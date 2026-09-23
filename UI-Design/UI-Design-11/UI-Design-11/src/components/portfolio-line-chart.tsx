"use client";

import type { ComponentProps } from "react";
import { LineChart } from "@/components/charts";
import { fmtCompact, fmtShortDate } from "@/lib/format";

type Props = Omit<ComponentProps<typeof LineChart>, "formatValue" | "formatDay">;

export function PortfolioLineChart(props: Props) {
  return (
    <LineChart
      {...props}
      formatValue={(n: number) => fmtCompact(n)}
      formatDay={fmtShortDate}
    />
  );
}
