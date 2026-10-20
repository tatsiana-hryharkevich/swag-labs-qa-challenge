# Defect Log

| | |
|---|---|
| **Document** | Defect log and observations |
| **Version** | 0.1 — no cases executed yet |
| **Date** | 2026-10-20 |
| **Author** | Tatsiana Hryharkevich |

Defects found during execution, and observations that are not defects. Severity
definitions and the rules every record must satisfy are in the test plan, §8.

**Status: 16 defects recorded, all reproduced in a browser with evidence captured.**

Found during exploratory sessions ES-01 to ES-03 on 2026-10-21. Every record below was
reproduced from a clean browser context; none is carried over from the predictions in
`STATIC_ANALYSIS.md`, which were confirmed, refuted or left unresolved by execution and
are reconciled at the end of this document.

| ID | Summary | Account | Severity |
|---|---|---|---|
| DEF-001 | Checkout cannot be completed: the Last Name field writes into First Name | problem_user | **Critical** |
| DEF-002 | An order cannot be completed: Finish does nothing and the cart is not cleared | error_user | **Critical** |
| DEF-003 | Every product image is replaced with a placeholder | problem_user | Major |
| DEF-004 | Sorting has no effect in any of the four modes | problem_user | Major |
| DEF-005 | "Add to cart" silently does nothing for half the catalogue | problem_user | Major |
| DEF-006 | "Remove" never removes anything | problem_user | Major |
| DEF-007 | A product tile opens a different product | problem_user | Major |
| DEF-008 | Catalogue prices are random and do not match the price charged | visual_user | Major |
| DEF-009 | Checkout accepts an empty Last Name | error_user | Major |
| DEF-010 | "Add to cart" throws and silently fails for half the catalogue | error_user | Major |
| DEF-011 | Sorting shows a blocking alert and does nothing | error_user | Major |
| DEF-012 | Error telemetry is rejected: build placeholders were never replaced | **all accounts** | Major |
| DEF-013 | The catalogue freezes the browser for five seconds | performance_glitch_user | Major |
| DEF-014 | One product image is replaced and the layout is broken | visual_user | Minor |
| DEF-015 | The cart outlives its owner and is shown to the next person who signs in | all accounts | Major |
| DEF-016 | The typed password is written into the DOM as a plain attribute | all accounts | Minor here, serious elsewhere |

---

### DEF-001 · Checkout cannot be completed: the Last Name field writes into First Name

**Requirement broken:** REQ-002 — `REQUIREMENTS.md`
> "Cart & Checkout Flow: verify add/remove from cart, checkout form validation (empty
> fields, invalid data), and order completion."
> — Challenge brief, page 3, scenario 2

**Covered by test:** TC-UI-032 · **Severity:** Critical · **Priority:** Highest · **Status:** Open

**Why this is a defect and not something else.** Reproduced on every attempt across two
separate runs, each from a clean browser context. Three different input methods were
tried — filling the field, typing character by character, and filling only the Last Name
field with First Name left empty — and all three behave the same way. The steps are the
ordinary checkout path: there is no unusual input and no workaround, because the field
cannot be made to hold a value by any means available to a customer.

**Environment:** Chromium 156 (headless) / macOS 15 · https://www.saucedemo.com/ · 2026-10-21
**Account:** `problem_user`

**Steps to reproduce**
1. Sign in as `problem_user`, add any item to the cart, open the cart and select Checkout.
2. Type `Anna` into First Name.
3. Type `Petrova` into Last Name.
4. Fill Postal Code and select Continue.

**Expected:** First Name holds `Anna`, Last Name holds `Petrova`, and checkout proceeds
to the overview page.

**Actual:** Last Name stays empty and every keystroke is written into First Name instead.
After typing `Petrova`, First Name reads `a` — the last character typed — because the
Last Name input is bound to a value that never changes, so it clears itself after each
keystroke while its handler updates the wrong field. Continue is refused with
`Error: Last Name is required`, and checkout can never be passed.

