// Contatos salvos para enviar PDF pelo WhatsApp. Sem imports com alias: roda em node --test.
import { resolveWhatsAppDigits } from './patientContact.ts'

export type ContatoWhatsapp = { id: string; nome: string; digits: string }

export const CONTATO_NOME_MAX = 120

export type ContatoValidado = { ok: true; nome: string; digits: string } | { ok: false; erro: string }

export function validarContato(nome: string, numero: string): ContatoValidado {
  const limpo = nome.trim().slice(0, CONTATO_NOME_MAX)
  if (!limpo) return { ok: false, erro: 'Escreva o nome da pessoa.' }
  const resolvido = resolveWhatsAppDigits(numero)
  if (!resolvido.ok) return { ok: false, erro: 'Use DDD + número, ex.: 11 91234-5678.' }
  return { ok: true, nome: limpo, digits: resolvido.digits }
}

function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/** Busca por nome (sem ligar para acento) ou por parte do número. */
export function buscarContatos<T extends { nome: string; digits: string }>(contatos: T[], termo: string): T[] {
  const busca = semAcento(termo.trim())
  if (!busca) return contatos
  const digitos = busca.replace(/\D/g, '')
  return contatos.filter(
    (c) => semAcento(c.nome).includes(busca) || (digitos.length >= 3 && c.digits.includes(digitos)),
  )
}
