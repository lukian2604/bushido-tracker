# ⚔️ Bushido Tracker — Compiti da Fare

Elenco di lavoro concordato, in ordine di priorità. Spunto le caselle mano a mano che finisco, così puoi vedere lo stato in ogni momento senza dover rileggere tutta la conversazione.

Legenda: `[ ]` da fare · `[~]` in corso · `[x]` fatto

---

## 📍 Stato attuale (aggiornato 2026-09-22)

**Blocco principale, ancora aperto**: `firestore.rules` **e** `storage.rules` sono scritte correttamente ma **non deployate** su Firebase — serve un tuo `firebase login` interattivo (non posso farlo io). Finché non viene fatto, restano bloccati con "Missing or insufficient permissions": nome utente, ricerca amici, colori/emoji custom, caricamento copertina elementi, caricamento foto profilo. Sono tutte funzioni già costruite e corrette nel codice, non mancanti.

**Altri blocchi noti (esterni, non dipendono dal codice)**:
- Ricerca videogiochi (RAWG): serve ottenere una chiave API gratuita da rawg.io (il sito era tornato online dopo un'interruzione).
- Google Books può esaurire la sua quota giornaliera gratuita di tanto in tanto (si resetta da sola) — da oggi, Open Library fa comunque da rete di sicurezza per Libri/Fumetti in quei momenti.
- `git` non funziona in questa sessione shell (manca l'accettazione della licenza Xcode) — da sistemare con `sudo xcodebuild -license` da terminale prima del prossimo commit/push.

**Fatto di recente (2026-09-22)**: **security audit completa del sito** (avviata il 21/09, interrotta per token esauriti, ripresa e conclusa oggi con verifica indipendente di ogni sospetto). Nessuna falla critica trovata (nessun furto account, nessun accesso ai dati di altri utenti). 3 sospetti di ieri erano falsi allarmi, scartati dopo verifica. **7 problemi reali confermati e corretti in questa sessione** (tutti gravità bassa): upload SVG accettato come immagine, foto profilo mai cancellata da Storage alla cancellazione account, nessun limite di username per utente, username orfani non ripuliti alla cancellazione account, streak/rango degli eventi amici falsificabile via SDK diretto, cancellazione categoria Watchlist che non cancellava davvero elementi/foto, streak auto-dichiarato nel profilo pubblico/classifica amici (quest'ultimo con un limite "+1 al giorno" testato con l'emulatore Firestore). **Trovato e corretto anche un bug preesistente più grave durante i test con l'emulatore**: le regole Firestore per i campi opzionali (`isOptionalString`/`isOptionalList`, 16 punti nel file) si sarebbero rotte alla primissima registrazione di ogni nuovo utente non appena fatto il deploy — corretto. Dettagli completi in `REVIEW_LOG.md`; report tecnico riga-per-riga in `~/security-audit-skill/bushido-tracker/run-1/findings.json`.

**Fatto in precedenza (2026-09-20)**: suite di test automatici reale con vitest (81 test), ricerca corretta per tradurre nella lingua del sito Anime/Manga/Videogiochi, filtro lingua dei Libri corretto (cercava per lingua del sito invece che della query), limiti risultati ricerca alzati al massimo per fonte, etichetta tipo risultato (Manga/Novel/Comic/Film/Serie TV...), Open Library aggiunta come seconda fonte libri/fumetti, audit completo delle 9 lingue (nessuna chiave mancante), **nuova funzione: esporta ogni categoria della Collezione in PDF** (titolo, anno, autore/studio, stato, colonna "Visto", data/ora di esportazione — senza copertine, per via dei limiti CORS di alcune fonti). **Due bug critici corretti nello stesso export**: (1) i titoli in russo/altri alfabeti non latini uscivano illeggibili — corretto incorporando un font che copre anche cirillico/greco; (2) l'intestazione della tabella era invisibile (testo scuro su sfondo scuro) — corretta. **Aggiunto anche il supporto completo a giapponese/cinese nel PDF** (font dedicato ~17.7MB, scaricato solo per quelle due lingue, le altre 7 restano leggere ~500KB) — verificato con testo reale che si legge correttamente. **Rifatta visivamente la homepage pubblica** (hero con filigrana kanji e card sovrapposte, badge di fiducia, sezione funzionalità e "come funziona" più curate) — **non ancora vista dal vivo, da controllare con uno screenshot appena possibile**. Dettagli completi in `REVIEW_LOG.md`.

**Chiarimento (nessuna modifica di codice)**: confermato che il logout porta a `/login` (il form di accesso), non alla homepage pubblica `/` — comportamento voluto, lasciato così su tua conferma. La homepage `/` resta visibile solo a chi non è loggato e visita la radice del sito direttamente.

**Priorità per la prossima sessione**: 1) la homepage rifatta il 20/09 **non è mai stata vista dal vivo** — da controllare con uno screenshot. 2) Deploy di `firestore.rules`/`storage.rules` (incluse le correzioni di sicurezza di oggi) tramite l'emulatore Firestore prima, poi `firebase deploy`.

