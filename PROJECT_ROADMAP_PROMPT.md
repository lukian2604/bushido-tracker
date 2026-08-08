# ⚔️ Bushido Tracker — Master Project Roadmap & AI Prompt Document

Questo documento raccoglie la panoramica completa dell'applicazione **Bushido Tracker**, l'architettura attuale, la roadmap delle funzionalità avanzate, le linee guida sulla sicurezza, le opzioni di monetizzazione e un prompt pronto per Claude o altri assistenti AI.

---

## 📌 1. Panoramica del Progetto & Stack Tecnologico

- **Nome Progetto**: Bushido Tracker
- **Descrizione**: Web App responsive per il tracciamento di abitudini, sfide a intervallo di date e watchlist multimediali (anime, libri, giochi, film) con tema visivo ispirato ai Samurai ("Bushido").
- **Stack Tecnologico**:
  - **Frontend**: React 19 + TypeScript + Vite 8
  - **Styling**: Tailwind CSS v4 + Variabili CSS personalizzate (`src/index.css`)
  - **Backend & DB**: Firebase 12 (Authentication + Cloud Firestore)
  - **Routing**: React Router v7 (`react-router-dom`)
  - **Internazionalizzazione (i18n)**: 9 lingue (EN, IT, RU, ES, FR, DE, JA, ZH, PT)
  - **Hosting**: Vercel (`vercel.json`) / Firebase Hosting

---

## 🎯 2. Roadmap Nuove Funzionalità (Feature Plan)

### A. 🏯 Gamificazione & Gradi Samurai (Bushido Ranks)
Sistema di progressione basato sui giorni di streak consecutivi e check-in totali:
- **Gradi**:
  1. 🗡️ **Rōnin** (0 - 6 giorni) — Guerriero errante (cornice argento/sobria).
  2. 🛡️ **Ashigaru** (7 - 29 giorni) — Soldato novizio (cornice verde bambù/smeraldo).
  3. ⚔️ **Samurai** (30 - 89 giorni) — Guerriero esperto (cornice rosso cremisi con bagliore).
  4. 👺 **Daimyō** (90 - 179 giorni) — Signore feudale (cornice viola e oro con aura).
  5. 👑 **Shōgun** (180+ giorni) — Comandante supremo (cornice dorata animata + corona).
- **Rank Avatar Frames**: Cornici profilate attorno all'avatar dell'utente (visibili in Sidebar, Dashboard e Profilo).
- **Modal "Level-Up"**: Pop-up celebrativo con animazione quando si sblocca un nuovo grado.

### B. 👥 Sistema Amici & Social (Accountability)
- **Aggiungi Amici**: Collegamento tramite Codice Amico o Email.
- **Classifica dei Guerrieri (Leaderboard)**: Ranking settimanale tra amici basato su streak e check-in.
- **Feed Attività**: Notifica visiva quando un amico completa una sfida o finisce un'opera in Watchlist.
- **Profilo Pubblico Amico**: Possibilità di visualizzare il profilo dell'amico con il suo grado e la sua cornice.

### C. 🎬 Integrazione API Esterne (Watchlist)
- **AniList / Jikan API** (Anime e Manga): Auto-completamento titolo, locandina/copertina, numero episodi/capitoli e voto.
- **Google Books / Open Library API**: Copertine e info automatiche per i libri.

### D. 📱 PWA & Notifiche Push
- **PWA Manifest & Service Worker**: Installabilità come app su dispositivi iOS/Android/Desktop.
- **Notifiche Push Locali**: Promemoria serale configurabile per non interrompere lo streak.

---

## 🔒 3. Linee Guida per la Sicurezza (Security & Protection)

1. **Firestore Security Rules (`firestore.rules`)**:
   - Assicurare l'isolamento completo dei dati: ogni utente può leggere/scrivere **solamente** nella propria alberatura di documenti (`users/{uid}`).
   - Per la funzione Amici, creare regole apposite per consentire la lettura dei soli dati pubblici (displayName, rank, streak) tra utenti collegati.
2. **Protezione Chiavi API (`.env`)**:
   - Mantenere le chiavi Firebase nel file `.env` (non committare segreti privati in repository pubblici).
3. **Domini Autorizzati (CORS)**:
   - Configurare in **Firebase Console → Authentication → Settings → Authorized Domains** solo i domini effettivi di produzione (es. `bushido-tracker.vercel.app`).
4. **Sanitizzazione Input**:
   - Sanitizzare il testo inserito dall'utente nei campi (titoli abitudini, nomi sfide) per prevenire attacchi XSS.

