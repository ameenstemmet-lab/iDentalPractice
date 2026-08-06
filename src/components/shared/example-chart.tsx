"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Abstract placeholder data — this component demonstrates the chart design
// pattern only, it is not wired to real practice data.
const data = [
  { period: "Week 1", seriesA: 42, seriesB: 28, seriesC: 12 },
  { period: "Week 2", seriesA: 51, seriesB: 31, seriesC: 18 },
  { period: "Week 3", seriesA: 39, seriesB: 34, seriesC: 15 },
  { period: "Week 4", seriesA: 58, seriesB: 29, seriesC: 22 },
  { period: "Week 5", seriesA: 63, seriesB: 40, seriesC: 19 },
  { period: "Week 6", seriesA: 55, seriesB: 37, seriesC: 24 },
];

// Fixed categorical order (slots 1–3), themed per light/dark. Only slots
// 1–3 are safe for all-pairs comparison (see DESIGN_SYSTEM.md) — a bar
// chart with adjacent bars needs that, not just the adjacent-pair guarantee
// the full 5-slot palette gives.
const chartConfig = {
  seriesA: { label: "Series A", theme: { light: "#2a78d6", dark: "#3987e5" } },
  seriesB: { label: "Series B", theme: { light: "#eb6834", dark: "#d95926" } },
  seriesC: { label: "Series C", theme: { light: "#1baf7a", dark: "#199e70" } },
} satisfies ChartConfig;

/**
 * Reference chart implementation — grouped bar chart with legend, hover
 * tooltip, and thin rounded-end marks per the data-viz mark spec. Swap the
 * placeholder data for a real query when a metrics milestone lands.
 */
export function ExampleChart() {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
      <BarChart data={data} barCategoryGap="24%" barGap={2}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="period"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "var(--muted)" }} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="seriesA" fill="var(--color-seriesA)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="seriesB" fill="var(--color-seriesB)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="seriesC" fill="var(--color-seriesC)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ChartContainer>
  );
}
