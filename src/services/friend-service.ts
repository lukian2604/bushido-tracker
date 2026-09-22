import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  startAt,
  endAt,
  limit,
  documentId,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { slugifyUsername } from '@/lib/username'
import type { ActivityEvent, ActivityEventType, Friendship, PublicProfile } from '@/lib/types'
import type { RankId } from '@/lib/ranks'

const pairId = (a: string, b: string) => (a < b ? `${a}_${b}` : `${b}_${a}`)

export const isUsernameAvailable = async (username: string) => {
  const snapshot = await getDoc(doc(db, 'usernames', username))
  return !snapshot.exists()
}

export const generateUniqueUsername = async (displayName: string) => {
  const base = slugifyUsername(displayName) || 'user'
  const safeBase = base.length < 3 ? base.padEnd(3, '0') : base

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `${safeBase}_${Math.random().toString(36).slice(2, 6)}`
    if (await isUsernameAvailable(candidate)) return candidate
  }
  return `user_${Date.now().toString(36)}`
}

export const claimUsername = async (uid: string, username: string, previousUsername?: string) => {
  const batch = writeBatch(db)
  if (previousUsername && previousUsername !== username) {
    batch.delete(doc(db, 'usernames', previousUsername))
  }
  batch.set(doc(db, 'usernames', username), { uid })
  batch.set(doc(db, 'users', uid), { username }, { merge: true })
  await batch.commit()
}

export const syncPublicProfile = (
  uid: string,
  data: { displayName: string; username?: string; photoURL?: string; currentStreak: number },
) => {
  const { displayName, username, photoURL, currentStreak } = data
  return setDoc(
    doc(db, 'publicProfiles', uid),
    {
      displayName,
      currentStreak,
      ...(username ? { username } : {}),
      ...(photoURL ? { photoURL } : {}),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export const getPublicProfile = async (uid: string): Promise<PublicProfile | null> => {
  const snapshot = await getDoc(doc(db, 'publicProfiles', uid))
  return snapshot.exists() ? (snapshot.data() as PublicProfile) : null
}

export const searchUsersByUsername = async (prefix: string, excludeUid: string) => {
  const usernamesQuery = query(
    collection(db, 'usernames'),
    orderBy(documentId()),
    startAt(prefix),
    endAt(`${prefix}`),
    limit(8),
  )
  const snapshot = await getDocs(usernamesQuery)
  const candidates = snapshot.docs
    .map((entry) => ({ username: entry.id, uid: (entry.data() as { uid: string }).uid }))
    .filter((entry) => entry.uid !== excludeUid)

  const profiles = await Promise.all(
    candidates.map(async ({ uid, username }) => {
      const profile = await getPublicProfile(uid)
      return profile ? { uid, username, ...profile } : null
    }),
  )

  return profiles.filter((entry): entry is PublicProfile & { uid: string; username: string } => entry !== null)
}

export const sendFriendRequest = (myUid: string, otherUid: string) => {
  const uidA = myUid < otherUid ? myUid : otherUid
  const uidB = myUid < otherUid ? otherUid : myUid
  return setDoc(doc(db, 'friendships', pairId(myUid, otherUid)), {
    uidA,
    uidB,
    requesterUid: myUid,
    status: 'pending',
    createdAt: serverTimestamp(),
  })
}

export const acceptFriendRequest = (myUid: string, otherUid: string) => {
  return updateDoc(doc(db, 'friendships', pairId(myUid, otherUid)), { status: 'accepted' })
}

export const removeFriendship = (myUid: string, otherUid: string) => {
  return deleteDoc(doc(db, 'friendships', pairId(myUid, otherUid)))
}

export const subscribeToFriendships = (uid: string, callback: (friendships: Friendship[]) => void) => {
  let resultsA: Friendship[] = []
  let resultsB: Friendship[] = []
  const emit = () => callback([...resultsA, ...resultsB])

  const unsubA = onSnapshot(query(collection(db, 'friendships'), where('uidA', '==', uid)), (snapshot) => {
    resultsA = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as Friendship)
    emit()
  })
  const unsubB = onSnapshot(query(collection(db, 'friendships'), where('uidB', '==', uid)), (snapshot) => {
    resultsB = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as Friendship)
    emit()
  })

  return () => {
    unsubA()
    unsubB()
  }
}

export const logActivityEvent = (uid: string, type: ActivityEventType, extra: { rankId?: RankId; streak?: number } = {}) => {
  return addDoc(collection(db, 'activityEvents'), {
    uid,
    type,
    ...extra,
    createdAt: serverTimestamp(),
  }).catch(() => {})
}

export const getActivityFeed = async (uids: string[]): Promise<ActivityEvent[]> => {
  if (uids.length === 0) return []
  const feedQuery = query(collection(db, 'activityEvents'), where('uid', 'in', uids.slice(0, 30)), orderBy('createdAt', 'desc'), limit(20))
  const snapshot = await getDocs(feedQuery)
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as ActivityEvent)
}
