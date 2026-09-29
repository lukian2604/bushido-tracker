import { doc, getDoc, setDoc, writeBatch, onSnapshot, serverTimestamp } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '@/firebase/config'
import { detectCountry } from '@/lib/countries'
import { compressImageToDataUrl, PROFILE_PHOTO_SIZE } from '@/lib/image-data'
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

// Foto compressa (256 px, JPEG) salvata direttamente nel documento utente — niente
// Firebase Storage (vedi lib/image-data.ts).
export const uploadProfilePhoto = async (uid: string, file: File): Promise<string> => {
  const photoURL = await compressImageToDataUrl(file, PROFILE_PHOTO_SIZE)
  await setDoc(doc(db, 'users', uid), { photoURL }, { merge: true })
  return photoURL
}

// Tour di benvenuto: salvato sul profilo (non in localStorage) così non ricompare su un
// altro dispositivo; false per rivederlo dal Profilo.
export const setOnboardingDone = (uid: string, onboardingDone: boolean) => {
  return setDoc(doc(db, 'users', uid), { onboardingDone }, { merge: true })
}

export const setProfilePhotoLink = (uid: string, photoURL: string) => {
  return setDoc(doc(db, 'users', uid), { photoURL }, { merge: true })
}

export const subscribeToUser = (uid: string, callback: (userDoc: UserDoc | null) => void) => {
  return onSnapshot(
    doc(db, 'users', uid),
    (snapshot) => callback(snapshot.exists() ? (snapshot.data() as UserDoc) : null),
    () => {},
  )
}
