# Test Plan — Swag Labs (UI) & ReqRes (API)

| | |
|---|---|
| **Document** | Test Plan |
| **Version** | 0.1 — draft, written before execution. Becomes 1.0 once every P1 case has been run and the Known failure column holds real defect identifiers. |
| **Date** | 2026-10-20 |
| **Author** | Tatsiana Hryharkevich |
| **Systems under test** | https://www.saucedemo.com/ (UI), https://reqres.in/api (API) |
| **Time box** | 4 h core + clearly marked extended block |
| **Status** | Draft |

---

## 1. Purpose

This plan defines what will be tested, why, in which order, and what evidence will be
produced, for a system we were handed with no specification, no access to the
vendor's issue tracker, and nobody to ask.

Because no requirements document exists, requirements were **derived** from two
sources and numbered in `docs/REQUIREMENTS.md`:

1. **the challenge brief**, quoted word for word with a page reference. These are the
   client's own requirements.
2. **what the application visibly does** — requirements we worked out ourselves. Each
   one is marked as an assumption, so a reader can always tell our interpretation from
   the client's own words.

Anything neither source answers is written down as an open question in
`docs/OPEN_QUESTIONS.md` instead of being quietly assumed.

**The two systems under test are unrelated.** The brief pairs a web application with a
REST API as two stand-ins for a typical deliverable. Nothing you do in the UI sends a
request to the API, and the UI does not use anything the API provides. Testing how the
two work together is therefore not merely out of scope — there is nothing to test. They
are planned as two parallel scopes that share a repository and a single documented run
command, each with its own requirements, cases and exit criteria. This is said plainly so
that no reader assumes an end-to-end path exists between them.

## 2. Scope

### 2.1 In scope — UI (Swag Labs / SauceDemo)

| Area | Rationale |
|---|---|
| Authentication and access control | The way into every other flow; a defect here blocks every other test. The four accounts the brief documents are covered in depth; the two the application adds are surveyed in one exploratory session. The depth applied to each account is set out in §3.1 |
| Cart and checkout, end to end | This is how the business earns money, so the impact of a defect is highest here |
| Catalogue sorting and data display | Explicitly required; a wrong order is easy to introduce and cheap to check |
| Session behaviour: protected routes, logout, browser history | Derived requirement. In a single-page application the browser, not the server, decides who may open which page, and the signed-in state lives in the browser too. It is easy to miss one page, so this area produces defects regularly |
| Commerce rules: quantity, availability, cart lifecycle | Derived requirement. The brief says nothing about rules every shop must define. These cases record what the application does today and turn into questions for the product owner |
| Network-level defect reproduction | Explicitly required; the quality of the evidence is part of the assessment |
| Client-side performance smoke, single user | Requested; the browser already measures this, so it costs almost nothing. Measurements are taken during core testing; the write-up is in the extended block (§13) |
| Accessibility smoke, automated rules only | Extended block; first item to be cut if time runs out |

### 2.2 In scope — API (ReqRes)

| Area | Rationale |
|---|---|
| Contract shape: status codes and response schemas for the documented endpoints | Explicitly required; if the shape of a response changes, no UI test will notice, and neither will anyone who checks only the status code |
| Error handling: unknown identifiers, missing fields, malformed input | Explicitly required; the brief names a non-existent user id specifically |
| Write operations: POST, PUT, PATCH, DELETE semantics | Explicitly required; checks that each method returns the status code and body it promises |
| Response time of a single request | One request only, to show the service responds within a sensible time. Load and stress testing are excluded for the reason given against "Load, stress and soak testing" in §2.3 of this plan |

### 2.3 Out of scope, with reasons

| Excluded | System | Reason |
|---|---|---|
| **Load, stress and soak testing** | both | Both systems are public demo sites belonging to someone else. Sending load at servers we do not own would be wrong no matter how much time we had. In a real project this would be k6 against a dedicated environment, with limits agreed with the business. |
| **Integration and consumer-driven contract testing between the two systems** | both | There is nothing to test: the UI sends no request to the API and uses nothing it provides. See §1. |
| **Visual regression testing** | UI | Needs reference screenshots and a machine that always draws the page identically. Reference images taken on macOS do not match a Linux CI machine, because fonts are drawn differently, so tests would fail for the wrong reason. Left out on purpose, not forgotten. |
| **Cross-browser and mobile matrix** | UI | Chromium only within the time box. The browser support matrix is an open question (Q-06). |
| **Manual accessibility checks** (keyboard navigation, screen reader, focus order) | UI | Automated rules find roughly a third of accessibility problems; the rest has to be checked by hand, which does not fit the time box. Said here so the automated report is not mistaken for full coverage. |
| **Localisation / i18n** | UI | No requirement exists. Raised as an open question (Q-02) rather than reported as a defect. Note that this is not purely cosmetic: the tax rate is a hard-coded client-side constant and the currency symbol is hard-coded, so regional scope has a direct effect on the amount a customer is charged. Tested against a stated assumption of a single region. |
| **Authentication, rate limiting and tenancy behaviour of the API** | API | ReqRes is a public mock with no real accounts to test. Its API key and rate limits are handled as risks to our work (R1, R2), not as something we test. |
| **Security testing** | both | Not requested; the systems are public demo environments with published credentials. |

## 3. Systems under test

### 3.1 UI — Swag Labs / SauceDemo

Single-page application (React, client-side routing). **Authentication and cart state
are handled entirely in the browser — logging in sends no request to a server.**
Confirmed by reading the JavaScript the site serves. This changes the test design:
evidence at the network level has to come from file downloads and from timing,
because there is no login request to inspect.

