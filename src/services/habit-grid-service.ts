import {
  doc,
  collection,
  addDoc,
  deleteDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { Habit, HabitMonthDoc, HabitGridMonthSummary, WeeklyActivityDay } from '@/lib/types'

const monthRef = (uid: string, yearMonth: string) => doc(db, 'users', uid, 'habitGridMonths', yearMonth)
const habitsRef = (uid: string) => collection(db, 'users', uid, 'habitGridHabits')

export const subscribeToHabits = (uid: string, callback: (habits: Habit[]) => void) => {
  return onSnapshot(query(habitsRef(uid), orderBy('createdAt', 'asc')), (snapshot) => {
    callback(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Habit)))
  })
}

export const addHabit = (uid: string, name: string) => {
  return addDoc(habitsRef(uid), { name, createdAt: serverTimestamp() })
}

export const deleteHabit = (uid: string, habitId: string) => {
  return deleteDoc(doc(db, 'users', uid, 'habitGridHabits', habitId))
}

export const updateHabit = (uid: string, habitId: string, name: string) => {
  return updateDoc(doc(db, 'users', uid, 'habitGridHabits', habitId), { name })
}

const daysInMonthLocal = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()

export const getHabitGridMonthsSummary = async (uid: string, monthsCount = 3): Promise<HabitGridMonthSummary[]> => {
  const habitsSnapshot = await getDocs(habitsRef(uid))
  const habitCount = habitsSnapshot.size

  if (habitCount === 0) {
    return []
  }

  const now = new Date()
  const months: { date: Date; yearMonth: string; isCurrent: boolean }[] = []
  for (let i = monthsCount - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      date,
      yearMonth: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      isCurrent: i === 0,
    })
  }

  return Promise.all(months.map(async ({ date, yearMonth, isCurrent }) => {
    const monthSnapshot = await getDoc(monthRef(uid, yearMonth))
    const days = monthSnapshot.exists() ? (monthSnapshot.data() as HabitMonthDoc).days || {} : {}
    const daysElapsed = isCurrent ? now.getDate() : daysInMonthLocal(date)

    let checked = 0
    for (let day = 1; day <= daysElapsed; day += 1) {
      const dayData = days[String(day)] || {}
      checked += Object.values(dayData).filter(Boolean).length
    }

    return { date, isCurrent, checked, total: habitCount * daysElapsed }
  }))
}

const fetchDaySeries = async (uid: string, habitCount: number, dates: Date[]): Promise<WeeklyActivityDay[]> => {
  const entries = dates.map((date) => ({
    date,
    yearMonth: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    dayOfMonth: date.getDate(),
  }))

  const monthDocsByYearMonth: Record<string, Record<string, Record<string, boolean>>> = {}
  for (const yearMonth of new Set(entries.map((entry) => entry.yearMonth))) {
    const snapshot = await getDoc(monthRef(uid, yearMonth))
    monthDocsByYearMonth[yearMonth] = snapshot.exists() ? (snapshot.data() as HabitMonthDoc).days || {} : {}
  }

  return entries.map(({ date, yearMonth, dayOfMonth }) => {
    const dayData = monthDocsByYearMonth[yearMonth][String(dayOfMonth)] || {}
    const checked = Object.values(dayData).filter(Boolean).length
    return { date, checked, total: habitCount }
  })
}

export const getWeeklyActivity = async (uid: string, weekOffset = 0): Promise<WeeklyActivityDay[]> => {
  const habitsSnapshot = await getDocs(habitsRef(uid))
  const habitCount = habitsSnapshot.size

  const now = new Date()
  const isoDayOfWeek = (now.getDay() + 6) % 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - isoDayOfWeek + weekOffset * 7)

  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return date
  })

  return fetchDaySeries(uid, habitCount, dates)
}

export const getHabitActivitySeries = async (uid: string, days: number): Promise<WeeklyActivityDay[]> => {
  const habitsSnapshot = await getDocs(habitsRef(uid))
  const habitCount = habitsSnapshot.size

  const now = new Date()
  const dates = Array.from({ length: days }, (_, i) => {
    const date = new Date(now)
    date.setDate(now.getDate() - (days - 1 - i))
    return date
  })

  return fetchDaySeries(uid, habitCount, dates)
}

export const getConsistencyMap = async (uid: string, weeksCount = 18): Promise<WeeklyActivityDay[]> => {
  const habitsSnapshot = await getDocs(habitsRef(uid))
  const habitCount = habitsSnapshot.size

  const now = new Date()
  const isoDayOfWeek = (now.getDay() + 6) % 7
  const thisMonday = new Date(now)
  thisMonday.setDate(now.getDate() - isoDayOfWeek)
  const startMonday = new Date(thisMonday)
  startMonday.setDate(thisMonday.getDate() - (weeksCount - 1) * 7)

  const dates = Array.from({ length: weeksCount * 7 }, (_, i) => {
    const date = new Date(startMonday)
    date.setDate(startMonday.getDate() + i)
    return date
  })

  return fetchDaySeries(uid, habitCount, dates)
}

export const subscribeToMonth = (uid: string, yearMonth: string, callback: (data: HabitMonthDoc) => void) => {
  return onSnapshot(monthRef(uid, yearMonth), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as HabitMonthDoc) : { days: {} })
  })
}

export const toggleCell = async (uid: string, yearMonth: string, day: number, habitId: string, value: boolean) => {
  const ref = monthRef(uid, yearMonth)
  const snapshot = await getDoc(ref)

  if (!snapshot.exists()) {
    await setDoc(ref, { days: { [day]: { [habitId]: value } } })
    return
  }

  await updateDoc(ref, { [`days.${day}.${habitId}`]: value })
}
