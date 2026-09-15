import { useEffect, useState } from 'react'

type SignedPhotoProps = {
  src: string | null
  fallbackSrc?: string | null
  alt: string
  contain?: boolean
}

export function SignedPhoto({ src, fallbackSrc, alt, contain }: SignedPhotoProps) {
  const [failed, setFailed] = useState(false)
  const [useFallback, setUseFallback] = useState(false)

  useEffect(() => {
    setFailed(false)
    setUseFallback(false)
  }, [src, fallbackSrc])

  const active = useFallback ? (fallbackSrc ?? src) : src

  if (!active || failed) {
    return (
      <div className="flex h-full min-h-24 w-full items-center justify-center bg-canvas px-3">
        <p className="text-center text-xs text-muted">Não foi possível mostrar a imagem.</p>
      </div>
    )
  }

  return (
    <img
      src={active}
      alt={alt}
      loading={contain ? 'eager' : 'lazy'}
      decoding="async"
      className={contain ? 'max-h-[70vh] w-full object-contain' : 'h-full w-full object-cover'}
      onError={() => {
        if (!useFallback && fallbackSrc && fallbackSrc !== active) {
          setUseFallback(true)
          return
        }
        setFailed(true)
      }}
    />
  )
}
