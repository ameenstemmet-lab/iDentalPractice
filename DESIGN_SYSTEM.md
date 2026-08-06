# Design System

The visual foundation for every screen in iDentalPractice. Built on
Tailwind CSS v4 (CSS-first config) and shadcn/ui (`radix-nova` style),
extended with this app's own tokens and composite components.

**Philosophy**: monochrome-first neutral UI (true grays, zero chroma) with
a single deliberate brand color used sparingly. No gradients-as-decoration,
no stock illustrations, no default shadcn blue-on-everything. Reference
points: Apple, Stripe, Linear, Vercel, Notion — quiet, confident, and
handcrafted rather than templated.

## Source of truth

| Concern | File |
|---|---|
| Runtime CSS tokens (what Tailwind utilities actually read) | `src/app/globals.css` |
| Typed mirror of the same values, for JS consumers | `src/lib/design-system/design-tokens.ts` |
| Resolved light/dark theme + chart color helper | `src/lib/design-system/theme.ts` |

Change a value in `globals.css` first; keep `design-tokens.ts` in sync.
Tailwind utilities (`bg-primary`, `shadow-md`, `duration-base`, …) always
reflect `globals.css` directly — `design-tokens.ts` exists for contexts
that need a raw value in JS (chart series colors, tests).

## Color

### Brand

One indigo-blue (`oklch(0.45 0.19 264)` light / `oklch(0.62 0.19 264)`
dark). Reserved for: primary buttons, links, the active nav/sidebar item,
focus rings, and chart series 1. It does not appear as a background wash,
a hero gradient, or a decorative accent — restraint is what keeps it
reading as premium rather than templated.

### Semantic (success / warning / danger)

Used as **soft tints only** — `bg-success/10 text-success`, never a solid
fill — matching the shadcn `destructive` button/badge treatment already in
the codebase. This keeps state feedback calm instead of alarming.

