import { deleteUser } from 'firebase/auth'
import { collection, getDocs, deleteDoc, doc, type CollectionReference } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'

const FLAT_SUBCOLLECTIONS = ['challenges', 'habitGridHabits', 'habitGridMonths']

const deleteCollection = async (collectionRef: CollectionReference) => {
  const snapshot = await getDocs(collectionRef)
  await Promise.all(snapshot.docs.map((docSnapshot) => deleteDoc(docSnapshot.ref)))
}

export const deleteAccount = async () => {
  const user = auth.currentUser
  if (!user) {
    return
  }
  const uid = user.uid

  for (const subcollection of FLAT_SUBCOLLECTIONS) {
    await deleteCollection(collection(db, 'users', uid, subcollection))
  }

  const categoriesSnapshot = await getDocs(collection(db, 'users', uid, 'watchlistCategories'))
  for (const categoryDoc of categoriesSnapshot.docs) {
    await deleteCollection(collection(db, 'users', uid, 'watchlistCategories', categoryDoc.id, 'items'))
    await deleteDoc(categoryDoc.ref)
  }

  await deleteDoc(doc(db, 'users', uid))
  await deleteUser(user)
}