**Consequence.** This account cannot buy anything. It also hides whatever lies beyond:
the order overview, the totals and the Finish step are unreachable, so no defect on
those pages can be found or ruled out for this account.

**Evidence:** `evidence/problem_user-lastname-blocked.png`, `evidence/har-problem_user.har`

---

### DEF-002 · An order cannot be completed: Finish does nothing and the cart is not cleared

**Requirement broken:** REQ-002 (quoted in DEF-001)
**Covered by test:** TC-UI-039 · **Severity:** Critical · **Priority:** Highest · **Status:** Open

**Why this is a defect and not something else.** Reproduced from a clean context. The
steps are the plain purchase path, with valid data in every field that is validated. The
failure is silent: no message is shown, so a customer is given no reason to believe the
order did not go through.

**Environment:** Chromium 156 / macOS 15 · 2026-10-21 · **Account:** `error_user`

**Steps to reproduce**
1. Sign in as `error_user` and add items to the cart.
2. Open the cart, select Checkout, complete the form and select Continue.
3. On the overview page, select Finish.

**Expected:** The order confirmation page is shown and the cart is emptied.

**Actual:** The page does not change — the browser stays on `checkout-step-two.html`.
The cart badge still reads `3` and `localStorage` still holds `cart-contents = [4,0,2]`.
No error is displayed. A customer sees the Finish button do nothing at all.

**Consequence.** No order can be placed through this account, and because the cart
survives, a customer who tries again starts from a cart they believe they have already
paid for.

**Evidence:** `evidence/har-error_user.har`

**Suggested fix:** the handler that clears the cart calls a method that does not exist
(`cesetRart` rather than `resetCart`), so it throws before navigation is reached.

---

### DEF-003 · Every product image is replaced with a placeholder

**Requirement broken:** REQ-003 — "Sorting & Data Display" (brief, page 3, scenario 3)
**Covered by test:** TC-UI-050 · **Severity:** Major · **Priority:** High · **Status:** Open

**Why this is a defect.** Reproduced on every load from a clean context; affects all six
products, on the plain catalogue page, with no special steps.

**Account:** `problem_user`

**Steps:** sign in as `problem_user` and look at the catalogue.

**Expected:** each product shows its own photograph, as it does for `standard_user`.
**Actual:** all six products show the same placeholder image, `sl-404-Cq1a9k9X.jpg`.

**Consequence.** Products cannot be told apart visually, which in a shop directly affects
whether a customer can choose one.

**Evidence:** `evidence/problem_user-catalogue.png`

---

### DEF-004 · Sorting has no effect in any of the four modes

**Requirement broken:** REQ-003
> "verify that product sorting (name A–Z/Z–A, price low–high/high–low) actually sorts
> correctly across the different demo users."
> — Challenge brief, page 3, scenario 3

**Covered by tests:** TC-UI-044, TC-UI-045, TC-UI-046, TC-UI-047 · **Severity:** Major · **Status:** Open

**Why this is a defect.** All four options were selected in turn, from a clean context, and
the recorded order of products was byte-identical before and after each one. No
workaround exists: the control is the only way to sort.

**Account:** `problem_user`

**Expected:** choosing Z→A reverses the catalogue; choosing a price order sorts by price.
**Actual:** the catalogue stays in its original order for all four options:
`Backpack, Bike Light, Bolt T-Shirt, Fleece Jacket, Onesie, Test.allTheThings()`.
The control shows the chosen option, so the interface reports a state it has not applied.

---

### DEF-005 · "Add to cart" silently does nothing for half the catalogue

**Requirement broken:** REQ-002 — "verify add/remove from cart"
**Covered by test:** TC-UI-021 · **Severity:** Major · **Status:** Open · **Account:** `problem_user`

**Why this is a defect.** Reproduced from a clean context by adding all six products in
catalogue order and recording the cart badge after each. Three of the six never reach the
cart, and no message explains it.

