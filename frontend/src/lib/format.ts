export function formatCompactNumber(n: any) {
  const v = typeof n === "number" ? n : Number(n)
  if (Number.isNaN(v)) return String(n)
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 2 }).format(v)
}

export function formatPercent(ratio: number) {
  return `${(ratio * 100).toFixed(2)}%`
}

export function formatDateTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}
