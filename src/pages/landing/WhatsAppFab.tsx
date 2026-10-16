import { MessageCircle } from 'lucide-react'
import { WhatsAppLink } from './LinkButton'

export function WhatsAppFab({ hidden }: { hidden: boolean }) {
  if (hidden) return null
  return (
    <WhatsAppLink
      variant="primary"
      ariaLabel="Falar no WhatsApp"
      className="fixed right-4 z-40 h-14 w-14 rounded-full! px-0! py-0! md:hidden"
      style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))' }}
    >
      <MessageCircle size={24} aria-hidden="true" />
    </WhatsAppLink>
  )
}
