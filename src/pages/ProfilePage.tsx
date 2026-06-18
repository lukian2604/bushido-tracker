import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/hooks/useTranslation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { subscribeToUser } from '@/services/user-service'
import { deleteAccount } from '@/services/account-service'
import { colorForUid, initialFor } from '@/lib/avatar'
import type { UserDoc } from '@/lib/types'
import type { FirebaseError } from 'firebase/app'

export const ProfilePage = () => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [userDoc, setUserDoc] = useState<UserDoc | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!user) return
    return subscribeToUser(user.uid, setUserDoc)
  }, [user])

  if (!user) return null

  const displayName = userDoc?.displayName || user.displayName || user.email || ''

  const onConfirmDelete = async () => {
    setIsDeleting(true)
    setErrorMessage('')

    try {
      await deleteAccount()
      navigate('/')
    } catch (error) {
      const firebaseError = error as FirebaseError
      setErrorMessage(
        firebaseError.code === 'auth/requires-recent-login' ? t('profile.errorRecentLogin') : t('profile.errorGeneric'),
      )
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader title={t('profile.heading')} subtitle={t('profile.subtitle')} />

      <div className="grid gap-6 sm:grid-cols-2">
        <article className="rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
          <div
            className="mb-4 flex size-16 items-center justify-center rounded-full text-xl font-semibold text-white"
            style={{ backgroundColor: colorForUid(user.uid) }}
          >
            {initialFor(displayName)}
          </div>
          <h2 className="font-accent text-lg font-semibold text-(--color-parchment)">{t('profile.accountTitle')}</h2>
          <p className="mt-2 text-(--color-parchment)">{displayName}</p>
          <p className="text-sm text-(--color-parchment-muted)">{user.email}</p>
        </article>

        <article className="rounded-2xl border border-(--color-accent)/30 bg-(--color-ink-10) p-6">
          <h2 className="font-accent text-lg font-semibold text-(--color-parchment)">{t('profile.dangerZoneTitle')}</h2>
          <h3 className="mt-3 font-semibold text-(--color-accent)">{t('profile.deleteAccountTitle')}</h3>
          <p className="mt-2 text-sm text-(--color-parchment-muted)">{t('profile.deleteWarning')}</p>

          {errorMessage && <p className="mt-3 text-sm text-(--color-accent)">{errorMessage}</p>}

          {isConfirmingDelete ? (
            <div className="mt-4 flex gap-3">
              <Button variant="ghost" onClick={() => setIsConfirmingDelete(false)} disabled={isDeleting}>
                {t('profile.cancelButton')}
              </Button>
              <Button onClick={onConfirmDelete} disabled={isDeleting}>
                {isDeleting ? t('profile.deletingButton') : t('profile.confirmButton')}
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsConfirmingDelete(true)} className="mt-4">
              {t('profile.deleteButton')}
            </Button>
          )}
        </article>
      </div>
    </div>
  )
}
