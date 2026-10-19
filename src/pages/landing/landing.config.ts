// Constantes editáveis da landing page — troque aqui o WhatsApp, os preços, o Sobre o Fluxo e o Instagram

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
      { label: 'Relatórios para médicos e convênios', teamOnly: false },
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
      { label: 'Cada fisioterapeuta com seus próprios pacientes', teamOnly: true },
      { label: 'Registro de alterações por item', teamOnly: true },
      { label: 'Integração entre os profissionais da equipe', teamOnly: true },
    ],
  },
]

// Seção "Sobre o Fluxo": assinatura de quem idealizou e textos
export const CREATOR_NAME = 'Nicolle Bandeira'
export const CREATOR_ROLE = 'Fisioterapeuta e idealizadora do Fluxo'
export const ABOUT_PARAGRAPHS = [
  'O Fluxo nasceu da experiência real na fisioterapia e da necessidade de tornar a rotina clínica mais simples, organizada e integrada.',
  'Desenvolvido a partir dos desafios cotidianos da profissão, une conhecimento clínico e tecnologia para facilitar registros, acompanhar a evolução dos pacientes e fortalecer a comunicação entre profissionais.',
] as const

// Instagram do Fluxo no rodapé (URL completa, ex.: 'https://www.instagram.com/fluxo'); null esconde o ícone
export const INSTAGRAM_URL: string | null = null

// Capturas do app no hero. null mostra a prévia ilustrada (placeholder).
// Coloque as imagens em public/ (ex.: '/landing/app-desktop.webp') e troque aqui.
export const HERO_DESKTOP_IMAGE: string | null = '/landing/app-desktop.webp' // 1600×1067, já com a moldura do navegador
export const HERO_MOBILE_IMAGE: string | null = '/landing/app-mobile.webp' // 600×1199, já com a moldura do celular

// Crédito no rodapé
export const MAKER_NAME = 'Niztech'
export const MAKER_URL = 'https://niztech.rehost.site/'
