// Le fonti di ricerca restituiscono copertine piccole (miniature per le liste). Per la
// vista ingrandita proviamo la versione più grande che la stessa fonte offre; se non
// esiste, CoverLightbox ripiega sull'URL originale.
const LARGER_COVER_RULES: [RegExp, string][] = [
  [/(anilistcdn\/media\/\w+\/cover\/)(?:medium|small)\//, '$1large/'], // AniList
  [/(image\.tmdb\.org\/t\/p\/)w\d+\//, '$1w500/'], // TMDB
  [/(covers\.openlibrary\.org\/b\/id\/\d+)-[SM]\.jpg/, '$1-L.jpg'], // Open Library
  [/\/t_cover_big\//, '/t_cover_big_2x/'], // IGDB
  [/(commons\.wikimedia\.org\/wiki\/Special:FilePath\/[^?]+\?width=)\d+/, '$1900'], // Wikimedia Commons
  [/\/capsule_sm_120\.jpg/, '/header.jpg'], // Steam (CheapShark)
]

export const largerCoverUrl = (url: string): string => {
  for (const [pattern, replacement] of LARGER_COVER_RULES) {
    if (pattern.test(url)) return url.replace(pattern, replacement)
  }
  return url
}
