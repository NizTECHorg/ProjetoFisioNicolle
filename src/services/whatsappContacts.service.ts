import { supabase } from '@/lib/supabase/client'
import type { ContatoWhatsapp } from '@/lib/contatosWhatsapp'

type ContactRow = { id: string; name: string; digits: string }

const COLUNAS = 'id, name, digits'

function mapRow(row: ContactRow): ContatoWhatsapp {
  return { id: row.id, nome: row.name, digits: row.digits }
}

export async function listWhatsappContacts(): Promise<ContatoWhatsapp[]> {
  const { data, error } = await supabase.from('whatsapp_contacts').select(COLUNAS).order('name')
  if (error) throw new Error('Não foi possível carregar os contatos salvos.')
  return ((data ?? []) as ContactRow[]).map(mapRow)
}

/** Mesmo número de novo só atualiza o nome. */
export async function saveWhatsappContact(ownerId: string, nome: string, digits: string): Promise<void> {
  const { error } = await supabase
    .from('whatsapp_contacts')
    .upsert({ owner_id: ownerId, name: nome, digits }, { onConflict: 'owner_id,digits' })
  if (error) throw new Error('Não foi possível salvar o contato.')
}

export async function deleteWhatsappContact(id: string): Promise<void> {
  const { error } = await supabase.from('whatsapp_contacts').delete().eq('id', id)
  if (error) throw new Error('Não foi possível remover o contato.')
}
