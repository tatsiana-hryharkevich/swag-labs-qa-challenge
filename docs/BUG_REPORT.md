# Bug Report — DEF-012

> Error reporting is broken in production: build placeholders were never replaced,
> so the application cannot see its own failures.

| | |
|---|---|
| **Defect** | DEF-012 |
| **Reported by** | Tatsiana Hryharkevich |
| **Date** | 2026-10-21 |
| **Severity** | Major |
| **Priority** | High |
| **Status** | Open |
| **Affects** | Every account, every page |
| **Covered by test** | `tests/ui/specs/network.spec.js` › TC-UI-100, TC-UI-101 |
| **Requirement** | REQ-005 — `docs/REQUIREMENTS.md` |

> "Bug Reproduction at the Network Level: pick at least one bug and document the exact
> request/response involved, using browser DevTools."
> — Challenge brief, page 3, scenario 5

---

## 1. Summary

The application reports errors to Backtrace, a crash-reporting service. Its configuration
still contains the literal build-time placeholders `UNIVERSE` and `TOKEN` where the real
account identifier and key belong. Both reporting channels therefore fail, on every page
and for every account, and nothing reaches the service.

The consequence is larger than the broken reporting itself. **Every other defect in this
log that raises a console error was supposed to be reported automatically, and none of
them was.** The application is blind to its own failures, which is a plausible reason the
rest of these defects have survived in a build that is live.

## 2. Why this one was chosen for a full write-up

It is the only defect in this application observable at the request/response level.
Signing in, the cart and all pricing run entirely in the browser with no server calls, so
there is no business API whose traffic could be inspected. Telemetry is the one thing the
application sends anywhere, and it turned out to be broken.

## 3. Environment

| | |
|---|---|
| Application | Swag Store 3.0.0 — https://www.saucedemo.com/ |
| Browser | Chromium 156.0.8078.4 |
| Operating system | macOS 15 |
| Date observed | 2026-10-21 |
| Reporting agent | `@backtrace/react` 0.5.1 |
| Accounts | All six. `error_user` produces the most traffic because it raises errors deliberately |

## 4. Steps to reproduce

1. Open https://www.saucedemo.com/ with developer tools open on the **Network** panel.
2. Filter the panel for `backtrace`.
3. Sign in as any account, for example `standard_user` / `secret_sauce`.
4. Watch the requests as the catalogue loads.

To see the second channel as well, sign in as `error_user`, add an item to the cart and
change the sort order — each of those raises an error the application tries to report.

## 5. Evidence

### 5.1 Channel one — usage metrics, rejected with 401

**Request**

```http
POST /api/summed-events/submit?universe=UNIVERSE&token=TOKEN HTTP/2
Host: events.backtrace.io
Content-Type: application/json
Origin: https://www.saucedemo.com

{"application":"Swag Store","appversion":"3.0.0","summed_events":[{"timestamp":1792534117,
 "attributes":{"application.session":"7565d1c0-...","backtrace.agent":"@backtrace/react",
 "backtrace.version":"0.5.1", ...41 attributes in total}}]}
```

**Response**

```http
HTTP/2 401 Unauthorized
Content-Type: application/json
Server: openresty

{"error":{"message":"Unauthorized request","code":6}}
```

The same happens on `/api/unique-events/submit`. Two such requests are sent per page
load, so the **Console** fills with
`Failed to load resource: the server responded with a status of 401 (Unauthorized)`.

### 5.2 Channel two — crash reports, blocked before any response

```http
POST /UNIVERSE/TOKEN/json HTTP/2
Host: submit.backtrace.io
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
```

Result: **`net::ERR_FAILED`** — the request does not complete, so there is no status code
at all. The path segments `UNIVERSE` and `TOKEN` are not a valid submission endpoint, and
the request is rejected before a response is produced.

For `error_user`, thirteen of these were attempted in a single session; all thirteen
failed.