The product list is a fixed array built into the same file, and nothing is fetched from a
server at any point. So content that displays incorrectly is never a data or loading
problem — it is code that behaves differently depending on which user is signed in.
`docs/STATIC_ANALYSIS.md` lists every deliberately broken behaviour per account.

**Eleven routes are registered; the interface links to seven.** Four catalogue variants —
`/inventory-long.html`, `/dynamic-catalog-lazy-load.html`,
`/dynamic-catalog-spinner.html` and `/dynamic-catalog-slider.html` — are reachable by
direct URL only and appear in no menu. They are covered by exploratory charter ES-04.

Stable `data-test` attributes are present on all interactive elements
(`username`, `password`, `login-button`, `product-sort-container`, `checkout`,
`firstName`, `lastName`, `postalCode`, `finish`, `remove-*`). Selector strategy is
therefore `data-test` only — no XPath, and no CSS that depends on layout or wording.
These attributes are test hooks placed on the form fields; they hold no values.

**Security observation (OBS-02).** The values behind those fields are another matter.
Because sign-in happens entirely in the browser, the list of valid usernames and the one
password shared by all of them are built into the JavaScript that every visitor downloads,
and the login page prints them on screen. The session cookie, `session-username`, holds
the username as plain text with no token and no signature, so setting that cookie by hand
grants access without signing in at all. In a demo application built for practice this is
deliberate, and security testing is out of scope (§2.3). It is recorded anyway, because in a
real application each of these would be Critical, and a tester who noticed and said
nothing would not be doing the job.

Accounts: the brief lists four. **The application's own login page lists six** under
"Accepted usernames are:" — `error_user` and `visual_user` additionally. This
difference between the brief and the application is recorded as an observation (OBS-01).
Observations are findings that are not defects — there is no requirement to breach — and
they live in their own section of `docs/DEFECTS.md`.
The two extra accounts are not given the same depth as the four the brief names: they are
surveyed in one exploratory session, and `error_user` is additionally used where its
deliberate faults are the clearest way to evidence a console or network defect.

| Account | Documented in brief | Treatment |
|---|---|---|
| `standard_user` | yes | Full automated + manual coverage; baseline |
| `problem_user` | yes | Full coverage; defects are built in on purpose |
| `performance_glitch_user` | yes | Full coverage; timings measured |
| `locked_out_user` | yes | Access-control cases |
| `error_user` | **no** | Exploratory survey (TC-UI-015), plus three cases that use this account because its faults are the clearest evidence available: TC-UI-039, TC-UI-100, TC-UI-102 |
| `visual_user` | **no** | Exploratory survey only (TC-UI-015); never automated, for the reason given against visual regression testing in §2.3 |

### 3.2 API — ReqRes

A public mock REST API. Checked on 2026-10-19: it answers without an API key. Two
risks outside our control are handled by design rather than wished away — see §9.

### 3.3 What these systems are, and what that means for this report

Neither system under test is a business. SauceDemo is a training fixture built to be
tested against: six products, no payment, no fulfilment, no stock, no server of any kind,
and defects that switch on the name of the account signing in. ReqRes is a mock API for
building a front end against before a back end exists — writes are not stored, and every
caller receives the same authentication token. The brief says as much: they "stand in
for" a deliverable rather than being one.

That changes how impact may honestly be written, and there are two ways to get it wrong.
One is to describe a fixture as though it were a shop — "this is costing the business
money", "customers will leave" — none of which is knowable here, and a confident
invention devalues everything around it. The other is to shrug at a demo and report
nothing of consequence.

This report takes the middle position throughout: it states what the system **does**,
evidenced, and states impact **conditionally** — "in a real shop this would be…". Where
severity reflects the fixture rather than the mechanism, it says so, as in DEF-016, where
the severity is Minor only because the password is printed on the sign-in page anyway.

It follows that a defect count is not an achievement. Most of what is in the defect log
was put there deliberately by the people who built the fixture, and finding it proves
only that the ground was covered. What the log separates, and what is worth reading, is
which findings **nobody planted** — see the classification at the end of `DEFECTS.md`.

## 4. Test approach

| Level / type | Technique | Where |
|---|---|---|
| Functional UI regression | Written in advance, ordered by risk, structured with page objects | `tests/ui/` |
| Exploratory | Session-based: each session has a written goal, a time limit and notes written up afterwards | `docs/EXPLORATORY_SESSIONS.md` |
| API contract | Status codes, JSON-schema validation, negative and boundary input | `tests/api/` |
| Non-functional smoke | Client-side timings; automated accessibility rules | `docs/PERFORMANCE.md`, `docs/ACCESSIBILITY.md` |
| Static analysis | Reading the JavaScript the site serves to the browser, to decide what to test first | `docs/STATIC_ANALYSIS.md` |

### 4.1 Test levels, and which of them are possible here

| Level | Possible here | Why |
|---|---|---|
| **Unit** | No | A unit test checks one function in the source code, and is normally written and owned by the development team. We have SauceDemo's compiled JavaScript, not its source repository, so there is no source to test. The same applies to ReqRes, which is somebody else's service. |
| **Integration** | No | Between components inside the application: same reason as above. Between the two systems under test: they are unrelated, so there is no integration to exercise (§1). |
| **End-to-end through the UI** | Yes — the main level of this work | Sign in, browse the catalogue, add to the cart, complete checkout and reach the order confirmation, driven through a real browser exactly as a customer would. |
| **API component tests** | Yes | The ReqRes suite exercises that service on its own, without any UI. |
| **Unit tests of our own helpers** | Only where it earns its place | Our comparison and formatting helpers are code too. Within this time box they are covered through the cases that use them rather than separately. |

