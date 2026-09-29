import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { subscribeToUser, setOnboardingDone } from '@/services/user-service'
import type { UserDoc } from '@/lib/types'

// Il tour compare finché il profilo non ha onboardingDone: true — quindi al primo
// accesso dopo la registrazione, una sola volta, su qualunque dispositivo.
export const useOnboarding = () => {
  const { user } = useAuth()
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    if (!user) return
    return subscribeToUser(user.uid, (nextUserDoc) => {
      setUserDoc(nextUserDoc)
      setHasLoaded(true)
    })
  }, [user])

  // Aspettiamo il documento: senza, un utente che l'ha già visto lo rivedrebbe per un attimo.
  const isOpen = !!user && hasLoaded && !!userDoc && userDoc.onboardingDone !== true

  const complete = () => {
    if (!user) return
    // Aggiornamento ottimistico: la finestra si chiude subito anche se la scrittura tarda.
    setUserDoc((current) => (current ? { ...current, onboardingDone: true } : current))
    setOnboardingDone(user.uid, true).catch(() => {})
  }

  return { isOpen, displayName: userDoc?.displayName || '', complete }
}