| Token | Light | Dark |
|---|---|---|
| `--success` | `oklch(0.6 0.14 152)` | `oklch(0.72 0.16 152)` |
| `--warning` | `oklch(0.77 0.15 80)` | `oklch(0.8 0.15 80)` |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` |

### Neutral surfaces

| Token | Role |
|---|---|
| `--background` | page canvas |
| `--surface` | subtle elevated panel (sidebar, section wrap) — between background and card |
| `--card` | bordered/shadowed content container |
| `--popover` | dropdowns, dialogs, tooltips |
| `--foreground` / `--muted-foreground` | primary / secondary text |
| `--border` / `--input` | dividers and form field borders |

Every neutral token is true gray (0 chroma) in both modes — no warm or
cool tint — so the brand color is the only hue doing identity work.

## Chart palette

Categorical order is **fixed, never cycled**: blue → orange → aqua →
yellow → magenta (5 slots), stepped separately for light/dark. Validated
with the data-viz skill's contrast/CVD checker against this app's actual
surfaces:

```
node scripts/validate_palette.js "#2a78d6,#eb6834,#1baf7a,#eda100,#e87ba4" --mode light --surface "#ffffff"
node scripts/validate_palette.js "#3987e5,#d95926,#199e70,#c98500,#d55181" --mode dark  --surface "#171717"
```

Both pass every hard gate (lightness band, chroma floor, adjacent-pair CVD
separation, normal-vision floor). Light mode WARNs on raw contrast for 3 of
5 hues against pure white — the mitigation is a visible legend/direct
labels, never color alone (see `ExampleChart`). Only the **first three**
slots are safe for all-pairs comparisons (scatter, small multiples); past
three, fold extra series into "Other" or facet.

A separate, fixed **status** palette (good/warning/serious/critical) exists
for chart delta indicators and is never reused as a series color — see
`chartPalette.status` in `design-tokens.ts`.

## Typography

Geist Sans (UI) / Geist Mono (code, figures), loaded via `next/font` in
`layout.tsx`. Tailwind's default type scale is used as-is (documented in
`design-tokens.ts` for reference) plus one addition: `text-display`
(3.5rem / 1.05 line-height) for hero/marketing headings only.

## Spacing & radius

Tailwind's default 4px spacing scale — no custom scale, for compatibility
with every shadcn primitive. Radius is a single base (`--radius: 0.625rem`
/ 10px) with named multiples (`radius-sm` → `radius-4xl`) so every corner
in the app stays proportionally related.

## Elevation

Six-step shadow scale (`shadow-xs` → `shadow-2xl`), softer and lower-opacity
than Tailwind's defaults — deliberately quiet. Dark mode shadows are more
opaque (drop shadows barely read on near-black) and add a 1px inset top
highlight for an "edge-lit" card effect instead of relying on shadow alone.

## Motion

| Token | Value | Use |
|---|---|---|
| `duration-fast` | 120ms | hover, toggle |
| `duration-base` | 200ms | default transitions |
| `duration-slow` | 320ms | panels, dialogs |
| `duration-slower` | 480ms | page-level transitions |
| `ease-premium` | `cubic-bezier(0.16,1,0.3,1)` | entrances |
| `ease-premium-in` | `cubic-bezier(0.7,0,0.84,0)` | exits |
| `ease-spring` | `cubic-bezier(0.34,1.56,0.64,1)` | rare, playful micro-interactions only |

All transitions are neutralized under `prefers-reduced-motion: reduce`
globally (see `globals.css` base layer).

## Blur & glass

`backdrop-blur-glass` (20px) + the `.glass` utility class
(translucent surface + hairline border + backdrop blur). Reserved for
floating chrome — a sticky sub-header, a command palette — never a default
card treatment.

## Icons

[Lucide](https://lucide.dev), stroke width overridden globally to **1.75px**
(from the 2px default) via a base-layer `svg { stroke-width: 1.75px }` rule
— reads lighter, closer to Linear/Notion than the default Lucide weight.

## Component inventory

All primitives live in `src/components/ui/` (shadcn `radix-nova` style,
installed via `npx shadcn add`). Composite, app-specific components live in
`src/components/layout/` and `src/components/shared/`.

| Design requirement | Component(s) |
|---|---|
| Buttons | `ui/button.tsx` — variants: default, outline, secondary, ghost, destructive, **success**, **warning**, link |
| Inputs | `ui/input.tsx`, `ui/textarea.tsx`, `ui/select.tsx`, `ui/checkbox.tsx`, `ui/radio-group.tsx`, `ui/switch.tsx`, `ui/input-group.tsx` |
| Form components | `ui/field.tsx`, `ui/label.tsx`, `ui/button-group.tsx` |
| Cards | `ui/card.tsx` |
| Modals | `ui/dialog.tsx`, `ui/sheet.tsx` (slide-over variant) |
| Toasts | `ui/sonner.tsx` — mounted globally in `layout.tsx` |
| Navigation | `layout/navbar.tsx`, `ui/navigation-menu.tsx` |
| Sidebar | `layout/app-sidebar.tsx` (built on `ui/sidebar.tsx`) |
| Dropdowns | `ui/dropdown-menu.tsx`, `ui/popover.tsx` |
| Avatars | `ui/avatar.tsx` |
| Badges | `ui/badge.tsx` — same extended variant set as Button |
| Tables | `ui/table.tsx` |
| Charts | `ui/chart.tsx` (Recharts wrapper) + `shared/example-chart.tsx` reference implementation |
| Calendar | `ui/calendar.tsx` |
| Skeleton loading | `ui/skeleton.tsx` + `shared/skeleton-patterns.tsx` (`SkeletonCard`, `SkeletonTable`, `SkeletonList`) |
| Empty / error / success states | `ui/empty.tsx` + `shared/state-views.tsx` (`StatusEmpty`, `LoadingState`) |
| Tooltips | `ui/tooltip.tsx` — `TooltipProvider` mounted globally |
| Theme toggle | `layout/theme-toggle.tsx` |

## Dark mode & light mode

Class-based (`next-themes`, `attribute="class"`, `defaultTheme="system"`).
Every token above is defined for both `:root` and `.dark` — there is no
component in this system that hardcodes a light- or dark-only color.

## Accessibility notes

- Focus rings use the brand color (`--ring`) at 50% opacity via
  `focus-visible:ring-ring/50` on every interactive primitive.
- `prefers-reduced-motion: reduce` is honored globally.
- Chart colors carry a legend/label, never color alone (see chart palette
  section above).
- Semantic colors (success/warning/danger) are always paired with an icon
  and/or text label in the primitives that use them (`sonner` toasts,
  `alert.tsx`) — never color as the sole signal.

## What's out of scope here

No pages, no auth, no booking logic, no dashboards — this milestone is the
design system only. Composite components (`AppSidebar`, `Navbar`,
`ExampleChart`) are reference implementations meant to be assembled into
real screens in later milestones; none of them are wired into an actual
app route yet.