This is an inverted pyramid: almost everything sits at the slowest and most expensive
level. That is forced by what we were given, not chosen. In a project where the team
owned the source, most of these checks would move down — sorting logic, tax
calculation and form validation belong in unit tests owned by developers, leaving a thin
layer of end-to-end tests for the few journeys that must be proven through the whole
stack. Pushing coverage down is the first thing worth discussing with the development
team.

**Why both scripted and exploratory.** Scripted tests check what we already know
should be true; they are the safety net that catches regressions. Exploratory sessions
look for what we do not yet know to ask about — which, on day one without a
specification, is most of the system. Both are planned, and both produce written
output.

**How response shapes are checked.** We check strictly the fields our tests rely on —
that each one is present, of the right type and in the right format — and we allow any
extra fields we do not use. ReqRes adds a marketing block (`support`, `_meta`) to every
response and visibly changes it between responses; failing a test because that block
changed would tell us nothing about the contract. This approach has a name in the
industry: a *tolerant reader*.

## 5. Risk-based prioritisation

Priority comes from three things: how much damage a defect would do, how likely it
is, and how hard it would be to catch in another way.

| Priority | Definition | Treatment |
|---|---|---|
| **P1** | Blocks a purchase or blocks access to the application, or the brief names it explicitly | Automated, run every time, and part of the CI gate |
| **P2** | Makes the experience worse or shows wrong data, but does not block the user | Automated where that is cheap, otherwise checked by hand and written up |
| **P3** | Low impact, or automating it costs more than it is worth in the time available | Checked by hand or explored, or postponed with the reason written down |

**Why the work is split this way.** Login and checkout are automated first: they matter
most to the business, and they are what a reviewer will run. Sorting is automated
because it is driven by data — four sort modes across several accounts is a single loop,
so the coverage is very cheap. Checks on unusual form input stay manual, because each
one needs a judgement about what *should* happen and no specification says. Visual
and localisation checks are not automated at all, for the reasons given in §2.3.

### 5.1 Run profiles — what runs when

Priority decides what a run contains. Three profiles exist, each a subset of the next.
Manual and exploratory cases belong to none of them: they are performed by a person,
and their results are recorded in `docs/TEST_CASES.md` alongside the executed automated
cases, so one document shows every case and its outcome.

| Profile | Contains | Cases | Runs | Command |
|---|---|---|---|---|
| **Smoke** | The shortest set that proves the application is usable at all | 7 | Before anything else, and after every change to the build | `make smoke` |
| **Regression** | Every P1 case | 36 | On every change — this is the CI gate | `make regression` |
| **Full** | Every automated case, P1 to P3 | 70 | Before a release — here, before submission | `make test` |

**Smoke is not the same as P1.** All 36 P1 cases together are a regression suite that
takes minutes; a smoke check has to answer one question — is it worth testing this build
at all — and answer it in about a minute. The smoke set is therefore a deliberate subset
of P1, tagged `@smoke`:

| Case | What it proves |
|---|---|
| TC-UI-001 | A user can sign in and the catalogue renders |
| TC-UI-010 | A protected page is refused without a session |
| TC-UI-020 | An item can be added to the cart |
| TC-UI-025 | An order can be completed end to end |
| TC-API-002 | The API answers a read and returns the expected shape |
| TC-API-006 | The API accepts a write |
| TC-API-013 | The API rejects bad input with the right status |

If any of these seven fails, the build is not worth testing further and the run stops
there. Everything else — the other 29 P1 cases, and all P2 and P3 — runs only once
smoke is green.

The brief asks for a suite runnable with a single documented command. That command is
`make test`, which runs everything. `make smoke` and `make regression` are narrower
profiles for day-to-day use and for the CI gate; a reviewer needs only the first.

## 6. Test case matrix

**Coverage type** says how a case is covered. A case has exactly one:

- **Automated** — a test in the suite, run by command on every execution.
- **Manual** — performed by a person following the steps, with the result written up.
- **Exploratory** — investigated inside a session from §6.6 rather than as a fixed script.

Capturing evidence is not a coverage type. An automated run records its own screenshots,
video and trace; screenshots of the browser's developer tools are taken by hand only when
a defect has been found, and they belong to the defect record (§8), not to the test case.

**Known failure** has a life cycle, and its value says which stage a case is at:

| Value | Meaning | When |
|---|---|---|
| *(empty)* | No failure is predicted for this case | — |
| `predicted` | We predict this case will fail, because the defect looks deliberate in the application's code. **A prediction, not a finding.** | While this plan is a draft, before the case has been run |
| `DEF-003 · #4` | The case was run, it failed, the defect is logged, and this is its identifier and tracker number | After execution |

This document is version 0.1 because no case has been run yet. In the submitted version,
**no cell still reads `predicted`**: each one either carries a defect identifier and its
tracker number, or is empty because the prediction was wrong and the case passed. A cell
still reading `predicted` would mean the case was never run, which exit criterion 1 does
not allow for P1.

The same rule governs the suite itself: no test is marked as a known failure until a defect
has been logged for it (§8).

**A known failure hides more than it reports.** The marker says a test is allowed to fail;
it does not say *why* it failed. While this suite was being built it contained a fault of its
own — a page object that returned before the new page had rendered — and the marked
test for TC-UI-052 went on reporting a tidy expected failure throughout, because failing
for the wrong reason looks identical to failing for the right one. What exposed it was the
unmarked twin of the same check running against a healthy account. Two rules follow, and
both are applied here: a marked test is re-examined whenever the suite changes, and
wherever it is practical the same assertion also runs unmarked against an account where
it is expected to pass.

