import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')
const has = (src: string, needle: string) => ok(src.includes(needle), `deveria conter: ${needle}`)
const lacks = (src: string, needle: string) => ok(!src.includes(needle), `não deveria conter: ${needle}`)

test('REQ-47: "/" é a LP lazy dentro do GuestRoute', () => {
  const src = read('../routes/index.tsx')
  const start = src.indexOf('<Route element={<GuestRoute />}>')
  ok(start >= 0, 'GuestRoute ausente')
  const block = src.slice(start, src.indexOf('</Route>', start))
  has(block, 'path="/" element={<LandingPage />}')
  has(block, 'path="/login" element={<LoginPage />}')
  has(src, "import('@/pages/landing/LandingPage')")
  has(src, 'lazy(')
  has(src, '<Suspense')
  has(src, 'ChunkErrorBoundary')
  lacks(src, 'path="/login" element={<Navigate')
})

test('REQ-47: app em chunks lazy', () => {
  const src = read('../routes/index.tsx')
  has(src, "import('@/components/layout/AppShell')")
  has(src, "import('@/pages/PatientPage')")
  for (const s of ['import { PatientPage }', 'import { AppShell }', 'import { DashboardPage }'])
    lacks(src, s)
  const shell = read('../components/layout/AppShell.tsx')
  ok(/<Suspense[\s\S]*<Outlet \/>[\s\S]*<\/Suspense>/.test(shell), 'Suspense deve envolver Outlet')
})

test('REQ-47: redirects de auth vão para /login', () => {
  const guard = read('../components/auth/ProtectedRoute.tsx')
  has(guard, '<Navigate to="/login" state={{ from: location }} replace />')
  lacks(guard, '<Navigate to="/" state')
  has(read('../pages/auth/WaitingApprovalPage.tsx'), '<Navigate to="/login" replace />')
  const confirm = read('../pages/auth/AuthConfirmPage.tsx')
  lacks(confirm, "navigate('/',")
  lacks(confirm, 'to="/"')
  has(confirm, "navigate('/login', { replace: true })")
  for (const f of ['RegisterPage', 'ForgotPasswordPage']) {
    const src = read(`../pages/auth/${f}.tsx`)
    lacks(src, 'to="/"')
    has(src, 'to="/login"')
  }
})

test('REQ-47: safeRedirectPath segue bloqueando rotas de auth', () => {
  has(read('./security/index.ts'), "new Set(['/', '/login', '/cadastro'])")
})

test('REQ-47: LP isolada do app', () => {
  const dir = fileURLToPath(new URL('../pages/landing/', import.meta.url))
  const walk = (d: string): string[] =>
    readdirSync(d, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(d, e.name)) : /\.tsx?$/.test(e.name) ? [join(d, e.name)] : [],
    )
  for (const file of walk(dir)) {
    const src = readFileSync(file, 'utf8')
    for (const s of ['@/services', '@/stores', '@/hooks/useAuth', '@/components/layout'])
      lacks(src, s)
  }
})
