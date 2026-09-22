import type { MediaType } from './types'

export const KNOWLEDGE_MEDIA_TYPES: MediaType[] = ['book', 'manga', 'audiobook']
export const LEISURE_MEDIA_TYPES: MediaType[] = ['video', 'game']

export const isKnowledgeMediaType = (mediaType: MediaType) => KNOWLEDGE_MEDIA_TYPES.includes(mediaType)
