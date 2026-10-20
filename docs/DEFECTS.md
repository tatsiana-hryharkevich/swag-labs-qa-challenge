# Defect Log

| | |
|---|---|
| **Document** | Defect log and observations |
| **Version** | 0.1 — no cases executed yet |
| **Date** | 2026-10-20 |
| **Author** | Tatsiana Hryharkevich |

Defects found during execution, and observations that are not defects. Severity
definitions and the rules every record must satisfy are in the test plan, §8.

**Status: no defects recorded yet.** Execution has not started. The cases in the test plan
marked `predicted` in the Known failure column are expectations drawn from reading the
application's code (`STATIC_ANALYSIS.md`), not findings, and none of them appears here
until it has been reproduced in a browser with evidence captured.

---

## Severity, in short

| Severity | Definition |
|---|---|
| **Critical** | Core flow unusable, no workaround: cannot sign in, cannot complete an order, data loss |
| **Major** | Significant function broken or data shown incorrectly; a workaround exists |
| **Minor** | Limited impact: cosmetic defect, unclear message, inconsistent behaviour in a secondary path |
| **Trivial** | Noticeable but harmless: wording, spacing, minor inconsistency |

Severity is the tester's assessment of the effect. Priority — when it gets fixed — is the
business's decision and is recorded separately.

---

## Defects

*(none recorded yet — this section is filled during execution)*

Each record follows this shape:

```markdown
### DEF-00X · <one-line summary>

**Requirement broken:** REQ-00X — docs/REQUIREMENTS.md#req-00x
> "<the requirement quoted word for word>"
> — Challenge brief, page N          (or: derived requirement — an assumption)

**Tracker:** #N
**Covered by test:** <spec file> › TC-UI-0XX
**Severity:** Major · **Priority:** High · **Status:** Open

**Why this is a defect and not something else**
- Reproduced N times, on N separate runs.
- Reproduced from a clean session (cleared storage, fresh browser context),
  so it is not state left over from earlier testing.
- The steps are ones a customer would plausibly perform: <why>.
  (Or, where the steps are unusual: why the case still matters.)

**Environment:** Chrome <version> / macOS <version> · <URL> · <date>
**Account:** <demo account used>

**Steps to reproduce**
1. …

**Expected:** …
**Actual:** …

**Evidence**
- Recorded by the run: `evidence/def-00X-trace.zip`, video, screenshot
- Captured by hand at the moment of the defect: `evidence/def-00X-network.png`
  (Network panel showing the request and response)

**Suggested fix:** … *(where the cause is visible)*
```

---

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
