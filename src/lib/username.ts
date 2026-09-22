const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/

export const isValidUsername = (username: string) => USERNAME_REGEX.test(username)

export const normalizeUsername = (raw: string) => raw.trim().toLowerCase()

export const slugifyUsername = (raw: string) =>
  raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 14)
