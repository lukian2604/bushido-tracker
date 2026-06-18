import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  GoogleAuthProvider,
  type AuthError,
} from 'firebase/auth'
import { auth } from '@/firebase/config'
import { ensureUserDocument, setDisplayName } from '@/services/user-service'
import { useTranslation } from '@/hooks/useTranslation'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

const ERROR_KEYS: Record<string, string> = {
  'auth/invalid-email': 'error.invalidEmail',
  'auth/user-not-found': 'error.userNotFound',
  'auth/wrong-password': 'error.wrongPassword',
  'auth/invalid-credential': 'error.invalidCredential',
  'auth/email-already-in-use': 'error.emailInUse',
  'auth/weak-password': 'error.weakPassword',
  'auth/popup-closed-by-user': 'error.popupClosed',
}

export const LoginPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const friendlyError = (error: AuthError) => t(ERROR_KEYS[error.code] || 'error.generic')

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      if (mode === 'signup') {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
        const trimmedName = name.trim()
        await updateProfile(credential.user, { displayName: trimmedName })
        await ensureUserDocument({ uid: credential.user.uid, email: credential.user.email, displayName: trimmedName })
        await setDisplayName(credential.user.uid, trimmedName)
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password)
      }

      navigate('/dashboard')
    } catch (error) {
      setErrorMessage(friendlyError(error as AuthError))
      setIsSubmitting(false)
    }
  }

  const onGoogleClick = async () => {
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider())
      await ensureUserDocument(credential.user)
      navigate('/dashboard')
    } catch (error) {
      setErrorMessage(friendlyError(error as AuthError))
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-ink) px-4">
      <div className="w-full max-w-130 rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-10">
        <h1 className="text-center font-accent text-2xl font-semibold text-(--color-parchment)">
          {mode === 'signup' ? t('login.signupTitle') : t('login.signinTitle')}
        </h1>
        <p className="mb-7 text-center text-sm text-(--color-parchment-muted)">{t('login.subtitle')}</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4.5">
          {mode === 'signup' && (
            <Field
              label={t('login.nameLabel')}
              placeholder={t('login.namePlaceholder')}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          )}
          <Field
            label={t('login.emailLabel')}
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Field
            label={t('login.passwordLabel')}
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {errorMessage && <p className="text-sm text-(--color-accent)">{errorMessage}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? t('login.submittingButton') : mode === 'signup' ? t('login.signupButton') : t('login.signinButton')}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-(--color-ink-40)">
          <span className="h-px flex-grow bg-(--color-border)" />
          {t('login.divider')}
          <span className="h-px flex-grow bg-(--color-border)" />
        </div>

        <Button type="button" variant="ghost" onClick={onGoogleClick} disabled={isSubmitting} className="w-full">
          <img src="/icons/google.svg" alt="" width={18} height={18} />
          {t('login.googleButton')}
        </Button>

        <p className="mt-5 text-center text-sm">
          <button
            type="button"
            onClick={() => { setMode((current) => (current === 'signin' ? 'signup' : 'signin')); setErrorMessage('') }}
            className="text-(--color-gold) hover:underline"
          >
            {mode === 'signup' ? t('login.toggleToSignin') : t('login.toggleToSignup')}
          </button>
        </p>
      </div>
    </div>
  )
}
