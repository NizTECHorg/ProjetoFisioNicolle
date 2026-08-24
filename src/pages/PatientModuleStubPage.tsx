import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const MODULE_TITLES: Record<string, string> = {
  avaliacoes: 'Avaliações',
  reavaliacoes: 'Reavaliações',
  exercicios: 'Exercícios',
  documentos: 'Documentos',
  financeiro: 'Financeiro',
}

export function PatientModuleStubPage() {
  const { id, module } = useParams()

  if (module === 'evolucoes' && id) {
    return <Navigate to={`/pacientes/${id}?aba=evolucoes`} replace />
  }

  const title = (module && MODULE_TITLES[module]) || 'Módulo'

  return (
    <section className="mx-auto max-w-3xl">
      <div className="dash-in">
        <Link
          to={id ? `/pacientes/${id}` : '/pacientes'}
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-forest"
        >
          <ArrowLeft size={16} />
          Voltar ao resumo
        </Link>
      </div>

      <article
        className="dash-in mt-8 rounded-2xl border border-line bg-surface px-6 py-12 text-center"
        style={{ animationDelay: '60ms' }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{title}</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Em breve</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          Este módulo ainda não está disponível. O resumo do paciente e o cadastro já podem ser usados
          normalmente.
        </p>
      </article>
    </section>
  )
}
