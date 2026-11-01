import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'
import { Building2, ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PDF_BRAND_DEFAULT_COLOR, PDF_BRAND_NAME_MAX, PDF_BRAND_PRESETS, normalizarCor } from '@/lib/pdfBrand'
import { getOwnBranding, saveBranding, validarLogo, type PdfBranding } from '@/services/pdfBranding.service'
import { toast } from '@/stores/toast.store'
import type { AccountType } from '@/types/account'

type Props = { accountType: AccountType | null | undefined }

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

          {/* Prévia de como fica o topo do PDF. */}
          <div className="rounded-2xl border border-line bg-canvas p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Prévia do PDF</p>
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="h-1.5" style={{ backgroundColor: cor }} />
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                {logoMostrada ? (
                  <img src={logoMostrada} alt="" className="h-8 max-w-[10rem] object-contain" />
                ) : (
                  <span className="truncate text-base font-bold" style={{ color: cor }}>
                    {nomeMostrado}
                  </span>
                )}
                <span className="text-right text-sm font-semibold text-ink">Avaliação</span>
              </div>
              <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[11px] text-muted">
                <span className="truncate">{nomeMostrado} · Documento clínico</span>
                <span>Pág. 1</span>
              </div>
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
