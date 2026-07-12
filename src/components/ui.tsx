import type { ReactNode } from 'react'

export function Campo({
  label,
  children,
  ajuda,
}: {
  label: string
  children: ReactNode
  ajuda?: string
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
      {ajuda && <span className="text-xs text-slate-500 dark:text-slate-400">{ajuda}</span>}
    </label>
  )
}

const inputBase =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'

export function NumberInput({
  value,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { value: number | undefined }) {
  return <input type="number" className={inputBase} value={value ?? ''} {...props} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={inputBase} {...props} />
}

export function Cartao({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`}
    >
      {children}
    </div>
  )
}

export function Selo({
  tom,
  children,
}: {
  tom: 'verde' | 'amarelo' | 'vermelho' | 'neutro'
  children: ReactNode
}) {
  const tons: Record<typeof tom, string> = {
    verde:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800',
    amarelo:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800',
    vermelho:
      'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-800',
    neutro:
      'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tons[tom]}`}>
      {children}
    </span>
  )
}

export function BotaoPrimario(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-500 dark:hover:bg-teal-400 ${props.className ?? ''}`}
    />
  )
}

export function BotaoSecundario(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 ${props.className ?? ''}`}
    />
  )
}
