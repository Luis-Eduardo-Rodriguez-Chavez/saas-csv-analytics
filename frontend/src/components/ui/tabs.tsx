import { clsx } from "clsx"
import React from "react"

type TabsCtx = { value: string; setValue: (v: string) => void }
const Ctx = React.createContext<TabsCtx | null>(null)

export function Tabs(props: { value: string; onValueChange: (v: string) => void; children: React.ReactNode; className?: string }) {
  return (
    <Ctx.Provider value={{ value: props.value, setValue: props.onValueChange }}>
      <div className={clsx("w-full", props.className)}>{props.children}</div>
    </Ctx.Provider>
  )
}

export function TabsList(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return <div className={clsx("inline-flex rounded-2xl bg-zinc-900/50 border border-zinc-800 p-1 gap-1", className)} {...rest} />
}

export function TabsTrigger(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const ctx = React.useContext(Ctx)
  if (!ctx) return null
  const active = ctx.value === props.value
  const { className, value, ...rest } = props
  return (
    <button
      className={clsx(
        "px-3 py-2 text-xs rounded-xl transition",
        active ? "bg-zinc-100 text-zinc-950 shadow-soft" : "text-zinc-300 hover:bg-zinc-800/60",
        className
      )}
      onClick={() => ctx.setValue(value)}
      {...rest}
    />
  )
}