**Steps:** sign in as `problem_user`, then select "Add to cart" on each of the six products
in turn, watching the cart badge.

**Expected:** the badge increases by one each time, reaching 6.

**Actual:** the badge reads 1, 2, 2, 2, 3, 3. Bolt T-Shirt, Fleece Jacket and
Test.allTheThings() T-Shirt are never added. The button still changes to "Remove", so the
interface claims the item is in the cart while the cart disagrees.

**Consequence.** Half the catalogue cannot be bought, and the customer is told the
opposite.

---

### DEF-006 · "Remove" never removes anything

**Requirement broken:** REQ-002 — "verify add/remove from cart"
**Covered by test:** TC-UI-022 · **Severity:** Major · **Status:** Open · **Account:** `problem_user`

**Why this is a defect.** Three different products were removed in turn from a clean
context; the cart badge stayed at 3 throughout, and the items remained in the cart.

**Expected:** the badge decreases and the item leaves the cart.
**Actual:** nothing changes. Taken together with DEF-005 the effect is absolute: the only
items that can be added are exactly the items that cannot be removed, so anything put in
this cart stays there.

**Consequence.** A customer cannot correct a mistake, and cannot reduce an order they
have changed their mind about.

---

### DEF-007 · A product tile opens a different product

**Requirement broken:** REQ-003 — "Sorting & Data Display"
**Covered by test:** TC-UI-052 · **Severity:** Major · **Status:** Open · **Account:** `problem_user`

**Why this is a defect.** Compared directly against `standard_user` in the same run, from
clean contexts, with one click on the first product tile in each.

**Steps:** sign in and select the first product in the catalogue, "Sauce Labs Backpack".

**Expected:** the detail page for Sauce Labs Backpack opens, as it does for
`standard_user` (`inventory-item.html?id=4`).
**Actual:** `inventory-item.html?id=5` opens, showing **Sauce Labs Fleece Jacket** — the
next product, at a different price.

**Consequence.** A customer reading a product's details is reading about a different
product, which is the kind of defect that produces returns rather than complaints.

---

### DEF-008 · Catalogue prices are random and do not match the price charged

**Requirement broken:** REQ-003 — "Sorting & **Data Display**"
**Covered by test:** TC-UI-050 · **Severity:** Major · **Priority:** High · **Status:** Open
**Account:** `visual_user`

**Why this is a defect.** Reproduced from a clean context. The catalogue prices bear no
relation to the real ones and change on each render; the totals at checkout use the real
prices, so the two disagree within a single purchase.

**Steps:** sign in as `visual_user`, note the catalogue prices, add three items and go
through to the order overview.

**Expected:** `$29.99, $9.99, $15.99, $49.99, $7.99, $15.99`, matching every other
account, and the same figures carried through to checkout.
**Actual:** the catalogue showed `$66.19, $88.73, $66.66, $52.33, $45.75, $21.53` — values
that appear to be generated at random up to $100. Checkout then charged
`Item total: $73.97`, computed from the **real** prices, not the ones displayed.

**Consequence.** A customer chooses on one price and is charged another. Whether the
displayed price is higher or lower, the shop is making a statement about price that it does
not honour — which is a trust and potentially a consumer-law problem rather than a
cosmetic one. Classified Major under our scale because checkout still completes; the
business impact argues for a higher priority than the severity alone suggests.

**Evidence:** `evidence/visual_user-catalogue.png`

---

### DEF-009 · Checkout accepts an empty Last Name

**Requirement broken:** REQ-002 — "checkout form validation (empty fields, invalid data)"
**Covered by test:** TC-UI-027 · **Severity:** Major · **Status:** Open · **Account:** `error_user`

**Why this is a defect.** Reproduced from a clean context. The same form refuses an empty
Last Name for `standard_user`, so the rule exists and is simply not applied here.

