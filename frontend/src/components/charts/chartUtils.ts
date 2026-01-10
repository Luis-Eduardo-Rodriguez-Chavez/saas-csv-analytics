export function clampLabel(s: any, max = 18) {
  const str = String(s ?? "")
  if (str.length <= max) return str
  return str.slice(0, max - 1) + "…"
}
