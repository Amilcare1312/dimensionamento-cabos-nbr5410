import type { ReactNode } from 'react'

// Controles de formulário do CRM (mesma linguagem visual do restante do app).

export const inputBase =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="text" {...props} className={`${inputBase} ${props.className ?? ''}`} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} min-h-[80px] resize-y ${props.className ?? ''}`} />
}

export function SelectCrm(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputBase} ${props.className ?? ''}`} />
}

export function CampoForm({
  label,
  children,
  ajuda,
  className = '',
}: {
  label: string
  children: ReactNode
  ajuda?: string
  className?: string
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className}`}>
      <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
      {ajuda && <span className="text-xs text-slate-500 dark:text-slate-400">{ajuda}</span>}
    </label>
  )
}

/** Modal centralizado com backdrop. */
export function Modal({
  aberto,
  titulo,
  onFechar,
  children,
  larguraMax = 'max-w-2xl',
}: {
  aberto: boolean
  titulo: string
  onFechar: () => void
  children: ReactNode
  larguraMax?: string
}) {
  if (!aberto) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onFechar}
    >
      <div
        className={`my-8 w-full ${larguraMax} rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{titulo}</h2>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

/** Avatar circular com iniciais e cor derivada do nome. */
export function Avatar({ nome, texto }: { nome: string; texto: string }) {
  const cores = [
    'bg-teal-500',
    'bg-sky-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-emerald-500',
  ]
  let h = 0
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) & 0xffff
  const cor = cores[h % cores.length]
  return (
    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${cor}`}>
      {texto}
    </span>
  )
}