**A note on wording.** This plan says *known failure* throughout. Playwright's own report
labels the same thing an *expected failure*, and pytest calls it *xfail*. They are the same
state under three names; where a tool's wording appears on screen, it means what this
plan calls a known failure.

### 6.1 [UI] Authentication and access control — REQ-001, REQ-006

| Case ID | Test case | Account | Priority | Coverage type | Known failure |
|---|---|---|---|---|---|
| TC-UI-001 | Valid credentials land on the catalogue with 6 products | standard | P1 | Automated |  |
| TC-UI-002 | Locked-out account is refused with an explanatory message | locked_out | P1 | Automated |  |
| TC-UI-003 | Valid user, wrong password is refused | standard | P1 | Automated |  |
| TC-UI-004 | Unknown username is refused | — | P1 | Automated |  |
| TC-UI-005 | Empty username is refused with a field-specific message | — | P2 | Automated |  |
| TC-UI-006 | Empty password is refused with a field-specific message | — | P2 | Automated |  |
| TC-UI-007 | Error message does not disclose which field was wrong | — | P2 | Manual |  |
| TC-UI-008 | Seeded-defect account can sign in and reaches the catalogue | problem | P2 | Automated |  |
| TC-UI-009 | Slow account can log in; duration measured | perf_glitch | P2 | Automated |  |
| TC-UI-010 | Protected route `/inventory.html` is refused without a session | — | P1 | Automated |  |
| TC-UI-011 | Protected routes `/cart.html`, `/checkout-step-*` refused without a session | — | P2 | Automated |  |
| TC-UI-012 | Logout ends the session | standard | P1 | Automated |  |
| TC-UI-013 | Browser Back after logout does not restore the session | standard | P1 | Automated |  |
| TC-UI-014 | Password input is masked and absent from the DOM in clear text | standard | P2 | Manual |  |
| TC-UI-015 | Undocumented accounts: behaviour survey | error, visual | P3 | Exploratory |  |

### 6.2 [UI] Cart and checkout — REQ-002, REQ-007

| Case ID | Test case | Account | Priority | Coverage type | Known failure |
|---|---|---|---|---|---|
| TC-UI-020 | Add one item: badge shows 1, cart holds that item | standard | P1 | Automated |  |
| TC-UI-021 | Add several items: badge matches the cart contents | standard | P1 | Automated |  |
| TC-UI-022 | Remove from the catalogue page decrements the badge | standard | P1 | Automated | predicted |
| TC-UI-023 | Remove from the cart page empties the cart | standard | P1 | Automated |  |
| TC-UI-024 | Cart survives navigation between catalogue and cart | standard | P2 | Automated |  |
| TC-UI-025 | Checkout happy path reaches the order confirmation | standard | P1 | Automated |  |
| TC-UI-026 | Checkout with first name missing is rejected | standard | P1 | Automated |  |
| TC-UI-027 | Checkout with last name missing is rejected | standard | P1 | Automated |  |
| TC-UI-028 | Checkout with postal code missing is rejected | standard | P1 | Automated |  |
| TC-UI-029 | Order summary arithmetic: item total + tax = total | standard | P1 | Automated |  |
| TC-UI-030 | Cancel from checkout returns to the cart with items intact | standard | P2 | Automated |  |
| TC-UI-031 | Checkout with an empty cart | standard | P2 | Manual |  |
| TC-UI-032 | Checkout accepts the seeded-defect account's last name | problem | P1 | Automated | predicted |
| TC-UI-033 | Form boundary input: very long strings, digits, special characters | standard | P3 | Manual |  |
| TC-UI-034 | Cart state after re-login as the same user (expected behaviour unspecified → Q-03) | standard | P3 | Manual |  |
| TC-UI-035 | Tax equals 8% of the item total | standard | P1 | Automated |  |
| TC-UI-036 | Two different postal codes produce an identical tax amount (→ Q-02) | standard | P2 | Automated |  |
| TC-UI-037 | Currency symbol and decimal formatting on the cart and checkout pages | standard | P2 | Automated |  |
| TC-UI-038 | Order total equals the sum of the item prices in the cart | problem | P1 | Automated | predicted |
| TC-UI-039 | Cart is emptied after the order is completed | error | P2 | Automated | DEF-002 |

### 6.3 [UI] Sorting and data display — REQ-003

| Case ID | Test case | Account | Priority | Coverage type | Known failure |
|---|---|---|---|---|---|
| TC-UI-040 | Name A to Z | standard | P1 | Automated |  |
| TC-UI-041 | Name Z to A | standard | P1 | Automated |  |
| TC-UI-042 | Price low to high | standard | P1 | Automated |  |
| TC-UI-043 | Price high to low | standard | P1 | Automated |  |
| TC-UI-044 | Name A to Z | problem | P1 | Automated | predicted |
| TC-UI-045 | Name Z to A | problem | P1 | Automated | predicted |
| TC-UI-046 | Price low to high | problem | P1 | Automated | predicted |
| TC-UI-047 | Price high to low | problem | P1 | Automated | predicted |
| TC-UI-048 | Default sort order on first load | standard | P2 | Automated |  |
| TC-UI-049 | All four sort modes behave correctly for the slow account | perf_glitch | P2 | Automated |  |
| TC-UI-050 | Catalogue data integrity: names, prices and images are consistent | problem | P2 | Automated | predicted |
| TC-UI-051 | Sort selection after navigating away and back | standard | P3 | Manual |  |
| TC-UI-052 | A product tile opens the detail page of that same product | problem | P2 | Automated | predicted |
| TC-UI-053 | The "About" menu link points at the vendor site, not an error page | problem | P3 | Automated | predicted |