**Steps:** sign in as `error_user`, reach the checkout form, fill First Name and Postal Code,
leave Last Name empty, select Continue.

**Expected:** `Error: Last Name is required`, as for `standard_user`.
**Actual:** checkout proceeds to the order overview with no last name recorded.

**Consequence.** Orders can be placed with incomplete delivery details, which fails at
fulfilment rather than at the point where it could still be corrected.

---

### DEF-010 · "Add to cart" throws and silently fails for half the catalogue

**Requirement broken:** REQ-002 — "verify add/remove from cart"
**Covered by tests:** TC-UI-021, TC-UI-102 · **Severity:** Major · **Status:** Open
**Account:** `error_user`

**Why this is a defect.** Reproduced from a clean context with the console captured. The
same three products fail as for `problem_user`, but here an uncaught exception is raised
each time.

**Expected:** the badge increases by one for each of the six products.
**Actual:** the badge reads 1, 2, 2, 2, 3, 3, and the browser console records an uncaught
`Error: Failed to add item to the cart.` for each failure. "Remove" behaves the same way,
raising `Error: Failed to remove item from cart.`

**Consequence.** Identical to DEF-005 for the customer. The difference matters to a
developer: here the failure is visible in the console, so it would be caught by monitoring
if monitoring worked — which it does not, see DEF-012.

**Evidence:** `evidence/har-error_user.har`

---

### DEF-011 · Sorting shows a blocking alert and does nothing

**Requirement broken:** REQ-003
**Covered by test:** TC-UI-044 · **Severity:** Major · **Status:** Open · **Account:** `error_user`

**Why this is a defect.** Reproduced on every one of the four sort options from a clean
context.

**Expected:** the catalogue is reordered.
**Actual:** a browser alert appears reading
`Sorting is broken! This error has been reported to Backtrace.`, the customer must
dismiss it, and the order of products does not change.

**Consequence.** Beyond the broken sorting, an internal diagnostic message is shown
directly to the customer, naming an internal tool. Error handling of this kind belongs in a
log, not in a modal in front of a buyer. The claim it makes is also false — the report is
rejected, see DEF-012.

---

### DEF-012 · Error telemetry is rejected: build placeholders were never replaced

**Requirement broken:** REQ-005
> "Bug Reproduction at the Network Level: pick at least one bug and document the exact
> request/response involved, using browser DevTools."
> — Challenge brief, page 3, scenario 5

**Covered by test:** TC-UI-100 · **Severity:** Major · **Priority:** High · **Status:** Open
**Account:** **all six** — this is not account-specific

**Why this is a defect.** Observed on every account, on every page, in every run, in the
captured HAR files. It is not an environment problem: the request is well formed and
reaches the server, which answers deliberately with 401.

**Steps:** sign in as any account with the Network panel open and filter for `backtrace`.

There are **two channels**, and they fail differently:

| Channel | Address | Result |
|---|---|---|
| Usage metrics | `POST events.backtrace.io/api/{unique,summed}-events/submit?universe=UNIVERSE&token=TOKEN` | `401 Unauthorized` — `{"error":{"message":"Unauthorized request","code":6}}` |
| Crash reports | `POST submit.backtrace.io/UNIVERSE/TOKEN/json` | **503 Service Unavailable, returned without CORS headers.** The browser blocks the response, so the application sees only `net::ERR_FAILED` and cannot tell a misconfiguration from an outage |

**Expected:** telemetry is addressed to the real universe and token for this application
and is accepted.
**Actual:** the literal strings `UNIVERSE` and `TOKEN` survive into the production bundle
in both the query string and the path. Metrics are rejected and the console fills with
`Failed to load resource: 401 (Unauthorized)`; crash reports do not complete at all. For
`error_user`, thirteen crash submissions were attempted in one session and all thirteen
failed.

**Consequence.** Error reporting does not work in production at all. Every defect in this
log that raises a console error — DEF-002, DEF-010, DEF-011 — would have been reported
automatically and was not. The application is blind to its own failures, which is why
these defects have survived.

