import { test } from 'node:test'
import { deepEqual, equal } from 'node:assert/strict'
import { buscarContatos, validarContato } from './contatosWhatsapp.ts'

test('validar: exige nome e número do Brasil, e guarda com 55', () => {
  deepEqual(validarContato(' Ana ', '(11) 91234-5678'), { ok: true, nome: 'Ana', digits: '5511912345678' })
  equal(validarContato('', '11912345678').ok, false)
  equal(validarContato('Ana', '123').ok, false)
})

test('busca por nome sem acento e por parte do número', () => {
  const lista = [
    { nome: 'João Mãe', digits: '5511912345678' },
    { nome: 'Maria', digits: '5541999990000' },
  ]
  deepEqual(buscarContatos(lista, 'joao').map((c) => c.nome), ['João Mãe'])
  deepEqual(buscarContatos(lista, 'MAE').map((c) => c.nome), ['João Mãe'])
  deepEqual(buscarContatos(lista, '41 9999').map((c) => c.nome), ['Maria'])
  equal(buscarContatos(lista, '  ').length, 2)
})
