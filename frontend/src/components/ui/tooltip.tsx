import React from "react"

export function Tooltip(props: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {props.children}
      {open && (
        <span className="absolute z-50 -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-200 shadow-soft">
          {props.label}
        </span>
      )}
    </span>
  )
}
