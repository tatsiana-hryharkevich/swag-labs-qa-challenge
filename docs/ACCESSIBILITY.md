# Accessibility — automated rule checks

| | |
|---|---|
| **Document** | Accessibility smoke |
| **Version** | 1.0 |
| **Date** | 2026-10-21 |
| **Author** | Tatsiana Hryharkevich |
| **Block** | Extended — beyond the four-hour core scope |
| **Tool** | axe-core 4.14.0 via `@axe-core/playwright` |
| **Rules applied** | WCAG 2.0 A and AA, WCAG 2.1 A and AA |

## The headline, and why it is not what it looks like

**No automated rule was broken on any of the three pages scanned.**

| Page | Violations | Rules passed | Needs a human |
|---|---|---|---|
| Sign-in | 0 | 18 | — |
| Catalogue | 0 | 27 | 1 |
| Checkout form | 0 | 28 | — |

That result is worth less than it appears, and saying so is the point of this document.
Automated rules find roughly a third of accessibility problems — the ones a machine can
decide, such as a missing label or an image without alternative text. The remaining
two-thirds are judgements a person makes: whether the keyboard order is sensible, whether
focus is visible, whether an error is announced rather than merely coloured, whether a
screen reader describes what is actually happening.

**A clean scan means no rule was broken. It does not mean the application is usable with
assistive technology, and this report does not claim that.**

## The result is real, and that was checked

A scanner that silently fails also reports zero violations. Before trusting three clean
results, the scan was given something to find: a text input with no label and an image
with no alternative text, injected into the page.

```
after breaking the page on purpose: 2 violations -> image-alt, label
```

It found both. That control runs as part of the suite (TC-UI-085), so a future run cannot
report a clean page because the tooling has quietly stopped working.

## What still needs a human

| Needs review | Where |
|---|---|
| **Colour contrast on three elements** — axe could not decide automatically, usually because of a background it cannot compute | Catalogue page |

Beyond that single flagged item, none of the following was performed, and all of it
matters more than the rules that were checked:

- **Keyboard navigation through the whole purchase path** — sign in, choose a product,
  add to the cart, complete checkout, without touching a mouse. A shop that cannot be
  bought from with a keyboard cannot be bought from by a large group of customers.
- **Focus visibility and order** — whether the focused element is always identifiable
  and whether the order follows the visible layout.
- **Error announcement** — the sign-in and checkout errors are rendered in red. Whether
  they are announced to a screen reader, and associated with the field they concern, was
  not checked.
- **Screen-reader walkthrough of checkout** — the one flow where a mistake costs the
  customer money.
- **Zoom and reflow at 200%**, and the application at a phone width.

## Target level is an assumption

No accessibility target was stated for this application, and there is nobody to agree
one with. The rules applied here are WCAG 2.1 level AA, chosen because it is the usual
baseline for a public-facing commercial site — but it is **our assumption, not a
requirement**, which is why nothing in this document is recorded as a defect.

For a shop selling to the public the level is often set by law rather than by preference,
so confirming it is a decision with legal input. Raised as **Q-07** in
`docs/OPEN_QUESTIONS.md`.

## How this is run

```bash
npx playwright test accessibility
```

Four checks: three pages, plus the control. They carry `@P3`, so they are part of the
full profile and not of the CI gate — an accessibility finding here cannot be a pass or a
failure until Q-07 is answered.

## What would come next

1. **Agree the conformance level** (Q-07), so results can be judged rather than noted.
2. **Manual verification of the purchase path** — keyboard, focus, screen reader. This is
   where the real findings would be.
3. **Resolve the contrast items** the scanner could not decide, by measuring them.
4. **Keep the scan in CI**, where it adds most value as a regression guard: it will not
   prove the application accessible, but it will catch the day somebody removes a label.
