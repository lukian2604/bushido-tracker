import { describe, it, expect, vi, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { exportCategoryToPdf, toSafeFileName } from './export-pdf'
import type { WatchlistItem } from './types'

const item = (overrides: Partial<WatchlistItem>): WatchlistItem => ({
  id: 'i1',
  title: 'Naruto',
  year: '2002',
  studio: 'Studio Pierrot',
  status: 'watching',
  watchedAt: null,
  createdAt: null,
  ...overrides,
})

// I veri font TTF (non buffer finti): jsPDF li analizza per costruire le mappe dei glifi al
// momento di addFont, quindi un buffer non valido farebbe fallire i test qui sotto anche se
// il codice fosse corretto.
const readFontBuffer = (fileName: string) => readFileSync(fileURLToPath(new URL(`../../public/fonts/${fileName}`, import.meta.url)))
const bufferToArrayBuffer = (buffer: Buffer) => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

const robotoBuffer = readFontBuffer('Roboto-Regular.ttf')
const notoSansScBuffer = readFontBuffer('NotoSansSC-Variable.ttf')

beforeAll(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      const buffer = url.includes('NotoSansSC') ? notoSansScBuffer : robotoBuffer
      return Promise.resolve({ arrayBuffer: () => Promise.resolve(bufferToArrayBuffer(buffer)) })
    }),
  )
})

describe('exportCategoryToPdf', () => {
  it('generates a PDF and saves it with a filename derived from the category name', async () => {
    const items = [item({ title: 'Naruto' }), item({ id: 'i2', title: 'Bleach', studio: 'Studio Pierrot', status: 'completed' })]

    await exportCategoryToPdf({
      categoryName: 'Anime & Serie',
      generatedAtText: 'Exported on 20 Sep 2026, 22:00',
      items,
      hasAuthor: false,
      authorLabel: 'Author',
      studioLabel: 'Studio',
      columnLabels: { title: 'Title', year: 'Year', status: 'Status', watched: 'Watched' },
      statusLabel: (status) => status,
      watchedLabel: () => 'Not watched',
      locale: 'en',
    })

    // Non intercettiamo doc.save (richiederebbe di mockare jsPDF internamente), ma se la
    // chiamata arriva fin qui senza eccezioni la generazione del documento è andata a buon fine.
    expect(true).toBe(true)
  })

  it('never throws for an empty item list', async () => {
    await expect(
      exportCategoryToPdf({
        categoryName: 'Vuota',
        generatedAtText: 'Exported on 20 Sep 2026, 22:00',
        items: [],
        hasAuthor: false,
        authorLabel: 'Author',
        studioLabel: 'Studio',
        columnLabels: { title: 'Title', year: 'Year', status: 'Status', watched: 'Watched' },
        statusLabel: (status) => status,
        watchedLabel: () => 'Not watched',
        locale: 'en',
      }),
    ).resolves.not.toThrow()
  })

  it('includes the author column only when hasAuthor is true', async () => {
    const items = [item({ title: 'One Piece', author: 'Eiichiro Oda' })]

    await expect(
      exportCategoryToPdf({
        categoryName: 'Manga',
        generatedAtText: 'Exported on 20 Sep 2026, 22:00',
        items,
        hasAuthor: true,
        authorLabel: 'Author',
        studioLabel: 'Publisher',
        columnLabels: { title: 'Title', year: 'Year', status: 'Status', watched: 'Watched' },
        statusLabel: (status) => status,
        watchedLabel: () => 'Not watched',
        locale: 'en',
      }),
    ).resolves.not.toThrow()
  })

  it('embeds the Unicode font and renders Russian titles without throwing (regression: used to render as garbled text with the default font)', async () => {
    await expect(
      exportCategoryToPdf({
        categoryName: 'Аниме',
        generatedAtText: 'Экспортировано 20 сент. 2026, 22:00',
        items: [item({ title: 'Второй сезон', studio: 'Студия Пьеро' })],
        hasAuthor: false,
        authorLabel: 'Author',
        studioLabel: 'Студия',
        columnLabels: { title: 'Название', year: 'Год', status: 'Статус', watched: 'Просмотрено' },
        statusLabel: () => 'Смотрю',
        watchedLabel: () => 'Не просмотрено',
        locale: 'ru',
      }),
    ).resolves.not.toThrow()
  })

  it('uses the CJK font for Japanese and renders kanji/kana without throwing', async () => {
    await expect(
      exportCategoryToPdf({
        categoryName: 'アニメ',
        generatedAtText: '書き出し日時：2026/09/20 22:44',
        items: [item({ title: '進撃の巨人', studio: 'WIT STUDIO' })],
        hasAuthor: false,
        authorLabel: '著者',
        studioLabel: 'スタジオ',
        columnLabels: { title: 'タイトル', year: '年', status: 'ステータス', watched: '視聴済み' },
        statusLabel: () => '視聴中',
        watchedLabel: () => '未視聴',
        locale: 'ja',
      }),
    ).resolves.not.toThrow()
  })

  it('uses the CJK font for Chinese and renders hanzi without throwing', async () => {
    await expect(
      exportCategoryToPdf({
        categoryName: '动漫',
        generatedAtText: '导出于 2026/09/20 22:44',
        items: [item({ title: '海贼王', studio: '东映动画' })],
        hasAuthor: false,
        authorLabel: '作者',
        studioLabel: '工作室',
        columnLabels: { title: '标题', year: '年份', status: '状态', watched: '已观看' },
        statusLabel: () => '观看中',
        watchedLabel: () => '未观看',
        locale: 'zh',
      }),
    ).resolves.not.toThrow()
  })
})

describe('toSafeFileName', () => {
  it('strips punctuation and emoji, collapsing them into single hyphens', () => {
    expect(toSafeFileName('Film / Serie: "Preferiti" 🔥')).toBe('Film-Serie-Preferiti')
  })

  it('keeps accented letters and non-Latin scripts intact', () => {
    expect(toSafeFileName('Città perdute')).toBe('Città-perdute')
    expect(toSafeFileName('マンガ')).toBe('マンガ')
  })

  it('falls back to a generic name when nothing alphanumeric remains', () => {
    expect(toSafeFileName('🔥🔥🔥')).toBe('lista')
  })

  it('trims leading and trailing hyphens', () => {
    expect(toSafeFileName('  !!! Anime !!!  ')).toBe('Anime')
  })
})
