import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera } from 'lucide-react'
import { z } from 'zod'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { accountTypeLabel } from '@/lib/accountAccess'
import { preparePatientPhoto } from '@/lib/cropPatientPhoto'
import {
  accountNameSchema,
  changePasswordSchema,
  type ChangePasswordFormData,
} from '@/schemas/auth.schema'
import { removeAccountPhoto, signAccountAvatarUrl, uploadAccountPhoto } from '@/services/accountPhoto.service'
import { changePassword, updateOwnName } from '@/services/auth.service'
import { toast } from '@/stores/toast.store'

const PERMISSION = 'Você não tem permissão para esta ação.'
const PHOTO_TYPE = 'Envie PNG, JPEG ou WebP.'
const PHOTO_SIZE = 'A foto deve ter no máximo 8 MB.'
const PHOTO_SAVE = 'Não foi possível salvar a foto. Tente de novo.'
const PHOTO_REMOVE = 'Não foi possível remover a foto. Tente de novo.'
const NAME_SAVE = 'Não foi possível salvar o nome. Tente de novo.'
const WRONG_CURRENT_PASSWORD = 'Senha atual incorreta.'
const SAME_PASSWORD = 'A nova senha deve ser diferente da atual.'
const PASSWORD_RATE_LIMIT = 'Muitas tentativas. Aguarde e tente novamente mais tarde.'
const PASSWORD_SAVE = 'Não foi possível atualizar a senha. Tente de novo.'
const PASSWORD_HINT = 'Mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial'
const EMPTY_PASSWORD_FORM: ChangePasswordFormData = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

const nameFormSchema = z.object({
  fullName: accountNameSchema,
})

type NameForm = z.infer<typeof nameFormSchema>

function knownPhotoMessage(error: unknown): string | null {
  if (!(error instanceof Error)) return null
  if (
    error.message === PERMISSION ||
    error.message === PHOTO_TYPE ||
    error.message === PHOTO_SIZE ||
    error.message === PHOTO_SAVE ||
    error.message === PHOTO_REMOVE
  ) {
    return error.message
  }
  return null
}

function accountInitials(displayName: string): string {
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  return initials || 'U'
}

