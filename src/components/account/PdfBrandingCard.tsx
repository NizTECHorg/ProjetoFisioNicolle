import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'
import { AlignCenter, AlignLeft, AlignRight, Building2, ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  PDF_BRAND_DEFAULT_COLOR,
  PDF_BRAND_NAME_MAX,
  PDF_BRAND_PRESETS,
  PDF_LOGO_SIZE_DEFAULT,
  PDF_LOGO_SIZE_MAX,
  PDF_LOGO_SIZE_MIN,
  normalizarCor,
  type PdfLogoAlign,
} from '@/lib/pdfBrand'
import { getOwnBranding, saveBranding, validarLogo, type PdfBranding } from '@/services/pdfBranding.service'
import { toast } from '@/stores/toast.store'
import type { AccountType } from '@/types/account'

type Props = { accountType: AccountType | null | undefined }

/** Medidas da página A4 em pontos, as mesmas do gerador de PDF. */
const A4_W = 595.28
const A4_H = 841.89
const MARGEM_PDF = 48

const ALINHAMENTOS: ReadonlyArray<{ value: PdfLogoAlign; label: string; Icon: typeof AlignLeft }> = [
  { value: 'left', label: 'Esquerda', Icon: AlignLeft },
  { value: 'center', label: 'Centro', Icon: AlignCenter },
  { value: 'right', label: 'Direita', Icon: AlignRight },
]

/**
 * Prévia em escala da 1ª página da avaliação: mesma página A4, margens e altura da logo (em pt)
 * que o PDF usa, reduzida para caber no cartão. O que se vê aqui é o que sai no PDF.
 */
