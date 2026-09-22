// Funzione serverless Vercel (Edge Runtime) — proxy di sola lettura verso IGDB.
//
// IGDB richiede un token OAuth2 "app access token" di Twitch, ottenuto con
// Client-ID + Client-Secret (grant_type=client_credentials). Il Client-Secret
// non può mai stare nel codice del browser (src/), quindi tutta questa
// autenticazione avviene qui, lato server: il frontend chiama solo GET
// /api/igdb-search?q=<query> e non vede mai le credenziali reali.
//
// Config richiesta su Vercel → Settings → Environment Variables (MAI con
// prefisso VITE_, altrimenti Vite le includerebbe nel bundle del browser):
//   IGDB_CLIENT_ID
//   IGDB_CLIENT_SECRET
// Si ottengono creando un'app su https://dev.twitch.tv/console (gratuito).

export const config = { runtime: 'edge' }

const TWITCH_TOKEN_ENDPOINT = 'https://id.twitch.tv/oauth2/token'
const IGDB_GAMES_ENDPOINT = 'https://api.igdb.com/v4/games'
const IGDB_IMAGE_BASE = 'https://images.igdb.com/igdb/image/upload/t_cover_big'

interface CachedToken {
  accessToken: string
  expiresAt: number
}

// Sopravvive solo finché l'istanza edge resta "calda" tra una richiesta e
// l'altra — nel caso peggiore (istanza nuova) richiediamo semplicemente un
// nuovo token, che è un'operazione economica e senza limiti stretti lato Twitch.
let cachedToken: CachedToken | null = null

const getAppAccessToken = async (clientId: string, clientSecret: string): Promise<string | null> => {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  })
  const response = await fetch(`${TWITCH_TOKEN_ENDPOINT}?${params.toString()}`, { method: 'POST' })
  if (!response.ok) return null

  const json = (await response.json()) as { access_token?: string; expires_in?: number }
  if (!json.access_token) return null

  cachedToken = {
    accessToken: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 0) * 1000,
  }
  return cachedToken.accessToken
}

interface IgdbGame {
  name?: string
  first_release_date?: number
  cover?: { image_id?: string }
}

const escapeApicalypseString = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

export default async function handler(request: Request): Promise<Response> {
  const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

  if (request.method !== 'GET') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  const query = new URL(request.url).searchParams.get('q')?.trim()
  if (!query) return jsonResponse([])

  const clientId = process.env.IGDB_CLIENT_ID
  const clientSecret = process.env.IGDB_CLIENT_SECRET
  // Non configurate: nessun errore rumoroso, semplicemente questa fonte non
  // contribuisce risultati — il frontend continua con le altre fonti (RAWG,
  // FreeToGame, CheapShark) esattamente come se questa non esistesse.
  if (!clientId || !clientSecret) return jsonResponse([])

  try {
    const accessToken = await getAppAccessToken(clientId, clientSecret)
    if (!accessToken) return jsonResponse([])

    const body = [
      'fields name, first_release_date, cover.image_id;',
      `search "${escapeApicalypseString(query)}";`,
      'limit 40;',
    ].join('\n')

    const igdbResponse = await fetch(IGDB_GAMES_ENDPOINT, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'text/plain',
      },
      body,
    })
    if (!igdbResponse.ok) return jsonResponse([])

    const games = (await igdbResponse.json()) as IgdbGame[]
    const results = games.map((game) => ({
      title: game.name || '',
      year: game.first_release_date ? String(new Date(game.first_release_date * 1000).getUTCFullYear()) : '',
      coverUrl: game.cover?.image_id ? `${IGDB_IMAGE_BASE}/${game.cover.image_id}.jpg` : undefined,
    }))

    return jsonResponse(results)
  } catch {
    return jsonResponse([])
  }
}
