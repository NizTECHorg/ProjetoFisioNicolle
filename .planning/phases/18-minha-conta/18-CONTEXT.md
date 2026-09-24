# Phase 18: Minha conta - Context

**Gathered:** 2026-09-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Página da própria conta, aberta por um botão só com ícone no rodapé da barra lateral, na mesma faixa do botão Sair. A pessoa troca a foto, o nome e a senha dessa conta.

Fora desta fase: foto de paciente, troca de e-mail de login, exclusão de conta, convite de equipe.

</domain>

<decisions>
## Implementation Decisions

### Entrada
- D-01: O botão fica em `AppShell`, na faixa do rodapé que já tem as iniciais, o nome e o botão Sair. Fica ao lado de Sair.
- D-02: O botão mostra só um ícone. Sem texto visível. O nome acessível é Minha conta.

### Página
- D-03: A página permite trocar a foto da conta, o nome exibido e a senha.
- D-04: As três mudanças valem só para a conta logada e continuam depois de recarregar.
- D-05: Resetar a senha exige verificação antes de gravar a senha nova. A senha atual é conferida; se não bater, a senha não muda. O plano precisa de uma regra de verificação que prove o reset: a senha antiga deixa de entrar e a nova entra.

### Claude's Discretion
- Campos extras além de foto, nome e senha (e-mail só leitura, tipo de conta só leitura).
- Onde a foto da conta é guardada e como a senha é trocada no Supabase Auth.
- Rota e rótulo interno da página, desde que o botão continue só com ícone.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Navegação
- `src/components/layout/AppShell.tsx` — rodapé com iniciais, nome e botão Sair
- `src/config/navigation.ts` — itens do menu clínico

### Conta
- `src/providers/AuthProvider.tsx` — sessão, perfil e signOut
- `src/pages/SettingsPage.tsx` — página de configurações existente, sem rota e sem edição

</canonical_refs>

<specifics>
## Specific Ideas

O botão de sair hoje é um ícone `LogOut` no canto da faixa do rodapé. O novo botão fica junto dele, também só ícone.

</specifics>

<deferred>
## Deferred Ideas

None — o pedido cobre a entrada e a edição de foto, nome e senha.

</deferred>

---

*Phase: 18-minha-conta*
*Context gathered: 2026-09-24*