### 🛠️ Protocollo Operativo Passo-Passo (8 Passaggi)
1. **BACKUP**: Copia di sicurezza `firestore.rules.bak` prima di qualsiasi modifica.
2. **REGOLE DI SICUREZZA**: Riscritura di `firestore.rules` con controllo ownership `request.auth.uid == uid` e validazione dei tipi/lunghezze dei campi per tutte le sottocollezioni (`users/{uid}`, `challenges`, `habitGridHabits`, `habitGridMonths`, `watchlistCategories`, `items`).
3. **TEST CON EMULATORE**: Configurazione ed esecuzione di `firebase emulators:start --only firestore` per la verifica dell'isolamento dati.
4. **DEPLOY**: Deploy delle regole tramite `firebase deploy --only firestore:rules` dopo conferma dei test.
5. **VARIABILI D'AMBIENTE**: Spostamento delle chiavi Firebase da `src/firebase/config.ts` al file `.env` con prefisso `VITE_FIREBASE_*`.
6. **CANCELLAZIONE ACCOUNT ATOMICA**: Aggiornamento di `account-service.ts` per eseguire l'eliminazione dei dati dell'utente tramite `writeBatch` atomico.
7. **PERSISTENZA OFFLINE**: Abilitazione della cache Firestore offline (`persistentLocalCache` / `enableIndexedDbPersistence`).
8. **TEST UNITARI**: Scrittura dei test unitari con **Vitest** per le funzioni pure `streak.ts` e `date-utils.ts`.

---


## 💰 4. Modelli di Monetizzazione (Business Model)

### Opzione A: Freemium (Consigliata)
- **Piano Free (Gratuito)**:
  - Abitudini illimitate nella griglia mensile.
  - Fino a 2 Sfide Samurai attive contemporaneamente.
  - Fino a 3 Categorie Watchlist.
  - Gradi Samurai base.
- **Piano Premium Samurai (€2.99 / mese oppure €24.99 / anno)**:
  - Sfide Samurai illimitate.
  - Categorie Watchlist e media illimitati.
  - Cornici Profilo ed Effetti Visivi esclusivi/animati.
  - Notifiche Push di promemoria avanzate.
  - Statistiche dettagliate ed esportazione dati in CSV/JSON.

### Opzione B: 100% Gratuito con Donazioni (Open Source / Supporter Model)
- Servizio completamente gratuito per la community.
- Pulsante *"Offrimi un Tè Matcha / Buy Me a Coffee"* nel profilo per ricevere donazioni spontanee dai sostenitori.

---

## 🤖 5. Ready-to-Use Prompt per Claude / AI Assistants

Copia e incolla il seguente prompt a Claude per proseguire lo sviluppo:

```text
Ciao Claude! Sto lavorando al progetto "Bushido Tracker", una web application per il tracciamento di abitudini, sfide e watchlist multimediali in stile Samurai.

Stack tecnologico del progetto:
- React 19 + TypeScript + Vite 8 + Tailwind CSS v4
- Firebase Authentication + Cloud Firestore
- React Router v7 + i18n (9 lingue)

Architettura attuale del codice:
- src/services/ -> Moduli Firestore (challenge-service, habit-grid-service, watchlist-service, user-service, account-service)
- src/hooks/ -> Hook personalizzati (useAuth, useTheme, useTranslation, useToast, useModal)
- src/components/ui/ -> Componenti grafici (StatCard, DonutChart, AreaChart, Heatmap, Button, ecc.)
- src/lib/ -> Tipi TypeScript (types.ts), utility date (date-utils.ts) e calcolo streak (streak.ts)

Obiettivo attuale:
Desidero implementare il sistema di "Gradi Samurai (Bushido Ranks)" e la "Cornice Avatar del Profilo (Rank Avatar Frame)".

Specifiche dei Gradi basati sullo streak:
1. Rōnin (0-6 giorni) -> Cornice sobria argento
2. Ashigaru (7-29 giorni) -> Cornice verde bambù/smeraldo
3. Samurai (30-89 giorni) -> Cornice rosso cremisi con bagliore
4. Daimyō (90-179 giorni) -> Cornice viola/oro regale
5. Shōgun (180+ giorni) -> Cornice dorata animata con corona

Cosa fare:
1. Crea/Modifica un helper in `src/lib/ranks.ts` per calcolare il grado dell'utente dallo streak.
2. Crea un componente `src/components/ui/AvatarFrame.tsx` che mostri l'avatar con la cornice del grado corrispondente.
3. Integra il nuovo componente AvatarFrame nella Sidebar e nella ProfilePage.

Forniscimi il codice completo, pulito e privo di bug seguendo lo stile del progetto.
```

---
*Documento generato per Bushido Tracker — Pronto per la condivisione e lo sviluppo.*