export function AccountPage() {
  const { profile, user, reloadProfile } = useAuth()
  const savedName = (profile?.fullName ?? user?.user_metadata.full_name ?? '').trim()
  const email = user?.email ?? profile?.email ?? ''
  const avatarPath =
    typeof profile?.avatarUrl === 'string' && profile.avatarUrl.length > 0 ? profile.avatarUrl : null
  const initials = accountInitials(savedName || 'Usuário')

  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [imageBroken, setImageBroken] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NameForm>({
    resolver: zodResolver(nameFormSchema),
    defaultValues: { fullName: savedName },
  })

  const nameValue = watch('fullName')
  const nameUnchanged = nameValue.trim() === savedName
  const showingPhoto = Boolean(signedUrl) && !imageBroken

  const sessionEmailRef = useRef(email)
  sessionEmailRef.current = email
  const [showPasswords, setShowPasswords] = useState(false)
  const resolvePassword = useCallback<Resolver<ChangePasswordFormData>>(
    (values, context, options) =>
      zodResolver(changePasswordSchema(sessionEmailRef.current))(values, context, options),
    [],
  )
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    setError: setPasswordError,
    setFocus: setPasswordFocus,
    setValue: setPasswordValue,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: resolvePassword,
    defaultValues: EMPTY_PASSWORD_FORM,
  })

  useEffect(() => {
    reset({ fullName: savedName })
  }, [savedName, reset])

  useEffect(() => {
    let cancelled = false
    setImageBroken(false)
    if (!avatarPath) {
      setSignedUrl(null)
      return
    }
    void signAccountAvatarUrl(avatarPath)
      .then((url) => {
        if (!cancelled) setSignedUrl(url)
      })
      .catch(() => {
        if (!cancelled) setSignedUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [avatarPath])

  async function onPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    if (uploading) {
      input.value = ''
      return
    }
    const file = input.files?.[0]
    input.value = ''
    if (!file || !user?.id) return
    setUploading(true)
    try {
      const prepared = await preparePatientPhoto(file)
      await uploadAccountPhoto(user.id, prepared.blob, prepared.mimeType)
      toast('Foto atualizada.', 'success')
      await reloadProfile()
    } catch (error) {
      toast(knownPhotoMessage(error) ?? PHOTO_SAVE, 'error')
    } finally {
      setUploading(false)
    }
  }

  async function onRemovePhoto() {
    if (!user?.id || removing) return
    setRemoving(true)
    try {
      await removeAccountPhoto(user.id)
      toast('Foto removida.', 'success')
      setConfirmOpen(false)
      await reloadProfile()
    } catch (error) {
      toast(knownPhotoMessage(error) ?? PHOTO_REMOVE, 'error')
    } finally {
      setRemoving(false)
    }
  }

  async function onSubmit(data: NameForm) {
    if (!user?.id) return
    try {
      await updateOwnName(user.id, data.fullName)
      await reloadProfile()
      toast('Nome atualizado.', 'success')
    } catch (error) {
      if (error instanceof Error && error.message === PERMISSION) {
        toast(PERMISSION, 'error')
        return
      }
      toast(NAME_SAVE, 'error')
    }
  }

  async function onPasswordSubmit(data: ChangePasswordFormData) {
    try {
      await changePassword(email, data)
      resetPassword(EMPTY_PASSWORD_FORM)
      toast('Senha atualizada.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message === WRONG_CURRENT_PASSWORD) {
        setPasswordValue('currentPassword', '')
        setPasswordError('currentPassword', { type: 'server', message: WRONG_CURRENT_PASSWORD })
        setPasswordFocus('currentPassword')
        return
      }
      if (message === SAME_PASSWORD) {
        setPasswordError('newPassword', { type: 'server', message: SAME_PASSWORD })
        return
      }
      if (message === PASSWORD_RATE_LIMIT) {
        toast(PASSWORD_RATE_LIMIT, 'error')
        return
      }
      toast(PASSWORD_SAVE, 'error')
    }
  }

  return (
    <section className="mx-auto w-full max-w-2xl font-sans">
      <PageHeader
        className="dash-in"
        title="Minha conta"
        description="Foto, nome e senha desta conta."
      />

      <div className="space-y-6">
      <article className="rounded-2xl border border-line bg-surface p-4 text-ink md:p-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold leading-[1.2]">Foto e nome</h2>

          <div className="flex flex-wrap items-center gap-2">
            <label
              className="group/photo relative inline-flex h-16 w-16 shrink-0 overflow-hidden rounded-full"
              aria-busy={uploading}
            >
              {showingPhoto ? (
                <img
                  src={signedUrl ?? undefined}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setImageBroken(true)}
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-accent/20 text-sm font-semibold text-accent">
                  {initials}
                </span>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                className="sr-only"
                aria-label={showingPhoto ? 'Trocar foto' : 'Escolher foto'}
                disabled={uploading}
                onChange={(event) => {
                  void onPhotoChange(event)
                }}
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-forest/55 text-white opacity-0 group-hover/photo:opacity-100 group-focus-within/photo:opacity-100 [@media(hover:none)]:opacity-100">
                {uploading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Camera aria-hidden="true" size={20} />
                )}
              </span>
            </label>

            {avatarPath ? (
              <button
                type="button"
                className="inline-flex min-h-11 items-center px-2 text-xs text-muted hover:text-error"
                onClick={() => setConfirmOpen(true)}
              >
                Remover foto
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <div className="space-y-2">
              <p className="text-sm leading-normal">E-mail</p>
              <p className="text-sm leading-normal">{email}</p>
              <p className="text-xs leading-normal text-muted">O e-mail de login não muda aqui.</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm leading-normal">Tipo de conta</p>
              <p className="text-sm leading-normal">{accountTypeLabel(profile?.accountType)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input
              label="Nome"
              type="text"
              autoComplete="name"
              error={errors.fullName?.message}
              {...register('fullName')}
            />
            <div>
              <Button type="submit" isLoading={isSubmitting} disabled={nameUnchanged}>
                Salvar nome
              </Button>
            </div>
          </form>
        </div>
      </article>

      <article className="rounded-2xl border border-line bg-surface p-4 text-ink md:p-6">
        <form
          onSubmit={handlePasswordSubmit(onPasswordSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <h2 className="text-xl font-semibold leading-[1.2]">Senha</h2>
          <p className="text-sm leading-normal text-muted">
            Informe a senha atual para gravar a nova.
          </p>
          <Input
            label="Senha atual"
            type={showPasswords ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••••••"
            error={passwordErrors.currentPassword?.message}
            {...registerPassword('currentPassword')}
          />
          <Input
            label="Nova senha"
            type={showPasswords ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••••••"
            hint={PASSWORD_HINT}
            error={passwordErrors.newPassword?.message}
            {...registerPassword('newPassword')}
          />
          <Input
            label="Confirmar nova senha"
            type={showPasswords ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••••••"
            error={passwordErrors.confirmPassword?.message}
            {...registerPassword('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowPasswords((current) => !current)}
            className="inline-flex min-h-11 items-center text-xs text-muted transition-colors hover:text-forest"
          >
            {showPasswords ? 'Ocultar senhas' : 'Mostrar senhas'}
          </button>
          <div>
            <Button type="submit" isLoading={isPasswordSubmitting}>
              Salvar senha
            </Button>
          </div>
        </form>
      </article>
      </div>

      <ConfirmDialog
        open={confirmOpen && Boolean(avatarPath)}
        title="Remover foto"
        description="A foto sai da sua conta. As iniciais voltam."
        confirmLabel="Remover foto"
        cancelLabel="Voltar"
        tone="danger"
        isLoading={removing}
        onConfirm={() => {
          void onRemovePhoto()
        }}
        onClose={() => {
          if (!removing) setConfirmOpen(false)
        }}
      />
    </section>
  )
}
