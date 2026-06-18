import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '@/firebase/config'
import type { UserDoc } from '@/lib/types'

export const ensureUserDocument = async (user: User | { uid: string; email: string | null; displayName?: string | null }) => {
  const userRef = doc(db, 'users', user.uid)
  const userSnapshot = await getDoc(userRef)

  if (userSnapshot.exists()) {
    return userSnapshot.data() as UserDoc
  }

  const newUser = {
    displayName: user.displayName || user.email!.split('@')[0],
    email: user.email!,
    createdAt: serverTimestamp(),
  }

  await setDoc(userRef, newUser)
  return newUser as unknown as UserDoc
}

export const setDisplayName = (uid: string, displayName: string) => {
  return setDoc(doc(db, 'users', uid), { displayName }, { merge: true })
}

export const subscribeToUser = (uid: string, callback: (userDoc: UserDoc | null) => void) => {
  return onSnapshot(doc(db, 'users', uid), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as UserDoc) : null)
  })
}
