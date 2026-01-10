import { clsx } from "clsx"

export function Badge(props: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "green" | "blue" | "amber" }) {
  const { className, tone = "neutral", ...rest } = props
  const tones: Record<string, string> = {
    neutral: "bg-zinc-900 border-zinc-800 text-zinc-200",
    green: "bg-emerald-950/40 border-emerald-900/50 text-emerald-200",
    blue: "bg-sky-950/40 border-sky-900/50 text-sky-200",
    amber: "bg-amber-950/40 border-amber-900/50 text-amber-200"
  }
  return <span className={clsx("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]", tones[tone], className)} {...rest} />
}
