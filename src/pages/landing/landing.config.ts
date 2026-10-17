// Constantes editáveis da landing page — troque aqui o WhatsApp, os preços e a foto/bio da criadora

// DDI+DDD+número, só dígitos (placeholder até o número real ser informado)
export const WHATSAPP_NUMBER = '5500000000000'
export const WHATSAPP_MESSAGE = 'Olá! Vim pela página do Fluxo e gostaria de saber mais.'

export const PRICE_PLACEHOLDER = 'R$ —'
export const PRICE_SUFFIX = '/mês'
export const PRICE_NOTE = 'Valores em breve'

export type LandingPlan = {
  id: 'autonomo' | 'empresa'
  name: string
  description: string
  price: string
  badge: string | null
  highlighted: boolean
  features: readonly { label: string; teamOnly: boolean }[]
}

export const PLANS: readonly LandingPlan[] = [
  {
    id: 'autonomo',
    name: 'Autônomo',
    description: 'Para quem atende por conta própria.',
    price: PRICE_PLACEHOLDER,
    badge: null,
    highlighted: false,
    features: [
      { label: 'Prontuário e cadastro de pacientes', teamOnly: false },
      { label: 'Avaliação com mapa corporal', teamOnly: false },
      { label: 'Sessões e evolução', teamOnly: false },
      { label: 'Agenda com sessões repetidas', teamOnly: false },
      { label: 'Resumo e avaliação com IA (você revisa)', teamOnly: false },
      { label: 'Exportar PDF', teamOnly: false },
      { label: 'Financeiro próprio', teamOnly: false },
    ],
  },
  {
    id: 'empresa',
    name: 'Empresa',
    description: 'Para clínicas com fisioterapeutas na equipe.',
    price: PRICE_PLACEHOLDER,
    badge: 'Para equipes',
    highlighted: true,
    features: [
      { label: 'Tudo do plano Autônomo', teamOnly: false },
      { label: 'Fisioterapeutas vinculados à conta', teamOnly: true },
      { label: 'Empresa vê e gerencia tudo da equipe', teamOnly: true },
      { label: 'Cada fisio com seus próprios pacientes', teamOnly: true },
      { label: 'Registro de alterações por item', teamOnly: true },
    ],
  },
]

export const CREATOR_NAME = 'Nicolle'
// Caminho público da foto (ex.: '/nicolle.webp'); null mostra o placeholder
export const CREATOR_PHOTO_SRC: string | null = null
export const CREATOR_PHOTO_ALT = 'Nicolle, fisioterapeuta e criadora do Fluxo'
export const CREATOR_BIO =
  'A Nicolle é fisioterapeuta e criou o Fluxo a partir da própria rotina no consultório: papéis espalhados, fichas longas e pouco tempo para o que importa. O Fluxo nasceu para deixar o registro clínico simples, bonito e do jeito que o fisioterapeuta trabalha.'
export const CREATOR_SIGNATURE = 'Nicolle, fisioterapeuta e criadora do Fluxo'

// Capturas do app no hero. null mostra a prévia ilustrada (placeholder).
// Coloque as imagens em public/ (ex.: '/landing/app-desktop.webp') e troque aqui.
export const HERO_DESKTOP_IMAGE: string | null = '/landing/app-desktop.webp' // 1600×1067, já com a moldura do navegador
export const HERO_MOBILE_IMAGE: string | null = '/landing/app-mobile.webp' // 600×1199, já com a moldura do celular

// Crédito no rodapé
export const MAKER_NAME = 'Niztech'
export const MAKER_URL = 'https://niztech.rehost.site/'
