import { Star } from 'lucide-react'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface AiGeneratingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  generating?: boolean
}

export const AiGeneratingButton = forwardRef<HTMLButtonElement, AiGeneratingButtonProps>(
  ({ generating = false, disabled, children, className = '', ...props }, ref) => {
    const chrome =
      'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold min-h-11 bg-forest text-white focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'

    return (
      <button
        ref={ref}
        disabled={disabled || generating}
        aria-busy={generating ? true : undefined}
        className={[chrome, generating ? 'ai-generating' : '', className].filter(Boolean).join(' ')}
        {...props}
      >
        {generating ? (
          <>
            <Star size={16} fill="currentColor" aria-hidden />
            Gerando
          </>
        ) : (
          children
        )}
      </button>
    )
  },
)

AiGeneratingButton.displayName = 'AiGeneratingButton'
