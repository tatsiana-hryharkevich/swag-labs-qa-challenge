# QA Engineer Technical Challenge — Swag Labs (UI) & ReqRes (API)

Test planning, execution and automation for two systems handed over without a
specification: a web shop and a REST API.

**Author:** Tatsiana Hryharkevich · **Date:** October 2026

> ⚠️ **Work in progress.** Planning and analysis are complete; execution and the
> automated suites are being built. Sections marked *filled after execution* are
> placeholders. This banner is removed before submission.

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

Requires Node 18+, Python 3.10+ and [uv](https://docs.astral.sh/uv/).

```bash
make install        # installs Node and Python dependencies and the Playwright browser
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

*Filled after execution.* Each requirement maps to the cases that cover it, each case to
the test that runs it, and each failure to a logged defect.

| Requirement | Cases | Automated tests | Defects |
|---|---|---|---|
| | | | |

---

## Results

*Filled after execution* — counts by status, defects by severity, and the release
recommendation built from the criteria in test plan §14.

---

## Time spent

*Filled after execution.* Reported split between the four-hour core scope and the
extended work done beyond it, so that prioritisation is visible rather than claimed.

---

## Bonus questions

### 1. If this were subject to GxP/CSV, what validation documentation would accompany the test evidence?

A validation package, with the evidence we already produce forming only part of it:

- **Validation plan** and a **risk assessment** (GAMP 5 software category, risk-based
  depth), approved before any testing starts.
- **User and functional requirement specifications**, with a **requirements traceability
  matrix** as the backbone — the same role the RTM plays here, but formally approved.
- **IQ — Installation Qualification.** Documented evidence that the system is installed as
  specified: versions of the application, browser, runtime and dependencies, the exact
  commit, lock files, the CI runner image, environment configuration — each verified and
  signed.
- **OQ — Operational Qualification.** Documented evidence that each function works to
  specification across normal and boundary conditions. Our test cases are the raw
  material, but with two differences: scripts and their expected results are **approved
  before execution**, and results are signed by the executor and a reviewer.
- **PQ — Performance Qualification.** Evidence that the system performs in its real
  environment with real users and real data — business-led UAT scripts, performance under
  expected load.
- **Deviation reports** for anything that did not go to plan, each with an impact
  assessment and, where needed, CAPA.
- **Validation summary report** with an explicit release statement.

The deeper change is in how evidence is produced, not what it contains. Under 21 CFR
Part 11 it must be attributable, legible, contemporaneous, original and accurate — so
screenshots taken after the fact, scripts written once the result is known, or an
unversioned test plan would all be unacceptable, regardless of how good the testing was.

### 2. How would you integrate this regression suite into CI, and what would trigger it?

GitHub Actions, with the UI and API jobs running in parallel.

| Trigger | Profile | Why |
|---|---|---|
| Pull request | Smoke, then regression | The merge gate. Fast feedback while the change is fresh. |
| Push to the main branch | Regression | Confirms what actually landed. |
| Nightly schedule | Full, plus accessibility and timings | Catches slow drift and third-party contract changes without slowing anyone down. |
| Manual dispatch | Any profile | For investigating a specific failure. |

Supporting detail: reports, traces, video and HAR uploaded as artifacts on failure, with a
retention period; branch protection so the regression profile must pass before a merge;
API keys in repository secrets, never in the repository; one retry on CI only, with every
retried test reported — a test that needs retries is a defect in the suite and gets an issue,
not a permanent `retries: 3`. The suite skips rather than fails when the third-party API is
unavailable, so somebody else's outage cannot block a merge, while a separate scheduled
job watches for contract drift.

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
rather than merely coloured, and a screen reader run through checkout. A shop that
cannot be used without a mouse cannot be bought from.

### 5. Given only four hours, how did you decide what to test manually, what to automate, and what to skip?

By asking what would cost the business most if it broke, and what would cost us most to
check by hand repeatedly.

**Automated** the revenue path and anything data-driven. Sign-in and checkout, because
they carry the highest impact and because a reviewer will run them. Sorting, because four
sort modes across several accounts is one parametrised loop — the cheapest coverage in
the whole suite.

**Manual** where a judgement about intended behaviour was needed and no specification
offered one. Boundary input on the checkout form is the clearest example: each case
needs someone to decide what *should* happen, and automating a guess only makes the
guess permanent.

**Skipped, with the reason written down.** Load testing, because these are public demo
sites belonging to someone else and generating load against them would be wrong
regardless of the time available. Visual regression, because reference images taken on one
machine do not match another and the tests would fail for the wrong reason.
Cross-browser and mobile, because widening the surface before one browser is verified
buys little.

**Documents were written first and grown throughout**, not left to the end. If the time
had run out at any point, the plan, the defect log and the open questions would still have
been there — and the brief asks for exactly that in the event the work is unfinished.

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

Several rounds went into making the documents readable: terminology was unified,
dense phrasing rewritten in plain words, and a glossary added. I can explain every line of
what is here, which was the point of working this way rather than accepting a first draft.
