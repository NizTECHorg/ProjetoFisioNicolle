import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import {
  ACCOUNT_DELETION_ERRORS,
  accountDeletionCopy,
  canSubmitAccountDeletion,
  type AccountDeletionKind,
} from '@/lib/accountDeletion'
import { deleteOwnAccount } from '@/services/accountDeletion.service'
import { toast } from '@/stores/toast.store'

type DeleteAccountDialogProps = {
  open: boolean
  userId: string
  kind: AccountDeletionKind
  patientCount: number | null
  onClose: () => void
  onDeleted: () => void | Promise<void>
}

export function DeleteAccountDialog({
  open,
  userId,
  kind,
  patientCount,
  onClose,
  onDeleted,
}: DeleteAccountDialogProps) {
  const [typed, setTyped] = useState('')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (open) {
      setTyped('')
      setPassword('')
      setPasswordError(null)
      setIsPending(false)
    }
  }, [open])

  const copy = accountDeletionCopy(kind, patientCount)
  // Durante a exclusão, Esc, fundo e X não fecham o diálogo.
  const handleClose = isPending ? () => {} : onClose

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmitAccountDeletion(typed, password) || isPending) return
    setIsPending(true)
    try {
      await deleteOwnAccount(userId, password)
      await onDeleted()
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message === ACCOUNT_DELETION_ERRORS.invalidPassword) {
        setPassword('')
        setPasswordError(ACCOUNT_DELETION_ERRORS.invalidPassword)
      } else if (message === ACCOUNT_DELETION_ERRORS.rateLimited) {
        toast(ACCOUNT_DELETION_ERRORS.rateLimited, 'error')
      } else {
        toast(ACCOUNT_DELETION_ERRORS.generic, 'error')
      }
      setIsPending(false)
    }
  }

  return (
    <Modal open={open} title={copy.title} description={copy.description} onClose={handleClose}>
      <form
        onSubmit={(event) => {
          void handleSubmit(event)
        }}
        className="space-y-4"
      >
        <p className="text-sm text-ink">Serão apagados:</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
          {copy.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="text-sm text-muted">{copy.note}</p>
        <Input
          label="Digite EXCLUIR para confirmar"
          id="delete-account-confirm-word"
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="characters"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          disabled={isPending}
        />
        <Input
          label="Senha atual"
          id="delete-account-password"
          type="password"
          autoComplete="current-password"
          value={password}
          error={passwordError ?? undefined}
          onChange={(event) => {
            setPassword(event.target.value)
            setPasswordError(null)
          }}
          disabled={isPending}
        />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            className="sm:w-auto"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            fullWidth
            className="sm:w-auto !bg-error !text-white hover:!bg-error/90"
            disabled={!canSubmitAccountDeletion(typed, password) || isPending}
            isLoading={isPending}
          >
            Excluir minha conta
          </Button>
        </div>
      </form>
    </Modal>
  )
}
