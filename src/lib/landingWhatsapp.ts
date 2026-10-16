// Monta o link do WhatsApp. Só dígitos entram no path e a mensagem é
// codificada, então a entrada nunca troca o host nem injeta parâmetros (T-36-01).
export function buildWhatsAppLink(number: string, message: string): string {
  const digits = number.replace(/\D/g, '')
  const base = `https://wa.me/${digits}`
  if (message.trim() === '') return base
  return `${base}?text=${encodeURIComponent(message)}`
}
