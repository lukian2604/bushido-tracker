# 🚀 Cosa devi fare tu per andare online

Il codice è pronto al 100% (build pulita, 81/81 test, `tsc` senza errori). Restano solo questi passaggi che **richiedono il tuo login/password** — non posso farli io. In totale sono circa 20-30 minuti.

---

## 1. Sistemare `git` in locale (5 minuti)

`git` in questa sessione shell non funziona (licenza Xcode non accettata) — probabilmente lo stesso capiterà a te se usi lo stesso Mac/terminale.

Apri il Terminale e lancia:

```
sudo xcodebuild -license
```

Ti chiederà la password del Mac, poi ti mostrerà un testo lungo — premi `spazio` per scorrere fino alla fine, poi scrivi `agree` e Invio.

Dopo questo, `git status` dovrebbe tornare a funzionare normalmente.

---

## 2. Deploy delle regole Firestore e Storage (10 minuti)

Le regole di sicurezza (`firestore.rules`, `storage.rules`) sono scritte, corrette e testate con l'emulatore — ma **non sono ancora attive** sul progetto Firebase vero. Finché non fai questo passaggio restano bloccate: nome utente, ricerca amici, foto profilo, copertine Watchlist.

Nel terminale, dentro la cartella del progetto:

```
npm install -g firebase-tools   # solo se non l'hai già
firebase login                  # si apre il browser, accedi col tuo account Google/Firebase
firebase deploy --only firestore:rules,storage:rules
```

**Prima di farlo in produzione**, se vuoi essere extra-sicuro (consigliato, dato che alcune regole sono nuove/non banali — in particolare quella sullo streak pubblico con il limite "+1 al giorno"), puoi testarle in locale con l'emulatore:

```
firebase emulators:start --only firestore
```

e provare l'app puntandola all'emulatore. Se non vuoi impelagarti in questo, va bene anche deployare direttamente — ma appena fatto, **registra un utente di prova e controlla che il login funzioni** (è la cosa che una delle mie correzioni di oggi teneva particolarmente d'occhio).

---

## 3. Chiave IGDB per la ricerca videogiochi migliore (10 minuti, facoltativo)

Il sito ora cerca i videogiochi su **3-4 fonti insieme** (IGDB, FreeToGame, CheapShark, e RAWG se configurato) — funziona comunque anche se salti questo passaggio, ma IGDB ha il catalogo migliore.

1. Vai su **https://dev.twitch.tv/console** e accedi (serve un account Twitch, gratuito).
2. Sezione "Applications" → "Register Your Application".
   - Nome: qualsiasi (es. "Bushido Tracker")
   - OAuth Redirect URLs: `https://localhost` (non verrà mai usato davvero, ma il campo è obbligatorio)
   - Categoria: "Application Integration" o simile
3. Dopo la creazione, apri l'app e copia **Client ID**.
4. Clicca "New Secret" per generare il **Client Secret** e copialo (si vede una volta sola).
5. Vai sul pannello Vercel del progetto → **Settings → Environment Variables** e aggiungi:
   - `IGDB_CLIENT_ID` = (il Client ID)
   - `IGDB_CLIENT_SECRET` = (il Client Secret)

   **Importante**: questi due NON vanno mai messi nel file `.env` con prefisso `VITE_` — vanno solo su Vercel, così restano nascosti nel server e non finiscono mai nel sito pubblico.

---

## 4. Variabili d'ambiente su Vercel (5 minuti)

Se non l'hai già fatto in una sessione precedente, vai su Vercel → **Settings → Environment Variables** e aggiungi tutte le chiavi che hai nel tuo `.env` locale (guarda `.env.example` per la lista completa dei nomi):

- Le 6 `VITE_FIREBASE_*`
- `VITE_RAWG_API_KEY` (facoltativa)
- `VITE_TMDB_API_KEY` (facoltativa)
- `IGDB_CLIENT_ID` / `IGDB_CLIENT_SECRET` (facoltative, vedi punto 3)

Senza le 6 `VITE_FIREBASE_*` **il sito in produzione non parte proprio** — sono le uniche davvero obbligatorie.

---

## 5. Commit e push (dopo aver sistemato git al punto 1)

```
git add -A
git commit -m "fix: security audit fixes + game search (IGDB/FreeToGame/CheapShark)"
git push
```

Se il progetto è collegato a Vercel, il push scatena da solo il deploy in produzione.

---

## ✅ Checklist rapida

- [ ] `sudo xcodebuild -license` → `git` funziona di nuovo
- [ ] `firebase login` + deploy regole Firestore/Storage
- [ ] (facoltativo) Account Twitch Dev + chiavi IGDB su Vercel
- [ ] Tutte le variabili `.env.example` presenti su Vercel
- [ ] `git push` → deploy automatico
- [ ] Dopo il deploy: registra un utente di prova, controlla login/logout, prova a impostare uno username, prova la ricerca videogiochi
