import { GOOGLE_CALENDAR_COPY } from '@/schemas/googleCalendar.schema'

/**
 * Sanitiza entrada de texto removendo caracteres de controle e limitando tamanho.
 * Nunca confie apenas nisso — validação com Zod e RLS no Supabase são obrigatórios.
 */
export function sanitizeText(input: string, maxLength = 255): string {
  return input
    .replace(/\p{Cc}/gu, '')
    .trim()
    .slice(0, maxLength)
}

export function sanitizeEmail(email: string): string {
  return sanitizeText(email.toLowerCase(), 254)
}

/**
 * Só aceita caminhos internos do app. Bloqueia redirect aberto
 * (protocol-relative, URL absoluta, backslash, path externo).
 */
export function isSafeInternalPath(path: unknown): path is string {
  if (typeof path !== 'string' || path.length === 0 || path.length > 256) {
    return false
  }

  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
    return false
  }

  if (path.includes('\\') || path.includes('://') || path.includes('\0')) {
    return false
  }

  try {
    const decoded = decodeURIComponent(path)
    if (
      decoded.startsWith('//') ||
      decoded.includes('://') ||
      decoded.includes('\\') ||
      decoded.includes('\0')
    ) {
      return false
    }
  } catch {
    return false
  }

  return true
}

const AUTH_PATHS = new Set(['/', '/login', '/cadastro'])

export function safeRedirectPath(path: unknown, fallback = '/painel'): string {
  if (!isSafeInternalPath(path) || AUTH_PATHS.has(path)) {
    return fallback
  }
  return path
}

/**
 * Mapeia erros do Supabase Auth para mensagens seguras (sem vazar detalhes internos).
 */
export function mapAuthError(error: { message?: string; status?: number }): string {
  const message = error.message?.toLowerCase() ?? ''

  if (message.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.'
  }

  if (message.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.'
  }

  if (
    message.includes('user already registered') ||
    message.includes('already been registered') ||
    message.includes('email address has already been registered') ||
    message.includes('already exists')
  ) {
    return 'Este e-mail já está cadastrado. Entre ou use outro e-mail.'
  }

  if (message.includes('password')) {
    return 'A senha não atende aos requisitos de segurança.'
  }

  if (message.includes('rate limit') || error.status === 429) {
    return 'Muitas tentativas. Aguarde e tente novamente mais tarde.'
  }

  if (message.includes('network') || message.includes('fetch')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.'
  }

  return 'Ocorreu um erro. Tente novamente mais tarde.'
}

const LOGIN_MAX_ATTEMPTS_PER_KEY = 5
const LOGIN_MAX_ATTEMPTS_GLOBAL = 20
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const REGISTER_MAX_ATTEMPTS = 7
const REGISTER_WINDOW_MS = 60 * 60 * 1000
const STORAGE_KEY = 'fisio.auth.rate'

type AttemptEntry = { count: number; resetAt: number }
type AttemptStore = Record<string, AttemptEntry>

function readStore(): AttemptStore {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as AttemptStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store: AttemptStore) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* private mode / quota — o limite em memória ainda vale nesta sessão */
  }
}

const memoryStore: AttemptStore = {}

function getEntry(key: string): AttemptEntry | undefined {
  const persisted = readStore()[key]
  const memory = memoryStore[key]
  if (!persisted) return memory
  if (!memory) return persisted
  return persisted.count > memory.count ? persisted : memory
}

function setEntry(key: string, entry: AttemptEntry) {
  memoryStore[key] = entry
  const store = readStore()
  store[key] = entry
  writeStore(store)
}

function deleteEntry(key: string) {
  delete memoryStore[key]
  const store = readStore()
  delete store[key]
  writeStore(store)
}

function limitsFor(key: string): { max: number; windowMs: number } {
  if (key.startsWith('auth:register:')) {
    return { max: REGISTER_MAX_ATTEMPTS, windowMs: REGISTER_WINDOW_MS }
  }

  return {
    max: key.endsWith(':global') ? LOGIN_MAX_ATTEMPTS_GLOBAL : LOGIN_MAX_ATTEMPTS_PER_KEY,
    windowMs: LOGIN_WINDOW_MS,
  }
}

/**
 * Rate limit no cliente para reduzir força bruta neste browser.
 * Não substitui o rate limit do Supabase Auth no servidor.
 * Cadastro: 7 tentativas por hora. Login: 5 por chave / 20 globais a cada 15 minutos.
 */
export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const { max, windowMs } = limitsFor(key)
  const entry = getEntry(key)

  if (!entry || now > entry.resetAt) {
    setEntry(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (entry.count >= max) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }

  entry.count += 1
  setEntry(key, entry)
  return { allowed: true }
}

export function resetRateLimit(key: string): void {
  deleteEntry(key)
}

export function formatRetryAfter(ms: number): string {
  const minutes = Math.max(1, Math.ceil(ms / 60_000))
  if (minutes >= 60) {
    const hours = Math.ceil(ms / 3_600_000)
    return `${hours} hora${hours > 1 ? 's' : ''}`
  }
  return `${minutes} minuto${minutes > 1 ? 's' : ''}`
}

