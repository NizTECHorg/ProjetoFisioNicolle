import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PatientAvatar } from '@/components/ui/PatientAvatar'
import { statusLabels, type PatientStatus } from '@/types/patient'

export type PatientTab = 'resumo' | 'cadastro' | 'evolucoes' | 'resumo-ia' | 'avaliacao' | 'imagens'

type PatientProfileHeaderProps = {
  name: string
  initials: string
  photoTone: string
  status: PatientStatus
  meta: string
  activeTab: PatientTab
  onTabChange: (tab: PatientTab) => void
  identityAction?: ReactNode
}

export function PatientProfileHeader({
  name,
  initials,
  photoTone,
  status,
  meta,
  activeTab,
  onTabChange,
  identityAction,
}: PatientProfileHeaderProps) {
  return (
    <>
      <div className="dash-in">
        <Link
          to="/pacientes"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-forest"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
      </div>

      {/*
        Grid fixo: avatar | coluna de texto.
        O conteúdo da página usa a mesma coluna (col-start-2),
        então a borda esquerda de tabs e cards fica alinhada.
      */}
      <div
        className="dash-in group mt-5 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 sm:gap-x-4"
        style={{ animationDelay: '60ms' }}
      >
        <PatientAvatar
          name={name}
          tone={photoTone}
          initials={initials}
          size="lg"
          className="!h-14 !w-14 !text-base sm:!h-16 sm:!w-16 sm:!text-lg"
        />

        <div className="min-w-0">
          <div className="relative flex min-h-11 flex-wrap items-center gap-2 pr-12 sm:gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{name}</h1>
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-forest">
              {statusLabels[status]}
            </span>
            {/* Fora do fluxo — o nome não muda de lugar entre abas */}
            {identityAction ? (
              <span className="absolute right-0 top-0 inline-flex min-h-11 min-w-11 items-center justify-center">
                {identityAction}
              </span>
            ) : null}
          </div>

          <p className="mt-2 min-h-5 break-words text-sm text-muted">{meta}</p>

          <nav
            className="mt-4 flex min-w-0 items-end gap-5 overflow-x-auto overflow-y-hidden overscroll-x-contain border-b border-line sm:gap-6 [-ms-overflow-style:auto] [scrollbar-width:thin]"
            aria-label="Seções do paciente"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'resumo'}
              className={[
                '-mb-px inline-flex min-h-11 shrink-0 items-center border-b-2 text-sm font-medium transition-colors',
                activeTab === 'resumo'
                  ? 'border-forest text-forest'
                  : 'border-transparent text-muted hover:border-line hover:text-ink',
              ].join(' ')}
              onClick={() => onTabChange('resumo')}
            >
              Resumo
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'cadastro'}
              className={[
                '-mb-px inline-flex min-h-11 shrink-0 items-center border-b-2 text-sm font-medium transition-colors',
                activeTab === 'cadastro'
                  ? 'border-forest text-forest'
                  : 'border-transparent text-muted hover:border-line hover:text-ink',
              ].join(' ')}
              onClick={() => onTabChange('cadastro')}
            >
              Dados cadastrais
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'evolucoes'}
              className={[
                '-mb-px inline-flex min-h-11 shrink-0 items-center border-b-2 text-sm font-medium transition-colors',
                activeTab === 'evolucoes'
                  ? 'border-forest text-forest'
                  : 'border-transparent text-muted hover:border-line hover:text-ink',
              ].join(' ')}
              onClick={() => onTabChange('evolucoes')}
            >
              Evoluções
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'resumo-ia' || activeTab === 'avaliacao'}
              className={[
                '-mb-px inline-flex min-h-11 shrink-0 items-center border-b-2 text-sm font-medium transition-colors',
                activeTab === 'resumo-ia' || activeTab === 'avaliacao'
                  ? 'border-forest text-forest'
                  : 'border-transparent text-muted hover:border-line hover:text-ink',
              ].join(' ')}
              onClick={() => onTabChange('resumo-ia')}
            >
              Resumo IA
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'imagens'}
              className={[
                '-mb-px inline-flex min-h-11 shrink-0 items-center border-b-2 text-sm font-medium transition-colors',
                activeTab === 'imagens'
                  ? 'border-forest text-forest'
                  : 'border-transparent text-muted hover:border-line hover:text-ink',
              ].join(' ')}
              onClick={() => onTabChange('imagens')}
            >
              Imagens
            </button>
          </nav>
        </div>
      </div>
    </>
  )
}
