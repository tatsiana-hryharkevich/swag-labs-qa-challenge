# Performance — client-side measurements

| | |
|---|---|
| **Document** | Performance smoke, single user |
| **Version** | 1.0 |
| **Date** | 2026-10-21 |
| **Author** | Tatsiana Hryharkevich |
| **Block** | Extended — beyond the four-hour core scope |

## What this is, and what it is not

**No load testing was performed, and that is a decision rather than an omission.** Both
systems are public demo sites belonging to someone else. Generating load against servers
we do not own would be wrong regardless of how much time was available, and it would
also degrade the service for everyone else using it. What follows is measurement of a
single user's experience, which costs the service nothing beyond ordinary use.

There is no agreed performance target for this application — nobody stated one, and
there is nobody to agree one with. Every figure below is therefore reported **relative to
the `standard_user` baseline** rather than against an invented threshold. The one thing
the application does tell us is that a difference is expected: an account named
`performance_glitch_user` implies the others should be faster.

## Method

Timings were taken from a real browser, measuring the moment a customer can actually see
or use something, rather than the moment a network event completed. Each figure is the
median of repeated runs on a wired connection, Chromium 156 on macOS 15.

**One measurement was wrong at first, and it matters.** The first attempt used the
browser's Navigation Timing API, which reported 133 ms to first byte and 279 ms to load
for the slow account — a clean bill of health. Those events complete before the
application renders, and the delay happens during rendering. A measurement that
contradicts the thing being investigated is worth distrusting before the investigation is.

## Interaction timings, by account

Time from the action to the result being visible, in milliseconds.

| Account | Sign-in → catalogue visible | Change sort order | Open cart |
|---|---|---|---|
| `standard_user` | **69** | 59 | 45 |
| `problem_user` | 64 | 60 | 52 |
| `error_user` | 60 | 62 | 49 |
| `visual_user` | 61 | 62 | 59 |
| `performance_glitch_user` | **5 097** | **5 059** | 56 |

`performance_glitch_user` is 74× slower to show the catalogue and 86× slower to apply a
sort. The cart is unaffected.

**The delay is not a slow response — it is a frozen browser.** There is no server behind
this application, so nothing is waiting on a network. The page blocks: during those five
seconds nothing is drawn and no click is answered. Three consequences follow for testing
and for fixing it:

- throttling the network in developer tools will not reproduce it;
- it shows up as a blocked main thread in a performance profile, not as request latency;
- a customer cannot even navigate away while it lasts, which is worse than slowness.

Recorded as DEF-013.

## Page weight and asset timings

Measured for `standard_user`, from `evidence/har-standard_user.har`.

| Asset | Size | Time |
|---|---|---|
| `index-D3OxT1jE.js` | 174.1 KB | 30 ms |
| `red-tatt-1200x1500.jpg` | 29.9 KB | 16 ms |
| `sauce-backpack-1200x1500.jpg` | 19.6 KB | 15 ms |
| `red-onesie-1200x1500.jpg` | 18.3 KB | 14 ms |
| `index-aSZoiKGF.css` | 10.7 KB | 29 ms |
| `checkmark.png` | 5.4 KB | 131 ms |
| **Total from saucedemo.com** | **335 KB over 10 requests** | |

Nothing here is alarming: 335 KB is modest, and the application is small enough that
delivery is not its problem. Two observations for an owner rather than defects:

- The JavaScript bundle is 174 KB — just over half the page weight — and everything
  including the whole catalogue is inside it. That is fine at six products and would not
  be at six hundred.
- Product images are served at 1200×1500 and displayed far smaller. Resizing them for
  the catalogue would remove most of the remaining weight. Not reported as a defect:
  no requirement is breached and the page is fast as it stands.

## API response times

Measured against ReqRes with a single request at a time; see the note on its daily limit
in the README.

| Endpoint | Time |
|---|---|
| `GET /users/2` | 0.09–0.24 s |
| `GET /users?page=2` | 0.23 s |
| `POST /users` | 0.09 s |
| `GET /users?delay=3` | 3.10 s — the parameter does what it says |

Covered by TC-API-018, which asserts a single read completes within three seconds. The
budget is a stated assumption, not an agreed service level.

## What would be done with a real engagement

1. **Agree the targets first.** A budget for the checkout path tied to conversion, and an
   API latency target at the 95th percentile under expected concurrency — agreed with
   the business, not invented by testing.
2. **Measure what customers feel**: largest contentful paint and interaction latency,
   rather than page load alone. The defect found here is invisible to load metrics and
   obvious in interaction ones.
3. **Load testing on a dedicated environment**, with k6, derived from real expected
   traffic — never against a shared or third-party system.
4. **A performance budget in CI**, failing a build that makes the bundle or the critical
   path materially worse, so regressions are caught at the commit that causes them.