### 6.4 [API] Contract validation — REQ-004

| Case ID | Endpoint | Expected result | Priority | Coverage type |
|---|---|---|---|---|
| TC-API-001 | `GET /users?page=2` | 200, list schema, pagination fields consistent with the payload | P1 | Automated |
| TC-API-002 | `GET /users/2` | 200, single-user schema, email format valid | P1 | Automated |
| TC-API-003 | `GET /users/23` | 404, empty body | P1 | Automated |
| TC-API-004 | `GET /unknown` | 200, resource list schema | P2 | Automated |
| TC-API-005 | `GET /unknown/23` | 404 | P2 | Automated |
| TC-API-006 | `POST /users` valid payload | 201, echoes input, returns `id` and `createdAt` | P1 | Automated |
| TC-API-007 | `PUT /users/2` | 200, returns `updatedAt` | P2 | Automated |
| TC-API-008 | `PATCH /users/2` | 200 | P3 | Automated |
| TC-API-009 | `DELETE /users/2` | 204, empty body | P2 | Automated |
| TC-API-010 | `POST /register` valid | 200, returns `id` and `token` | P1 | Automated |
| TC-API-011 | `POST /register` password missing | 400, `{"error": "Missing password"}` | P1 | Automated |
| TC-API-012 | `POST /login` valid | 200, returns `token` | P1 | Automated |
| TC-API-013 | `POST /login` password missing | 400 | P1 | Automated |
| TC-API-014 | `POST /login` unknown user | 400, `{"error": "user not found"}` | P1 | Automated |
| TC-API-015 | `GET /users?delay=3` | 200, elapsed time at least 3 s | P3 | Automated |
| TC-API-016 | Pagination boundary: page 0, page beyond the last | documented behaviour | P3 | Automated |
| TC-API-017 | Malformed JSON body | documented behaviour, no 5xx | P3 | Automated |
| TC-API-018 | A single request completes within the threshold stated in the suite configuration | 200, within the stated threshold | P2 | Automated |

### 6.5 [UI] Non-functional smoke — REQ-008, REQ-009 (extended block)

| Case ID | Test case | Priority | Coverage type |
|---|---|---|---|
| TC-UI-080 | Navigation timings (TTFB, DOMContentLoaded, load) per account | P2 | Automated |
| TC-UI-081 | Slowest assets on the catalogue page, from the HAR capture | P3 | Automated |
| TC-UI-082 | Automated accessibility rules: login page | P3 | Automated |
| TC-UI-083 | Automated accessibility rules: catalogue page | P3 | Automated |
| TC-UI-084 | Automated accessibility rules: checkout form | P3 | Automated |

### 6.6 [UI] Exploratory sessions

| Session ID | Charter (what this session investigates) | Time box | Block |
|---|---|---|---|
| ES-01 | Survey all six accounts end to end; record behavioural differences against the baseline | 20 min | core |
| ES-02 | Probe session and cart lifecycle: direct URLs, browser history, logout, cart persistence across sessions and across users on one browser | 15 min | core |
| ES-03 | Probe data integrity and the checkout form: prices, images, totals, boundary input | 15 min | core |
| ES-04 | Probe the four catalogue routes that no menu links to, across accounts | 10 min | extended |

### 6.7 [UI] Commerce rules and cart lifecycle — REQ-010 (derived)

These cases exist because the brief is silent on commerce rules that any real storefront
must define. They are low priority as *tests* but high value as *requirement probes*: each
one documents what the application currently does and feeds a question to the product
owner. None of them is part of the smoke set.

| Case ID | Test case | Account | Priority | Coverage type | Feeds question |
|---|---|---|---|---|---|
| TC-UI-090 | Cart contents survive logout and are visible to the next user who signs in on the same browser | standard, problem | P2 | Automated | Q-03 |
| TC-UI-091 | The same item cannot be added twice; quantity is fixed at 1 with no quantity control | standard | P2 | Automated | Q-04 |
| TC-UI-092 | "Reset App State" clears the cart and the badge | standard | P3 | Automated | — |
| TC-UI-093 | Cart survives a full browser restart | standard | P3 | Manual | Q-03 |
| TC-UI-094 | The catalogue exposes no availability or stock information; every item is always purchasable | standard | P3 | Manual | Q-05 |
| TC-UI-095 | An item added in an earlier session can still be ordered later with no availability re-check | standard | P3 | Manual | Q-05 |

**Why these matter.** In a real storefront, each is a revenue or trust defect waiting to
happen: a cart that outlives its owner on a shared device leaks one customer's intent to
the next; a missing quantity concept caps order value at one unit per item; an
availability model that does not exist at all means a customer can complete an order for
something the business cannot ship. The demo application has no stock concept
whatsoever, so these cannot be tested as functionality — only recorded as gaps and
turned into questions.

### 6.8 [UI] Network level and configuration — REQ-005

The application performs almost no network activity: authentication, cart and pricing
are client-side, so there is no API call to inspect. The observable network surface is
static assets plus error telemetry, and that is where network-level evidence is sourced.

| Case ID | Test case | Account | Priority | Coverage type | Known failure |
|---|---|---|---|---|---|
| TC-UI-100 | Error telemetry is addressed to a valid, substituted endpoint | error | P2 | Automated | predicted |
| TC-UI-101 | The core flow issues no failing asset requests | standard, problem | P2 | Automated | predicted |
| TC-UI-102 | The core flow produces no uncaught console errors | standard, error | P2 | Automated | predicted |

## 7. Entry and exit criteria