**File di riferimento**: `TASKS.md` (questo file, checklist), `REVIEW_LOG.md` (log dettagliato di ogni modifica, con perché e cosa controllare).

---

## Fase 0 — Igiene Repo & Sicurezza
- [x] Rimuovere `firestore.rules.bak` dal repo (aggiungere `*.bak` a `.gitignore`)
- [x] Spostare la config Firebase da `src/firebase/config.ts` a variabili `.env` (prefisso `VITE_FIREBASE_*`)
- [x] Creare `.env.example` con placeholder (da committare)
- [x] Verificare/aggiornare `.gitignore` per `.env`
- [x] Persistenza offline Firestore — **era già presente** (`persistentLocalCache` + `persistentMultipleTabManager` in `config.ts`), nessuna modifica necessaria
- [x] Build verificata (`npm run build`) dopo la migrazione a `.env` — OK, nessun errore
- [ ] Nota per te: dopo il merge, aggiungere le stesse variabili nel pannello Vercel (Settings → Environment Variables), altrimenti la build in produzione si rompe
- [x] Riscrivere `firestore.rules` con validazione più stretta per tutte le sottocollezioni (come da protocollo nel doc)
- [ ] **Rimandato a fine lavoro** — Test con `firebase emulators:start --only firestore` + deploy (`firebase deploy --only firestore:rules`). Richiede che tu faccia `firebase login` nel terminale (login interattivo via browser, non posso farlo io) — quando siamo pronti ti dico esattamente il comando
- [x] Cancellazione account atomica (`account-service.ts` → `writeBatch` a blocchi, invece di `deleteDoc` in sequenza; ora pulisce anche `usernames`/`publicProfiles`/`friendships` della Fase 5) — dal protocollo, punto 6
- [x] Test unitari Vitest per `streak.ts` e `date-utils.ts` — dal protocollo, punto 8. `npm run test` → 20/20 verdi

## Fase 1 — Sistema Ranghi Samurai
- [x] `src/lib/ranks.ts` — calcolo grado da streak (Rōnin/Ashigaru/Samurai/Daimyō/Shōgun)
- [x] Componente `AvatarFrame` (cornice colorata + animazioni, come nel mockup approvato)
- [x] Integrazione in Sidebar, Dashboard, ProfilePage
- [x] Modal "Level-Up" con animazione (kanji in filigrana, nome shimmer, sigillo colorato) — **semplificata rispetto al mockup**: niente canvas particellare/tilt 3D al mouse, vedi REVIEW_LOG
- [x] Testi grado (nome/range/flavor) tradotti in tutte le 9 lingue

