import React from "react"
import type { DashboardChart } from "../../lib/types"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ScatterChart,
  Scatter
} from "recharts"

function formatNumber(v: any) {
  const n = typeof v === "number" ? v : Number(v)
  if (Number.isNaN(n)) return String(v)
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  if (abs >= 1) return `${n.toFixed(0)}`
  return `${n.toFixed(2)}`
}

function clampLabel(s: any, max = 14) {
  const str = String(s ?? "")
  return str.length <= max ? str : str.slice(0, max - 1) + "…"
}

function ChartShell(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-glow">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-100">{props.title}</div>
      </div>
      <div className="p-4 h-[360px]">{props.children}</div>
    </div>
  )
}

const tooltipStyle: React.CSSProperties = {
  background: "rgba(10, 12, 18, 0.92)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 14,
  boxShadow: "0 20px 70px rgba(0,0,0,0.55)",
  color: "rgba(255,255,255,0.92)"
}

export function AutoCharts(props: { charts: DashboardChart[] }) {
  if (!props.charts?.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 text-sm text-zinc-400 shadow-glow">
        Not enough signal to generate charts for this dataset.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {props.charts.map((c) => (
        <ChartBlock key={c.id} chart={c} />
      ))}
    </div>
  )
}

function ChartBlock({ chart }: { chart: DashboardChart }) {
  if (chart.type === "line") {
    const yKey = chart.series?.[0]?.yKey
    return (
      <ChartShell title={chart.title}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chart.data}>
            <CartesianGrid strokeOpacity={0.08} />
            <XAxis
              dataKey={chart.xKey}
              tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
              tickFormatter={(v) => clampLabel(v, 12)}
              axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
              tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
              tickFormatter={formatNumber}
              axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
              tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
            />
            <RTooltip contentStyle={tooltipStyle} formatter={(v: any) => formatNumber(v)} />
            <Line
              type="monotone"
              dataKey={yKey}
              dot={false}
              strokeWidth={2.6}
              stroke="rgba(56, 189, 248, 0.95)"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartShell>
    )
  }

  if (chart.type === "bar") {
    const yKey = chart.series?.[0]?.yKey ?? "value"
    return (
      <ChartShell title={chart.title}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart.data} margin={{ left: 6, right: 6, top: 6, bottom: 22 }}>
            <CartesianGrid strokeOpacity={0.08} />
            <XAxis
              dataKey={chart.xKey}
              tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
              tickFormatter={(v) => clampLabel(v, 10)}
              interval={0}
              height={64}
              angle={-22}
              textAnchor="end"
              axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
              tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
              tickFormatter={formatNumber}
              axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
              tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
            />
            <RTooltip contentStyle={tooltipStyle} formatter={(v: any) => formatNumber(v)} />
            <Bar dataKey={yKey} radius={[12, 12, 6, 6]} fill="rgba(167, 139, 250, 0.90)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>
    )
  }

  if (chart.type === "hist") {
    const yKey = chart.series?.[0]?.yKey ?? "count"
    return (
      <ChartShell title={chart.title}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart.data} margin={{ left: 6, right: 6, top: 6, bottom: 22 }}>
            <CartesianGrid strokeOpacity={0.08} />
            <XAxis
              dataKey={chart.xKey}
              tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 10 }}
              tickFormatter={(v) => clampLabel(String(v).split("–")[0], 6)}
              interval="preserveStartEnd"
              height={56}
              axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
              tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
              tickFormatter={formatNumber}
              axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
              tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
            />
            <RTooltip contentStyle={tooltipStyle} formatter={(v: any) => formatNumber(v)} />
            <Bar dataKey={yKey} radius={[10, 10, 6, 6]} fill="rgba(34, 197, 94, 0.85)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>
    )
  }

  if (chart.type === "scatter") {
    const xLabel = chart.meta?.xLabel ?? "X"
    const yLabel = chart.meta?.yLabel ?? chart.series?.[0]?.label ?? "Y"
    return (
      <ChartShell title={chart.title}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ left: 6, right: 6, top: 6, bottom: 6 }}>
            <CartesianGrid strokeOpacity={0.08} />
            <XAxis
              dataKey={chart.xKey}
              name={xLabel}
              tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
              tickFormatter={formatNumber}
              axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
              tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
            />
            <YAxis
              dataKey={chart.series?.[0]?.yKey ?? "y"}
              name={yLabel}
              tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
              tickFormatter={formatNumber}
              axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
              tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
            />
            <RTooltip contentStyle={tooltipStyle} formatter={(v: any) => formatNumber(v)} />
            <Scatter data={chart.data} fill="rgba(56, 189, 248, 0.85)" />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartShell>
    )
  }

  return null
}
