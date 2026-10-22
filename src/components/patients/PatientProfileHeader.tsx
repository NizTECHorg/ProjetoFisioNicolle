import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
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
  /** Lápis sempre visível ao lado do nome (checklist 8.1/8.2); sem ele, não aparece. */
  onEditName?: () => void
  /** Ação no topo à direita (ex.: Nova avaliação no Resumo). */
  topRightAction?: ReactNode
  /** Abre o diálogo de exclusão; só aparece com canWrite. */
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
  onEditName,
  topRightAction,
}: PatientProfileHeaderProps) {
  return (
    <>
      {/* Celular e tablet: mais perto do cabeçalho do app; desktop (sem o cabeçalho) fica no lugar. */}
      <div className="dash-in -mt-3 lg:mt-0">
        <Link
          to="/pacientes"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-forest"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
      </div>

      {/*
        Grid fixo: avatar (3.5rem / 4rem, igual ao avatar) | coluna de texto.
        A coluna do avatar não pode ser auto: o botão da direita (só em algumas abas)
        mudaria a largura calculada e as abas andariam para os lados.
        O conteúdo da página usa a mesma coluna (col-start-2),
        então a borda esquerda de tabs e cards fica alinhada.
      */}
      <div
        className="dash-in mt-2.5 lg:mt-4 grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-x-4"
        style={{ animationDelay: '60ms' }}
      >
        <div className="group col-span-2 grid grid-cols-subgrid">
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
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0 sm:gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{name}</h1>
                {canWrite && onEditName ? (
                  <button
                    type="button"
                    aria-label="Editar nome e dados iniciais"
                    title="Editar nome e dados iniciais"
                    onClick={onEditName}
                    className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-muted transition hover:bg-accent-soft hover:text-forest"
                  >
                    <Pencil size={18} />
                  </button>
                ) : null}
                {canWrite ? (
                  <PatientPhotoRemoveButton patientId={patientId} name={name} photoUrl={photoUrl} />
                ) : null}
              </div>
              {topRightAction ? (
                <div className="shrink-0 self-start">{topRightAction}</div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Mobile: telefone + status ocupam a largura toda; sm+: alinhados à coluna do nome. */}
        <div className="col-span-2 mt-2 flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1 sm:col-span-1 sm:col-start-2 sm:mt-2">
          {meta ? <p className="text-sm text-muted">{meta}</p> : null}
          {canWrite ? (
            <PatientStatusToggle patientId={patientId} status={status} />
          ) : (
            <span className="text-xs text-muted">{statusLabels[status]}</span>
          )}
        </div>

        <nav
          className="col-span-2 mt-3 flex min-w-0 items-end gap-5 sm:col-span-1 sm:col-start-2 overflow-x-auto overflow-y-hidden overscroll-x-contain border-b border-line sm:gap-6 [-ms-overflow-style:auto] [scrollbar-width:thin]"
          aria-label="Sessões do paciente"
          role="tablist"
        >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'resumo'}
              className={[
                '-mb-px inline-flex min-h-11 shrink-0 items-center border-b-[3px] text-sm font-medium transition-colors',
                activeTab === 'resumo'
                  ? 'border-[#1e3a8a] font-semibold text-[#1e3a8a]'
                  : 'border-transparent text-muted hover:text-ink',
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
                '-mb-px inline-flex min-h-11 shrink-0 items-center border-b-[3px] text-sm font-medium transition-colors',
                activeTab === 'cadastro'
                  ? 'border-[#1e3a8a] font-semibold text-[#1e3a8a]'
                  : 'border-transparent text-muted hover:text-ink',
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
                '-mb-px inline-flex min-h-11 shrink-0 items-center border-b-[3px] text-sm font-medium transition-colors',
                activeTab === 'secoes'
                  ? 'border-[#1e3a8a] font-semibold text-[#1e3a8a]'
                  : 'border-transparent text-muted hover:text-ink',
              ].join(' ')}
              onClick={() => onTabChange('secoes')}
            >
              Sessões / Evoluções
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'avaliacoes'}
              className={[
                '-mb-px inline-flex min-h-11 shrink-0 items-center border-b-[3px] text-sm font-medium transition-colors',
                activeTab === 'avaliacoes'
                  ? 'border-[#1e3a8a] font-semibold text-[#1e3a8a]'
                  : 'border-transparent text-muted hover:text-ink',
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
                '-mb-px inline-flex min-h-11 shrink-0 items-center border-b-[3px] text-sm font-medium transition-colors',
                activeTab === 'resumo-ia' || activeTab === 'avaliacao'
                  ? 'border-[#1e3a8a] font-semibold text-[#1e3a8a]'
                  : 'border-transparent text-muted hover:text-ink',
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
                '-mb-px inline-flex min-h-11 shrink-0 items-center border-b-[3px] text-sm font-medium transition-colors',
                activeTab === 'imagens'
                  ? 'border-[#1e3a8a] font-semibold text-[#1e3a8a]'
                  : 'border-transparent text-muted hover:text-ink',
              ].join(' ')}
              onClick={() => onTabChange('imagens')}
            >
              Arquivos
            </button>
          </nav>
      </div>
    </>
  )
}
