# Executed Test Cases

| | |
|---|---|
| **Document** | Execution record |
| **Version** | 0.3 — exploratory cases executed; UI suite built and green; API suite outstanding |
| **Date** | 2026-10-21 |
| **Author** | Tatsiana Hryharkevich |

The result of every case in the test plan, automated and manual alike, in one place. The
plan says what will be tested; this says what was tested, when, and what happened.

Result is one of **Passed**, **Failed**, **Known failure**, **Skipped** (with the reason) or
**Not executed** (with the reason — which for a P1 case is not acceptable, see test plan
§7). Automated results are taken from the run report; manual and exploratory results are
written here by hand.

## Executed so far

All results below are from exploratory sessions ES-01 to ES-03 on 2026-10-21. Where a
case is also covered by an automated test, the automated result replaces this one once
the suite runs.

| Case ID | Coverage | Account | Result | Defect | Notes |
|---|---|---|---|---|---|
| TC-UI-001 | Exploratory | standard | Passed | — | Catalogue renders with all six products |
| TC-UI-002 | Exploratory | locked_out | Passed | — | Refused with "Epic sadface: Sorry, this user has been locked out." |
| TC-UI-008 | Exploratory | problem | Passed | — | Signs in and reaches the catalogue |
| TC-UI-009 | Exploratory | perf_glitch | Passed | — | Signs in; delay measured separately, see TC-UI-080 |
| TC-UI-010 | Exploratory | — | Passed | — | `/inventory.html` refused without a session, page named in the message |
| TC-UI-011 | Exploratory | — | Passed | — | All nine routes refused, including the four not linked from any menu |
| TC-UI-012 | Exploratory | standard | Passed | — | Sign-out removes the `session-username` cookie |
| TC-UI-013 | Exploratory | standard | Passed | — | Back after sign-out returns to the sign-in page, session not restored |
| TC-UI-015 | Exploratory | error, visual | Passed | DEF-014 | Both undocumented accounts sign in; behaviour surveyed |
| TC-UI-020 | Exploratory | standard | Passed | — | Badge reads 1, cart holds the item |
| TC-UI-021 | Exploratory | standard | Passed | — | Badge reaches 6 adding all six products |
| TC-UI-021 | Exploratory | problem | **Failed** | DEF-005 | Badge reads 1, 2, 2, 2, 3, 3 — three products never added |
| TC-UI-021 | Exploratory | error | **Failed** | DEF-010 | Same three fail, with an uncaught exception each time |
| TC-UI-022 | Exploratory | standard | Passed | — | Badge decreases correctly |
| TC-UI-022 | Exploratory | problem | **Failed** | DEF-006 | Badge unchanged after three removals |
| TC-UI-025 | Exploratory | standard | Passed | — | Order completed, confirmation page reached |
| TC-UI-025 | Exploratory | error | **Failed** | DEF-002 | Finish does nothing; no navigation, no message |
| TC-UI-027 | Exploratory | error | **Failed** | DEF-009 | Checkout proceeds with Last Name empty |
| TC-UI-029 | Exploratory | standard | Passed | — | $73.97 + $5.92 tax = $79.89; 8% correctly rounded |
| TC-UI-032 | Exploratory | problem | **Failed** | DEF-001 | Last Name writes into First Name; checkout unreachable |
| TC-UI-035 | Exploratory | standard, error | Passed | — | Tax is 8% of the item total at two different basket values |
| TC-UI-040..043 | Exploratory | standard | Passed | — | All four sort modes order the catalogue correctly |
| TC-UI-044..047 | Exploratory | problem | **Failed** | DEF-004 | Catalogue order identical before and after all four options |
| TC-UI-044 | Exploratory | error | **Failed** | DEF-011 | Blocking alert shown; order unchanged |
| TC-UI-049 | Exploratory | perf_glitch | Passed | DEF-013 | Sorting is correct, but takes 5 010 ms |
| TC-UI-050 | Exploratory | problem | **Failed** | DEF-003 | All six images replaced with `sl-404` |
| TC-UI-050 | Exploratory | visual | **Failed** | DEF-008 | Catalogue prices random; checkout charges the real ones |
| TC-UI-052 | Exploratory | problem | **Failed** | DEF-007 | Backpack tile opens `id=5`, Fleece Jacket |
| TC-UI-080 | Exploratory | standard, perf_glitch | **Failed** | DEF-013 | 72 ms against 5 097 ms to visible catalogue |
| TC-UI-090 | Exploratory | standard → problem | **Failed** | DEF-015 | Second user signs in and sees the first user's cart |
| TC-UI-091 | Exploratory | standard | Passed | — | Quantity fixed at 1; an item cannot be added twice |
| TC-UI-093 | Exploratory | standard | **Failed** | DEF-015 | Cart survives a simulated browser restart |
| TC-UI-100 | Exploratory | all | **Failed** | DEF-012 | Telemetry returns 401; placeholders left in the URL |
| TC-UI-102 | Exploratory | error | **Failed** | DEF-010 | Uncaught exceptions on add and remove |

## Automated UI suite — run of 2026-10-21

`npx playwright test` · Chromium 156 · 63 tests · 22.8 s · **0 unexpected results**

| Outcome | Count | Meaning |
|---|---|---|
| Passed | 45 | The behaviour is correct |
| Known failure | 18 | The test asserts correct behaviour, the application does not provide it, and the defect is logged |
| Failed | 0 | Nothing failed for a reason that is not accounted for |
| Skipped | 0 | Nothing went unrun |

By priority: 4 `@smoke`, 29 `@P1`, 32 `@P2`, 2 `@P3`. The smoke profile runs in 1.2 s.

The 18 known failures map to 11 distinct defects:

| Defect | Tests marked |
|---|---|
| DEF-001 | TC-UI-032 |
| DEF-002 | TC-UI-039 |
| DEF-003 | TC-UI-050 (problem_user) |
| DEF-004 | TC-UI-045, TC-UI-046, TC-UI-047 |
| DEF-005 | TC-UI-021 (problem_user) |
| DEF-006 | TC-UI-022 (problem_user) |
| DEF-007 | TC-UI-052 (problem_user) |
| DEF-008 | TC-UI-050 (visual_user) |
| DEF-010 | TC-UI-021 (error_user), TC-UI-102 (error_user) |
| DEF-011 | TC-UI-051 |
| DEF-012 | TC-UI-100, TC-UI-101 |
| DEF-015 | TC-UI-090, TC-UI-093 |
| DEF-016 | TC-UI-014 |

**TC-UI-044 is deliberately not marked.** Name A to Z is the order the catalogue already
opens in, so for `problem_user` a broken sort and a working one produce the same result.
The check is kept because the order it asserts is still correct, but it is no evidence
either way about DEF-004 — and marking it would have claimed otherwise.

**DEF-016 was found by this suite, not by exploration.** TC-UI-014 was written as a
routine check that the password field is masked; the second half of the assertion, that
the value does not appear in the page markup, failed.

## Not yet executed

Everything not listed above. The automated suite covers most of it; the remaining manual
cases — boundary input on the checkout form (TC-UI-033), the empty-cart checkout
(TC-UI-031), availability (TC-UI-094, TC-UI-095) — and the whole API block are still to run.
