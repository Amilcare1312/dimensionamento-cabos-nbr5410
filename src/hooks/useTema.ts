import { useEffect, useState } from 'react'

export type Tema = 'claro' | 'escuro'

function temaPreferido(): Tema {
  if (typeof window === 'undefined') return 'claro'
  const salvo = window.localStorage.getItem('nbr5410:tema')
  if (salvo === 'claro' || salvo === 'escuro') return salvo
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro'
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(temaPreferido)

  useEffect(() => {
    const raiz = document.documentElement
    raiz.classList.toggle('dark', tema === 'escuro')
    window.localStorage.setItem('nbr5410:tema', tema)
  }, [tema])

  return {
    tema,
    alternarTema: () => setTema((t) => (t === 'claro' ? 'escuro' : 'claro')),
  }
}
