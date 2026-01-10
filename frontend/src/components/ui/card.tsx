import { clsx } from "clsx"

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return (
    <div
      className={clsx(
        "rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-glow",
        className
      )}
      {...rest}
    />
  )
}

export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return <div className={clsx("p-4 border-b border-white/10", className)} {...rest} />
}

export function CardTitle(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return <div className={clsx("text-sm font-semibold text-zinc-100", className)} {...rest} />
}

export function CardDescription(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return <div className={clsx("text-xs text-zinc-400 mt-1", className)} {...rest} />
}

export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return <div className={clsx("p-4", className)} {...rest} />
}
