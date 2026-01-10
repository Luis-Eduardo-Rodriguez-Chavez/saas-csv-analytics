import { clsx } from "clsx"

export function Separator(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return <div className={clsx("h-px w-full bg-zinc-900", className)} {...rest} />
}