/** Escapa curingas de ILIKE para evitar injeção de padrões na busca. */
export function escapeIlike(term: string): string {
  return sanitizeText(term, 80)
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
}

export function mapDbError(error: { message?: string; code?: string }): string {
  const message = error.message?.toLowerCase() ?? ''
  const code = error.code ?? ''

  if (code === '42501' || message.includes('operation_not_permitted')) {
    return 'Você não tem permissão para esta ação.'
  }
  if (message.includes('invalid_coupon')) {
    return 'Cupom inválido, expirado ou esgotado.'
  }
  if (message.includes('invalid_order_status') || message.includes('invalid_production_status')) {
    return 'Status inválido para esta operação.'
  }
  if (message.includes('duplicate') || code === '23505') {
    return 'Já existe um registro com esses dados.'
  }
  if (message.includes('foreign key') || code === '23503') {
    return 'Não é possível concluir: há registros relacionados.'
  }
  if (message.includes('check') || code === '23514') {
    return 'Dados inválidos. Verifique os campos e tente novamente.'
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.'
  }

  return 'Não foi possível concluir a operação. Tente novamente.'
}

/**
 * Mapeia erros do Storage para copy em português (D-04). Nunca devolve error.message cru.
 */
export function mapStorageError(error: {
  message?: string
  code?: string
  statusCode?: string | number
  error?: string
  status?: number
}): string {
  const message = `${error.message ?? ''} ${error.error ?? ''}`.toLowerCase()
  const code = error.code ?? ''
  const statusCode = String(error.statusCode ?? error.status ?? '')

  if (
    message.includes('size') ||
    statusCode === '413' ||
    message.includes('exceeded') ||
    message.includes('too large') ||
    message.includes('maximum allowed size')
  ) {
    return 'A imagem deve ter no máximo 8 MB.'
  }

  if (
    message.includes('mime') ||
    message.includes('not allowed') ||
    message.includes('heic') ||
    message.includes('heif') ||
    message.includes('invalid content type') ||
    message.includes('content-type')
  ) {
    return 'Envie JPEG, PNG ou WebP. Fotos do iPhone: escolha a opção mais compatível.'
  }

  if (
    code === '42501' ||
    statusCode === '403' ||
    error.status === 403 ||
    message.includes('unauthorized') ||
    message.includes('row-level security') ||
    message.includes('not allowed')
  ) {
    return mapDbError({ ...error, code: code === '42501' ? code : '42501' })
  }

  return 'Não foi possível salvar. Verifique o arquivo e tente de novo.'
}

/**
 * Mapeia erros do Google Calendar / Edge Functions para copy em português (REQ-20.5).
 * Nunca devolve error.message cru nem JSON OAuth em inglês.
 */
export function mapGoogleCalendarError(
  error: { message?: string; status?: number; code?: string | number } | null | undefined,
): string {
  if (!error) {
    return GOOGLE_CALENDAR_COPY.exportError
  }

  const message = (error.message ?? '').toLowerCase()
  const code = String(error.code ?? '').toLowerCase()
  const status = error.status

  if (
    code === 'insufficient_scope' ||
    message.includes('insufficient_scope') ||
    message.includes('insufficient permission') ||
    message.includes('insufficientpermissions') ||
    message.includes('authentication scopes')
  ) {
    return GOOGLE_CALENDAR_COPY.insufficientScope
  }

  if (
    code === 'misconfigured' ||
    message.includes('misconfigured') ||
    message.includes('invalid_client')
  ) {
    return GOOGLE_CALENDAR_COPY.misconfigured
  }

  // JWT/unauthorized da Edge Function ≠ token Google expirado
  if (code === 'unauthorized' || message === 'unauthorized') {
    return GOOGLE_CALENDAR_COPY.exportError
  }

  if (
    code === 'needs_reconnect' ||
    message.includes('needs_reconnect') ||
    message.includes('invalid_grant') ||
    message.includes('insufficient') ||
    code === '403' ||
    status === 403 ||
    (status === 401 && (code === 'needs_reconnect' || message.includes('reconnect')))
  ) {
    return GOOGLE_CALENDAR_COPY.tokenExpired
  }

  if (
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('fetch failed') ||
    message.includes('unavailable') ||
    code === 'network' ||
    (typeof status === 'number' && status >= 500 && status < 600)
  ) {
    return GOOGLE_CALENDAR_COPY.networkError
  }

  if (message.includes('empty_month') || message.includes('empty') || code === 'empty_month') {
    return GOOGLE_CALENDAR_COPY.exportEmpty
  }

  if (
    code === '42501' ||
    message.includes('permission') ||
    message.includes('row-level security') ||
    message.includes('rls')
  ) {
    return mapDbError({ message: error.message, code: '42501' })
  }

  return GOOGLE_CALENDAR_COPY.exportError
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
