import { supabase } from '@/lib/supabase/client'
import type { ContatoEmail } from '@/lib/contatosEmail'

type ContactRow = { id: string; name: string; email: string }

const COLUNAS = 'id, name, email'

function mapRow(row: ContactRow): ContatoEmail {
  return { id: row.id, nome: row.name, email: row.email }
}

export async function listEmailContacts(): Promise<ContatoEmail[]> {
  const { data, error } = await supabase.from('email_contacts').select(COLUNAS).order('name')
  if (error) throw new Error('Não foi possível carregar os contatos salvos.')
  return ((data ?? []) as ContactRow[]).map(mapRow)
}

/** Mesmo e-mail de novo só atualiza o nome. */
export async function saveEmailContact(ownerId: string, nome: string, email: string): Promise<void> {
  const { error } = await supabase
    .from('email_contacts')
    .upsert({ owner_id: ownerId, name: nome, email }, { onConflict: 'owner_id,email' })
  if (error) throw new Error('Não foi possível salvar o contato.')
}

export async function deleteEmailContact(id: string): Promise<void> {
  const { error } = await supabase.from('email_contacts').delete().eq('id', id)
  if (error) throw new Error('Não foi possível remover o contato.')
}
