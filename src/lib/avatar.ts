export function avatarColor(tone: string | null | undefined) {
  if (!tone) return '#0b1d36'
  const hex = tone.match(/#([0-9a-fA-F]{3,8})/)?.[0]
  if (hex) return hex
  if (tone.includes('forest-mid')) return '#163056'
  if (tone.includes('forest')) return '#0b1d36'
  if (tone.includes('accent')) return '#2f7dff'
  return '#0b1d36'
}

export function initialsFromName(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