**Entry.** Both systems reachable; credentials valid; accounts and base URLs recorded
in configuration; toolchain installs from a clean clone.

**Exit.**
1. Every P1 case executed, with a recorded result. No cell in the Known failure column
   of §6 still reads `predicted`: it holds a defect identifier and tracker number, or it is
   empty because the case passed.
2. Every defect logged with severity, priority, reproduction steps and evidence, and
   raised as a tracker item.
3. Every known failure in the suite links to a logged defect. No test is marked as a
   known failure unless that link is present, and no failure is left unexplained.
4. Traceability matrix complete: each requirement maps to at least one case, each
   automated test carries its case ID.
5. Suite runs from a clean clone with the documented commands.
6. Remaining risk, and anything deliberately skipped, is written down.

## 8. Defect management

Severity describes damage; priority describes urgency. They are recorded separately
because they are decided by different people: severity is the tester's assessment of the
effect, priority is the business's decision about when it gets fixed. The priority on a
*defect* is therefore a different thing from the P1/P2/P3 on a *test case* in §5, which
ranks how important the check is. The two are related but never the same field.

| Severity | Definition |
|---|---|
| **Critical** | Core flow unusable, no workaround: cannot log in, cannot complete an order, data loss |
| **Major** | Significant function broken or data displayed incorrectly; a workaround exists |
| **Minor** | Limited impact: cosmetic defect, unclear message, inconsistent behaviour in a secondary path |
| **Trivial** | Noticeable but harmless: wording, spacing, minor inconsistency |

Every defect record carries:

1. **The requirement it breaks** — its ID and the requirement text quoted word for word,
   so a reader can see what the application was supposed to do without leaving the page.
   Where the requirement is one we derived rather than one the client stated, it says so.
2. **Why this is a defect and not something else.** A record has to rule out the two
   explanations a developer will reach for first: that it was a passing environment problem,
   and that the steps are contrived. So it states how many times the defect was
   reproduced, that it was reproduced from a clean session, and that the steps are ones a
   real customer would plausibly perform. Where the steps genuinely are unusual, the
   record says why the case still matters instead of hiding it.
3. Tracker item number, the test that covers it, severity, priority, environment
   (browser, operating system, URL, date).
4. Reproduction steps, expected result versus actual result.
5. **Evidence**: the screenshots, video, trace and HAR file the automated run recorded
   by itself, plus screenshots of the browser's developer tools taken by hand at the
   moment the defect was found, where the Network or Console panel is what proves it.
6. A suggested fix, where the cause is visible.

**Known-failure policy.** A test that fails because of a known, unfixed defect is marked
as a known failure and **must** link to the tracker item holding the evidence. The
same link appears in the Known failure column of §6, so the plan and the suite agree on
which failures are accounted for. The
assertion is never weakened — the test keeps asserting correct behaviour. Without a
linked defect record, a test is not allowed to carry the marker and stays red. This keeps
the CI gate meaningful: red means something new has broken, not a pile of issues we
already know about. If
the defect is fixed, the suite reports the unexpected pass and asks for the marker to be
removed.

## 9. Risks to the test effort

| # | Risk | Mitigation |
|---|---|---|
| R1 | ReqRes may require an API key (`x-api-key`), returning 401 | The header is always sent, and `REQRES_API_KEY` overrides it; harmless when unnecessary. A 401 skips the affected check with that reason rather than failing it |
| R2 | ReqRes rate limiting (429) during a run. **Measured, not assumed:** the free tier allows **40 requests per day from one address**, and the first draft of the suite spent all forty in a single run | Every response is guarded: a 429 skips that check, naming the call that could not be made, rather than failing it. The suite is written to a request budget — responses needed by more than one check are fetched once and shared — which brought a full run from 40 requests to **29**, and the smoke profile to **3**. Each run prints the number it used |
| R3 | Vendor marketing fields (`_meta`, `support`) change between responses | Tolerant-reader schemas — strict only on consumed fields |
| R4 | The slow account freezes the browser for five seconds with a loop, rather than waiting on a slow response. Slowing the network in test tools would not reproduce it | A longer timeout on those tests only; no global waits and no fixed sleeps |
| R5 | The built-in defects keep the suite permanently red, so a red run stops meaning anything | Known-failure policy, §8 |
| R6 | Both systems are third-party and may change or go down mid-exercise | Evidence captured as files (HAR, traces, screenshots) at the moment of observation |
| R7 | Extra ideas crowd out the scenarios the brief requires | The core scope is fixed and done first; extended items are cut from the end |

## 10. Test data

Accounts are fixed and published by the application, so no user data needs to be
provisioned. The cart, however, does **not** reset with the session: it is held in
`localStorage` under `cart-contents`, while the session is a separate cookie
(`session-username`), and logging out removes only the cookie. Consequently every
automated test must start from a clean storage state — Playwright provides an isolated
browser context per test, which satisfies this by default — and every manual session must
begin with "Reset App State" or a cleared `localStorage`, otherwise results carry over
between runs. The API is a mock —
writes are not persisted, so tests must not assume that a created resource can be read
back. Every test therefore builds its own request payload and asserts only on the
response, with no ordering dependency between tests.

## 11. Automation strategy

