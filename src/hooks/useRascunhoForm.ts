import { useCallback, useEffect, useRef, useState } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import { useAuth } from '@/hooks/useAuth'
import {
  RASCUNHO_EVENTO,
  apagarRascunho,
  carregarRascunho,
  rascunhosDoPaciente,
  salvarRascunho,
  type Rascunho,
  type RascunhoResumo,
  type RascunhoTipo,
} from '@/lib/rascunhosLocais'

const ESPERA_MS = 800

type Opcoes<T extends FieldValues> = {
  form: UseFormReturn<T>
  patientId: string
  tipo: RascunhoTipo
  registroId: string
  /** false quando o formulário abre com conteúdo próprio (áudio, IA): não recupera rascunho antigo. */
  recuperar?: boolean
}

/**
 * Guarda o formulário neste aparelho enquanto a pessoa preenche (só depois de ela mexer).
 * Grava também ao fechar o formulário, trocar de aba ou fechar o navegador, então sair sem
 * salvar não perde nada. Depois de salvar de verdade, chame `limpar`.
 */
export function useRascunhoForm<T extends FieldValues>({ form, patientId, tipo, registroId, recuperar = true }: Opcoes<T>) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const alvo = useRef({ userId, patientId, tipo, registroId })
  const [restaurado, setRestaurado] = useState<Rascunho<T> | null>(() =>
    userId && recuperar ? carregarRascunho<T>({ userId, patientId, tipo, registroId }) : null,
  )
  const pendente = useRef(false)
  const timer = useRef<number | null>(null)
  // Lido no render para o react-hook-form manter isDirty atualizado.
  void form.formState.isDirty

  useEffect(() => {
    alvo.current = { userId, patientId, tipo, registroId }
  }, [userId, patientId, tipo, registroId])

  const gravar = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    if (!pendente.current) return
    pendente.current = false
    const { userId: id, ...resto } = alvo.current
    if (id && form.formState.isDirty) salvarRascunho({ userId: id, ...resto }, form.getValues())
  }, [form])

  useEffect(() => {
    const assinatura = form.watch((_valores, info) => {
      // Sem `name` é um reset (abrir, recuperar): não é a pessoa preenchendo.
      if (!info.name) return
      pendente.current = true
      if (timer.current !== null) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(gravar, ESPERA_MS)
    })
    const aoEsconder = () => {
      if (document.visibilityState === 'hidden') gravar()
    }
    window.addEventListener('pagehide', gravar)
    document.addEventListener('visibilitychange', aoEsconder)
    return () => {
      assinatura.unsubscribe()
      window.removeEventListener('pagehide', gravar)
      document.removeEventListener('visibilitychange', aoEsconder)
      gravar()
    }
  }, [form, gravar])

  /** Conteúdo que veio pronto (áudio, IA) ainda não conta como "mexeu": guarda na hora. */
  const guardarAgora = useCallback(() => {
    const { userId: id, ...resto } = alvo.current
    if (id) salvarRascunho({ userId: id, ...resto }, form.getValues())
  }, [form])

  /** Depois de salvar de verdade ou de descartar: o rascunho deixa de existir. */
  const limpar = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    pendente.current = false
    const { userId: id, ...resto } = alvo.current
    if (id) apagarRascunho({ userId: id, ...resto })
    setRestaurado(null)
  }, [])

  return { restaurado, limpar, guardarAgora }
}

type OpcoesValores<T> = {
  patientId: string
  tipo: RascunhoTipo
  registroId: string
  /** Memorizado: cada valor novo reinicia a espera para gravar. */
  valores: T
  /** true enquanto há o que guardar (formulário aberto e alterado). */
  ativo: boolean
}

/** O mesmo rascunho automático de useRascunhoForm, para telas que guardam o estado sem react-hook-form. */
export function useRascunhoValores<T>({ patientId, tipo, registroId, valores, ativo }: OpcoesValores<T>) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const atual = useRef({ userId, patientId, tipo, registroId, valores, ativo })
  const timer = useRef<number | null>(null)

  useEffect(() => {
    atual.current = { userId, patientId, tipo, registroId, valores, ativo }
  }, [userId, patientId, tipo, registroId, valores, ativo])

  const referencia = useCallback(() => {
    const { userId: id, patientId: paciente, tipo: tipoAtual, registroId: registro } = atual.current
    return id ? { userId: id, patientId: paciente, tipo: tipoAtual, registroId: registro } : null
  }, [])

  const cancelarEspera = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }, [])

  const gravar = useCallback(() => {
    cancelarEspera()
    const ref = referencia()
    if (ref && atual.current.ativo) salvarRascunho(ref, atual.current.valores)
  }, [cancelarEspera, referencia])

  useEffect(() => {
    if (!ativo) return
    timer.current = window.setTimeout(gravar, ESPERA_MS)
    return cancelarEspera
  }, [ativo, valores, gravar, cancelarEspera])

  // F5, fechar a aba ou trocar de aplicativo antes da espera terminar.
  useEffect(() => {
    const aoEsconder = () => {
      if (document.visibilityState === 'hidden') gravar()
    }
    window.addEventListener('pagehide', gravar)
    document.addEventListener('visibilitychange', aoEsconder)
    return () => {
      window.removeEventListener('pagehide', gravar)
      document.removeEventListener('visibilitychange', aoEsconder)
    }
  }, [gravar])

  const carregar = useCallback(() => {
    const ref = referencia()
    return ref ? carregarRascunho<T>(ref) : null
  }, [referencia])

  /** Depois de salvar de verdade ou de descartar: o rascunho deixa de existir. */
  const limpar = useCallback(() => {
    cancelarEspera()
    const ref = referencia()
    if (ref) apagarRascunho(ref)
  }, [cancelarEspera, referencia])

  /** Ao fechar sem salvar: guarda o que mudou; se voltou ao original, não sobra rascunho. */
  const guardar = useCallback(() => {
    if (atual.current.ativo) gravar()
    else limpar()
  }, [gravar, limpar])

  return { carregar, guardar, limpar }
}

/** Rascunhos deste paciente, atualizados quando um formulário grava ou apaga. */
export function useRascunhosPaciente(patientId: string, tipo: RascunhoTipo): RascunhoResumo[] {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [lista, setLista] = useState<RascunhoResumo[]>([])

  useEffect(() => {
    const atualizar = () => setLista(userId ? rascunhosDoPaciente({ userId, patientId, tipo }) : [])
    atualizar()
    window.addEventListener(RASCUNHO_EVENTO, atualizar)
    return () => window.removeEventListener(RASCUNHO_EVENTO, atualizar)
  }, [userId, patientId, tipo])

  return lista
}