## Fase 2 — Rifiniture pagine già disegnate (mockup approvati)
- [x] Watchlist: colori/icone per tipo media, card collezioni, collezioni personalizzate con emoji, filtri di stato colorati
- [x] Griglia Abitudini: colore per abitudine, editor colore, vista mobile a elenco giornaliero, intestazioni a riga singola
- [x] Dashboard: delta colorati per segno, mappa di costanza fluida, card Sfide Attive/Obiettivo Settimanale
- [x] Sfide: barra di progresso, badge modalità, calendario in finestrina con giorni saltati (rosso), modulo riordinato

## Fase 3 — Integrazione API esterne (Watchlist)
- [x] Ricerca anime/manga (AniList) — testata dal vivo durante lo sviluppo, funziona
- [x] Ricerca libri (Google Books)
- [x] Ricerca giochi (RAWG.io) — **codice pronto ma non testabile da me**: serve una chiave API gratuita, vedi nota sotto
- [x] Ricerca audiolibri (riuso Google Books)
- [x] Supporto multi-lingua nella ricerca (AniList cerca su tutte le lingue del titolo; Google Books usa `langRestrict` sulla lingua dell'interfaccia)
- [x] Rilevare il paese dell'utente in fase di registrazione (Fase 3b) — usato per ora solo come dato di profilo, la lingua di ricerca di fatto segue la lingua dell'interfaccia già scelta (vedi nota sotto)
- [x] Compilazione automatica campi (titolo, anno, studio/autore, copertina) dal risultato scelto
- [x] Fallback sempre disponibile: inserimento manuale se non trovato (la ricerca non blocca mai il form)

## Fase 3b — Profilo Utente
- [x] Caricamento foto profilo personalizzata (al posto del cerchio con iniziale) — Firebase Storage, `storage.rules` pronto ma non ancora deployato (stesso discorso di `firestore.rules`)
- [x] Possibilità di modificare il nome visualizzato dalle Impostazioni Profilo
- [x] Impostazione paese modificabile dalle Impostazioni Profilo, rilevato automaticamente alla registrazione

## Fase 4 — Punti Conoscenza & Bilanciamento
- [x] Contatore "Punti Conoscenza" che sale al completamento di un elemento Watchlist (Dashboard, card "Collezione per categoria")
- [x] Messaggio/insight sul grafico a ciambella esistente (bilanciamento studio/svago: libro+manga+audiolibro = studio, video+gioco = svago)

## Fase 5 — Sistema Amici
- [x] Ricerca utenti per nome utente (username univoco + collezione `usernames` di prenotazione, ricerca per prefisso)
- [x] Richieste di amicizia (invio/accetta/rifiuta/annulla)
- [x] Lista amici + profilo pubblico (solo nome/foto/rango/streak via nuova collezione `publicProfiles`, mai dettagli di abitudini/watchlist/sfide)
- [x] Classifica tra amici — **semplificata**: ordinata per streak attuale, non per check-in della sola settimana corrente (vedi REVIEW_LOG)
- [x] Feed attività (rank-up, streak, watchlist completati) — implementato, non più rimandato (voce non aggiornata prima)
- [x] Regole di sicurezza dedicate (`usernames`, `publicProfiles`, `friendships`) — **non ancora testate con emulatore né deployate**, stesso discorso del resto delle regole

## Fase 7 — Dashboard configurabile
- [x] V1 — toggle mostra/nascondi + riordino (frecce su/giù) delle 6 card di contenuto, salvato per utente su Firestore (`dashboardConfig` su `users/{uid}`)
- [x] Layout passato da colonne asimmetriche fisse a griglia simmetrica 2 colonne (1 su mobile) per supportare l'ordine libero — cambio visivo concordato con te
- [x] V2 — posizionamento e ridimensionamento liberi via drag sulla griglia (desktop, `react-grid-layout`), attivato dal pulsante "Modifica layout"; su mobile resta la lista riordinabile della V1 senza resize
- [x] Rifinitura dimensioni per card — ogni widget ha limiti min/max/assi di resize proporzionati a cosa il suo contenuto può davvero sfruttare, invece di un range uguale per tutti; "Per categoria" si rivela in 3 livelli (solo cerchio → +statistica → +categorie) e non mostra mai una singola riga isolata
- [x] Chiuso — dashboard configurabile considerata completa

## Fase 8 — Calendario Sfide: rifinitura interazione
- [x] Calendario tornato di sola visualizzazione (hover/tap mostra la data, nessuna modifica diretta sulle celle)
- [x] Scorciatoie "Fatto oggi"/"Saltato oggi" direttamente sulla card della sfida nella lista
- [x] Quarto pulsante "Modifica altri giorni" — selettore data nativo del browser + Fatto/Saltato sulla data scelta

## Fase 9 — Griglia Abitudini: rifiniture
- [x] Tolta la lista a pillole sempre visibile (ridondante con i nomi cliccabili già nella griglia/tabella)
- [x] Pulsante Elimina spostato dentro la modale di modifica
- [x] Slider colorato (arcobaleno) per scegliere il colore, oltre alle swatch preset
- [x] Colore scelto già in fase di aggiunta abitudine, non solo dopo
- [x] Tooltip col nome dell'abitudine al passaggio del mouse sulla griglia (desktop)

## Fase 10 — Coerenza traduzioni (9 lingue)
- [x] Scansione completa di tutte le chiavi tra i 9 file lingua — trovate e corrette 54 chiavi mancanti (causa del bug "lingue che si mischiano" segnalato settimane fa)
- [x] Vocabolario Collezione (tipo media, stati) che mancava in 7 lingue su 9 — tradotto e aggiunto

## Fase 11 — Temi colore
- [x] 18 temi colore selezionabili (Cremisi di default + 17 nuovi), ciascuno con versione chiara e scura (36 combinazioni totali) — selettore in Profilo, Home pubblica e barra laterale
- [x] Ogni tema cambia colori di marchio, sfondi e testo (non solo i pulsanti)

## Fase 6 — Sfide auto-collegate alla Watchlist
- [x] ~~Collegare una sfida a una categoria Watchlist~~ — **implementato e poi rimosso su tua richiesta** (non ti convinceva la resa con poche unità, es. "5/5 elementi"). Le Sfide sono tornate a essere sempre basate su giorni/percentuale.

## Fase 12 — Nome utente automatico + pulizia pagina Amici
- [x] Rimosso il prompt bloccante "scegli uno username" dalla pagina Amici — sostituito con un avviso non bloccante + link al Profilo, la ricerca resta sempre usabile
- [x] Nuovo campo "Nome utente" modificabile nelle Impostazioni Profilo (sotto Nome visualizzato), separato e sempre editabile — non più legato solo alla pagina Amici
- [x] Generazione automatica dello username alla registrazione (email/password e Google), in base al nome scelto + suffisso casuale (es. "Crowen" → `crowen_x4k2`), niente più campo vuoto di default
- [x] Backfill automatico per gli account già esistenti creati prima di questa modifica: al prossimo accesso, se manca lo username viene generato in automatico
- [x] **Bug critico trovato e corretto nella stessa sessione**: la prima versione del backfill raggruppava la scrittura del documento utente e la prenotazione username in un unico batch atomico — se le regole Firestore non sono deployate (blocco noto, vedi sotto), l'intero batch falliva, bloccando il login di *chiunque* con una pagina nera vuota a tempo indeterminato. Corretto separando le due scritture (l'account si crea/carica sempre, lo username si aggiunge quando possibile) e aggiunta una `try/catch` di sicurezza in `useAuth.tsx` così un errore in `ensureUserDocument` non blocca più il login

---

*Aggiornato automaticamente durante il lavoro. Vedi anche `REVIEW_LOG.md` per i dettagli di cosa è stato fatto e perché.*
