import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

test('REQ-57: editor do relatorio', () => {
  const src = read('../components/patients/PatientReportEditor.tsx')
  for (const token of [
    'sessaoSelecionavelRelatorio',
    'contarLinhasRelatorio',
    'ajustarAoLimite',
    'numerosNaoConfirmados',
    'RELATORIO_MAX_SESSOES',
    'RELATORIO_LINHAS_MAX',
    'createRelatorioMeasurer',
    'useGenerateReportText',
    'fullName',
    'crefito',
  ]) {
    ok(src.includes(token), `editor deve conter ${token}`)
  }
  for (const token of ['dangerouslySetInnerHTML', 'pdf-lib', 'sanitizeText']) {
    ok(!src.includes(token), `editor nao deve conter ${token}`)
  }
})

test('REQ-57: painel do relatorio', () => {
  const src = read('../components/patients/PatientReportsPanel.tsx')
  for (const token of [
    'canWrite = false',
    'usePatient(patientId)',
    'buildRelatorioPdf',
    'downloadBlob',
    'SendEmailDialog',
    'SendWhatsAppDialog',
    'signPatientDocumentUrl',
    "'relatorio'",
    "source: 'relatorio'",
    'PATIENT_REPORT_COPY.whatsappMessage',
    'useEnsurePatientReportPdf',
    'tone="danger"',
    'PatientReportEditor',
  ]) {
    ok(src.includes(token), `painel deve conter ${token}`)
  }
  ok(!src.includes('dangerouslySetInnerHTML'))
})

test('REQ-57: aba Relatorio na ficha', () => {
  const header = read('../components/patients/PatientProfileHeader.tsx')
  for (const token of ["| 'relatorio'", "onTabChange('relatorio')", 'Relatório']) {
    ok(header.includes(token), `header deve conter ${token}`)
  }
  const page = read('../pages/PatientPage.tsx')
  for (const token of [
    "aba === 'relatorio'",
    "next === 'relatorio'",
    "{ aba: 'relatorio' }",
    "tab === 'relatorio'",
    'PatientReportsPanel',
  ]) {
    ok(page.includes(token), `pagina deve conter ${token}`)
  }
})

test('REQ-57: editor solta geração atrasada e conta Local como alteração; e-mail tem trava', () => {
  const editor = readFileSync(new URL('../components/patients/PatientReportEditor.tsx', import.meta.url), 'utf8')
  const panel = readFileSync(new URL('../components/patients/PatientReportsPanel.tsx', import.meta.url), 'utf8')
  ok(editor.includes('generate.reset()'))
  ok(editor.includes('placeValue !== report.place'))
  ok(panel.includes('if (!report || sending) return'))
})

test('REQ-57: relatório usa o rascunho automático, inclusive no F5', () => {
  const editor = readFileSync(new URL('../components/patients/PatientReportEditor.tsx', import.meta.url), 'utf8')
  const panel = readFileSync(new URL('../components/patients/PatientReportsPanel.tsx', import.meta.url), 'utf8')
  const hook = readFileSync(new URL('../hooks/useRascunhoForm.ts', import.meta.url), 'utf8')
  const valores = hook.slice(hook.indexOf('export function useRascunhoValores'))
  ok(valores.includes("addEventListener('pagehide', gravar)"))
  ok(editor.includes("tipo: 'relatorio'"))
  ok(editor.includes('sessionIds: [...selectedIds]'))
  ok(editor.includes('ativo: open && dirty'))
  ok(editor.includes('limparRascunho()'))
  ok(!editor.includes('ConfirmDialog'))
  ok(panel.includes("useRascunhosPaciente(patientId, 'relatorio')"))
})

