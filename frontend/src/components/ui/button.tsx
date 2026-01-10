import { clsx } from "clsx"

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "secondary" | "ghost"
  }
) {
  const { className, variant = "default", ...rest } = props

  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-400/25 disabled:opacity-50 disabled:pointer-events-none"

  const variants: Record<string, string> = {
    default:
      "bg-gradient-to-b from-white to-zinc-200 text-zinc-950 shadow-soft hover:from-white hover:to-white",
    secondary:
      "bg-white/[0.06] text-zinc-100 hover:bg-white/[0.09] border border-white/10",
    ghost: "bg-transparent text-zinc-100 hover:bg-white/[0.06]"
  }

  return <button className={clsx(base, variants[variant], className)} {...rest} />
}
