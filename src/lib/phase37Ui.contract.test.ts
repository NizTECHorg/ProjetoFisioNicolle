import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

test('REQ-48: rota /termos usa TermsPage via lazy', () => {
  const routes = read('../routes/index.tsx')
  ok(routes.includes("import('@/pages/TermsPage')"))
  ok(routes.includes('path="/termos" element={<TermsPage />}'))
  ok(routes.includes('path="/testes-especiais" element={<UnderConstructionPage />}'))
})

test('REQ-48: ficha do paciente tem a área Arquivos na aba imagens', () => {
  const page = read('../pages/PatientPage.tsx')
  ok(page.includes("label: 'Arquivos'"))
  ok(page.includes("tab: 'imagens'"))
})

test('REQ-48: ordem dos elementos no cartão do termo', () => {
  const card = read('../components/terms/TermCard.tsx')
  const order = [
    'Editar',
    'Assine aqui com o dedo ou mouse',
    'Assinatura do paciente ou responsável legal',
    'Copiar Texto',
    'Exportar PDF',
    'Salvar na Nuvem',
  ].map((s) => card.indexOf(s))
  ok(order.every((i) => i >= 0))
  for (let i = 1; i < order.length; i++) ok((order[i] ?? -1) > (order[i - 1] ?? 0), `ordem quebrada no item ${i}`)
})

test('REQ-48: arquivos novos não têm console.', () => {
  const files = [
    '../pages/TermsPage.tsx',
    '../components/terms/TermCard.tsx',
    '../components/terms/TermsHistory.tsx',
    '../components/terms/TermList.tsx',
    '../components/patients/PatientPicker.tsx',
    '../components/patients/PatientTermsPanel.tsx',
    '../components/patients/PatientFilesPanel.tsx',
    '../services/patientTerms.service.ts',
    '../services/termsPdf.service.ts',
    '../hooks/usePatientTerms.ts',
    './cpf.ts',
    './consentTerms.ts',
  ]
  for (const f of files) ok(!read(f).includes('console.'), `${f} contém console.`)
})

test('REQ-48: resumo IA não recebe CPF nem termos', () => {
  const fn = read('../../supabase/functions/patient-ai-summary/index.ts').toLowerCase()
  ok(!fn.includes('cpf'))
  ok(!fn.includes('patient_terms'))
})

test('REQ-48: os 4 termos na ordem esperada', () => {
  const src = read('./consentTerms.ts')
  const idx = ['Consentimento', 'Liberação', 'Uso de Imagem', 'Uso de Imagem em Redes Sociais'].map((t) =>
    src.indexOf(`category: '${t}'`),
  )
  ok(idx.every((i) => i >= 0))
  for (let i = 1; i < idx.length; i++) ok((idx[i] ?? -1) > (idx[i - 1] ?? 0))
})

test('REQ-48: página Termos contém os rótulos da especificação', () => {
  const page = read('../pages/TermsPage.tsx')
  for (const t of [
    'Quem assina',
    'Assinado por responsável legal',
    'Salvar CREFITO no meu perfil',
    'Será salvo no cadastro do paciente e usado em todos os termos.',
    'CPF salvo no cadastro do paciente.',
  ])
    ok(page.includes(t), t)
  ok(!page.includes('guardianCpf') || !/patients?\.(update|mutate)[^)]*guardian/.test(page))
  const hist = read('../components/terms/TermsHistory.tsx')
  ok(hist.includes('Termos salvos na nuvem'))
  ok(hist.includes('Nenhum termo salvo ainda.'))
})
