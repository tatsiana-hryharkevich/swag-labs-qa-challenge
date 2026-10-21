# Static Analysis of the Shipped Application Bundle

| | |
|---|---|
| **Document** | Static analysis — risk-analysis input |
| **Version** | 0.1 |
| **Date** | 2026-10-20 |
| **Target** | `https://www.saucedemo.com/assets/index-D3OxT1jE.js` (541 KB, production build) |
| **Status** | Hypotheses — not test evidence |

> **How to read this document.** Everything below comes from reading the JavaScript
> file the application serves to every visitor. It is **input for designing tests**, not a
> replacement for testing: nothing here goes into the defect log until it has been
> reproduced in a browser with evidence captured. Each item is written as a prediction,
> together with the test case that will confirm or disprove it.
>
> The code below has been rewritten to be readable. The file as served has its spacing
> removed and its names shortened to single letters; the names of the application's own
> functions are unchanged. Terms used here are defined in the glossary of the test plan.

## 1. Why this was done

The application arrived with no specification, no API documentation and no contact
point. Three questions needed answering before a single test case could be prioritised:

1. Where does the displayed content come from — a service, or the client itself?
2. Which pages exist, including any not reachable through the interface?
3. Which behaviours differ between the demo accounts, and in what way?

Reading the file the site serves answered all three in about twenty minutes, and turned
much of the exploratory testing from "click around and hope" into targeted confirmation.
It cannot replace exploration, because it only shows what the author wrote and not how
it behaves, but it makes exploration far cheaper.

### Three sources of knowledge, and what each is worth

Testing a system with no specification draws on three different kinds of knowledge. They
are easy to blur together and they carry very different weight, so this report keeps them
in separate documents.

| Source | What it gives | Where it is recorded | How much it proves |
|---|---|---|---|
| **Experience of similar systems** | an idea of *where to look* | test plan §2.1, and the derived requirements | Least. It is a hypothesis about a class of system, not about this one. |
| **Reading the code** | what the author *intended* | **this document** | Strong about intent. Silent about behaviour. |
| **Running the system** | what actually *happens* | the exploratory sessions, `TEST_CASES.md`, `DEFECTS.md` | The only source from which a defect may be raised. |

An example of each, from this project. Knowing that a single-page application re-implements
every route guard in the browser is experience: it said *look at the routes*. Reading the
router showed that eleven exist and four are linked from nowhere — intent. Opening all
nine without a session and finding each one refused with the page named — behaviour, and
the only one of the three that could be reported as a result.

**This document is the middle row, and nothing more.** It is not a record of how the
system behaves, and reading code is a poor way to learn that: a branch may be
unreachable, a framework may intervene, and timing changes everything. Both happened
here. The order total is doubled for `problem_user` in the code, and no customer can ever
reach the page where that applies, because checkout is blocked a step earlier. The
five-second freeze was predicted correctly from the code and the first measurement still
missed it, because the instrument was wrong.

That is why every entry below is written as a prediction with the case that settles it,
why none entered the defect log before being reproduced in a browser, and why the last
section reconciles what was predicted against what execution actually showed.

## 2. Architecture

**There is no backend.** The catalogue is a static array compiled into the bundle:

```js
Ra = [
  { id: 0, name: 'Sauce Labs Bike Light', desc: '…', price: 9.99,
    image_url: 'bike-light-1200x1500.jpg' },
  …six items total
]
```

No request is made to fetch products, and authentication performs no network call
either — the session is a cookie written client-side. Consequences for testing:

| Consequence | Impact on the plan |
|---|---|
| Content that displays incorrectly is never a data or loading problem — it is code that behaves differently depending on who is signed in | The same account always produces the same defect, and nothing depends on the environment |
| Login cannot be evidenced at the request/response level | Network-level evidence had to come from assets and telemetry instead (§6) |
| Prices, tax and totals are worked out in the browser | Anyone can change them using developer tools; see Q-02 |

**State model.** The session and the cart live in different stores:

```js
// cart — localStorage, key `cart-contents`
static resetCart() { window.localStorage.removeItem('cart-contents') }

// session — cookie `session-username`
function logout() { cookies.remove('session-username') }
```

Logout removes the cookie and leaves the cart untouched. The cart therefore outlives
the session, survives a browser restart, and is visible to whoever signs in next on the
same browser. Confirmed by TC-UI-090, TC-UI-093; raised as Q-03.

## 3. Route inventory

Eleven routes are registered. The burger menu exposes four destinations, so four
catalogue variants exist that no link in the interface leads to:

| Route | Reachable from the UI |
|---|---|
| `/`, `/inventory.html`, `/cart.html`, `/checkout-step-one|two|complete.html` | yes |
| `/inventory-item.html` | via a product tile |
| `/inventory-long.html` | **no — direct URL only** |
| `/dynamic-catalog-lazy-load.html` | **no — direct URL only** |
| `/dynamic-catalog-spinner.html` | **no — direct URL only** |
| `/dynamic-catalog-slider.html` | **no — direct URL only** |

Explored under charter ES-04. Unlinked routes in a production build are themselves
worth a question: either they are dead code that should not ship, or they are live
features missing from the navigation.

## 4. Deliberately broken behaviour per account

Every difference is gated on the username, through predicates of this shape:

```js
function isProblemUser()  { return cookies.get('session-username') === 'problem_user' }
function isErrorUser()    { return cookies.get('session-username') === 'error_user' }
function isVisualUser()   { return cookies.get('session-username') === 'visual_user' }
function isGlitchUser()   { return cookies.get('session-username') === 'performance_glitch_user' }
```