**Note for the owner.** Before this is fixed, see Q-08. The crash-report payload was
captured and inspected: it carries `attributes.user = "error_user"`,
`annotations.shoppingCart = [4]`, the whole catalogue, and a breadcrumb trail of the
customer's recent actions. The metrics channel carries none of that — only browser and
document metadata. So repairing the address switches on a flow of customer data to a
third party that is currently blocked by this very defect, and whether that is permitted
is a data-protection decision rather than an engineering one.

A full write-up with the request and response bodies is in `docs/BUG_REPORT.md`.

**Evidence:** `evidence/devtools-network-401.png`, `evidence/devtools-console-401.png`,
`evidence/har-standard_user.har` and the HAR file of every other account. Full write-up
with request and response bodies: `docs/BUG_REPORT.md`.

---

### DEF-013 · The catalogue freezes the browser for five seconds

**Requirement broken:** REQ-008 (derived — no performance target was stated)
**Covered by test:** TC-UI-080 · **Severity:** Major · **Status:** Open
**Account:** `performance_glitch_user`

**Why this is a defect.** Measured against `standard_user` in the same run, from clean
contexts, with the same steps. The delay is reproducible and the same length every time.

**Measured**

| Action | `standard_user` | `performance_glitch_user` | Difference |
|---|---|---|---|
| Sign-in until the catalogue is visible | 72 ms | 5 097 ms | ×71 |
| Change the sort order | 11 ms | 5 010 ms | ×455 |
| Open the cart | 59 ms | 57 ms | none |

**Actual behaviour.** The delay is not a slow response from a server — there is no server.
The browser is blocked: during those five seconds the page draws nothing and does not
react to clicks. It affects the catalogue page specifically; the cart is unaffected.

**Consequence.** Five seconds of a frozen page on the first screen after signing in is well
beyond the point at which customers abandon a site, and because the page is frozen
rather than merely slow, a customer cannot even navigate away.

**A note on how this was measured.** The first measurement used the browser's Navigation
Timing API and reported normal figures — 133 ms to first byte, 279 ms to load — which
would have been a false all-clear. Those events complete before the application renders,
and the delay happens during rendering. The figures above were taken by measuring the
time until catalogue content is actually visible, which is what a customer experiences.

---

### DEF-014 · One product image is replaced and the layout is broken

**Requirement broken:** REQ-003 — "Data Display"
**Covered by test:** TC-UI-015 · **Severity:** Minor · **Status:** Open · **Account:** `visual_user`

**Why this is a defect.** Reproduced from a clean context.

**Actual:** the first product shows the placeholder `sl-404-Cq1a9k9X.jpg` instead of its
own photograph, two products have their text aligned to the right while the rest are
aligned left, and one "Add to cart" button is positioned out of line with the others.

**Consequence.** Cosmetic, which is why it is Minor — but recorded because the same
account carries DEF-008, and a reader comparing the two should be able to see which
findings are cosmetic and which are not.

---

### DEF-015 · The cart outlives its owner and is shown to the next person who signs in

**Requirement broken:** REQ-007 (derived — **not confirmed**, see the note below)
**Covered by tests:** TC-UI-090, TC-UI-093 · **Severity:** Major · **Priority:** High
**Status:** Open, pending clarification of Q-03 · **Account:** any

**Why this is a defect.** Reproduced from a clean browser context, with the storage and
the session cookie inspected at each step. The steps are what happens naturally when two
people share a computer — a family machine, a library, a shop-floor terminal.

**Steps to reproduce**
1. Sign in as `standard_user`; add Sauce Labs Backpack and Sauce Labs Onesie.
2. Sign out using the menu.
3. Sign in as a **different** user, `problem_user`.
4. Open the cart.

**Expected:** the second user sees an empty cart.

