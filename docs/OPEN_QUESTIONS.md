# Open Questions

| | |
|---|---|
| **Document** | Open questions for the product owner |
| **Version** | 1.0 |
| **Date** | 2026-10-20 |
| **Author** | Tatsiana Hryharkevich |

Questions that testing could not answer from the brief or from the application, written
down rather than quietly assumed. Each one states what was observed, why it matters,
what has to be decided, and what we assumed in the meantime so that testing could
continue.

**Blocking** marks a question whose answer is needed before a release decision can be
made at all. The release-readiness criteria in the test plan (§14.1) treat an unanswered
blocking question as a reason to hold a release.

| ID | Question | Blocking |
|---|---|---|
| Q-01 | What is the authoritative source of requirements? | no |
| Q-02 | Which regions does the shop serve, and how is tax determined? | **yes** |
| Q-03 | What should happen to the cart at sign-out and across users? | **yes** |
| Q-04 | Should a customer be able to buy more than one of an item? | no |
| Q-05 | Is there an availability model, and what happens when an item becomes unavailable? | no |
| Q-06 | Which browsers and devices are supported, and which pages must be protected? | no |
| Q-07 | What accessibility conformance level is the target? | no |
| Q-08 | Should error telemetry carry the username and cart contents off-site? | **yes** |

---

### Q-01 · What is the authoritative source of requirements and acceptance criteria?
**Blocking:** no — but it affects everything below.

**Observed.** No specification, user stories or acceptance criteria accompany the
application. Requirements in `REQUIREMENTS.md` were reconstructed from the brief and
from observed behaviour, and five of the ten are our own interpretation.

**Why it matters.** Every defect raised against a derived requirement rests on our
reading rather than on an agreement. Without an agreed source, "defect" and "working
as intended" are separated by opinion, and a disagreement at sign-off has nothing to
appeal to.

**To decide.** Where the acceptance criteria live, who owns them, and who signs them
off.

**Assumed meanwhile.** The brief is treated as the specification, and everything beyond
it is marked as derived.

---

### Q-02 · Which regions does the shop serve, and how is the tax rate determined?
**Blocking: yes.**

**Observed.** The tax rate is a constant of 8% written into the browser code. The
currency symbol is a hard-coded `$` with no locale formatting anywhere — no
`Intl.NumberFormat`, no `toLocaleString`. The checkout form requires a postal code, but
the calculation never receives it: tax is computed from the cart contents alone. The
interface is English only, with no right-to-left support.

**Why it matters.** Tax rates and fees depend on the customer's jurisdiction. If the shop
serves more than one region, a fixed client-side rate charges the wrong amount on every
order — a financial and compliance exposure, not a cosmetic issue. Separately, a rate
that lives in the browser can be edited by anyone with developer tools, so the amount
charged is not under the business's control at all. And collecting a postal code that
affects nothing is itself a contradiction: either it should drive the tax, or it should not be
required.

**To decide.** The list of supported countries; where the tax rate should come from; what
the postal code is for; whether multiple currencies and localisation are planned.

**Assumed meanwhile.** One region (US), one currency (USD), a flat 8% rate. Testing
verifies the arithmetic against that assumption and records it as an assumption, not as
correct behaviour.

---

### Q-03 · What should happen to the cart at sign-out, and across different users?
**Blocking: yes.**

**Observed.** The cart is held in `localStorage` under `cart-contents`; the session is a
separate cookie, `session-username`. Signing out removes only the cookie. As a result the
cart survives sign-out, survives a browser restart, and is shown to whoever signs in next
on the same browser.

**Why it matters.** The first two may well be deliberate — many shops deliberately keep a
cart so a customer can return to it. The third is different: on a shared computer, one
customer's intended purchases are shown to the next person. Until someone states the
intent, we cannot tell a feature from a privacy defect, and that distinction changes the
severity from none to high.

**To decide.** Whether the cart should persist beyond a session at all; and if it should,
whether it must be tied to the account rather than to the browser.

