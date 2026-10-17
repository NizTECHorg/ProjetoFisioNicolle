export function normalizeCpf(v: string | null | undefined): string {
  return (v ?? '').replace(/\D/g, '').slice(0, 11)
}

function checkDigit(digits: string, len: number): number {
  let sum = 0
  for (let i = 0; i < len; i++) sum += Number(digits[i]) * (len + 1 - i)
  return ((sum * 10) % 11) % 10
}

export function isValidCpf(v: string | null | undefined): boolean {
  const d = (v ?? '').replace(/\D/g, '')
  if (d.length !== 11) return false
  if (/^(\d)\1{10}$/.test(d)) return false
  return checkDigit(d, 9) === Number(d[9]) && checkDigit(d, 10) === Number(d[10])
}

export function formatCpf(v: string | null | undefined): string {
  const d = normalizeCpf(v)
  if (!d) return ''
  let out = d.slice(0, 3)
  if (d.length > 3) out += `.${d.slice(3, 6)}`
  if (d.length > 6) out += `.${d.slice(6, 9)}`
  if (d.length > 9) out += `-${d.slice(9, 11)}`
  return out
}

export function maskCpf(v: string | null | undefined): string {
  const d = normalizeCpf(v)
  if (d.length !== 11) return ''
  return `***.***.${d.slice(6, 9)}-${d.slice(9, 11)}`
}