**Actual:** the cart badge reads `2` and the cart contains Sauce Labs Backpack and Sauce
Labs Onesie — the first user's items. Inspecting storage confirms it:

| Step | `session-username` cookie | `cart-contents` in localStorage | Badge |
|---|---|---|---|
| Two items added as `standard_user` | `standard_user` | `[4,2]` | 2 |
| After signing out | *removed* | `[4,2]` — **untouched** | — |
| After `problem_user` signs in | `problem_user` | `[4,2]` — still the first user's | 2 |

The same was confirmed across a simulated browser restart: with cookies cleared and only
storage preserved, `cart-contents` still read `[4,2]`.

**Cause.** Signing out removes the session cookie and nothing else. The cart lives in
`localStorage`, which is tied to the browser rather than to the account, and no code
clears it at sign-out.

**What is and is not being claimed.** That a cart persists at all is **not** reported as a
defect — many shops do that deliberately, and no requirement here says otherwise. What
is reported is narrower: the cart is bound to the browser instead of to the account, so it
crosses between people. Even where persistence is intended, showing one customer's
intended purchases to another is very unlikely to be. Q-03 asks the product owner to
confirm the intended behaviour; until it is answered, this record stands with its
requirement marked as unconfirmed rather than being quietly treated as settled.

**Consequence.** On any shared device, one customer's shopping is disclosed to the next
person to sign in, and that person can complete a purchase from a cart they did not fill.

---

### DEF-016 · The typed password is written into the DOM as a plain attribute

**Requirement broken:** none stated — found while automating TC-UI-014
**Covered by test:** TC-UI-014 · **Severity:** Minor *(in this application)* · **Status:** Open
**Account:** any

**Why this is a defect.** Reproduced from a clean context by typing into the field and
reading the page's serialised HTML.

**Steps to reproduce**
1. Open the sign-in page and type a password into the password field.
2. Read the page source as the browser holds it, for example `document.body.outerHTML`.

**Expected:** the typed value is held as a property of the input, as a browser normally
keeps it, and does not appear in the serialised markup.

**Actual:** the value is written as an HTML attribute on the element:

```html
<input data-test="password" id="password" type="password" value="secret_sauce" name="password">
```

**Consequence.** The field is masked on screen, so this is invisible to a person using
the application. It is not invisible to anything that captures the DOM: session-replay
tools, error-reporting agents that attach a page snapshot, browser extensions, or a
screenshot of the Elements panel. In this application the severity is Minor, because the
password is published on the sign-in page anyway and there is nothing to protect. The
same mechanism in a real application would expose every customer's password to
whatever captures the page — and this application is already configured to send page
context to a third party (DEF-012, Q-08), which is exactly the combination that turns it
from a curiosity into an incident.

**How it was found.** Not by exploration: TC-UI-014 was written as a routine check that
the password is masked, and the second half of the assertion — that the value is not in
the markup — failed. It is recorded here partly as a defect and partly as evidence that
automating the obvious checks is worth the time.

---

## Checks that passed, and are worth stating

A defect log that lists only failures tells a reader nothing about what was verified.

**Access control is correct on every route.** All nine pages — the five linked ones, plus
the four that no menu links to — refuse access without a session and show a specific
message naming the page, for example
`Epic sadface: You can only access '/checkout-step-two.html' when you are logged in.`
No page leaked content. This also answers part of Q-06: the four unlinked routes are real,
guarded pages rather than dead code.

**Signing out ends the session properly.** After sign-out the session cookie is removed,
and using the browser's Back button does not restore access — the application returns to
the sign-in page rather than re-displaying the catalogue.

**Arithmetic on the order summary is correct** for every account that can reach it.
Three items totalling $73.97 produced `Tax: $5.92` and `Total: $79.89`; 8% of $73.97 is
$5.9176, correctly rounded. The same held for `error_user` at a different basket value.

---

### OBS-03 · A deprecated unload handler is blocked by browser policy

Seen in the console on every page load, alongside the telemetry failures:

