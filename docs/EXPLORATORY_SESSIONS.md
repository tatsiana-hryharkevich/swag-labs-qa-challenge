# Exploratory Sessions

| | |
|---|---|
| **Document** | Session-based exploratory testing |
| **Version** | 1.0 |
| **Date** | 2026-10-21 |
| **Author** | Tatsiana Hryharkevich |

Exploratory testing here is not unstructured. Each session has a charter written before it
starts, a fixed time box, and a written debrief afterwards. That makes the work
reviewable: a reader can see what was investigated, what was found, what was left
untouched, and how the time was actually spent.

Charters are defined in the test plan, §6.6.

## How these sessions were run

The sessions were performed by driving a real browser through short scripts written for
the purpose, rather than by clicking by hand. The charter, the questions and the
decisions about where to look next were the same as in a manual session — each script
was written, run, read, and then rewritten in response to what it showed. What changed
is the instrumentation: every session captured the console, every network request, the
contents of `localStorage` and the session cookie, and timings, for all six accounts in one
pass.

This is a deliberate choice with a trade-off worth naming. Against it: a script sees only
what it was told to look at, so a visual oddity or a strange interaction that would catch a
human eye can pass unnoticed — which is exactly why DEF-014 is thin and why the layout
findings for `visual_user` rest on screenshots reviewed afterwards. In favour of it: every
observation is reproducible, carries its evidence, and covers all six accounts uniformly
rather than whichever ones there was time for. For a system whose defects are seeded per
account, the second mattered more.

---

## ES-01 · Survey all six accounts end to end
**Time box:** 20 min · **Performed:** 2026-10-21, 00:14–00:24 · **Accounts:** all six

**Charter.** Take every account through the same path — sign in, catalogue, sorting, cart,
checkout, order — and record the differences against `standard_user` as the baseline.
Establish which of the predictions in `STATIC_ANALYSIS.md` hold.

**Areas covered.** Sign-in and its error states; the catalogue, including product names,
prices, images and detail links; all four sort options; adding and removing every one of
the six products; the cart; both checkout steps; order completion; the console, the
network and navigation timings throughout.

**Found.** DEF-001 (Critical), DEF-002 (Critical), DEF-003, DEF-004, DEF-005, DEF-006,
DEF-008, DEF-009, DEF-010, DEF-011, DEF-012, DEF-014.

**Notable.** The two Critical defects are both of the same kind: a purchase cannot be
completed, and the application says nothing about it. DEF-012 applies to every account
rather than to one, and was found only because the session captured network traffic on
every page rather than on the page under suspicion.

**Questions raised.** Q-08 — the telemetry that fails is configured to carry the signed-in
username and the cart contents to a third party, which becomes a live question the
moment the address is repaired.

**Not covered.** The cart's behaviour across sign-out and across users (moved to ES-02);
the four unlinked catalogue routes (ES-04); anything requiring visual judgement beyond
the screenshots captured.

**Time split.** Survey 55% · investigating individual findings 30% · setup 15%

---

## ES-02 · Session and cart lifecycle
**Time box:** 15 min · **Performed:** 2026-10-21, 00:30–00:45 · **Accounts:** `standard_user`, `problem_user`

**Charter.** Find out what the cart is actually bound to — the browser, the session, or
the account — and whether any page can be reached without signing in. This charter
exists because the brief says nothing about either, and because Q-03 cannot be asked
precisely without knowing what the application currently does.

**Areas covered.** Adding to the cart, signing out through the menu, signing in as a
different user in the same browser, a simulated browser restart with cookies cleared,
direct URL access to all nine routes without a session, and the browser Back button after
sign-out. The session cookie and `localStorage` were read at every step rather than
inferred from the interface.

**Found.** DEF-015 (Major) — the cart is bound to the browser, not to the account, and
the next person to sign in sees and can buy the previous person's basket.

**Passed, and recorded as such.** All nine routes — including the four that no menu links
to — refuse access without a session and name the page in the refusal. Sign-out removes
the session cookie, and Back does not restore access. Access control is the part of this
application that works properly.

**Questions raised.** Q-03 is now precise: it is no longer "does the cart persist?" but
"should the cart be tied to the browser or to the account?", which is the form a product
owner can actually answer.

**Not covered.** Whether the cart survives on a second device for the same account —
untestable here, as there are no real accounts behind these users.

**Time split.** Investigation 50% · confirming DEF-015 and capturing its storage evidence 35% · setup 15%

---

## ES-03 · Data integrity and the checkout form
**Time box:** 15 min · **Performed:** 2026-10-21, 00:24–00:30 · **Accounts:** `standard_user`, `problem_user`, `visual_user`

**Charter.** Decide whether the displayed data can be trusted: prices, images, product
identity and the totals charged. Resolve three questions ES-01 left open — whether
`problem_user` can complete checkout by any means, which product a tile actually opens,
and how slow `performance_glitch_user` really is.

**Areas covered.** Catalogue prices against the order summary for `visual_user`; product
detail navigation compared side by side between `standard_user` and `problem_user`;
three separate methods of entering a last name for `problem_user`; timing to visible
content rather than to navigation events.

**Found.** DEF-007 (a tile opens a different product), DEF-013 (the five-second freeze,
measured properly), and the sharpening of DEF-008 — the catalogue price and the price
charged are different numbers, which the code reading had not revealed.

**Notable — a measurement that was wrong.** The first attempt measured
`performance_glitch_user` with the browser's Navigation Timing API and reported 133 ms
to first byte and 279 ms to load: a clean bill of health. Those events complete before the
application renders, and the delay happens during rendering. Measuring the time until
catalogue content is visible gave 5 097 ms against 72 ms for the baseline. The lesson is
recorded in DEF-013 rather than quietly corrected: a measurement that looks reassuring
is worth distrusting when it contradicts the thing being investigated.

**Notable — a prediction that failed usefully.** The code contains a defect that doubles
the order total for `problem_user`. It cannot be reached: checkout for that account is
blocked at the previous step by DEF-001. It is recorded in the reconciliation table rather
than in the defect log, because a fault no customer can reach is not one — though it
becomes one the moment DEF-001 is fixed.

**Not covered.** Boundary input on the checkout form — long strings, digits in name
fields, special characters. Deferred as P3; nothing in the time box was worth cutting for
it.

**Time split.** Investigation 40% · re-measuring and confirming 45% · setup 15%

---

## ES-04 · The four unlinked catalogue routes
**Time box:** 10 min · **Block:** extended · **Status:** not yet performed

Partially answered already: ES-02 established that all four refuse access without a
session, so they are real guarded pages rather than dead code. What they render when
reached *with* a session, and whether the seeded defects apply there too, is still open.
