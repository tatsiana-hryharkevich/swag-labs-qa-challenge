# QA Engineer Technical Challenge — Swag Labs (UI) & ReqRes (API)

Test planning, execution and automation for two systems handed over without a
specification: a web shop and a REST API.

**Author:** Tatsiana Hryharkevich · **Date:** October 2026

---

## Start here

| Document | What it is |
|---|---|
| [Test Plan](docs/TEST_PLAN.md) | Scope, approach, prioritisation, 81 test cases, release-readiness criteria |
| [Requirements](docs/REQUIREMENTS.md) | The 10 requirements, separated into what the client stated and what we derived |
| [Open Questions](docs/OPEN_QUESTIONS.md) | 8 questions for the product owner; 3 of them block a release decision |
| [Static Analysis](docs/STATIC_ANALYSIS.md) | What reading the application's shipped JavaScript revealed, and how it shaped the test design |
| [Defect Log](docs/DEFECTS.md) | Defects found, with severity; plus observations that are not defects |
| [Bug Report](docs/BUG_REPORT.md) | One defect documented in full, with evidence at the request/response level |
| [Executed Cases](docs/TEST_CASES.md) | Every case and its result |
| [Exploratory Sessions](docs/EXPLORATORY_SESSIONS.md) | Session charters, findings and debriefs |
| [Performance](docs/PERFORMANCE.md) | Client-side measurements, and why no load testing was done |
| [Accessibility](docs/ACCESSIBILITY.md) | Automated rule checks, and what a clean result does not prove |

---

## Systems under test

| | UI | API |
|---|---|---|
| **System** | Swag Labs / SauceDemo | ReqRes |
| **URL** | https://www.saucedemo.com/ | https://reqres.in/api |
| **Stack under test** | React single-page application, **no backend** | Public mock REST service |
| **Suite** | Playwright, JavaScript | pytest + requests |

**The two systems are unrelated.** Nothing in the UI calls the API, and the UI consumes
no contract the API provides, so there is no integration between them to test. They are
treated as two parallel scopes sharing one repository and one run command.

---

## Setup

Requires Node 18+ and Python 3.10+.

```bash
make install        # installs Node and Python dependencies and the Playwright browser
```

