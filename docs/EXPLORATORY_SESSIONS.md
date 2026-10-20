# Exploratory Sessions

| | |
|---|---|
| **Document** | Session-based exploratory testing |
| **Version** | 0.1 — not yet performed |
| **Date** | 2026-10-20 |
| **Author** | Tatsiana Hryharkevich |

Exploratory testing here is not unstructured. Each session has a charter written before
it starts, a fixed time box, and a written debrief afterwards. That makes the work
reviewable: a reader can see what was investigated, what was found, what was left
untouched, and how the time was actually spent.

Charters are defined in the test plan, §6.6.

**Status: no sessions performed yet.**

---

Each session is recorded in this shape:

```markdown
## ES-0X · <charter in one line>
**Time box:** N min · **Performed:** <date> · **Account(s):** <accounts>

**Charter.** What this session set out to investigate, and why that area was chosen.

**Areas covered.** Pages, flows and accounts actually reached.

**Found.** DEF-00X (Major), DEF-00Y (Minor) — one line each, linking to the defect log.

**Questions raised.** Q-0X — anything that could not be decided without the product owner.

**Not covered.** What the charter implied but the time box did not allow, so that a reader
knows the boundary of the session rather than guessing it.

**Time split.** Investigation __% · investigating defects __% · setup __%
```

The time split is recorded because it is the honest measure of a session: an hour where
fifty minutes went into chasing one defect covered far less ground than the charter
suggests, and a reader is entitled to know that.
