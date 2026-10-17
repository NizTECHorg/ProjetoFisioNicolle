import { Activity } from 'lucide-react'
import mapaHomem from '@/assets/landing/mapa-homem.webp'
import mapaMulher from '@/assets/landing/mapa-mulher.webp'

// Posições medidas sobre as figuras (frente ~25% e costas ~74% da largura da imagem).
const PONTOS_A = [
  { left: '31%', top: '24%' }, // ombro (frente)
  { left: '74%', top: '42%' }, // lombar (costas)
]
const PONTOS_B = [{ left: '29%', top: '64%' }] // joelho (frente)

function Ponto({ left, top, delay }: { left: string; top: string; delay: number }) {
  return (
    <span className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2" style={{ left, top }}>
      <span className="lp-m-ping absolute inset-0 rounded-full bg-accent" style={{ animationDelay: `${delay}s` }} />
      <span
        className="lp-m-pop absolute inset-0 rounded-full bg-accent/85 ring-4 ring-accent/20"
        style={{ animationDelay: `${delay}s` }}
      />
    </span>
  )
}

/** Mapa corporal com marcas de dor e escala EVA. As marcas pulsam e a escala enche em loop. */
export function BodyMapMockup() {
  return (
    <div aria-hidden="true" className="max-w-full rounded-xl border border-line bg-surface p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        <div className="relative aspect-[1271/1238] rounded-xl bg-canvas">
          <img src={mapaHomem} width={960} height={935} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" />
          {PONTOS_A.map((p, i) => (
            <Ponto key={i} {...p} delay={i * 0.25} />
          ))}
        </div>
        <div className="relative aspect-[1271/1238] rounded-xl bg-canvas">
          <img src={mapaMulher} width={960} height={935} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" />
          {PONTOS_B.map((p, i) => (
            <Ponto key={i} {...p} delay={0.5} />
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-canvas p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
            <Activity size={14} className="text-[#1e3a8a]" />
            Dor agora (EVA)
          </span>
          <span className="rounded-full bg-accent-soft px-2 py-0.5 font-semibold text-[#1e3a8a]">7 / 10</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
          <span className="lp-m-fill block h-full w-[70%] origin-left rounded-full bg-[linear-gradient(90deg,#9cc8ff,#2f7dff,#1e3a8a)]" />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['Em pontada', 'Piora ao sentar', 'Irradia para a perna'].map((t, i) => (
            <span
              key={t}
              className="lp-m-pop rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink"
              style={{ animationDelay: `${0.4 + i * 0.15}s` }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
