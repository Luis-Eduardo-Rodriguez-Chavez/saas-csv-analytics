import React from "react"
import { BarChart3, Database, FileUp, RefreshCw, Search, Sparkles, LayoutGrid } from "lucide-react"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { Input } from "./components/ui/input"
import { Badge } from "./components/ui/badge"
import { Separator } from "./components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs"
import { TableShell, TableScroll, Table, THead, TR, TH, TD } from "./components/ui/table"
import { AutoCharts } from "./components/charts/AutoCharts"
import { formatCompactNumber, formatDateTime } from "./lib/format"
import { getDashboard, getPreview, getProfile, listDatasets, uploadDataset } from "./lib/api"
import type { DashboardResponse, DatasetMeta, PreviewResponse, ProfileResponse } from "./lib/types"

type LoadState<T> = { loading: boolean; error?: string; data?: T }

export default function App() {
  const [datasets, setDatasets] = React.useState<LoadState<DatasetMeta[]>>({ loading: true })
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState("")
  const [tab, setTab] = React.useState<"overview" | "profile" | "preview">("overview")

  const [dashboard, setDashboard] = React.useState<LoadState<DashboardResponse>>({ loading: false })
  const [profile, setProfile] = React.useState<LoadState<ProfileResponse>>({ loading: false })
  const [preview, setPreview] = React.useState<LoadState<PreviewResponse>>({ loading: false })

  const [uploading, setUploading] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement | null>(null)

  const refreshList = React.useCallback(async () => {
    setDatasets({ loading: true })
    try {
      const res = await listDatasets()
      setDatasets({ loading: false, data: res.datasets })
      if (!selectedId && res.datasets?.length) setSelectedId(res.datasets[0].id)
    } catch (e: any) {
      setDatasets({ loading: false, error: e.message || "Failed to load datasets" })
    }
  }, [selectedId])

  React.useEffect(() => {
    refreshList()
  }, [refreshList])

  const selected = React.useMemo(
    () => datasets.data?.find((d) => d.id === selectedId) || null,
    [datasets.data, selectedId]
  )

  const loadDatasetViews = React.useCallback(async (id: string) => {
    setDashboard({ loading: true })
    setProfile({ loading: true })
    setPreview({ loading: true })
    try {
      const [d, p, v] = await Promise.all([getDashboard(id), getProfile(id), getPreview(id)])
      setDashboard({ loading: false, data: d })
      setProfile({ loading: false, data: p })
      setPreview({ loading: false, data: v })
    } catch (e: any) {
      const msg = e.message || "Failed to load dataset"
      setDashboard({ loading: false, error: msg })
      setProfile({ loading: false, error: msg })
      setPreview({ loading: false, error: msg })
    }
  }, [])

  React.useEffect(() => {
    if (selectedId) loadDatasetViews(selectedId)
  }, [selectedId, loadDatasetViews])

  const filtered = React.useMemo(() => {
    const items = datasets.data || []
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((d) => d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q))
  }, [datasets.data, query])

  async function onPickFile(f: File) {
    setUploading(true)
    try {
      const res = await uploadDataset(f)
      await refreshList()
      setSelectedId(res.id)
      setTab("overview")
    } catch (e: any) {
      alert(e.message || "Upload failed")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div
      className={[
        "min-h-screen text-zinc-100",
        "bg-[radial-gradient(1100px_700px_at_15%_-10%,rgba(56,189,248,0.14),transparent_55%),radial-gradient(900px_650px_at_85%_0%,rgba(167,139,250,0.12),transparent_55%),radial-gradient(900px_700px_at_40%_110%,rgba(34,197,94,0.08),transparent_60%),linear-gradient(to_bottom,#05060a,#070912_40%,#05060a)]"
      ].join(" ")}
    >
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onPickFile(f)
        }}
      />

      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-zinc-950 flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">CSV Analytics</div>
              <div className="text-xs text-zinc-400">Upload a dataset → instant dashboard</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={refreshList}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
              <FileUp className="w-4 h-4" />
              {uploading ? "Uploading…" : "Upload CSV"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4">
          <aside className="space-y-4">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Datasets</CardTitle>
                <CardDescription>Stored locally (CSV + JSON)</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search datasets…" className="pl-9" />
                </div>

                <Button variant="secondary" className="w-full" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <FileUp className="w-4 h-4" />
                  Upload
                </Button>

                <Separator />

                {datasets.loading ? (
                  <div className="text-sm text-zinc-500">Loading…</div>
                ) : datasets.error ? (
                  <div className="text-sm text-red-300">{datasets.error}</div>
                ) : !filtered.length ? (
                  <div className="text-sm text-zinc-500">No datasets yet.</div>
                ) : (
                  <div className="space-y-2 max-h-[56vh] overflow-auto pr-1 [mask-image:linear-gradient(to_bottom,black_85%,transparent)]">
                    {filtered.map((d) => {
                      const active = selectedId === d.id
                      return (
                        <button
                          key={d.id}
                          onClick={() => {
                            setSelectedId(d.id)
                            setTab("overview")
                          }}
                          className={[
                            "w-full text-left rounded-2xl border px-3 py-3 transition",
                            active
                              ? "border-cyan-400/30 bg-white/[0.06]"
                              : "border-white/10 hover:border-white/20 hover:bg-white/[0.03]"
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold truncate">{d.name}</div>
                              <div className="text-xs text-zinc-400 mt-1">
                                {formatCompactNumber(d.rows)} rows • {formatCompactNumber(d.columns)} cols
                              </div>
                            </div>
                            <Badge tone="neutral" className="shrink-0">
                              {d.id.slice(0, 6)}
                            </Badge>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-xs text-zinc-400">
                Tip: upload multiple datasets to make your portfolio look enterprise-grade.
              </CardContent>
            </Card>
          </aside>

          <main className="min-w-0 space-y-4">
            {!selected ? (
              <Card>
                <CardContent className="p-10">
                  <div className="max-w-xl">
                    <div className="text-xl font-semibold">Upload a CSV to generate your dashboard</div>
                    <div className="text-sm text-zinc-400 mt-2">
                      Auto-detects column types, profiles quality, and generates charts with no configuration.
                    </div>
                    <div className="mt-6">
                      <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
                        <FileUp className="w-4 h-4" />
                        {uploading ? "Uploading…" : "Upload CSV"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="overflow-hidden">
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-zinc-300" />
                        <div className="text-sm font-semibold truncate">{selected.name}</div>
                      </div>
                      <div className="text-xs text-zinc-400 mt-1">
                        {formatCompactNumber(selected.rows)} rows • {formatCompactNumber(selected.columns)} columns • Created{" "}
                        {formatDateTime(selected.created_at)}
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400/80" />
                          Auto-generated
                        </span>
                        <span className="text-white/20">•</span>
                        <span>{dashboard.data?.generated_at ? formatDateTime(dashboard.data.generated_at) : "—"}</span>
                      </div>
                    </div>

                    <Badge tone="blue" className="shrink-0">
                      {selected.id.slice(0, 8)}
                    </Badge>
                  </div>
                </Card>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4">
                  <div className="min-w-0 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl flex items-center justify-center">
                        <LayoutGrid className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Dashboard</div>
                        <div className="text-xs text-zinc-400">Auto-generated insights and visuals</div>
                      </div>
                    </div>

                    <KPIBar dashboard={dashboard} />
                    <AutoCharts charts={dashboard.data?.charts || []} />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Data</div>
                        <div className="text-xs text-zinc-400">Preview + profiling</div>
                      </div>
                    </div>

                    <Card>
                      <CardContent className="p-3 flex items-center justify-between gap-2">
                        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
                          <TabsList className="w-full justify-start">
                            <TabsTrigger value="overview">Summary</TabsTrigger>
                            <TabsTrigger value="profile">Profiling</TabsTrigger>
                            <TabsTrigger value="preview">Preview</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </CardContent>
                    </Card>

                    {tab === "overview" && <RightSummary selected={selected} profile={profile} />}
                    {tab === "profile" && <Profiling profile={profile} />}
                    {tab === "preview" && <Preview preview={preview} />}
                  </div>
                </div>

                <div className="pt-6 pb-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl px-4 py-3 flex items-center justify-between gap-3">
                    <div className="text-xs text-zinc-400">
                      Built by <span className="text-zinc-200 font-semibold">Salah</span>
                    </div>
                    <div className="text-xs text-zinc-500">FastAPI • React • Local disk storage</div>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

function KPIBar(props: { dashboard: LoadState<DashboardResponse> }) {
  if (props.dashboard.loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-zinc-500">Loading KPIs…</CardContent>
      </Card>
    )
  }
  if (props.dashboard.error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-red-300">{props.dashboard.error}</CardContent>
      </Card>
    )
  }
  const d = props.dashboard.data
  if (!d?.kpis?.length) return null

  return (
    <Card>
      <CardContent className="p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {d.kpis.map((k) => (
            <div key={k.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="text-[11px] text-zinc-400">{k.label}</div>
<div className="mt-1 text-[15px] font-semibold text-zinc-100 leading-tight break-words">
{k.label === "Generated"
  ? new Date(String(k.value)).toLocaleString()
  : typeof k.value === "number"
    ? formatCompactNumber(k.value)
    : String(k.value)}
                {k.suffix ? <span className="text-sm text-zinc-400 ml-1">{k.suffix}</span> : null}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RightSummary(props: { selected: DatasetMeta; profile: LoadState<ProfileResponse> }) {
  const p = props.profile.data
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Dataset Summary</CardTitle>
        <CardDescription>Quick quality signal</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row label="Rows" value={formatCompactNumber(props.selected.rows)} />
        <Row label="Columns" value={formatCompactNumber(props.selected.columns)} />
        <Row label="Missing Ratio" value={p ? `${(p.missing_ratio * 100).toFixed(2)}%` : "—"} />
        <Separator />
        <div className="text-xs text-zinc-400">
          Charts are auto-selected based on detected column types (date/number/category).
        </div>
      </CardContent>
    </Card>
  )
}

function Row(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-zinc-400">{props.label}</span>
      <span className="font-semibold">{props.value}</span>
    </div>
  )
}

function Profiling(props: { profile: any }) {
  if (props.profile.loading) return <Card><CardContent className="p-6 text-sm text-zinc-500">Loading profiling…</CardContent></Card>
  if (props.profile.error) return <Card><CardContent className="p-6 text-sm text-red-300">{props.profile.error}</CardContent></Card>

  const p = props.profile.data
  const cols = p?.columns_profile
  if (!p || !Array.isArray(cols)) return <Card><CardContent className="p-6 text-sm text-zinc-500">No profiling data.</CardContent></Card>

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Profiling</CardTitle>
        <CardDescription>Column stats and quality</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        <TableShell>
          <TableScroll className="max-h-[58vh] overflow-x-auto overflow-y-auto">
            <Table className="min-w-max">
              <THead>
                <TR>
                  <TH className="min-w-[210px]">Name</TH>
                  <TH className="min-w-[110px]">Type</TH>
                  <TH className="min-w-[110px]">Missing</TH>
                  <TH className="min-w-[110px]">Unique</TH>
                  <TH className="min-w-[520px]">Details</TH>
                </TR>
              </THead>
              <tbody>
                {cols.map((c: any) => {
                  const t = c?.type
                  const miss = typeof c?.missing_ratio === "number" ? (c.missing_ratio * 100).toFixed(2) + "%" : "—"
                  const uniq = c?.unique_count ?? "—"
                  let details = "—"
                  if (t === "number") details = `min ${c?.min ?? "—"} • max ${c?.max ?? "—"} • mean ${c?.mean ?? "—"}`
                  if (t === "date") details = `${c?.date_start ? new Date(c.date_start).toLocaleString() : "—"} → ${c?.date_end ? new Date(c.date_end).toLocaleString() : "—"}`
                  if (t === "category") details = Array.isArray(c?.top_values) ? c.top_values.slice(0, 6).map((x: any) => `${x.value} (${x.count})`).join(" • ") : "—"
                  if (t === "text") details = Array.isArray(c?.sample_values) ? c.sample_values.slice(0, 6).join(" • ") : "—"

                  return (
                    <TR key={c?.name ?? Math.random()} className="hover:bg-white/[0.03] transition">
                      <TD className="min-w-[210px] font-medium text-zinc-100">{c?.name ?? "—"}</TD>
                      <TD className="min-w-[110px]">{t ?? "—"}</TD>
                      <TD className="min-w-[110px]">{miss}</TD>
                      <TD className="min-w-[110px]">{uniq}</TD>
                      <TD className="min-w-[520px] text-zinc-300">{details}</TD>
                    </TR>
                  )
                })}
              </tbody>
            </Table>
          </TableScroll>
        </TableShell>
      </CardContent>
    </Card>
  )
}

function Preview(props: { preview: any }) {
  if (props.preview.loading) return <Card><CardContent className="p-6 text-sm text-zinc-500">Loading preview…</CardContent></Card>
  if (props.preview.error) return <Card><CardContent className="p-6 text-sm text-red-300">{props.preview.error}</CardContent></Card>

  const v = props.preview.data
  if (!v) return null
  const cols: string[] = v.columns || []
  const rows: Record<string, any>[] = v.rows || []

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>First 50 rows</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        <TableShell>
          <TableScroll className="max-h-[58vh] max-w-full overflow-x-auto overflow-y-auto">
            <Table className="min-w-max">
              <THead>
                <TR>
                  {cols.map((c) => (
                    <TH key={c} className="min-w-[160px]">{c}</TH>
                  ))}
                </TR>
              </THead>
              <tbody>
                {rows.map((r, i) => (
                  <TR key={i} className="hover:bg-white/[0.03] transition">
                    {cols.map((c) => {
                      const val = r?.[c]
                      return (
                        <TD key={c} className="min-w-[160px]">
                          {val === null || val === undefined || val === "" ? <span className="text-zinc-500">—</span> : String(val)}
                        </TD>
                      )
                    })}
                  </TR>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        </TableShell>
      </CardContent>
    </Card>
  )
}
