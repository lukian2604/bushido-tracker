import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { WatchlistCategory, WatchlistCategoryWithProgress, WatchlistItem, WatchlistStatus } from '@/lib/types'

const categoriesRef = (uid: string) => collection(db, 'users', uid, 'watchlistCategories')
const itemsRef = (uid: string, categoryId: string) => collection(db, 'users', uid, 'watchlistCategories', categoryId, 'items')

export const subscribeToCategories = (uid: string, callback: (categories: WatchlistCategory[]) => void) => {
  return onSnapshot(
    query(categoriesRef(uid), orderBy('createdAt', 'asc')),
    (snapshot) => callback(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as WatchlistCategory))),
    () => {},
  )
}

export const getAllCategoriesWithProgress = async (uid: string): Promise<WatchlistCategoryWithProgress[]> => {
  const categoriesSnapshot = await getDocs(categoriesRef(uid))
  const categories = categoriesSnapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as WatchlistCategory))

  return Promise.all(categories.map(async (category) => {
    const itemsSnapshot = await getDocs(itemsRef(uid, category.id))
    const items = itemsSnapshot.docs.map((docSnapshot) => docSnapshot.data() as WatchlistItem)
    const watched = items.filter((item) => !!item.watchedAt).length
    return { ...category, total: items.length, watched }
  }))
}

export const createCategory = (uid: string, name: string) => {
  return addDoc(categoriesRef(uid), { name, createdAt: serverTimestamp() })
}

export const deleteCategory = (uid: string, categoryId: string) => {
  return deleteDoc(doc(db, 'users', uid, 'watchlistCategories', categoryId))
}

export const updateCategory = (uid: string, categoryId: string, name: string) => {
  return updateDoc(doc(db, 'users', uid, 'watchlistCategories', categoryId), { name })
}

export const subscribeToItems = (uid: string, categoryId: string, callback: (items: WatchlistItem[]) => void) => {
  return onSnapshot(
    query(itemsRef(uid, categoryId), orderBy('createdAt', 'asc')),
    (snapshot) => callback(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as WatchlistItem))),
    () => {},
  )
}

export interface WatchlistItemInput {
  title: string
  year: string
  studio: string
  status: WatchlistStatus
}

export const addItem = (uid: string, categoryId: string, { title, year, studio, status }: WatchlistItemInput) => {
  return addDoc(itemsRef(uid, categoryId), {
    title,
    year,
    studio,
    status,
    watchedAt: null,
    createdAt: serverTimestamp(),
  })
}

export const markWatched = (uid: string, categoryId: string, itemId: string, isWatched: boolean) => {
  const itemRef = doc(db, 'users', uid, 'watchlistCategories', categoryId, 'items', itemId)
  return updateDoc(itemRef, {
    watchedAt: isWatched ? serverTimestamp() : null,
    ...(isWatched ? { status: 'completed' } : {}),
  })
}

export const updateItem = (uid: string, categoryId: string, itemId: string, { title, year, studio, status }: WatchlistItemInput) => {
  const itemRef = doc(db, 'users', uid, 'watchlistCategories', categoryId, 'items', itemId)
  return updateDoc(itemRef, { title, year, studio, status })
}

export const deleteItem = (uid: string, categoryId: string, itemId: string) => {
  return deleteDoc(doc(db, 'users', uid, 'watchlistCategories', categoryId, 'items', itemId))
}
