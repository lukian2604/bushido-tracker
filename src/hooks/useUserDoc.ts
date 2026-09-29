import { useEffect, useState } from 'react'
import { subscribeToUser } from '@/services/user-service'
import type { UserDoc } from '@/lib/types'

// Il profilo salvato su Firestore (nome visualizzato e foto scelti nel Profilo). Il
// `user` di Firebase Auth invece ha il nome/foto dell'account Google, che l'utente
// non può cambiare dal sito: per mostrare nome e foto usare sempre questo.
export const useUserDoc = (uid: string | undefined) => {
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null)

  useEffect(() => {
    if (!uid) return
    return subscribeToUser(uid, setUserDoc)
  }, [uid])

  return userDoc
}
