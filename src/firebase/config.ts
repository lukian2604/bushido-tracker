import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBgHZkBHatFkPbmzSNE0sLyLMAR0W0MhJs',
  authDomain: 'bushido-tracker.firebaseapp.com',
  projectId: 'bushido-tracker',
  storageBucket: 'bushido-tracker.firebasestorage.app',
  messagingSenderId: '294160567274',
  appId: '1:294160567274:web:299a6fc27426d7f1944093',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
