export type DatasetMeta = {
  id: string
  name: string
  rows: number
  columns: number
  created_at: string
}

export type DatasetIndex = {
  datasets: DatasetMeta[]
}

export type PreviewResponse = {
  columns: string[]
  rows: Record<string, any>[]
}

export type ProfileColumn = {
  name: string
  type: "number" | "date" | "category" | "text"
  missing_ratio: number
  unique_count: number
  min?: number | null
  max?: number | null
  mean?: number | null
  date_start?: string | null
  date_end?: string | null
  top_values?: { value: string; count: number }[]
  sample_values?: string[]
}

export type ProfileResponse = {
  rows: number
  columns: number
  missing_ratio: number
  generated_at: string
  columns_profile: ProfileColumn[]
}

export type DashboardKPI = {
  label: string
  value: any
  suffix?: string
}

export type DashboardChart = {
  id: string
  type: "line" | "bar" | "scatter" | "hist"
  title: string
  xKey: string
  series: { yKey: string; label: string }[]
  data: Record<string, any>[]
  meta?: Record<string, any>
}

export type DashboardResponse = {
  kpis: DashboardKPI[]
  charts: DashboardChart[]
  generated_at: string
}
