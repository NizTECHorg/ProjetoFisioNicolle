import { env } from '@/config/env'
import { BrandWordmark } from '@/components/brand/BrandWordmark'

export function SetupPage() {
  const isProd = !env.isDev

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-lg rounded-3xl border border-line bg-surface p-8 text-center shadow-[0_18px_50px_rgba(11,29,54,0.06)]">
        <div className="mb-6 flex justify-center">
          <BrandWordmark size="sm" variant="onLight" />
        </div>
        <h1 className="text-2xl font-semibold text-ink">Configuração necessária</h1>
        <p className="mt-4 text-sm text-muted">
          As variáveis do Supabase não foram encontradas neste build.
        </p>

        {isProd ? (
          <ol className="mt-6 space-y-3 text-left text-sm text-ink/80">
            <li>
              1. Na Vercel, vá em <code className="text-forest">Settings → Environment Variables</code>
            </li>
            <li>
              2. Confirme <code className="text-forest">VITE_SUPABASE_URL</code> e{' '}
              <code className="text-forest">VITE_SUPABASE_ANON_KEY</code> (Production)
            </li>
            <li>
              3. Vá em <code className="text-forest">Deployments</code> → abra o último deploy →{' '}
              <code className="text-forest">Redeploy</code>
            </li>
            <li>
              4. Importante: no Vite as variáveis entram no <strong>build</strong>. Só cadastrar
              depois do deploy não atualiza o site — precisa rebuild.
            </li>
          </ol>
        ) : (
          <ol className="mt-6 space-y-3 text-left text-sm text-ink/80">
            <li>
              1. Copie <code className="text-forest">.env.example</code> para{' '}
              <code className="text-forest">.env</code>
            </li>
            <li>
              2. Preencha <code className="text-forest">VITE_SUPABASE_URL</code> e{' '}
              <code className="text-forest">VITE_SUPABASE_ANON_KEY</code>
            </li>
            <li>
              3. Execute as migrations em <code className="text-forest">supabase/migrations/</code>
            </li>
            <li>4. Reinicie o servidor de desenvolvimento</li>
          </ol>
        )}

        <p className="mt-6 text-xs text-muted">
          Use apenas a chave anon (pública). Nunca exponha a service_role key no frontend.
        </p>
      </div>
    </div>
  )
}
