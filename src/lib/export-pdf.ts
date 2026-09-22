import type { WatchlistItem } from './types'

interface ExportCategoryPdfOptions {
  categoryName: string
  generatedAtText: string
  items: WatchlistItem[]
  hasAuthor: boolean
  authorLabel: string
  studioLabel: string
  columnLabels: { title: string; year: string; status: string; watched: string }
  statusLabel: (status: WatchlistItem['status']) => string
  watchedLabel: (item: WatchlistItem) => string
  // Serve a scegliere il font giusto: il giapponese/cinese ha bisogno di un font CJK molto
  // più pesante (~17MB) di quello usato per le altre lingue (~500KB), quindi lo scarichiamo
  // solo quando davvero serve, non sempre.
  locale: string
}

export const toSafeFileName = (name: string): string =>
  name.trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'lista'

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  // In blocchi, altrimenti String.fromCharCode(...bytes) supera il limite di argomenti
  // della funzione per file di questa dimensione.
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

interface PdfFont {
  file: string
  name: string
}

const LATIN_FONT: PdfFont = { file: 'Roboto-Regular.ttf', name: 'Roboto' }
const CJK_FONT: PdfFont = { file: 'NotoSansSC-Variable.ttf', name: 'NotoSansSC' }
const CJK_LOCALES = ['ja', 'zh']

const fontBase64Cache = new Map<string, Promise<string>>()

// Il font predefinito di jsPDF (Helvetica) copre solo l'alfabeto latino di base: un titolo
// tradotto in russo, ad esempio, uscirebbe come una sequenza di caratteri a caso invece del
// cirillico vero. Roboto copre anche cirillico e greco, quindi risolve la maggior parte delle
// lingue del sito con un file leggero (~500KB). Giapponese e cinese hanno bisogno di un font
// CJK dedicato e molto più pesante (~17MB, l'unico formato TrueType — non OTF — che jsPDF
// riesce davvero a interpretare) — scaricato solo quando la lingua del sito lo richiede.
const loadFontBase64 = (font: PdfFont): Promise<string> => {
  let promise = fontBase64Cache.get(font.file)
  if (!promise) {
    promise = fetch(`/fonts/${font.file}`)
      .then((response) => response.arrayBuffer())
      .then(arrayBufferToBase64)
    fontBase64Cache.set(font.file, promise)
  }
  return promise
}

// jsPDF/jspdf-autotable sono caricati solo quando serve davvero (non nel bundle principale),
// dato che l'esportazione PDF è una funzione usata occasionalmente, non ad ogni visita.
export const exportCategoryToPdf = async (options: ExportCategoryPdfOptions) => {
  const { categoryName, generatedAtText, items, hasAuthor, authorLabel, studioLabel, columnLabels, statusLabel, watchedLabel, locale } =
    options

  const font = CJK_LOCALES.includes(locale) ? CJK_FONT : LATIN_FONT

  const [[{ jsPDF }, { default: autoTable }], fontBase64] = await Promise.all([
    Promise.all([import('jspdf'), import('jspdf-autotable')]),
    loadFontBase64(font),
  ])

  const doc = new jsPDF()
  doc.addFileToVFS(font.file, fontBase64)
  doc.addFont(font.file, font.name, 'normal')
  doc.setFont(font.name)

  doc.setFontSize(16)
  doc.text(categoryName, 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(generatedAtText, 14, 22)
  doc.setTextColor(0)

  const head = [
    [columnLabels.title, columnLabels.year, ...(hasAuthor ? [authorLabel] : []), studioLabel, columnLabels.status, columnLabels.watched],
  ]
  const body = items.map((item) => [
    item.title,
    item.year || '—',
    ...(hasAuthor ? [item.author || '—'] : []),
    item.studio || '—',
    statusLabel(item.status),
    watchedLabel(item),
  ])

  autoTable(doc, {
    head,
    body,
    startY: 28,
    styles: { font: font.name, fontSize: 9 },
    // fontStyle 'normal' forzato: non abbiamo incorporato la variante grassetto del font,
    // altrimenti l'intestazione tornerebbe silenziosamente al font di default (senza cirillico/CJK).
    // textColor bianco esplicito: senza, il testo scuro di default di autoTable è invisibile
    // sopra a un fillColor quasi nero come questo.
    headStyles: { font: font.name, fontStyle: 'normal', fillColor: [30, 30, 30], textColor: [255, 255, 255] },
  })

  doc.save(`${toSafeFileName(categoryName)}.pdf`)
}
