// Aniversários dos pacientes na Agenda, a partir da data de nascimento do cadastro.
// Sem imports com alias: roda direto em node --test.

export type PacienteComNascimento = {
  id: string
  name: string
  photoTone?: string | null
  photoUrl?: string | null
  birthDateRaw?: string | null
}

export type Aniversario = {
  patientId: string
  name: string
  photoTone?: string | null
  photoUrl?: string | null
  /** Idade que completa nesse dia; null se o ano de nascimento não for confiável. */
  idade: number | null
}

function lerNascimento(raw: string | null | undefined) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw ?? '')
  if (!m) return null
  const ano = Number(m[1])
  const mes = Number(m[2])
  const dia = Number(m[3])
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null
  return { ano, mes, dia }
}

/** Nascido em 29/02: em ano não bissexto o aniversário aparece em 28/02. */
function diaDoAniversario(mes: number, dia: number, ano: number) {
  const bissexto = (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0
  if (mes === 2 && dia === 29 && !bissexto) return { mes: 2, dia: 28 }
  return { mes, dia }
}

/** Aniversariantes de uma data (dia/mês iguais ao nascimento). */
export function aniversariantesDoDia(pacientes: readonly PacienteComNascimento[], data: Date): Aniversario[] {
  const ano = data.getFullYear()
  const out: Aniversario[] = []
  for (const paciente of pacientes) {
    const nasc = lerNascimento(paciente.birthDateRaw)
    if (!nasc) continue
    const alvo = diaDoAniversario(nasc.mes, nasc.dia, ano)
    if (alvo.mes !== data.getMonth() + 1 || alvo.dia !== data.getDate()) continue
    const idade = ano - nasc.ano
    out.push({
      patientId: paciente.id,
      name: paciente.name,
      photoTone: paciente.photoTone,
      photoUrl: paciente.photoUrl,
      idade: idade > 0 && idade < 130 ? idade : null,
    })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

/** Mapa dia (toDateString) → aniversariantes, para pintar o calendário de um período. */
export function aniversariosNoPeriodo(
  pacientes: readonly PacienteComNascimento[],
  inicio: Date,
  dias: number,
): Map<string, Aniversario[]> {
  const mapa = new Map<string, Aniversario[]>()
  for (let i = 0; i < dias; i += 1) {
    const data = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i)
    const lista = aniversariantesDoDia(pacientes, data)
    if (lista.length > 0) mapa.set(data.toDateString(), lista)
  }
  return mapa
}

export function rotuloAniversario(item: Aniversario): string {
  return item.idade ? `${item.name} faz ${item.idade} anos` : `Aniversário de ${item.name}`
}