### 4.1 `problem_user` — 11 branches

| Predicted behaviour | Mechanism | Case |
|---|---|---|
| Every product image is replaced | `image_url: isProblemUser() ? 'sl-404.jpg' : item.image_url` | TC-UI-050 |
| A product tile opens the **next** product's detail page | `let linkId = id; isProblemUser() && (linkId += 1)` — applied in both the catalogue and the cart | TC-UI-052 |
| "Add to cart" silently does nothing for odd ids | `if (isProblemUser()) { if (id % 2 === 1) return }` | TC-UI-021 |
| "Remove" silently does nothing for even ids | `if (isProblemUser()) { if (id % 2 === 0) return }` | TC-UI-022 |
| Sorting never applies | the whole handler body is wrapped in `if (!isProblemUser())` | TC-UI-044..047 |
| Typing in Last Name writes into the **First Name** state | `if (isProblemUser()) return setFirstName(e.target.value)` on the last-name input | TC-UI-032 |
| **Order total is doubled** | `calcOrder(cart, { doublePrices: isProblemUser() })`, which adds each price twice | TC-UI-038 |
| Cart is not cleared after the order completes | `if (!isProblemUser()) { … resetCart() }` | TC-UI-039 |
| "About" points at an error page | `isProblemUser() ? 'https://saucelabs.com/error/404' : 'https://saucelabs.com/'` | TC-UI-053 |

The add/remove asymmetry deserves emphasis: the control is a single toggle whose
label switches between "Add to cart" and "Remove". For this account the label changes
while the cart does not, so the interface actively reports a state that is false.

### 4.2 `error_user` — 7 branches

| Predicted behaviour | Mechanism |
|---|---|
| Every keystroke in Last Name raises a `TypeError` | `setLastName(e.totallyUndefined.value)` — reading a property of `undefined` |
| Checkout proceeds with an empty Last Name | the validation is `!lastName && !isErrorUser() ? error(…)` |
| Adding an odd-id item throws | `throw Error('Failed to add item to the cart.')` |
| Removing an even-id item throws | `throw Error('Failed to remove item from cart.')` |
| Changing the sort shows a blocking `alert()` and sends a telemetry report | `telemetry.send('Sorting is broken!', …); alert(…)` |
| The product description renders a component that throws deliberately | `const Boom = () => { throw Error('This component failed to render!') }` behind an error boundary |
| Cart is not cleared after the order — a misspelled method | `Cart.cesetRart()` instead of `resetCart()`, raising a `TypeError` |

### 4.3 `visual_user` — 5 branches, and not only cosmetic

```js
const randomPrice = () => Math.round(Math.random() * 1e4) / 100;
price: isVisualUser() ? randomPrice() : item.price
```

**Prices are randomised on every render**, up to $100. This is a data-integrity defect
wearing a visual label: the displayed price corresponds to nothing, changes between
renders, and would not match any order the business could honour. The remaining four
branches are genuinely cosmetic — a misaligned cart icon, a skewed button on the sixth
tile, right-aligned text on the third and fourth, and a replaced image on the first.

### 4.4 `performance_glitch_user` — one branch, and its name is misleading

```js
const block = ms => { const t = Date.now(); while (Date.now() < t + ms) {} };
isGlitchUser() && block(5000);
```

This is **a loop that freezes the browser for five seconds**, not a slow response from a
server. For that whole time the page draws nothing and reacts to nothing. What this
means for testing: the delay is always the same length rather than varying, slowing the
network in test tools will not reproduce it, and in developer tools it shows up as a frozen
page rather than as a slow request. The suite therefore raises the timeout on those
tests only, and the number recorded in `PERFORMANCE.md` is described as the page
being frozen, not as response time.

## 5. Defects that affect every account

```js
telemetry.initialize({
  name: 'Swag Store', version: '3.0.0',
  url: 'https://submit.backtrace.io/UNIVERSE/TOKEN/json'
})
```

The file served in production contains **configuration placeholders that were never
replaced**: `UNIVERSE` and `TOKEN` are markers meant to be substituted at build time,
not real values. Every error report the application sends therefore goes to an address
that cannot exist.

This matters beyond the broken reporting itself. It is the only defect in the application
observable at the request/response level, because nothing else talks to a server. For
`error_user`, changing the sort order triggers a report explicitly, producing a failing
request in the Network panel with a matching console error — a reproducible
network-level defect with a visible cause. Covered by TC-UI-100.

A second observation for the same section: the telemetry payload is configured to
attach `userAttributes: { user, shoppingCart }`, so an error report would carry the
signed-in username and the contents of the cart to a company outside this one. Harmless
here, because the address is invalid and the data is made up. In a regulated or
customer-facing system it is a question for whoever is responsible for data protection.
Raised as Q-08.

## 6. Limitations

Reading the code shows what the author intended, not what actually happens. It cannot
reveal defects that come from timing, from differences between browsers, from state
that builds up across sessions, or from anything the framework does while running — and
a branch that exists in the code may never be reached in practice. Some of the
predictions above may turn out to be wrong. The exploratory sessions are deliberately
aimed at what this method cannot see, not merely at confirming it.

Every prediction is therefore carried into the test matrix as a case, not as a finding.
Defect records are written only from reproduction in a browser, with evidence captured
at the time of observation.
