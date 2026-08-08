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
  arrayUnion,
  arrayRemove,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { Challenge, ChallengeMode } from '@/lib/types'

const challengesRef = (uid: string) => collection(db, 'users', uid, 'challenges')

export const subscribeToChallenges = (uid: string, callback: (challenges: Challenge[]) => void) => {
  return onSnapshot(
    query(challengesRef(uid), orderBy('createdAt', 'desc')),
    (snapshot) => callback(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Challenge))),
    () => {},
  )
}

export const getChallengesOnce = async (uid: string): Promise<Challenge[]> => {
  const snapshot = await getDocs(query(challengesRef(uid), orderBy('createdAt', 'desc')))
  return snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Challenge))
}

export const createChallenge = (
  uid: string,
  { name, startDate, endDate, mode }: { name: string; startDate: string; endDate: string; mode: ChallengeMode },
) => {
  return addDoc(challengesRef(uid), {
    name,
    startDate,
    endDate,
    mode,
    completedDates: [],
    createdAt: serverTimestamp(),
  })
}

export const toggleDayManual = (uid: string, challengeId: string, dateKey: string, isCompleted: boolean) => {
  const challengeRef = doc(db, 'users', uid, 'challenges', challengeId)
  return updateDoc(challengeRef, {
    completedDates: isCompleted ? arrayUnion(dateKey) : arrayRemove(dateKey),
  })
}

export const deleteChallenge = (uid: string, challengeId: string) => {
  return deleteDoc(doc(db, 'users', uid, 'challenges', challengeId))
}

export const updateChallenge = (
  uid: string,
  challengeId: string,
  { name, startDate, endDate, mode }: { name: string; startDate: string; endDate: string; mode: ChallengeMode },
) => {
  return updateDoc(doc(db, 'users', uid, 'challenges', challengeId), { name, startDate, endDate, mode })
}
