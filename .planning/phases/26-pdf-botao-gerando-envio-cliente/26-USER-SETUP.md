# Fase 26: enviar o PDF ao paciente

**Para que serve:** o e-mail com o PDF usa o mesmo servidor SMTP do Fluxo. Os segredos de Authentication não aparecem sozinhos na Edge Function.
**Segredos:** este arquivo só tem nomes e placeholders. Não copie host, usuário ou o valor de `FLUXO_SMTP_PASS` para o git.

---

## 1. Colar a função

1. Abra **Supabase Dashboard → Edge Functions**.
2. Crie a função com o nome exato `send-patient-document`.
3. Cole o arquivo `.planning/phases/26-pdf-botao-gerando-envio-cliente/functions/send-patient-document/index.ts`.
4. Não use `supabase functions deploy`.
5. Não ligue o Send Email Hook. O e-mail de confirmação de conta continua no Custom SMTP de Authentication.
6. Não altere o template de confirmação de conta.

## 2. Gravar os segredos

Em **Supabase Dashboard → Edge Functions → Secrets**, grave os cinco nomes abaixo com os mesmos valores já usados em **Authentication → SMTP**. Sem prefixo `SUPABASE_`. Cole o valor só no Dashboard.

| Nome | O que usar |
|------|------------|
| `FLUXO_SMTP_HOST` | O mesmo host do Custom SMTP. Não escreva o valor aqui. |
| `FLUXO_SMTP_PORT` | `465` ou `587`, igual ao Custom SMTP. |
| `FLUXO_SMTP_USER` | O usuário do Custom SMTP. Não escreva o valor aqui. |
| `FLUXO_SMTP_PASS` | O segredo do Custom SMTP. Nunca neste arquivo. |
| `FLUXO_SMTP_FROM` | O remetente Fluxo já usado na confirmação de conta. |

Se o servidor recusar a conexão, a tela mostra a falha em português. Não troque de provedor por causa disso.

## 3. Conferir na ficha

- [ ] Exporte uma avaliação de um paciente que já tem e-mail no cadastro. O PDF chega na caixa.
- [ ] Toque **Enviar por WhatsApp**. A conversa abre no número do cadastro, com o link que vale 7 dias.
- [ ] Sem telefone no cadastro, a tela explica e não diz que enviou.
- [ ] Sem e-mail no cadastro, a frase é a de cadastro incompleto e não há aviso de sucesso.
- [ ] Gere o resumo e veja **Gerando** com a estrela. **Exportar PDF** de avaliação continua em **Aguarde...**.
- [ ] Uma conta sem escrita não vê **Enviar por WhatsApp** nem **Enviar por e-mail**.
