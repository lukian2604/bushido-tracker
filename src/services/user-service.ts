import { doc, getDoc, setDoc, writeBatch, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import type { User } from 'firebase/auth'
import { db, storage } from '@/firebase/config'
import { detectCountry } from '@/lib/countries'
import { generateUniqueUsername } from '@/services/friend-service'
import type { DashboardWidgetConfig, DashboardWidgetLayout, UserDoc } from '@/lib/types'

export const ensureUserDocument = async (user: User | { uid: string; email: string | null; displayName?: string | null }) => {
  const userRef = doc(db, 'users', user.uid)
  const userSnapshot = await getDoc(userRef)

  if (userSnapshot.exists()) {
    const existingUser = userSnapshot.data() as UserDoc
    if (existingUser.username) {
      return existingUser
    }

    try {
      const username = await generateUniqueUsername(existingUser.displayName || user.uid)
      const batch = writeBatch(db)
      batch.set(userRef, { username }, { merge: true })
      batch.set(doc(db, 'usernames', username), { uid: user.uid })
      await batch.commit()
      return { ...existingUser, username }
    } catch {
      // usernames collection may not be writable yet (rules not deployed) — keep the account usable without a username
      return existingUser
    }
  }

  const displayName = user.displayName || user.email!.split('@')[0]

  const newUser = {
    displayName,
    email: user.email!,
    country: detectCountry(),
    createdAt: serverTimestamp(),
  }

  await setDoc(userRef, newUser)

  try {
    const username = await generateUniqueUsername(displayName)
    const batch = writeBatch(db)
    batch.set(userRef, { username }, { merge: true })
    batch.set(doc(db, 'usernames', username), { uid: user.uid })
    await batch.commit()
    return { ...newUser, username } as unknown as UserDoc
  } catch {
    // usernames collection may not be writable yet (rules not deployed) — account is created either way
    return newUser as unknown as UserDoc
  }
}

export const setDisplayName = (uid: string, displayName: string) => {
  return setDoc(doc(db, 'users', uid), { displayName }, { merge: true })
}

export const setCountry = (uid: string, country: string) => {
  return setDoc(doc(db, 'users', uid), { country }, { merge: true })
}

export const setDashboardConfig = (uid: string, dashboardConfig: DashboardWidgetConfig[]) => {
  return setDoc(doc(db, 'users', uid), { dashboardConfig }, { merge: true })
}

export const setDashboardLayout = (uid: string, dashboardLayout: DashboardWidgetLayout[]) => {
  return setDoc(doc(db, 'users', uid), { dashboardLayout }, { merge: true })
}

export const uploadProfilePhoto = async (uid: string, file: File): Promise<string> => {
  const photoRef = ref(storage, `users/${uid}/profile.jpg`)
  await uploadBytes(photoRef, file, { contentType: file.type })
  const photoURL = await getDownloadURL(photoRef)
  await setDoc(doc(db, 'users', uid), { photoURL }, { merge: true })
  return photoURL
}

export const subscribeToUser = (uid: string, callback: (userDoc: UserDoc | null) => void) => {
  return onSnapshot(
    doc(db, 'users', uid),
    (snapshot) => callback(snapshot.exists() ? (snapshot.data() as UserDoc) : null),
    () => {},
  )
}
