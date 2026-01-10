import { clsx } from "clsx"

export function TableShell(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return (
    <div
      className={clsx(
        "w-full max-w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]",
        className
      )}
      {...rest}
    />
  )
}

export function TableScroll(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return (
    <div
      className={clsx(
        "w-full overflow-auto",
        "[-webkit-overflow-scrolling:touch]",
        className
      )}
      {...rest}
    />
  )
}

export function Table(props: React.TableHTMLAttributes<HTMLTableElement>) {
  const { className, ...rest } = props
  return (
    <table
      className={clsx("w-full border-collapse text-left text-xs", className)}
      {...rest}
    />
  )
}

export function THead(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  const { className, ...rest } = props
  return (
    <thead
      className={clsx("sticky top-0 z-10 bg-black/40 backdrop-blur-xl", className)}
      {...rest}
    />
  )
}

export function TR(props: React.HTMLAttributes<HTMLTableRowElement>) {
  const { className, ...rest } = props
  return (
    <tr
      className={clsx("border-b border-white/10 last:border-b-0", className)}
      {...rest}
    />
  )
}

export function TH(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
  const { className, ...rest } = props
  return (
    <th
      className={clsx("px-3 py-2 font-semibold text-zinc-200 whitespace-nowrap", className)}
      {...rest}
    />
  )
}

export function TD(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  const { className, ...rest } = props
  return (
    <td
      className={clsx("px-3 py-2 text-zinc-200 whitespace-nowrap", className)}
      {...rest}
    />
  )
}

export const TRow = TR
