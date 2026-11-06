// Contatos salvos para enviar PDF por e-mail. Sem imports com alias: roda em node --test.
export type ContatoEmail = { id: string; nome: string; email: string }

export const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const CONTATO_EMAIL_NOME_MAX = 120
export const CONTATO_EMAIL_MAX = 254

export type ContatoEmailValidado = { ok: true; nome: string; email: string } | { ok: false; erro: string }

export function validarContatoEmail(nome: string, email: string): ContatoEmailValidado {
  const limpo = nome.trim().slice(0, CONTATO_EMAIL_NOME_MAX)
  if (!limpo) return { ok: false, erro: 'Escreva o nome da pessoa.' }
  const endereco = email.trim().toLowerCase()
  if (endereco.length > CONTATO_EMAIL_MAX || !EMAIL_OK.test(endereco)) {
    return { ok: false, erro: 'Confira o e-mail, ex.: medico@clinica.com.' }
  }
  return { ok: true, nome: limpo, email: endereco }
}

function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/** Busca por nome (sem ligar para acento) ou por parte do e-mail. */
export function buscarContatosEmail(contatos: ContatoEmail[], termo: string): ContatoEmail[] {
  const busca = semAcento(termo.trim())
  if (!busca) return contatos
  return contatos.filter((c) => semAcento(c.nome).includes(busca) || c.email.includes(busca))
}

/** Destinatários extras sem repetir, e sem o e-mail do paciente quando ele já recebe. */
export function juntarDestinatarios(
  avulsos: string[],
  salvos: string[],
  emailDoPaciente: string | null,
): string[] {
  const paciente = emailDoPaciente?.trim().toLowerCase() ?? null
  const vistos = new Set<string>()
  const lista: string[] = []
  for (const item of [...avulsos, ...salvos]) {
    const chave = item.trim().toLowerCase()
    if (!chave || chave === paciente || vistos.has(chave)) continue
    vistos.add(chave)
    lista.push(item.trim())
  }
  return lista
}
