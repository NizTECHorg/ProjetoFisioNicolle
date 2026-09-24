import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PatientAvatar } from '@/components/ui/PatientAvatar'
import {
  PatientPhotoControl,
  PatientPhotoRemoveButton,
} from '@/components/patients/PatientPhotoControl'
import { PatientStatusToggle } from '@/components/patients/PatientStatusToggle'
import { statusLabels, type PatientStatus } from '@/types/patient'

export type PatientTab =
  | 'resumo'
  | 'cadastro'
  | 'secoes'
  | 'avaliacoes'
  | 'resumo-ia'
  | 'avaliacao'
  | 'imagens'

type PatientProfileHeaderProps = {
  patientId: string
  name: string
  initials: string
  photoTone: string
  photoUrl: string | null
  canWrite: boolean
  status: PatientStatus
  meta: string
  activeTab: PatientTab
  onTabChange: (tab: PatientTab) => void
  identityAction?: ReactNode
  /** Ação no topo à direita (ex.: Nova avaliação no Resumo). */
  topRightAction?: ReactNode
}

const avatarClassName = '!h-14 !w-14 !text-base sm:!h-16 sm:!w-16 sm:!text-lg'

export function PatientProfileHeader({
  patientId,
  name,
  initials,
  photoTone,
  photoUrl,
  canWrite,
  status,
  meta,
  activeTab,
  onTabChange,
  identityAction,
  topRightAction,
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
        className="dash-in mt-5 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 sm:gap-x-4"
        style={{ animationDelay: '60ms' }}
      >
        <div className="group col-span-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 sm:gap-x-4">
          {canWrite ? (
            <PatientPhotoControl
              patientId={patientId}
              name={name}
              tone={photoTone}
              initials={initials}
              photoUrl={photoUrl}
              size="lg"
              className={avatarClassName}
              showRemove={false}
            />
          ) : (
            <PatientAvatar
              name={name}
              tone={photoTone}
              initials={initials}
              photoUrl={photoUrl}
              size="lg"
              className={avatarClassName}
            />
          )}

          <div className="min-w-0">
            <div className="flex min-h-11 items-start justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{name}</h1>
                {canWrite ? (
                  <span className="opacity-0 transition-opacity pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100">
                    <PatientPhotoRemoveButton patientId={patientId} name={name} photoUrl={photoUrl} />
                  </span>
                ) : null}
              </div>
              {topRightAction ?? identityAction ? (
                <div className="shrink-0 self-start">{topRightAction ?? identityAction}</div>
              ) : null}
            </div>

            <div className="mt-2 flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1">
              {meta ? <p className="text-sm text-muted">{meta}</p> : null}
              {canWrite ? (
                <PatientStatusToggle patientId={patientId} status={status} />
              ) : (
                <span className="text-xs text-muted">{statusLabels[status]}</span>
              )}
            </div>
          </div>
        </div>

        <nav
          className="col-start-2 mt-4 flex min-w-0 items-end gap-5 overflow-x-auto overflow-y-hidden overscroll-x-contain border-b border-line sm:gap-6 [-ms-overflow-style:auto] [scrollbar-width:thin]"
          aria-label="Sessões do paciente"
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
              aria-selected={activeTab === 'secoes'}
              className={[
                '-mb-px inline-flex min-h-11 shrink-0 items-center border-b-2 text-sm font-medium transition-colors',
                activeTab === 'secoes'
                  ? 'border-forest text-forest'
                  : 'border-transparent text-muted hover:border-line hover:text-ink',
              ].join(' ')}
              onClick={() => onTabChange('secoes')}
            >
              Sessões
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'avaliacoes'}
              className={[
                '-mb-px inline-flex min-h-11 shrink-0 items-center border-b-2 text-sm font-medium transition-colors',
                activeTab === 'avaliacoes'
                  ? 'border-forest text-forest'
                  : 'border-transparent text-muted hover:border-line hover:text-ink',
              ].join(' ')}
              onClick={() => onTabChange('avaliacoes')}
            >
              Avaliações
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
    </>
  )
}
