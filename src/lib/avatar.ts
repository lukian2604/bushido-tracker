const AVATAR_COLORS = ['#B5332B', '#3A9D72', '#3B7FC4', '#C9A24B', '#8C6A4C', '#8C4C7A', '#4C4C8C']

export const colorForUid = (uid: string) => {
  let hash = 0
  for (let i = 0; i < uid.length; i += 1) {
    hash = (hash * 31 + uid.charCodeAt(i)) % AVATAR_COLORS.length
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export const initialFor = (label: string) => label.trim().charAt(0).toUpperCase() || '?'