| Decision | Rationale |
|---|---|
| Playwright for the UI | It waits for elements by itself, which removes the main cause of unstable tests. It also records traces, HAR files and video, which serve as defect evidence |
| JavaScript (ESM) | Three reasons, in order of weight — see the note below the table |
| pytest + requests for the API | Named explicitly in the brief; validates endpoints independently of the UI |
| Page objects, `data-test` selectors | When a selector changes it changes in one file, and selectors do not depend on layout or wording |
| Case IDs in test titles | The link back to the plan is visible in the test report, not only in the plan |
| Priority tags in test titles (`@P1`, `@P2`, `@P3`, `@smoke`) | A run can be narrowed to one profile without maintaining separate lists of tests, and results can be read by priority. See §5.1 |
| No fixed sleeps anywhere | A fixed wait is either wasted time or not long enough, and both are faults in a suite |
| Tests independent and safe to run in parallel | The brief grades reliability, "not just that it runs once" |

**Why JavaScript for the UI suite.** Three reasons, and they are worth separating
because only the first two apply to this exercise.

1. **It is the language I can own.** Every line here can be explained rather than merely
   run, which matters more than any property of the language itself.
2. **It is the language the application is written in, and that was used.** Designing
   these tests started by reading the JavaScript the site serves: the eleven routes, the
   catalogue of per-account faults, and the telemetry placeholders all came from there
   (`docs/STATIC_ANALYSIS.md`). Without being able to read it, half the targeted checks
   in this suite would not exist.
3. **In a real engagement it would be the team's language too** — which is the strongest
   form of the argument and the one that does *not* apply here. A QA engineer writing the
   same language as the front-end team reads their changes, shares their tooling, lets a
   developer fix a failing test without learning another stack, and can move checks down
   the pyramid with them (§4.1). None of that is available in this exercise: there is no
   repository, no team and no pull requests.

**What this reasoning does not claim.** The language of the system under test does not
dictate the language of its tests. End-to-end tests drive a browser from the outside and
never touch application code; Playwright for Python would drive the same browser
identically. This suite proves the point itself — the API tests are written in Python
against a service written in Node, and that is the right choice there for an unrelated
reason: the brief names `pytest + requests`, and it is the language in which I work on
back-end tests.

## 12. Reporting and evidence

Playwright's HTML report for the UI and `pytest-html` for the API. Both are produced by
the same command that runs the tests, and there is nothing extra to install. Allure was
rejected because it needs Java on the reviewer's machine.

The report has to answer, without anyone opening the code:

| The report shows | Why it is needed |
|---|---|
| Every test with its outcome: **passed, failed, skipped, known failure** | These four mean different things. Skipped means a check did not run, usually because a third-party service was unavailable; a known failure means a defect we have already logged. Neither is a pass, and neither is a new problem. |
| A count of each outcome, and the total | The first thing a reviewer looks at. "28 passed, 3 known failures, 2 skipped" tells the whole story in one line. |
| When the run happened and how long each test took | Needed to compare runs, and to show the measured delay on the slow account. |
| The case ID and the priority of each test | Results can be read against the plan and filtered by priority. Priorities are tags in the test title, so `@P1` can also be used to run only the critical set. |
| For every failure: screenshot, video, trace, and HAR where the network is involved | Evidence is attached to the failure itself, so nobody has to reproduce it to see what happened. |
| For every known failure: the defect it links to | The report explains itself; a reader never has to ask why a test is allowed to fail. |

Network-level evidence comes from the HAR files and traces the suite records on every
run. Screenshots of Chrome developer tools are taken by hand only when a defect has
been found, to show the request and response that prove it, and they are attached to the
defect record rather than to the run.

## 13. Schedule

| Block | Budget | Output |
|---|---|---|
| Planning, requirements, traceability skeleton | 20 min | Test plan, requirements, open questions |
| Exploratory sessions ES-01 to ES-03 | 50 min | Defect log, observations, evidence |
| UI suite | 70 min | Login, cart, checkout, sorting |
| API suite | 45 min | Status codes, schemas, negative cases |
| Bug report | 30 min | One defect in full detail with network evidence |
| README, traceability matrix, CI, submission | 25 min | Runnable, documented, pushed |
| **Core total** | **4 h** | |
| Extended: performance write-up, accessibility smoke, session ES-04, open questions | +60 min | Marked separately in the README |

Time actually spent is reported honestly in the README, split between core and
extended, so that prioritisation is visible rather than claimed.

## 14. Release readiness — the evidence behind a decision to ship

Neither system here is ours to release: both are public demo sites. This section states
the criteria as they would be applied in a real engagement, and it is also the standard
this submission holds itself to — it decides what the final report may honestly claim.

**A tester does not decide a release.** The tester produces evidence and a
recommendation in terms the business can act on; the decision belongs to whoever owns
the risk. What follows is what that recommendation is built from, so that "is it ready?"
is answered with numbers and named risks rather than with a feeling.

### 14.1 Stop criteria — do not ship while any of these is true

| Condition | Why it stops a release |
|---|---|
| The smoke profile is red | The build is not usable at all. Nothing measured after that point means anything. |
| A P1 case fails and is not an accepted known failure | A P1 failure means a purchase or access to the application is blocked. |
| An open Critical defect with no agreed workaround | A core flow is unusable and customers have no way round it. |
| A business-critical open question is unanswered | Example from this project: until Q-02 settles which regions the shop serves, the tax on every order is unverifiable. A wrong rate is a financial and compliance exposure, not an item in a backlog. |
| A required scenario was not executed | We cannot report a result we do not have. An untested area is an unknown risk, not a low one. |
| A defect whose cause nobody understands | An unexplained failure may be the visible part of a larger fault. "It went away" is not a resolution. |

### 14.2 Conditional go — ship with the risk accepted in writing

| Condition | What has to accompany it |
|---|---|
| Major defects remain open | Each has an owner and an agreed fix date in a named release |
| Known failures exist in the suite | The business has seen the list and accepted it; each links to its defect |
| Minor and Trivial defects remain | Logged with severity, visible to the business, none of them Critical |

