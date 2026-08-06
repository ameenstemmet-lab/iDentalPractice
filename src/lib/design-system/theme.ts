/**
 * Structured light/dark theme resolved from design-tokens.ts.
 *
 * Use this when a component needs a concrete value in JS (e.g. a chart
 * series color) rather than a Tailwind class. Everything else should use
 * Tailwind utilities (bg-primary, text-muted-foreground, ...), which read
 * the same values from the CSS custom properties in globals.css.
 */
import { chartPalette, colors, elevation } from "./design-tokens";

export type ThemeMode = "light" | "dark";

export interface ResolvedTheme {
  colors: {
    brand: string;
    success: string;
    warning: string;
    danger: string;
    background: string;
    surface: string;
    card: string;
    text: string;
    mutedText: string;
    divider: string;
  };
  chart: string[];
  elevation: Record<keyof typeof elevation, string>;
}

function resolveElevation(mode: ThemeMode): Record<keyof typeof elevation, string> {
  return Object.fromEntries(
    Object.entries(elevation).map(([key, value]) => [key, value[mode]])
  ) as Record<keyof typeof elevation, string>;
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return {
    colors: {
      brand: colors.brand[mode],
      success: colors.semantic.success[mode],
      warning: colors.semantic.warning[mode],
      danger: colors.semantic.danger[mode],
      background: colors.neutral.background[mode],
      surface: colors.neutral.surface[mode],
      card: colors.neutral.card[mode],
      text: colors.neutral.text[mode],
      mutedText: colors.neutral.mutedText[mode],
      divider: colors.neutral.divider[mode],
    },
    chart: [...chartPalette.categorical[mode]],
    elevation: resolveElevation(mode),
  };
}

export const lightTheme: ResolvedTheme = resolveTheme("light");
export const darkTheme: ResolvedTheme = resolveTheme("dark");

/**
 * Fixed-order categorical chart color for series index `i`. Never cycle or
 * reassign colors when a filter changes which series are visible — a
 * series keeps its color for its whole lifetime on the chart.
 */
export function getChartColor(index: number, mode: ThemeMode = "light"): string {
  const palette = chartPalette.categorical[mode];
  if (index >= palette.length) {
    throw new Error(
      `getChartColor: index ${index} exceeds the ${palette.length}-slot categorical palette — fold extra series into "Other" or facet instead of generating a new hue.`
    );
  }
  return palette[index];
}

/** Fixed, never themed — see chartPalette.status in design-tokens.ts. */
export const chartStatusColor = chartPalette.status;
