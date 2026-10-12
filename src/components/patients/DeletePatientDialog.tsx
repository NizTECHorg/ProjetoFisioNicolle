import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { isDeleteNameMatch } from '@/lib/patientDeleteConfirm'

type DeletePatientDialogProps = {
  open: boolean
  patientName: string
  isPending: boolean
  onConfirm: () => void
  onClose: () => void
}

export function DeletePatientDialog({
  open,
  patientName,
  isPending,
  onConfirm,
  onClose,
}: DeletePatientDialogProps) {
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (open) setTyped('')
  }, [open])

  const matches = isDeleteNameMatch(typed, patientName)
  // Durante a exclusão, Esc, fundo e X não fecham o diálogo.
  const handleClose = isPending ? () => {} : onClose

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (matches && !isPending) onConfirm()
  }

  return (
    <Modal
      open={open}
      title="Excluir paciente?"
      description="Esta ação é definitiva e não pode ser desfeita."
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-ink">
          Serão apagados: sessões, avaliações, evoluções, metas, imagens, PDFs, relatórios da IA e cobranças.
        </p>
        <p className="text-sm text-muted">Eventos já enviados ao Google Agenda continuam lá.</p>
        <Input
          label="Digite o nome do paciente para confirmar"
          id="delete-patient-confirm-name"
          autoComplete="off"
          spellCheck={false}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          disabled={isPending}
          hint={`"${patientName}"`}
        />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            className="sm:w-auto"
            onClick={onClose}
            disabled={isPending}
          >
            Voltar sem excluir
          </Button>
          <Button
            type="submit"
            fullWidth
            className="sm:w-auto !bg-error !text-white hover:!bg-error/90"
            disabled={!matches}
            isLoading={isPending}
          >
            Excluir paciente
          </Button>
        </div>
      </form>
    </Modal>
  )
}
