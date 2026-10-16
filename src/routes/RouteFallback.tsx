import { Component, type ReactNode } from 'react'

export function RouteFallback() {
  return (
    <div
      role="status"
      className="flex min-h-dvh items-center justify-center bg-canvas"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
      <span className="sr-only">Carregando…</span>
    </div>
  )
}

export class ChunkErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas px-6 text-center text-ink">
        <p className="max-w-sm text-sm leading-6">
          Não foi possível carregar a página. Verifique sua conexão e recarregue, ou acesse{' '}
          {/* Navegação completa para rebaixar os chunks */}
          <a href="/login" className="font-semibold text-forest underline">
            Entrar
          </a>
          .
        </p>
      </div>
    )
  }
}
