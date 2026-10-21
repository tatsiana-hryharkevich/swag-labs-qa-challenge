# Requirements

| | |
|---|---|
| **Document** | Requirements |
| **Version** | 1.0 |
| **Date** | 2026-10-20 |
| **Author** | Tatsiana Hryharkevich |

No requirements document was provided with this assignment, and there is no access to
the vendor's specifications or issue tracker. The requirements below were therefore
reconstructed from two sources, and each one says which it came from:

- **Explicit** — stated by the client in the challenge brief, quoted word for word with a
  page reference. These are not open to interpretation.
- **Derived** — worked out from what the application visibly does. **These are
  assumptions.** They are testable, but nobody has confirmed them, and each one has an
  open question attached so that it can be confirmed or corrected.

Keeping the two apart matters: a defect raised against an explicit requirement rests on
the client's own words, while a defect raised against a derived one rests on our reading
of the system, and a reader is entitled to know which they are looking at.

Every requirement also names the **system** it belongs to. The two systems under test are
unrelated — nothing in the UI calls the API — so a requirement belongs to one of them, and
mixing them in one list without saying which is which would suggest a connection that does
not exist.

---

## Explicit requirements

### REQ-001 · Login and access control
**System:** UI
**Type:** Explicit
**Source:** Challenge brief, page 3, scenario 1

> "Login & Access Control: exercise all four demo users. Document behavioral differences
> and any defects, including what happens with invalid credentials and the locked-out
> account."

**Covered by:** TC-UI-001 to TC-UI-015 (test plan §6.1)

---

### REQ-002 · Cart and checkout
**System:** UI
**Type:** Explicit
**Source:** Challenge brief, page 3, scenario 2

> "Cart & Checkout Flow: verify add/remove from cart, checkout form validation (empty
> fields, invalid data), and order completion. Flag any functional bugs you encounter."

**Covered by:** TC-UI-020 to TC-UI-039 (test plan §6.2)

---

### REQ-003 · Sorting and data display
**System:** UI
**Type:** Explicit
**Source:** Challenge brief, page 3, scenario 3

> "Sorting & Data Display: verify that product sorting (name A–Z/Z–A, price low–high/
> high–low) actually sorts correctly across the different demo users."

**Covered by:** TC-UI-040 to TC-UI-053 (test plan §6.3)

---

### REQ-004 · API contract validation
**System:** **API**
**Type:** Explicit
**Source:** Challenge brief, page 3, scenario 4

> "API Contract Validation: verify ReqRes endpoints return correct status codes and
> response shapes, and confirm how the API behaves for invalid input (e.g. a non-existent
> user ID)."

**Covered by:** TC-API-001 to TC-API-018 (test plan §6.4)

---

### REQ-005 · Defect reproduction at the network level
**System:** UI
**Type:** Explicit
**Source:** Challenge brief, page 3, scenario 5

> "Bug Reproduction at the Network Level: pick at least one bug and document the exact
> request/response involved, using browser DevTools."

**Note on feasibility.** The application performs no network call for signing in, the cart,
or pricing — all of it runs in the browser. The observable network surface is static files
and error telemetry, and that is where this requirement is satisfied. See
`STATIC_ANALYSIS.md` §2 and §5.

**Covered by:** TC-UI-100 to TC-UI-102 (test plan §6.8)

---

## Derived requirements — assumptions, not client statements

### REQ-006 · Protected pages require a session
**System:** UI
**Type:** Derived — assumption
**Basis:** Opening `/inventory.html` without a session is refused with an error message,
so refusing unauthenticated access is intended behaviour rather than an accident. The
full list of pages that should be protected has never been stated; eleven routes exist and
four of them are not linked from anywhere in the interface.
**Open question:** Q-06
**Covered by:** TC-UI-010, TC-UI-011, TC-UI-012, TC-UI-013

---

### REQ-007 · Cart state behaves predictably across navigation
**System:** UI
**Type:** Derived — assumption
**Basis:** The cart survives navigation between pages, which only makes sense as
intended behaviour. What should happen to it at sign-out, across browser restarts, and
when a different person signs in on the same browser has never been stated — and the
application keeps the cart in `localStorage` while the session is a separate cookie, so it
currently survives all three.
**Open question:** Q-03 — this is the question that decides whether the current behaviour
is a feature or a defect.
**Covered by:** TC-UI-024, TC-UI-034, TC-UI-090, TC-UI-093

---

### REQ-008 · The application responds within a reasonable time
**System:** UI and API
**Type:** Derived — assumption
**Basis:** No performance target was given. One account is named
`performance_glitch_user`, which implies the others are expected to be noticeably faster,
so a baseline exists in intent even though no number was stated.
**Assumption applied:** the baseline account is measured, and the slow account is
reported as a multiple of it rather than against an invented threshold.
**Covered by:** TC-UI-080, TC-UI-081, TC-API-018

---

### REQ-009 · The application is usable with assistive technology
**System:** UI
**Type:** Derived — assumption
**Basis:** No accessibility target was stated. WCAG 2.1 level AA is assumed as the usual
baseline for a customer-facing commercial site.
**Open question:** Q-07 — the target level has to be confirmed before any result here can
be called a pass or a failure.
**Covered by:** TC-UI-082, TC-UI-083, TC-UI-084, TC-UI-085

---

### REQ-010 · Commerce rules: quantity, availability and the cart lifecycle
**System:** UI
**Type:** Derived — assumption
**Basis:** The brief says nothing about rules every shop must define. The application
fixes quantity at one unit per item, has no concept of stock or availability at all, and
never re-checks an item before an order is completed. Whether each of these is a
deliberate simplification of a demo or a genuine gap cannot be decided from the
application alone.
**Open questions:** Q-04 (quantity), Q-05 (availability)
**Covered by:** TC-UI-090 to TC-UI-095

---

## Coverage check

| Requirement | System | Type | Cases | Covered |
|---|---|---|---|---|
| REQ-001 | UI | Explicit | 15 | yes |
| REQ-002 | UI | Explicit | 20 | yes |
| REQ-003 | UI | Explicit | 14 | yes |
| REQ-004 | **API** | Explicit | 18 | yes |
| REQ-005 | UI | Explicit | 3 | yes |
| REQ-006 | UI | Derived | 4 | yes |
| REQ-007 | UI | Derived | 4 | yes |
| REQ-008 | UI and API | Derived | 3 | yes |
| REQ-009 | UI | Derived | 4 | yes |
| REQ-010 | UI | Derived | 6 | yes |

Every requirement has at least one case. The reverse check — that every case traces back
to a requirement — is in the traceability matrix in the README.
