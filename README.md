# Fisio — Aplicação Web

Resumo

Projeto frontend React + Vite para gestão clínica (pacientes, sessões, quadro Kanban, agendamentos, cobranças). A aplicação consome Supabase (Postgres + Auth + RLS) via cliente em `src/lib/supabase/client.ts` e organiza lógica de acesso a dados em serviços sob `src/services/`.

Tecnologias

- Vite + React + TypeScript
- Supabase (banco, auth, RPCs)
- TanStack Query
- Zod (validação)
- TailwindCSS (via plugin)

Estrutura principal

- `src/` — código da aplicação
  - `config/` — configurações, incluindo `src/config/env.ts` (validação de env)
  - `lib/supabase/` — cliente Supabase (`src/lib/supabase/client.ts`)
  - `services/` — funções que encapsulam consultas e comandos ao banco (veja abaixo)
  - `pages/`, `components/`, `hooks/`, `stores/`, `types/` — organização por domínio

Serviços (resumo de cada arquivo em `src/services`)

- `src/services/auth.service.ts` — operações de autenticação: login, registro, sign out, fetchProfile. Integra com `supabase.auth` e possui controle de rate-limit.
- `src/services/modules.service.ts` — conjunto grande de operações de domínio (produtos, ingredientes, pedidos, cupons, entregas, finanças, relatórios, tarefas, notificações, etc). Serve como camada CRUD central para módulos administrativos.
- `src/services/patients.service.ts` — lógica específica de pacientes: listagem, detalhes, dashboard do paciente, metas, focos, dores, alertas e conversão de dados para UI.
- `src/services/sessions.service.ts` — sessões de paciente (agendamento, registro de evolução, listagem), evoluções e helpers de formatação.
- `src/services/calendar.service.ts` — consultas e criação/atualização de sessões em intervalo de datas (usado no calendário).
- `src/services/board.service.ts` — operações do quadro Kanban: colunas, cartões, ordenação e cartões vencidos.

Arquivos úteis

- Configuração de ambiente: `src/config/env.ts` ([link](src/config/env.ts#L1))
- Cliente Supabase: `src/lib/supabase/client.ts` ([link](src/lib/supabase/client.ts#L1))
- Tipos do banco: `src/types/database.types.ts` (modelagem do schema)
- Serviços: `src/services/` (vários arquivos) — exemplo: `src/services/auth.service.ts` ([link](src/services/auth.service.ts#L1)), `src/services/patients.service.ts` ([link](src/services/patients.service.ts#L1))

Variáveis de ambiente

Crie um arquivo `.env.local` (ou configure o provedor de hospedagem) com as chaves abaixo:

```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

Observações:
- `src/config/env.ts` valida que `VITE_SUPABASE_URL` é um `https:` e que as chaves não estão com placeholders.
- O cliente Supabase lança erro se a configuração não estiver válida (`Supabase não configurado`).

Scripts (do `package.json`)

- `npm run dev` — roda a aplicação em desenvolvimento (Vite)
- `npm run build` — executa `tsc --noEmit` e em seguida `vite build`
- `npm run preview` — pré-visualiza a build gerada
- `npm run lint` — roda o ESLint
- `npm run typecheck` — checa tipos com `tsc --noEmit`

Requisitos locais

- Node.js 18+ recomendado
- npm (ou pnpm/yarn, adaptando os comandos)

Instalação e execução (local)

```bash
# clonar repo
git clone <repo>
cd ProjetoFisio

# instalar dependências
npm install

# configurar variáveis de ambiente
# crie .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

# rodar em desenvolvimento
npm run dev

# build para produção
npm run build

# testar a build localmente
npm run preview
```

Integração com Supabase

- O projeto espera que as tabelas, views e RPCs usadas pelos serviços existam no schema do Supabase (as chamadas a RPCs como `confirm_order`, `dismiss_notification`, etc., aparecem em `src/services/modules.service.ts` e outros arquivos).
- Modelo de dados e tipos estão em `src/types/database.types.ts`.
- Autenticação usa fluxo PKCE (`flowType: 'pkce'`) e sessions persistentes via `supabase-js`.

Dicas para desenvolvimento

- Use `npm run typecheck` frequentemente para capturar problemas de tipagem antes do build.
- `npm run lint` para garantir consistência de estilo.
- Cheque `src/config/env.ts` se os valores de env aparentarem estar corretos quando algo falhar na inicialização do cliente.

O que pode precisar de configuração extra

- Migrations / esquema do banco: as RPCs e algumas tabelas referenciadas (por exemplo, `patient_session_evolutions`, `board_columns`, `board_cards`, `profiles`, `orders`) são necessárias — importe migrations correspondentes no Supabase.
- Provedores de emails (se usar confirmações por e-mail) e regras RLS para segurança.

Precisa que eu:

- gere um arquivo `.env.local.example` com exemplos das variáveis?
- adicione instruções de deploy (Netlify / Vercel)?
- extraia uma lista completa de RPCs/tabelas usadas pelo projeto?

---
Gerado automaticamente: README básico com visão geral e instruções para desenvolvimento.
