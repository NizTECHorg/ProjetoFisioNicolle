import { useState } from 'react'
import { initialsFromName, avatarColor } from '@/lib/avatar'

const sizes = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-10 w-10 text-xs',
  lg: 'h-16 w-16 text-lg',
} as const

interface PatientAvatarProps {
  name: string
  tone?: string | null
  initials?: string
  size?: keyof typeof sizes
  className?: string
  photoUrl?: string | null
}

export function PatientAvatar({
  name,
  tone,
  initials,
  size = 'md',
  className = '',
  photoUrl,
}: PatientAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showPhoto = Boolean(photoUrl) && failedSrc !== photoUrl

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ${sizes[size]} ${className}`}
      style={{ backgroundColor: avatarColor(tone) }}
    >
      {showPhoto ? (
        <img
          src={photoUrl ?? ''}
          alt=""
          className="h-full w-full object-cover"
          onError={() => {
            if (photoUrl) setFailedSrc(photoUrl)
          }}
        />
      ) : (
        initials || initialsFromName(name)
      )}
    </span>
  )
}
