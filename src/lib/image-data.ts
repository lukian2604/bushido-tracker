// Immagini caricate dall'utente (foto profilo, copertine) salvate direttamente in
// Firestore come data URL JPEG compresso, invece che in Firebase Storage: Storage
// richiede il piano a pagamento (Blaze), mentre il GB gratuito di Firestore basta per
// decine di migliaia di immagini a queste dimensioni.

// Deve restare allineato con isImageRef() in firestore.rules.
export const MAX_IMAGE_DATA_URL_LENGTH = 100_000
export const MAX_IMAGE_LINK_LENGTH = 500

// Il file originale può essere grande (foto dal telefono): lo riduciamo noi.
export const MAX_IMAGE_INPUT_BYTES = 15 * 1024 * 1024
export const ALLOWED_IMAGE_INPUT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export const PROFILE_PHOTO_SIZE = { maxWidth: 256, maxHeight: 256 }
export const COVER_SIZE = { maxWidth: 300, maxHeight: 450 }

const JPEG_QUALITIES = [0.85, 0.75, 0.65, 0.55]

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image-decode-failed'))
    }
    image.src = url
  })

// Ridimensiona (mantenendo le proporzioni, mai ingrandendo) e comprime in JPEG
// abbassando la qualità finché il risultato sta nel limite; se non basta, rimpicciolisce.
export const compressImageToDataUrl = async (
  file: File,
  { maxWidth, maxHeight }: { maxWidth: number; maxHeight: number },
): Promise<string> => {
  const image = await loadImage(file)
  let scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight)

  for (let attempt = 0; attempt < 4; attempt++) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas-unavailable')
    // Sfondo pieno: le PNG trasparenti in JPEG diventerebbero nere.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    for (const quality of JPEG_QUALITIES) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      if (dataUrl.length <= MAX_IMAGE_DATA_URL_LENGTH) return dataUrl
    }
    scale *= 0.75
  }
  throw new Error('image-too-large')
}

// Link a un'immagine su internet: solo http(s), niente javascript:/data: incollati a mano.
export const normalizeImageLink = (raw: string): string | null => {
  const trimmed = raw.trim()
  if (!trimmed || trimmed.length > MAX_IMAGE_LINK_LENGTH) return null
  try {
    const url = new URL(trimmed)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}
