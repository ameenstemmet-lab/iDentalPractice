/**
 * Canonical design tokens for iDentalPractice.
 *
 * This file is the documented, typed mirror of the runtime CSS custom
 * properties defined in `src/app/globals.css` — it exists for contexts that
 * need raw values in JS/TS (chart configs, canvas, email templates, tests)
 * and as the single reference for what every token means and why.
 *
 * The CSS custom properties in globals.css remain the source of truth for
 * anything rendered with Tailwind utilities (bg-primary, text-muted-foreground,
 * shadow-md, etc). Keep the two in sync when either changes.
 */

/** Neutral, monochrome-first palette. Brand color is used sparingly — see `brand`. */
export const colors = {
  brand: {
    // A single deliberate indigo-blue. Primary actions, links, active nav
    // state, focus rings, chart slot 1. Nowhere else.
    light: "oklch(0.45 0.19 264)",
    dark: "oklch(0.62 0.19 264)",
  },
  semantic: {
    // Soft-tint usage only (bg-{name}/10 text-{name}), never solid fills —
    // matches the existing shadcn destructive treatment.
    success: { light: "oklch(0.6 0.14 152)", dark: "oklch(0.72 0.16 152)" },
    warning: { light: "oklch(0.77 0.15 80)", dark: "oklch(0.8 0.15 80)" },
    danger: { light: "oklch(0.577 0.245 27.325)", dark: "oklch(0.704 0.191 22.216)" },
  },
  neutral: {
    background: { light: "oklch(1 0 0)", dark: "oklch(0.145 0 0)" },
    surface: { light: "oklch(0.985 0 0)", dark: "oklch(0.19 0 0)" },
    card: { light: "oklch(1 0 0)", dark: "oklch(0.205 0 0)" },
    text: { light: "oklch(0.145 0 0)", dark: "oklch(0.985 0 0)" },
    mutedText: { light: "oklch(0.556 0 0)", dark: "oklch(0.708 0 0)" },
    divider: { light: "oklch(0.922 0 0)", dark: "oklch(1 0 0 / 10%)" },
  },
} as const;

/**
 * Chart categorical palette — fixed hue order, never cycled or reassigned
 * per-render. Validated for adjacent-pair CVD safety against the app's
 * light/dark surfaces (see DESIGN_SYSTEM.md for the validator output).
 */
export const chartPalette = {
  categorical: {
    light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"],
    dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181"],
  },
  // Fixed, never themed — reserved for state/delta indicators, never reused
  // as a categorical series color.
  status: {
    good: "#0ca30c",
    warning: "#fab219",
    serious: "#ec835a",
    critical: "#d03b3b",
  },
} as const;

/** Tailwind's default 4px spacing scale, named for reference in specs/handoff. */
export const spacing = {
  "0.5": "0.125rem", // 2px
  "1": "0.25rem", // 4px
  "1.5": "0.375rem", // 6px
  "2": "0.5rem", // 8px
  "3": "0.75rem", // 12px
  "4": "1rem", // 16px
  "5": "1.25rem", // 20px
  "6": "1.5rem", // 24px
  "8": "2rem", // 32px
  "10": "2.5rem", // 40px
  "12": "3rem", // 48px
  "16": "4rem", // 64px
  "20": "5rem", // 80px
  "24": "6rem", // 96px
} as const;

/** Base radius is 10px; every step is a multiple of it (see globals.css). */
export const radius = {
  sm: "calc(0.625rem * 0.6)", // 6px
  md: "calc(0.625rem * 0.8)", // 8px
  lg: "0.625rem", // 10px — default
  xl: "calc(0.625rem * 1.4)", // 14px
  "2xl": "calc(0.625rem * 1.8)", // 18px
  "3xl": "calc(0.625rem * 2.2)", // 22px
  "4xl": "calc(0.625rem * 2.6)", // 26px — pills, floating action buttons
} as const;

/**
 * Soft, low-opacity, multi-layer shadows — deliberately quieter than
 * Tailwind's defaults. Dark mode adds a subtle inset top highlight since
 * drop shadows barely read against a near-black surface.
 */
export const elevation = {
  xs: {
    light: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
    dark: "0 1px 2px 0 rgb(0 0 0 / 0.3)",
  },
  sm: {
    light: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
    dark: "0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.3)",
  },
  md: {
    light: "0 4px 10px -2px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
    dark:
      "0 4px 10px -2px rgb(0 0 0 / 0.45), 0 2px 4px -2px rgb(0 0 0 / 0.3), inset 0 1px 0 0 rgb(255 255 255 / 0.04)",
  },
  lg: {
    light: "0 12px 24px -6px rgb(0 0 0 / 0.09), 0 4px 8px -4px rgb(0 0 0 / 0.06)",
    dark:
      "0 12px 24px -6px rgb(0 0 0 / 0.5), 0 4px 8px -4px rgb(0 0 0 / 0.35), inset 0 1px 0 0 rgb(255 255 255 / 0.05)",
  },
  xl: {
    light: "0 24px 48px -10px rgb(0 0 0 / 0.12), 0 8px 16px -8px rgb(0 0 0 / 0.07)",
    dark:
      "0 24px 48px -10px rgb(0 0 0 / 0.55), 0 8px 16px -8px rgb(0 0 0 / 0.4), inset 0 1px 0 0 rgb(255 255 255 / 0.06)",
  },
  "2xl": {
    light: "0 32px 64px -16px rgb(0 0 0 / 0.16)",
    dark: "0 32px 64px -16px rgb(0 0 0 / 0.6), inset 0 1px 0 0 rgb(255 255 255 / 0.06)",
  },
} as const;

export const typography = {
  fontSans: "var(--font-geist-sans)",
  fontMono: "var(--font-geist-mono)",
  /** Tailwind's default type scale — used as-is, documented for reference. */
  scale: {
    xs: { size: "0.75rem", lineHeight: "1rem" },
    sm: { size: "0.875rem", lineHeight: "1.25rem" },
    base: { size: "1rem", lineHeight: "1.5rem" },
    lg: { size: "1.125rem", lineHeight: "1.75rem" },
    xl: { size: "1.25rem", lineHeight: "1.75rem" },
    "2xl": { size: "1.5rem", lineHeight: "2rem" },
    "3xl": { size: "1.875rem", lineHeight: "2.25rem" },
    "4xl": { size: "2.25rem", lineHeight: "2.5rem" },
    "5xl": { size: "3rem", lineHeight: "1.1" },
    /** Custom addition, for hero/marketing headings only. */
    display: { size: "3.5rem", lineHeight: "1.05" },
  },
  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const motion = {
  duration: {
    fast: "120ms", // micro-interactions: hover, toggle
    base: "200ms", // default transitions
    slow: "320ms", // panels, dialogs
    slower: "480ms", // page-level transitions
  },
  easing: {
    premium: "cubic-bezier(0.16, 1, 0.3, 1)", // ease-out-expo — entrances
    premiumIn: "cubic-bezier(0.7, 0, 0.84, 0)", // ease-in-expo — exits
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)", // subtle overshoot, used sparingly
  },
} as const;

export const blur = {
  glass: "20px",
} as const;

export const icon = {
  /** Lighter than lucide-react's 2px default — matches Linear/Notion. */
  strokeWidth: 1.75,
  size: {
    sm: "1rem", // 16px
    md: "1.25rem", // 20px
    lg: "1.5rem", // 24px
  },
} as const;

export const designTokens = {
  colors,
  chartPalette,
  spacing,
  radius,
  elevation,
  typography,
  motion,
  blur,
  icon,
} as const;

export type DesignTokens = typeof designTokens;
