import { deleteUser } from 'firebase/auth'
import { collection, getDocs, doc, query, where, writeBatch, type DocumentReference } from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { auth, db, storage } from '@/firebase/config'
import type { WatchlistItem } from '@/lib/types'
import { isFirebaseStorageUrl } from '@/lib/image-data'

const FLAT_SUBCOLLECTIONS = ['challenges', 'habitGridHabits', 'habitGridMonths']

// Il limite di Firestore per un singolo writeBatch è 500 operazioni: qui restiamo
// prudenzialmente sotto quella soglia e committiamo a blocchi.
const BATCH_LIMIT = 450

const commitInChunks = async (refs: DocumentReference[]) => {
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db)
    refs.slice(i, i + BATCH_LIMIT).forEach((ref) => batch.delete(ref))
    await batch.commit()
  }
}

// Pulizia best-effort dei file caricati prima del passaggio a Firestore: le immagini
// nuove stanno nei documenti stessi (già cancellati). Qualunque errore di Storage (file
// assente, Storage mai attivato sul progetto) non deve bloccare la cancellazione account.
const deleteStorageObjectIfExists = async (path: string) => {
  await deleteObject(ref(storage, path)).catch(() => {})
}

export const deleteAccount = async () => {
  const user = auth.currentUser
  if (!user) return
  const uid = user.uid

  const refsToDelete: DocumentReference[] = []
  const coverUrlsToDelete: string[] = []

  for (const subcollection of FLAT_SUBCOLLECTIONS) {
    const snapshot = await getDocs(collection(db, 'users', uid, subcollection))
    snapshot.docs.forEach((docSnapshot) => refsToDelete.push(docSnapshot.ref))
  }

  const categoriesSnapshot = await getDocs(collection(db, 'users', uid, 'watchlistCategories'))
  for (const categoryDoc of categoriesSnapshot.docs) {
    const itemsSnapshot = await getDocs(collection(db, 'users', uid, 'watchlistCategories', categoryDoc.id, 'items'))
    itemsSnapshot.docs.forEach((itemDoc) => {
      refsToDelete.push(itemDoc.ref)
      const coverUrl = (itemDoc.data() as WatchlistItem).coverUrl
      if (coverUrl && isFirebaseStorageUrl(coverUrl)) coverUrlsToDelete.push(coverUrl)
    })
    refsToDelete.push(categoryDoc.ref)
  }

  // Tutti gli username eventualmente posseduti da questo uid, non solo quello
  // tracciato su users/{uid}.username — evita di lasciarne orfani per sempre.
  const usernamesSnapshot = await getDocs(query(collection(db, 'usernames'), where('uid', '==', uid)))
  usernamesSnapshot.docs.forEach((entry) => refsToDelete.push(entry.ref))
  refsToDelete.push(doc(db, 'publicProfiles', uid))

  const [friendshipsAsA, friendshipsAsB] = await Promise.all([
    getDocs(query(collection(db, 'friendships'), where('uidA', '==', uid))),
    getDocs(query(collection(db, 'friendships'), where('uidB', '==', uid))),
  ])
  friendshipsAsA.docs.forEach((entry) => refsToDelete.push(entry.ref))
  friendshipsAsB.docs.forEach((entry) => refsToDelete.push(entry.ref))

  refsToDelete.push(doc(db, 'users', uid))

  await commitInChunks(refsToDelete)
  await deleteStorageObjectIfExists(`users/${uid}/profile.jpg`)
  await Promise.all(coverUrlsToDelete.map((url) => deleteObject(ref(storage, url)).catch(() => {})))
  await deleteUser(user)
}
