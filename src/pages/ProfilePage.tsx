import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/hooks/useTranslation'
import { useProfileStats } from '@/hooks/useCurrentStreak'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { AvatarFrame } from '@/components/ui/AvatarFrame'
import { PalettePicker } from '@/components/ui/PalettePicker'
import { EditIcon } from '@/components/ui/icons'
import { subscribeToUser, setDisplayName, setCountry, uploadProfilePhoto } from '@/services/user-service'
import { deleteAccount } from '@/services/account-service'
import { isUsernameAvailable, claimUsername } from '@/services/friend-service'
import { isValidUsername, normalizeUsername } from '@/lib/username'
import { rankForStreak, nextRank, rankProgress, daysUntilNextRank } from '@/lib/ranks'
import { COUNTRIES, detectCountry } from '@/lib/countries'
import type { UserDoc } from '@/lib/types'
import type { FirebaseError } from 'firebase/app'

const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export const ProfilePage = () => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [userDoc, setUserDoc] = useState<UserDoc | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [isSavingUsername, setIsSavingUsername] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const { streak, totalCheckIns } = useProfileStats(user?.uid)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    return subscribeToUser(user.uid, setUserDoc)
  }, [user])

  if (!user) return null

  const displayName = userDoc?.displayName || user.displayName || user.email || ''
  const rank = rankForStreak(streak)
  const next = nextRank(rank)
  const progress = rankProgress(streak, rank)
  const daysToNext = daysUntilNextRank(streak, rank)
  const country = userDoc?.country || detectCountry()

  const onStartEditName = () => {
    setNameInput(displayName)
    setIsEditingName(true)
  }

  const onSaveName = async () => {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    setIsSavingName(true)
    try {
      await setDisplayName(user.uid, trimmed)
      setIsEditingName(false)
    } finally {
      setIsSavingName(false)
    }
  }

  const onStartEditUsername = () => {
    setUsernameInput(userDoc?.username || '')
    setUsernameError('')
    setIsEditingUsername(true)
  }

  const onSaveUsername = async () => {
    const normalized = normalizeUsername(usernameInput)
    setUsernameError('')

    if (!isValidUsername(normalized)) {
      setUsernameError(t('profile.usernameInvalid'))
      return
    }

    setIsSavingUsername(true)
    try {
      if (normalized !== userDoc?.username) {
        const available = await isUsernameAvailable(normalized)
        if (!available) {
          setUsernameError(t('profile.usernameTaken'))
          return
        }
      }
      await claimUsername(user.uid, normalized, userDoc?.username)
      setIsEditingUsername(false)
    } catch {
      // Un errore qui (es. permessi Firestore non ancora attivi) non significa che lo
      // username sia preso — mostrare comunque "già in uso" sarebbe fuorviante.
      setUsernameError(t('profile.usernameCheckError'))
    } finally {
      setIsSavingUsername(false)
    }
  }

  const onPickPhoto = () => fileInputRef.current?.click()

  const onPhotoSelected = async (file: File | undefined) => {
    if (!file) return
    setPhotoError('')

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setPhotoError(t('profile.photoErrorType'))
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(t('profile.photoErrorSize'))
      return
    }

    setIsUploadingPhoto(true)
    try {
      await uploadProfilePhoto(user.uid, file)
    } catch {
      setPhotoError(t('profile.photoErrorGeneric'))
    } finally {
      setIsUploadingPhoto(false)
    }
  }

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

      <article className="relative mb-6 overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
        <span
          aria-hidden="true"
          className="font-accent pointer-events-none absolute -right-4 -top-6 select-none text-[180px] font-bold leading-none opacity-[0.06]"
          style={{ color: `var(--color-rank-${rank.id})` }}
        >
          {rank.kanji}
        </span>

        <h2 className="relative font-accent text-lg font-semibold text-(--color-parchment)">{t('ranks.sectionTitle')}</h2>
        <div className="relative mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <div className="flex flex-col items-center gap-2">
            <AvatarFrame streak={streak} uid={user.uid} displayName={displayName} photoUrl={userDoc?.photoURL} size={112} interactive />
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(',')}
              className="hidden"
              onChange={(event) => onPhotoSelected(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={onPickPhoto}
              disabled={isUploadingPhoto}
              className="text-xs font-medium text-(--color-parchment-muted) hover:text-(--color-gold) disabled:opacity-50"
            >
              {isUploadingPhoto ? t('profile.photoUploading') : t('profile.changePhotoButton')}
            </button>
            {photoError && <p className="max-w-32 text-center text-[11px] text-(--color-accent)">{photoError}</p>}
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-baseline justify-center gap-2 sm:justify-start">
              <span
                className="font-accent text-sm font-extrabold uppercase tracking-wider"
                style={{ color: `var(--color-rank-${rank.id})` }}
              >
                {rank.name}
              </span>
              <span className="text-xs text-(--color-parchment-muted)">{t(`ranks.${rank.id}.range`)}</span>
            </div>
            <h3 className="font-accent mt-1 text-2xl font-semibold text-(--color-parchment)">{displayName}</h3>
            <p className="mt-2 max-w-prose text-sm text-(--color-parchment-muted)">{t(`ranks.${rank.id}.flavor`)}</p>
            <div className="mt-3 flex items-center justify-center gap-5 sm:justify-start">
              <div>
                <span className="text-lg font-bold text-(--color-parchment)">{streak}</span>{' '}
                <span className="text-xs uppercase tracking-wide text-(--color-parchment-muted)">{t('ranks.streakLabel')}</span>
              </div>
              <div>
                <span className="text-lg font-bold text-(--color-parchment)">{totalCheckIns}</span>{' '}
                <span className="text-xs uppercase tracking-wide text-(--color-parchment-muted)">{t('ranks.checkinsLabel')}</span>
              </div>
            </div>
            {next ? (
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-(--color-ink-20)">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.round(progress * 100)}%`, backgroundColor: `var(--color-rank-${rank.id})` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-(--color-ink-40)">
                  {t('ranks.nextRankIn').replace('{days}', String(daysToNext))}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs font-semibold text-(--color-gold)">{t('ranks.maxRank')}</p>
            )}
          </div>
        </div>
      </article>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
          <h2 className="font-accent text-lg font-semibold text-(--color-parchment)">{t('profile.accountTitle')}</h2>

          <div className="mt-3">
            <span className="text-xs uppercase tracking-wide text-(--color-parchment-muted)">{t('profile.nameLabel')}</span>
            {isEditingName ? (
              <div className="mt-1.5 flex gap-2">
                <Field
                  containerClassName="flex-grow"
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                  autoFocus
                />
                <Button onClick={onSaveName} disabled={isSavingName}>
                  {t('common.save')}
                </Button>
                <Button variant="ghost" onClick={() => setIsEditingName(false)} disabled={isSavingName}>
                  {t('common.cancel')}
                </Button>
              </div>
            ) : (
              <button type="button" onClick={onStartEditName} className="mt-1 flex items-center gap-2 text-(--color-parchment) hover:text-(--color-gold)">
                {displayName}
                <EditIcon className="size-3.5 text-(--color-ink-40)" />
              </button>
            )}
          </div>

          <div className="mt-3">
            <span className="text-xs uppercase tracking-wide text-(--color-parchment-muted)">{t('profile.usernameLabel')}</span>
            {isEditingUsername ? (
              <div className="mt-1.5 flex gap-2">
                <Field
                  containerClassName="flex-grow"
                  placeholder={t('profile.usernamePlaceholder')}
                  value={usernameInput}
                  onChange={(event) => setUsernameInput(event.target.value)}
                  autoFocus
                />
                <Button onClick={onSaveUsername} disabled={isSavingUsername || !usernameInput.trim()}>
                  {t('common.save')}
                </Button>
                <Button variant="ghost" onClick={() => setIsEditingUsername(false)} disabled={isSavingUsername}>
                  {t('common.cancel')}
                </Button>
              </div>
            ) : (
              <button type="button" onClick={onStartEditUsername} className="mt-1 flex items-center gap-2 text-(--color-parchment) hover:text-(--color-gold)">
                {userDoc?.username ? `@${userDoc.username}` : t('profile.usernameNotSet')}
                <EditIcon className="size-3.5 text-(--color-ink-40)" />
              </button>
            )}
            {usernameError && <p className="mt-1.5 text-sm text-(--color-accent)">{usernameError}</p>}
            <p className="mt-1.5 text-xs text-(--color-ink-40)">{t('profile.usernameHint')}</p>
          </div>

          <p className="mt-3 text-xs uppercase tracking-wide text-(--color-parchment-muted)">{t('profile.emailLabel')}</p>
          <p className="mt-1 text-sm text-(--color-parchment-muted)">{user.email}</p>

          <div className="mt-4">
            <CustomSelect
              label={t('profile.countryLabel')}
              value={country}
              onChange={(value) => setCountry(user.uid, value)}
              openUpward
              options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
            />
            <p className="mt-1.5 text-xs text-(--color-ink-40)">{t('profile.countryHint')}</p>
          </div>
        </article>

        <article className="rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
          <h2 className="font-accent text-lg font-semibold text-(--color-parchment)">{t('profile.appearanceTitle')}</h2>
          <p className="mt-1 text-xs text-(--color-parchment-muted)">{t('profile.appearanceSubtitle')}</p>
          <div className="mt-4">
            <PalettePicker />
          </div>
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
