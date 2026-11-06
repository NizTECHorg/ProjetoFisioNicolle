import { test } from 'node:test'
import { deepEqual, equal } from 'node:assert/strict'
import { buscarContatosEmail, juntarDestinatarios, validarContatoEmail } from './contatosEmail.ts'

test('validar: exige nome e e-mail válido, e guarda em minúsculas', () => {
  deepEqual(validarContatoEmail(' Dra. Ana ', ' Ana@Clinica.COM '), { ok: true, nome: 'Dra. Ana', email: 'ana@clinica.com' })
  equal(validarContatoEmail('', 'ana@clinica.com').ok, false)
  equal(validarContatoEmail('Ana', 'ana@clinica').ok, false)
})

test('busca por nome sem acento e por parte do e-mail', () => {
  const lista = [
    { id: '1', nome: 'João Médico', email: 'joao@clinica.com' },
    { id: '2', nome: 'Maria', email: 'maria@hospital.org' },
  ]
  deepEqual(buscarContatosEmail(lista, 'medico').map((c) => c.id), ['1'])
  deepEqual(buscarContatosEmail(lista, 'hospital').map((c) => c.id), ['2'])
  equal(buscarContatosEmail(lista, ' ').length, 2)
})

test('destinatários: sem repetir e sem duplicar o paciente', () => {
  deepEqual(
    juntarDestinatarios([' Ana@x.com ', ''], ['ana@x.com', 'bia@x.com', 'pac@x.com'], 'PAC@x.com'),
    ['Ana@x.com', 'bia@x.com'],
  )
  deepEqual(juntarDestinatarios([], ['pac@x.com'], null), ['pac@x.com'])
})