### 5.3 What the crash reports would have carried

The payload of a crash report is worth recording, because it stops being hypothetical the
moment the address is fixed. The multipart body contains a JSON part whose fields
include:

```json
{
  "attributes": { "user": "error_user", "user.agent.full": "Mozilla/5.0 ...", ... },
  "annotations": {
    "shoppingCart": [4],
    "InventoryData": [ { "id": 0, "name": "Sauce Labs Bike Light", "price": 9.99, ... } ]
  }
}
```

plus a `bt-breadcrumbs` attachment recording the customer's recent actions. So each
report would carry the **signed-in username**, the **contents of their cart** and a trail
of what they were doing, to a company outside this one.

### 5.4 Files in this repository

| File | What it shows |
|---|---|
| `evidence/har-standard_user.har` | Six rejected telemetry requests in an ordinary session |
| `evidence/har-error_user.har` | Thirteen failed crash submissions plus six rejected metric requests |
| `evidence/devtools-network-401.png` | The Network panel with the 401 selected |
| `evidence/devtools-console-401.png` | The Console filling with the same failure |

Every HAR file can be opened in Chrome: **Network → right-click → Import HAR**.

## 6. Expected versus actual

**Expected.** The telemetry endpoints are configured with this application's real
Backtrace universe and submission token, requests are accepted, and failures in
production become visible to whoever maintains the application.

**Actual.** The placeholders survive into the production bundle. Usage metrics are
rejected with 401 and crash reports fail at the network layer. No error from this
application has ever reached the service.

## 7. Impact

**Operationally.** The team has no visibility of failures in a live application. The two
Critical defects in this log — neither `problem_user` nor `error_user` can complete a
purchase — both raise console errors that should have paged someone. Nothing did. A
monitoring system that is silently off is more dangerous than none, because its silence is
read as health.

**For customers.** Nothing directly: this defect is invisible from the interface. The harm
is indirect and already realised, in the defects that were never noticed.

**A decision needed before the fix ships.** Repairing the address switches on a flow of
customer data — username, cart contents, and a trail of recent actions — to a third-party
processor. Today that flow is blocked by the very defect being fixed. Whether it is
permitted is a data-protection question rather than an engineering one, and it should be
answered before the placeholders are replaced, not after. Raised as Q-08 in
`docs/OPEN_QUESTIONS.md`.

**Severity rationale.** Major rather than Critical under the scale in the test plan: no
customer-facing flow is blocked and there is no data loss. The priority is High because
every day it remains unfixed is a day of production failures nobody can see.

## 8. Suggested fix

1. **Replace the placeholders at build time.** `UNIVERSE` and `TOKEN` are clearly
   intended to be substituted during the build and are not. Supplying them from the
   build environment rather than from a checked-in default is the direct fix.
2. **Fail the build when they survive.** A release that ships the literal string
   `TOKEN` in a URL should not be publishable. A check in the pipeline costs little and
   prevents a silent recurrence — the defect is invisible precisely because nothing
   complains.
3. **Alert on the reporting channel itself.** A monitoring system that cannot report its
   own failure to report is not monitoring. A health check that confirms submissions are
   accepted, with an alert when they are not, is what would have caught this on the day
   it shipped.
4. **Decide the payload before switching it on** (Q-08). Which attributes a report may
   carry, and under what agreement with the processor, is a question for whoever owns
   data protection.

## 9. How it was found

Not by looking for it. The exploratory sessions captured all network traffic on every page
for every account as a matter of routine, rather than only on the page under suspicion.
The 401s appeared in that capture for all six accounts, including `standard_user`, where
nothing else was wrong.

The placeholders were visible in the application's shipped JavaScript as well — recorded
in `docs/STATIC_ANALYSIS.md` section 5 — but that reading alone would not have shown
that the requests are genuinely sent and genuinely rejected. The code said what was
intended; the network showed what happens.