test('REQ-57: criar relatório alterna entre modelo e sessões; modelo não usa IA nem limite de 15 linhas', () => {
  const editor = readFileSync(new URL('../components/patients/PatientReportEditor.tsx', import.meta.url), 'utf8')
  ok(editor.includes('aria-pressed={modo === valor}'))
  ok(editor.includes("useState<ModoRelatorio>('sessoes')"))
  ok(editor.indexOf("['sessoes', PATIENT_REPORT_COPY.modeSessions]") < editor.indexOf("['modelo', PATIENT_REPORT_COPY.modeModel]"))
  ok(editor.includes("sessionIds: modo === 'modelo' ? [] : marcadas.map((s) => s.id)"))
  ok(editor.includes('report.sessionIds.length === 0'))
  ok(editor.includes('!semLimiteDeLinhas && linhas > RELATORIO_LINHAS_MAX'))
})

test('contatos do WhatsApp: salvos na conta, sem importação do aparelho', () => {
  const dialog = readFileSync(new URL('../components/patients/SendWhatsAppDialog.tsx', import.meta.url), 'utf8')
  const contatos = readFileSync(new URL('../components/patients/ContatosWhatsapp.tsx', import.meta.url), 'utf8')
  const service = readFileSync(new URL('../services/whatsappContacts.service.ts', import.meta.url), 'utf8')
  ok(dialog.includes('<ContatosWhatsapp'))
  ok(dialog.includes('Adicionar outro número'))
  ok(service.includes("from('whatsapp_contacts')"))
  ok(!contatos.includes('.vcf'))
  ok(!contatos.includes('navigator'))
})

test('Textarea só encolhe com texto novo: re-render não joga a rolagem para o topo', () => {
  const textarea = readFileSync(new URL('../components/ui/Textarea.tsx', import.meta.url), 'utf8')
  ok(textarea.includes('el.value === ultimoTexto.current && el.scrollHeight <= el.offsetHeight'))
})

test('exportar saiu do Resumo IA e entrou nas abas Avaliações e Sessões', () => {
  const ler = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')
  const resumo = ler('../components/patients/PatientResumoIaPanel.tsx')
  const composer = ler('../components/patients/PatientAiComposer.tsx')
  ok(!resumo.includes('PatientAiReportsList'))
  ok(!composer.includes('buildPatientAiReportPdf'))
  ok(!composer.includes('modePdf'))
  const avaliacao = ler('../components/patients/PatientEvaluationPanel.tsx')
  const sessoes = ler('../components/patients/PatientEvolutionsPanel.tsx')
  ok(avaliacao.includes('<ExportarToggle') && avaliacao.includes('scope="avaliacao"'))
  ok(sessoes.includes('<ExportarToggle') && sessoes.includes('scope="evolucao"'))
  const exportar = ler('../components/patients/PatientPdfExport.tsx')
  ok(exportar.includes("['avaliacao', 'geral']"))
  ok(exportar.includes("['evolucao', 'sessao']"))
})

test('seletor Exportar: mesma largura nas duas abas e fundo que desliza', () => {
  const toggle = readFileSync(new URL('../components/patients/ExportarToggle.tsx', import.meta.url), 'utf8')
  ok(toggle.includes('grid-cols-[minmax(0,1fr)_7rem]'))
  ok(toggle.includes('sm:grid-cols-[auto_7rem]'))
  ok(toggle.includes('translateX('))
  ok(toggle.includes('motion-reduce:transition-none'))
})

test('contatos de e-mail: entram no envio, respeitam o limite e Enter não dispara o envio', () => {
  const dialog = readFileSync(new URL('../components/patients/SendEmailDialog.tsx', import.meta.url), 'utf8')
  const contatos = readFileSync(new URL('../components/patients/ContatosEmail.tsx', import.meta.url), 'utf8')
  ok(dialog.includes('<ContatosEmail'))
  ok(dialog.includes('extraEmails: destinatarios'))
  ok(dialog.includes('extras.length + salvos.length >= EXTRA_MAX'))
  ok(contatos.includes("event.key !== 'Enter'"))
  ok(contatos.includes('disabled={lotado && !marcado}'))
})