"Accepted" means a named person decided in writing, with the list in front of them. It
does not mean nobody objected.

### 14.3 The measures the recommendation is built from

| Measure | Where it comes from | Threshold for a go |
|---|---|---|
| Smoke result | `make smoke` | Green |
| P1 pass rate | Regression profile | 100%, counting accepted known failures as passes and nothing else |
| P2 pass rate | Full profile | At least 95%, and every failure logged as a defect |
| Open defects by severity | Defect log | No open Critical; every Major with an owner and a date |
| Time to fix, by severity | Tracker | Measured, so that "we will fix it later" becomes a date someone agreed to |
| Flaky tests | Repeated runs of the same build | None. A test that passes and fails on identical code makes every other number unreliable |
| Coverage of required scenarios | Traceability matrix | Every requirement has at least one executed case with a recorded result |
| Business-critical open questions | `docs/OPEN_QUESTIONS.md` | None unanswered among those marked as blocking |
| Evidence for every failure | Test report | Screenshot, video, trace, and HAR where the network is involved |

Where more than one run exists, the direction matters as much as the number: a defect
count that is falling run over run supports a different decision from the same count
rising.

### 14.4 What the tester actually says

The recommendation is one short statement built from the table above. Its shape:

> Regression: 36 of 36 P1 cases executed — 33 passed, 3 known failures already accepted
> (DEF-001, DEF-003, DEF-007). Full profile: 70 executed — 64 passed, 3 known failures,
> 3 skipped because the third-party API was rate-limited and the checks did not run.
> Defects: no open Critical, 2 Major with owners and fix dates, 5 Minor. Open questions
> blocking a decision: one — Q-02, regional tax. **Recommendation: hold the release until
> Q-02 is answered. Everything else is within the agreed thresholds.**

It names the risk, shows the evidence, and says who has to decide. It never says "it
works", because that is not a statement testing can support — only "these checks passed,
these did not, and this is what remains unknown".

## 15. What would come next, in the order it should be done

Ordered by what unblocks a release decision, not by what is most interesting to build.

1. **Answer the open questions that block a decision**, starting with Q-02 — which
   regions the shop serves, how the tax rate is determined, and why a postal code is
   collected but not used. Until that is settled, the amount charged to a customer cannot
   be verified at all, and no amount of extra test coverage changes that.
2. **Settle the remaining questions about intended behaviour** — Q-03 cart lifecycle
   across sessions and users, Q-04 multiple units per item, Q-05 the availability model.
   Each currently separates "a defect" from "working as intended" by assumption alone.
3. **Agree the acceptance criteria and the targets with the business** — the browser and
   device matrix (Q-06) and the accessibility conformance level (Q-07) — so that
   "correct" stops being our interpretation and becomes something signed off.
4. **Move checks down the pyramid with the development team** (§4.1). Sorting, tax
   calculation and form validation belong in unit tests owned by developers; a thin
   end-to-end layer should remain for the journeys that must be proven through the
   whole stack.
5. **Contract tests against a published API specification**, so that a change in response
   shape fails on the provider's side rather than being discovered by us later.
6. **Accessibility verified by hand** — keyboard navigation, focus order, screen reader —
   since automated rules cover only about a third of the problem.
7. **Load testing on a dedicated environment**, with limits agreed with the business and
   derived from real expected traffic.
8. **Test data helpers**, once a real server stores state and tests can no longer assume a
   clean slate.
9. **Visual comparison** using a service that manages the reference images, which removes
   the rendering differences that make it unreliable today.
10. **Coverage on other browsers and on mobile** — valuable, but it widens a surface we
    cannot yet describe as correct on one browser.

## 16. Glossary


Terms used above that are specific to testing or to this project.

| Term | Meaning here |
|---|---|
| **Bundle** | The single JavaScript file a site builds from its source and serves to the browser. We could read SauceDemo's bundle; we have no access to its source repository. |
| **Regression suite** | The set of automated tests run on every change, to catch things that used to work and no longer do. |
| **Smoke test** | A short, fast check that the main paths work at all, run before spending time on depth. The set used here is defined in §5.1. |
| **Known failure** | A test that fails because of a defect we have already found and logged. It is marked as such in the suite and must link to that defect. Playwright's report calls this an *expected failure*; pytest calls it *xfail*. |
| **Flaky test** | A test that passes and fails on the same code, usually because of timing. Treated as a fault, not as noise. |
| **Page object** | One file per screen holding that screen's selectors and actions, so a change to the page is fixed in one place. |
| **Exploratory session** | A timeboxed block of unscripted testing with a written goal, and notes written up afterwards. |
| **Charter** | The written goal of one exploratory session: what will be investigated, and why. |
| **Traceability matrix (RTM)** | A table linking each requirement to the cases that cover it, the tests that run them, and any defects found. |
| **Severity / Priority** | Severity is how much damage a defect does; priority is how soon it should be fixed. Different people decide them, so they are recorded separately. |
| **Derived requirement** | A requirement we worked out from the application's behaviour rather than from the client's words. Always marked as an assumption. |
| **Entry / exit criteria** | What must be true before testing starts, and what must be true before we call it finished. |
| **Tolerant reader** | Checking strictly the response fields we use, while allowing extra fields we do not. |
| **HAR file** | A recording of every network request and response on a page, which can be opened in browser developer tools. |
| **Trace** | Playwright's recording of a test run: page snapshots at each step, network activity and console output. |
| **CI gate** | The automated check that must pass before a change is allowed in — here, the regression profile from §5.1. Useful only while a red result means something new has broken. |