```
[Violation] Permissions policy violation: unload is not allowed in this document.
```

The application registers an `unload` handler, which current Chrome refuses to run under
its default permissions policy. Browsers have been removing `unload` for years because it
makes pages ineligible for the back/forward cache and fires unreliably on mobile.

**Why it is recorded rather than reported.** No requirement is breached and nothing
visible to a customer changes, so it is not a defect. It is worth the owner's attention
for two reasons: whatever the handler was meant to do is not happening, and the
registration alone may be costing the page its back/forward cache eligibility.

---

## Reconciliation with the static analysis

`STATIC_ANALYSIS.md` made predictions from reading the application's code. Honesty
about which held up matters more than the count:

| Prediction | Outcome |
|---|---|
| All images replaced for `problem_user` | **Confirmed** — DEF-003 |
| Product tile opens the next product | **Confirmed** — DEF-007, `id=4` → `id=5` |
| Add works for only half the items; Remove never works | **Confirmed** — DEF-005, DEF-006, and the two rules interlock exactly as predicted |
| Sorting never applies for `problem_user` | **Confirmed** — DEF-004 |
| Last Name writes into First Name | **Confirmed** — DEF-001, and the mechanism is visible in the result |
| `error_user`: validation skipped, exceptions thrown, alert shown, cart not cleared | **Confirmed** — DEF-002, DEF-009, DEF-010, DEF-011 |
| `visual_user`: random prices | **Confirmed** — DEF-008, and execution revealed more than the code reading did: the price charged is the real one, so displayed and charged disagree |
| Telemetry addressed to unreplaced placeholders | **Confirmed** — DEF-012, with the exact request and a 401 response |
| `problem_user`: order total doubled | **Not reachable.** The code exists, but checkout cannot be passed with this account (DEF-001), so no customer can ever reach the page where doubling would occur. Recorded here rather than as a defect: a fault that no user can reach is not one, and if DEF-001 is fixed this one appears. |
| `performance_glitch_user` freezes the browser | **Confirmed, but only after the measurement was corrected** — see the note in DEF-013 |

## Observations

Findings that are **not** defects: no requirement is breached, so nothing is being
claimed as broken. They are recorded because they change what a reader should
believe about the system, and several of them feed open questions.

### OBS-01 · The brief documents four accounts; the application offers six

The brief lists `standard_user`, `problem_user`, `performance_glitch_user` and
`locked_out_user`. The application's own sign-in page lists those four plus `error_user`
and `visual_user`, under the heading "Accepted usernames are:".

**Why it is recorded.** A difference between the specification handed to a tester and the
system actually delivered is worth raising whatever its cause — outdated documentation,
a feature added without updating the brief, or accounts that were never meant to ship. It
is not a defect, because no requirement says the list must match. It is reported so that
whoever owns the documentation can decide which of the three it is.

**Effect on testing.** The two extra accounts are surveyed in one exploratory session
(TC-UI-015) rather than given the depth of the four the brief names. `error_user` is used
in three further cases because its deliberate faults are the clearest available evidence of
console and network defects.

---

### OBS-02 · Credentials and session state live entirely in the browser

Sign-in is performed in the browser with no request to a server. As a result:

- the list of valid usernames and the single password shared by all of them are compiled
  into the JavaScript file every visitor downloads, and are additionally printed on the
  sign-in page;
- the session cookie `session-username` holds the username as plain text, with no token
  and no signature, so setting that cookie by hand grants access without signing in;
- prices, the tax rate and order totals are calculated in the browser, where anyone can
  change them with developer tools.

**Why it is recorded.** This is a demo application built for practice, so it is almost
certainly deliberate, and security testing is out of scope for this assignment. It is
recorded anyway because in a real application each of these three would be Critical, and
a tester who noticed them and said nothing would not be doing the job. The third point
also underlies Q-02: an amount calculated in the browser is not an amount the business
controls.