**Assumed meanwhile.** Current behaviour is recorded as observed, with no defect raised
for persistence itself. The cross-user case is recorded separately (TC-UI-090) because it
is the one a business is least likely to have intended.

---

### Q-04 · Should a customer be able to buy more than one unit of an item?
**Blocking:** no.

**Observed.** Quantity is fixed: the cart row renders the literal value `1`, there is no
quantity control, and the same item cannot be added twice — the control becomes
"Remove" instead.

**Why it matters.** It caps every order at one unit per item, which puts a ceiling on order
value. If multiple units are intended, the whole quantity path — pricing, tax, stock
reservation — is untested because it does not exist yet.

**To decide.** Whether multiple units are in the product's scope, and if so, whether a
limit per order applies.

**Assumed meanwhile.** One unit per item is intended. Tested as such.

---

### Q-05 · Is there an availability model, and what happens when an item becomes unavailable?
**Blocking:** no.

**Observed.** There is no concept of stock, availability or a sold-out state anywhere in
the application. The catalogue is a fixed list of six items, and an item added to the cart
is never re-checked before the order completes.

**Why it matters.** In a real shop this is the difference between selling something and
promising something that cannot be shipped. A cart that outlives its session (Q-03) makes
it worse: a customer could return days later and complete an order for an item that has
since gone.

**To decide.** Whether availability is in scope; where stock would come from; what the
customer should see when an item in their cart becomes unavailable.

**Assumed meanwhile.** Out of scope for this version. Recorded as a gap, not as a defect,
because there is no requirement to breach.

---

### Q-06 · Which browsers and devices are supported, and which pages must require a session?
**Blocking:** no.

**Observed.** No support matrix was given; testing used Chromium only. Eleven routes
exist, four of which — `/inventory-long.html`, `/dynamic-catalog-lazy-load.html`,
`/dynamic-catalog-spinner.html`, `/dynamic-catalog-slider.html` — are reachable by direct
URL but are linked from nowhere in the interface.

**Why it matters.** Without a matrix, "it works" has no defined boundary. And unlinked
routes in a production build are either dead code that should not ship, or live features
missing from the navigation; both need an owner's answer, and both need to be included
in access-control testing if they are to stay.

**To decide.** The supported browser and device matrix; whether the four unlinked routes
are intended to be reachable.

**Assumed meanwhile.** Chromium on desktop. The unlinked routes are explored (ES-04)
and reported, not treated as supported.

---

### Q-07 · What accessibility conformance level is the target?
**Blocking:** no.

**Observed.** No target was stated. Automated rule checks were run against WCAG 2.1
level AA as the usual baseline for a customer-facing site.

**Why it matters.** Without an agreed level, an accessibility finding cannot be called a
defect — only an observation. For a business selling to the public, the level is often set
by law rather than by preference, so this is a decision with legal input, not a
preference.

**To decide.** The conformance level and the deadline for reaching it.

**Assumed meanwhile.** WCAG 2.1 AA, with every finding recorded as an observation
rather than as a defect.

---

### Q-08 · Should error telemetry carry the username and cart contents to a third party?
**Blocking: yes.**

**Observed.** The application initialises an error-reporting service configured to attach
`userAttributes: { user, shoppingCart }` to every report, so a report carries the signed-in
username and the contents of the cart to a company outside this one. The configured
address still contains unreplaced build placeholders, so today nothing is actually
delivered.

**Why it matters.** Two separate problems. The broken address means error reporting does
not work at all, so faults in production go unseen. The payload is the larger question: as
soon as the address is fixed, customer data starts leaving for a third party, and whether
that is permitted is a data-protection decision, not an engineering one. In a regulated or
customer-facing system it needs an answer before the fix ships, not after.

**To decide.** Whether the telemetry endpoint should be configured at all; and if so, what
may be attached to a report, and under which agreement with the processor.

**Assumed meanwhile.** Recorded as an observation and a defect against the broken
address. No assumption is made about what the payload should contain, because that is
not a decision testing can make.