export function PdfPagePreview({
  logoUrl,
  nome,
  cor,
  tamanho,
  align,
}: {
  logoUrl: string | null
  nome: string
  cor: string
  tamanho: number
  align: PdfLogoAlign
}) {
  const caixaRef = useRef<HTMLDivElement>(null)
  const [escala, setEscala] = useState(0.5)

  useEffect(() => {
    const caixa = caixaRef.current
    if (!caixa) return
    const medir = () => setEscala(caixa.clientWidth / A4_W)
    medir()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(medir)
    observer.observe(caixa)
    return () => observer.disconnect()
  }, [])

  const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
  return (
    <div ref={caixaRef} className="relative w-full overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-line" style={{ aspectRatio: `${A4_W} / ${A4_H}` }}>
      <div
        className="absolute left-0 top-0 origin-top-left font-sans"
        style={{ width: A4_W, height: A4_H, transform: `scale(${escala})` }}
        aria-hidden
      >
        {/* Logo: começa a 48 pt do topo, com a altura escolhida e até 75% da largura útil. */}
        <div
          className="absolute flex items-center"
          style={{ top: MARGEM_PDF, left: MARGEM_PDF, right: MARGEM_PDF, height: tamanho, justifyContent: justify }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              style={{ maxHeight: tamanho, maxWidth: (A4_W - MARGEM_PDF * 2) * 0.75, objectFit: 'contain' }}
            />
          ) : (
            <span style={{ fontSize: Math.min(Math.max(18, tamanho * 0.45), tamanho * 0.8), fontWeight: 700, color: cor }}>
              {nome}
            </span>
          )}
        </div>
        <div className="absolute" style={{ top: MARGEM_PDF + tamanho + 16, left: MARGEM_PDF, right: MARGEM_PDF }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#102038', lineHeight: '24px' }}>Avaliação</p>
          <div style={{ width: 48, height: 4, background: cor, marginTop: 8 }} />
          <p style={{ fontSize: 16, color: '#102038', marginTop: 8 }}>Nome do paciente</p>
          <p style={{ fontSize: 14, color: '#5a6b80', marginTop: 6 }}>02/11/2026 · Fisioterapeuta</p>
          <div style={{ marginTop: 32 }}>
            {[100, 92, 96, 70, 0, 100, 88, 94, 60, 0, 100, 90, 85].map((largura, index) =>
              largura === 0 ? (
                <div key={index} style={{ height: 18 }} />
              ) : (
                <div key={index} style={{ width: `${largura}%`, height: 8, borderRadius: 4, background: '#e1e8f0', marginBottom: 10 }} />
              ),
            )}
          </div>
        </div>
        <div
          className="absolute flex justify-between"
          style={{ left: MARGEM_PDF, right: MARGEM_PDF, bottom: 28, borderTop: '0.5px solid #b8c9de', paddingTop: 6, fontSize: 9, color: '#5a6b80' }}
        >
          <span>{nome}</span>
          <span>1</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Minha empresa (conta empresa) / Meu escritório (autônomo): nome, logo e cor principal
 * que todos os PDFs exportados passam a usar. O fisioterapeuta de uma empresa usa a da empresa.
 */
export function PdfBrandingCard({ accountType }: Props) {
  const titulo = accountType === 'empresa' ? 'Minha empresa' : 'Meu escritório'
  const editavel = accountType === 'empresa' || accountType === 'autonomo'
  const idCor = useId()
  const inputLogo = useRef<HTMLInputElement>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [atual, setAtual] = useState<PdfBranding | null>(null)
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState(PDF_BRAND_DEFAULT_COLOR)
  const [corTexto, setCorTexto] = useState(PDF_BRAND_DEFAULT_COLOR)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [removerLogo, setRemoverLogo] = useState(false)
  const [tamanho, setTamanho] = useState(PDF_LOGO_SIZE_DEFAULT)
  const [alinhamento, setAlinhamento] = useState<PdfLogoAlign>('left')

  useEffect(() => {
    if (!editavel) return
    let ativo = true
    getOwnBranding()
      .then((dados) => {
        if (!ativo) return
        setAtual(dados)
        setNome(dados?.name ?? '')
        const c = normalizarCor(dados?.color) ?? PDF_BRAND_DEFAULT_COLOR
        setCor(c)
        setCorTexto(c)
        setTamanho(dados?.logoSize ?? PDF_LOGO_SIZE_DEFAULT)
        setAlinhamento(dados?.logoAlign ?? 'left')
      })
      .catch(() => undefined)
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
  }, [editavel])

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null)
      return
    }
    const url = URL.createObjectURL(logoFile)
    setLogoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [logoFile])

  if (!editavel) {
    return (
      <article className="rounded-2xl border border-line bg-surface p-4 text-ink md:p-6">
        <h2 className="text-xl font-semibold leading-[1.2]">Identidade dos PDFs</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Os PDFs que você exporta usam o nome, a logo e a cor que a sua empresa definiu em Minha empresa.
        </p>
      </article>
    )
  }

  const logoMostrada = removerLogo ? null : (logoPreview ?? atual?.logoUrl ?? null)
  const nomeMostrado = nome.trim() || 'Fluxo'

  function escolherLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const erro = validarLogo(file)
    if (erro) {
      toast(erro, 'error')
      return
    }
    setLogoFile(file)
    setRemoverLogo(false)
  }

  async function salvar() {
    setSalvando(true)
    try {
      const salvo = await saveBranding({
        name: nome,
        color: cor,
        logoFile,
        removeLogo: removerLogo,
        currentLogoPath: atual?.logoPath ?? null,
        logoSize: tamanho,
        logoAlign: alinhamento,
      })
      setAtual(salvo)
      setLogoFile(null)
      setRemoverLogo(false)
      toast('Identidade dos PDFs salva. Os próximos PDFs já saem assim.', 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Não foi possível salvar.', 'error')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <article className="rounded-2xl border border-line bg-surface p-4 text-ink md:p-6">
      <h2 className="flex items-center gap-2 text-xl font-semibold leading-[1.2]">
        <Building2 size={20} className="text-forest" aria-hidden />
        {titulo}
      </h2>
      <p className="mt-1 text-sm leading-6 text-muted">
        Nome, logo e cor principal que aparecem em todos os PDFs exportados (avaliação, evolução, resumo e termos).
      </p>

      {carregando ? (
        <div className="mt-6 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest border-t-transparent" />
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <Input
            label={accountType === 'empresa' ? 'Nome da empresa' : 'Nome do escritório'}
            placeholder="Ex.: Clínica Movimento"
            maxLength={PDF_BRAND_NAME_MAX}
            value={nome}
            onChange={(event) => setNome(event.target.value)}
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink">Logo</p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-16 w-40 items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-canvas p-2">
                {logoMostrada ? (
                  <img src={logoMostrada} alt="Logo atual" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-muted">Sem logo</span>
                )}
              </div>
              <input
                ref={inputLogo}
                type="file"
                accept="image/png,image/jpeg"
                className="sr-only"
                onChange={escolherLogo}
              />
              <Button type="button" variant="secondary" className="!px-4 !py-2.5" onClick={() => inputLogo.current?.click()}>
                <ImagePlus size={16} aria-hidden />
                {logoMostrada ? 'Trocar logo' : 'Enviar logo'}
              </Button>
              {logoMostrada ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="!px-3 !py-2.5"
                  onClick={() => {
                    setLogoFile(null)
                    setRemoverLogo(true)
                  }}
                >
                  <Trash2 size={16} aria-hidden />
                  Remover
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted">PNG ou JPG, até 1 MB. Fundo transparente fica melhor.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor={idCor} className="text-sm font-medium text-ink">
              Cor principal
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id={idCor}
                type="color"
                value={cor}
                onChange={(event) => {
                  setCor(event.target.value)
                  setCorTexto(event.target.value)
                }}
                className="h-11 w-14 cursor-pointer rounded-xl border border-line bg-surface p-1"
              />
              <input
                type="text"
                aria-label="Código da cor"
                value={corTexto}
                maxLength={7}
                onChange={(event) => {
                  setCorTexto(event.target.value)
                  const valida = normalizarCor(event.target.value)
                  if (valida) setCor(valida)
                }}
                className="min-h-11 w-28 rounded-xl border border-line bg-canvas px-3 font-mono text-sm uppercase text-ink"
              />
              <div className="flex flex-wrap gap-1.5">
                {PDF_BRAND_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    aria-label={`Usar a cor ${preset}`}
                    onClick={() => {
                      setCor(preset)
                      setCorTexto(preset)
                    }}
                    className={[
                      'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                      preset === cor ? 'border-ink' : 'border-surface ring-1 ring-line',
                    ].join(' ')}
                    style={{ backgroundColor: preset }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tamanho e posição da logo, com a prévia da página em escala real. */}
          <div className="grid gap-4 rounded-2xl border border-line bg-canvas p-3 sm:grid-cols-[minmax(0,1fr)_14rem] sm:p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <label htmlFor={`${idCor}-tamanho`} className="text-sm font-medium text-ink">
                    Tamanho da logo no PDF
                  </label>
                  <span className="text-xs tabular-nums text-muted">{tamanho} pt</span>
                </div>
                <input
                  id={`${idCor}-tamanho`}
                  type="range"
                  min={PDF_LOGO_SIZE_MIN}
                  max={PDF_LOGO_SIZE_MAX}
                  step={2}
                  value={tamanho}
                  onChange={(event) => setTamanho(Number(event.target.value))}
                  className="w-full accent-forest"
                />
                <div className="flex justify-between text-[11px] text-muted">
                  <span>Menor</span>
                  <span>Maior</span>
                </div>
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-ink">Posição</legend>
                <div className="inline-flex rounded-xl border border-line bg-surface p-1">
                  {ALINHAMENTOS.map(({ value, label, Icon }) => {
                    const ativo = alinhamento === value
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={ativo}
                        onClick={() => setAlinhamento(value)}
                        className={[
                          'inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition',
                          ativo ? 'bg-forest text-white' : 'text-muted hover:text-ink',
                        ].join(' ')}
                      >
                        <Icon size={15} aria-hidden />
                        {label}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
              <p className="text-xs leading-5 text-muted">
                A prévia ao lado é a primeira página da avaliação em escala. Ajuste até ficar do jeito que você quer;
                o PDF sai igual.
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Prévia do PDF</p>
              <PdfPagePreview
                logoUrl={logoMostrada}
                nome={nomeMostrado}
                cor={cor}
                tamanho={tamanho}
                align={alinhamento}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={salvar} isLoading={salvando}>
              Salvar identidade
            </Button>
          </div>
        </div>
      )}
    </article>
  )
}