`make install` uses [uv](https://docs.astral.sh/uv/) for the Python side. Without uv:

```bash
npm ci && npx playwright install chromium     # UI suite
python -m pip install -r requirements.txt     # API suite, then run it with: pytest tests/api
```

## Running the tests

```bash
make test           # everything — this is the single documented command
```

Narrower profiles, described in the test plan §5.1:

```bash
make smoke          # 7 cases, under a minute: is this build worth testing at all
make regression     # every P1 case — the CI gate
make test-ui        # the Playwright suite only
make test-api       # the pytest suite only
```

### A note on the API suite and its request budget

ReqRes is a public demo service that allows **40 requests per day from one address**
without an account. A full run of this suite costs **29**; the smoke profile costs **3**,
and each run prints what it used.

If the allowance is already spent, the suite does not fail — every affected check is
**skipped with the reason named**, for example
`ReqRes rate-limited GET /users/2 (429): this check did not run`. That is deliberate: a
failure would claim the contract is broken, and somebody else's rate limit is not that.

To lift the limit, set an API key from a free ReqRes account:

```bash
export REQRES_API_KEY=<your key>
```

## Reading the results

```bash
npx playwright show-report      # UI results: statuses, traces, video, HAR
open report.html                # API results
```

The report shows each test as **passed, failed, skipped or known failure** — four
different things. A *skipped* test did not run, usually because the third-party API was
unavailable; a *known failure* is a defect already logged and linked. Neither is a pass,
and neither is a new problem.

---

## Test strategy, in short

The full reasoning is in the [test plan](docs/TEST_PLAN.md); this is the shape of it.

**No specification exists**, so requirements were reconstructed from two sources and kept
visibly apart: what the client wrote, quoted word for word, and what we derived from the
application's behaviour, marked as assumptions. Anything neither source answered became
an open question rather than a silent assumption.

**Priority came from risk** — the damage a defect would do, how likely it is, and how hard
it would be to catch another way. P1 is anything that blocks a purchase or blocks access.
Automation went to the repeatable and the data-driven; manual testing went where a
judgement about intended behaviour was needed and no specification offered one.

**Reading the shipped JavaScript came first.** Twenty minutes of static analysis answered
where the content comes from, which pages exist, and exactly which behaviours differ per
account — turning most of the exploratory work from guesswork into targeted
confirmation. Its findings are predictions, and none entered the defect log until
reproduced in a browser.

**Known failures are linked, never hidden.** The seeded defects in this application would
otherwise leave the suite permanently red, and a permanently red suite tells you nothing.
Each is marked as a known failure with a link to its logged defect, so red once again
means something new has broken.

**What was deliberately not done**, with reasons: load testing (these are public demo
sites belonging to someone else), visual regression (reference images cannot be made
reliable across machines here), cross-browser and mobile coverage, and manual
accessibility checks. Stated in the plan so that absence is read as a decision, not an
omission.

---

## Traceability

Each requirement maps to the cases that cover it, each case to the test that runs it, and
each defect back to the case that found it.

| Requirement | Cases | Automated | Defects found |
|---|---|---|---|
| REQ-001 | 15 (TC-UI-001–TC-UI-015) | 14 | DEF-014, DEF-016 |
| REQ-002 | 20 (TC-UI-020–TC-UI-039) | 15 | DEF-001, DEF-002, DEF-005, DEF-006, DEF-009, DEF-010 |
| REQ-003 | 14 (TC-UI-040–TC-UI-053) | 13 | DEF-003, DEF-004, DEF-007, DEF-008, DEF-011 |
| REQ-004 | 18 (TC-API-001–TC-API-018) | 17 | — |
| REQ-005 | 3 (TC-UI-100–TC-UI-102) | 3 | DEF-010, DEF-012 |
| REQ-006 | 4 (TC-UI-010–TC-UI-013) | 4 | — |
| REQ-007 | 4 (TC-UI-024, TC-UI-034, TC-UI-090, TC-UI-093) | 3 | DEF-015 |
| REQ-008 | 3 (TC-API-018, TC-UI-080, TC-UI-081) | 1 | DEF-013 |
| REQ-009 | 4 (TC-UI-082–TC-UI-085) | 4 | — |
| REQ-010 | 6 (TC-UI-090–TC-UI-095) | 4 | DEF-015 |

**This table is generated, not typed**, and the generator also checks it:

```bash
python tools/traceability.py            # print the matrix
python tools/traceability.py --check    # fail if anything is unlinked
```

A requirement with no case, a test whose case id is not in the plan, or a defect pointing
at a case that does not exist all fail the check — and the check runs in CI on every
change.

---

## Results

### The suites

| Suite | Tests | Passed | Known failures | Unexplained failures |
|---|---|---|---|---|
| UI (Playwright) | 75 | 56 | 19 | **0** |
| API (pytest) | 31 | 31 | 0 | **0** |

Every known failure names the defect it waits on. No test carries that marker without a
logged defect behind it, and the smoke profile runs in under two seconds.

### What was found

**18 defects, 4 observations and 13 open questions.**

| Severity | Count |
|---|---|
| Critical | 2 |
| Major | 13 |
| Minor | 3 |

The two Critical defects are the same failure wearing different clothes: **neither
`problem_user` nor `error_user` can complete a purchase**, and in both cases the
application says nothing at all. One cannot pass the checkout form because the Last Name
field writes into First Name; the other can, but the Finish button silently does nothing.

**Thirteen of the eighteen were planted** — SauceDemo switches defects on by account, by
design. Five were not, and those are the ones worth reading: broken error telemetry (DEF-012), a
cart that crosses between people on a shared browser (DEF-015), a password written into
the DOM as plain text (DEF-016), an API that reports a missing key on a request that sent
one (DEF-017), and a required field that accepts three spaces and lets an order complete
with a blank name (DEF-018). Three of the five were found by the automated suites rather
than by exploring.

### The release recommendation

Judged against the criteria in test plan §14, with the caveat that neither system is ours
to release:

> UI suite: 75 of 75 executed — 56 passed, 19 known failures, all logged and linked.
> API suite: 31 of 31 executed, all passed. Defects: 2 Critical open with no
> workaround, 13 Major, 3 Minor. Open questions blocking a decision: 6.
>
> **Recommendation: do not ship.** Two accounts cannot complete a purchase at all, which
> is a stop criterion on its own. Separately, Q-02 — which regions the shop serves and how
> tax is determined — must be answered before any order total can be called correct.

---

## Time spent

The clock was not run, so no figure is claimed here. What can be stated honestly is the
shape of the work and what was prioritised.

**The four-hour core scope is complete**: the test plan, requirements and open questions;
exploratory sessions across all six accounts; the UI and API suites; the detailed bug
report; CI; and this README.

**Beyond it**, and marked as such throughout: the static analysis of the application's
shipped JavaScript, the performance measurements, the accessibility scan, and the
generated traceability check.

**Elapsed time exceeded four hours**, and the reason is worth stating plainly: the
documents were reviewed and rewritten repeatedly — terminology unified, dense phrasing
replaced, contradictions found and fixed, one measurement discarded as taken with the
wrong instrument. Under a hard four-hour limit the extended block would have been dropped
first, exactly as the test plan says it would, and the core scope would still have been
delivered.

---

## Bonus questions

### 1. If this were subject to GxP/CSV, what validation documentation would accompany the test evidence?

Most of the package already exists here in draft form. What changes under GxP is less
*what* the documents are than *how* they are produced and approved — so the useful answer
is the mapping, and what would fail an audit as it stands.

| Validation artefact | What this repository already has | What would have to change |
|---|---|---|
| **Validation plan**, risk assessment | `docs/TEST_PLAN.md` — scope, risk-based prioritisation (§5), risks to the test effort (§9) | Approved and signed **before** execution; a GAMP 5 software category assigned, which sets the required depth |
| **URS / functional specification** | `docs/REQUIREMENTS.md` — ten requirements, explicit separated from derived | Five of the ten are *derived*: our reading of the system. Nothing may be validated against an assumption, so each must be confirmed as a requirement or dropped. `docs/OPEN_QUESTIONS.md` is the list of what has to be answered first |
| **Requirements traceability matrix** | generated by `tools/traceability.py` and enforced in CI | Same mechanism; its output becomes a controlled document, approved per release |
| **IQ** — installation qualification | `package-lock.json`, `requirements.txt`, `playwright.config.js`, the pinned runner image and tool versions in `.github/workflows/tests.yml`, and the commit SHA of every run | Today the environment is *reproducible* but not *recorded*. IQ needs the actual installed versions captured per run and signed |
| **OQ** — operational qualification | the two suites — 75 UI and 31 API cases, each with its expected result in code — and `docs/TEST_CASES.md` as the execution record | Expected results approved before execution, and each run signed by an executor and a reviewer. Here the same person wrote and ran them in one sitting |
| **PQ** — performance qualification | **nothing** | Business-led UAT in the live environment with real users and data. Out of reach for a demo system with no business behind it |
| **Deviations and CAPA** | `docs/DEFECTS.md` — severity, reproduction, evidence, and the justification that each is a defect rather than an environment artefact | Each becomes a deviation with an impact assessment. The known-failure markers in the suite would need formal approval to remain |
| **Validation summary and release statement** | the Results section of this README, built from the criteria in test plan §14 | Signed by named approvers rather than recommended by the tester |
| **Audit trail** | git history; evidence committed under `evidence/`, captured at the moment of observation | 21 CFR Part 11 wants electronic signatures, trustworthy time-stamping, and history that cannot be rewritten — a repository where a branch can be force-pushed does not qualify |

**What would not pass as it stands**, and it is worth being explicit about it:

- Half the requirements are our own inference. In a regulated context that alone stops
  validation until they are agreed.
- The test scripts were written after observing the behaviour, by the person who ran
  them, with no second signature. Under ALCOA+ that is not acceptable evidence regardless
  of how good the testing was.
- The evidence is captured by tooling I wrote and could change. The DevTools screenshots
  are contemporaneous and human-witnessed; the HAR captures are reproducible but
  self-generated, which is a different standard.

### 2. How would you integrate this regression suite into CI, and what would trigger it?

GitHub Actions, with the UI and API jobs running in parallel.

| What happens | Declared in the workflow as | Profile | Why |
|---|---|---|---|
| Someone opens or updates a pull request | `on: pull_request` | smoke, then regression | The merge gate. Fast feedback while the change is fresh. |
| A change lands on the main branch | `on: push` | regression | Confirms what actually landed. |
| 03:00 UTC, Monday to Friday | `on: schedule`, `cron: '0 3 * * 1-5'` | full, with accessibility and timings | Catches slow drift and third-party contract changes without slowing anyone down. |
| Someone chooses to | `on: workflow_dispatch` | any, picked from a dropdown | Investigating a specific failure. |

**Nobody starts any of these by hand, including the nightly run.** The first two fire on
the Git event; the nightly one is fired by GitHub's own scheduler from the cron
expression in `.github/workflows/tests.yml`. Only the last is manual, and it exists for
the times a person wants a specific profile now.

Two things about scheduled runs are worth knowing before relying on one: they only ever
run against the default branch, and GitHub disables them automatically after 60 days
without activity in the repository.

**So the nightly run needs an alert on its absence, not only on its failure.** A
monitoring arrangement that only reacts to red treats silence as health, and silence is
exactly what a disabled schedule, an expired token or a runner outage produce. A failed
run is noisy and gets attention; a run that never happened is invisible. In practice that
means a check that asks "was there a completed nightly result in the last 26 hours?" and
raises if not — a scheduled job in another system, a monitor on the Actions API, or a
dead-man's-switch service that expects a ping and alerts when none arrives. The window is
26 rather than 24 hours because GitHub's scheduler is best-effort and runs are delayed at
peak times.

**Where the reports go, and in what form.**

| | Produced | Form | Kept |
|---|---|---|---|
| **UI report** | `playwright-report/` | Self-contained HTML; opened with `npx playwright show-report` | Local only — regenerated by every run, not committed |
| **UI failure evidence** | `test-results/<test>/` | `trace.zip`, `video.webm`, `test-failed-1.png`, `error-context.md` | Local only — regenerated by every run, not committed |
| **API report** | `report.html` | Single self-contained HTML file from `pytest-html` | Local only — regenerated by every run, not committed |
| **In CI** | Actions run page | The same files, zipped as the artifacts `playwright-report` and `pytest-report` | 14 days, then deleted |
| **Defect evidence** | `evidence/` | HAR captures and screenshots referenced by name from the defect log | **Committed** — permanent |

The distinction in the last row is deliberate. Run output is disposable: it belongs to one
execution, is regenerated by the next, and is in `.gitignore`. Evidence attached to a
defect is not — a defect record has to stay readable long after the run that produced it
has been deleted, so those files live in the repository and are named in the record.

Three further settings: branch protection, so the regression profile must pass before a
merge; API keys in repository secrets, never in the repository; and one retry on CI only,
with every retried test reported — a test that needs retries is a defect in the suite and
gets an issue, not a permanent `retries: 3`.

### 3. How would you handle test data setup and teardown for a stateful application?

This application needs no data provisioning — accounts are fixed and the catalogue is
static — but it is not stateless: the cart lives in `localStorage` and survives sign-out, so
every test starts from an isolated browser context and every manual session starts from
"Reset App State". Without that, results leak between runs.

For a genuinely stateful system:

- **Data created per test, not shared.** Shared fixtures create ordering dependencies, and
  ordering dependencies create flaky tests.
- **Created through the API, not the UI.** Setting up through the interface tests the setup
  rather than the thing under test, and is far slower.
- **Unique per run** — a run identifier in every generated record — so parallel runs and
  reruns cannot collide.
- **Torn down by the test that created it**, with a scheduled sweep for whatever escapes.
- **Isolation at the right level**: a transaction rolled back per test where the stack allows,
  otherwise a schema or tenant per run, or a restored container snapshot.
- **Never a copy of production data.** Synthetic or anonymised, which is a hard
  requirement rather than a preference once GDPR or GxP applies.
- **Reference data versioned with the schema**, so a migration and its seed data move
  together.

### 4. What performance or accessibility checks would you flag as important, even though they were out of scope?

**Performance.** The checkout path deserves a budget tied to conversion, measured as
real user-centred metrics — largest contentful paint and interaction latency, not only
page load. Worth noting from this exercise: the slow account does not simulate a slow
network at all, it blocks the browser's main thread with a loop, which is a different and
more damaging failure — the page cannot even respond to a click. That distinction
matters when choosing what to measure. On the API side, latency at the 95th percentile
under realistic concurrency, rather than a single request.

**Accessibility.** The conformance target has to be agreed first — often a legal
requirement rather than a preference for a public-facing shop. Automated rule checks
belong in CI, but they find roughly a third of the problem. The rest is manual and
matters more: keyboard navigation through the whole purchase path, a visible focus
indicator, form labels correctly associated with their inputs, error messages announced
rather than merely coloured, and a screen reader run through checkout.

### 5. Given only four hours, how did you decide what to test manually, what to automate, and what to skip?

Not by judgement at the end, but by a priority recorded against every case in the plan
(§5) and a set of run profiles built from it (§5.1). The decision is therefore in the
document, case by case, and can be argued with.

**The rule.** P1 blocks a purchase or blocks access to the application, or the brief
names it explicitly. P2 makes the experience worse or shows wrong data without blocking.
P3 is low impact, or automating it costs more than it is worth in the time available.
Applied to 82 cases that gave **36 P1, 28 P2, 18 P3**.

**What happens regardless.** In this order, and nothing below begins before the item
above it is finished:

| | Work | Size | Why it cannot be cut |
|---|---|---|---|
| 1 | Test plan, requirements, open questions | ~20 min | If time runs out at any point, this is precisely what the brief asks to be left behind |
| 2 | Smoke profile — 4 UI + 3 API cases | under 2 min | Answers whether the build is worth testing at all, before anything is spent on depth |
| 3 | Exploratory sessions across all six accounts | 3 sessions, 50 min | Finds what no scripted case knows to ask. 12 of the 18 defects came from here |
| 4 | **Logging every defect found, with evidence** | roughly a third of the time after a find | An unlogged defect is not a result |
| 5 | All P1 automated — 12 checkout, 9 API contract, 8 sorting, 7 authentication | 36 cases | The revenue path, and the brief's five required scenarios |
| 6 | The detailed bug report at the request/response level | ~30 min | Explicitly required, and the only artefact where depth beats breadth |
| 7 | README, traceability matrix, CI | ~25 min | A suite nobody else can run has not been delivered |

**Then, with time remaining:** the 28 P2 cases, automated where that is cheap and checked
by hand where it is not.

**The cut order**, decided in advance so it does not have to be improvised under
pressure. Work is dropped from the bottom:

1. The extended block — accessibility scan, performance write-up, session ES-04. 6 cases
   and 2 documents, and the first thing to go because none of it is in the brief.
2. The 10 manual and exploratory P3 cases.
3. P2 cases that are not cheap to automate.
4. The second and third account in a parametrised P1 case — keep `standard_user`, lose
   the comparison.

What is never cut is items 1 and 4 of the table above: the planning documents and the
defect records. Coverage can be reported as incomplete; a finding that was seen and not
written down cannot be recovered at all.

**Skipped outright, each with the reason recorded in §2.3:** load testing, because these
are public demo sites belonging to someone else; visual regression, because reference
images taken on one machine do not match another and the tests would fail for the wrong
reason; cross-browser and mobile, because widening the surface before one browser is
verified buys little.

---

## A note on AI assistance

This solution was built with Claude Code as an active collaborator, which the brief
explicitly invites. Being specific about the division of labour, since "I used AI" says
very little:

**What the AI did.** Drafted documents from my direction and rewrote them repeatedly
against my review; read the application's shipped JavaScript bundle and catalogued the
per-account behaviour; ran the API probes that established actual status codes and
response shapes; wrote the test code; checked the plan for internal contradictions.

**What remained mine.** Every decision in the stack, and the review that shaped the
documents. Playwright with JavaScript for the UI and pytest for the API, chosen against
my own experience. The rule that a failing test may be marked as a known failure only
with a link to a logged defect carrying its evidence. The requirement that a defect record
justify itself as a defect rather than an environment problem or contrived steps. The
separation of coverage type from evidence capture. The release-readiness criteria. The
questions about regional tax, stock and the cart lifecycle that became the blocking open
questions — those came from asking what a real shop must define, which is not something
a tool volunteers.

Several rounds went into making the documents readable: terminology was unified, dense
phrasing rewritten in plain words, and a glossary added.
