# FloorControl — GitHub Pages-opsætning

Dette er FloorControl-dashboardet (fra Claude-projektet "Dashboards") pakket ind i et
almindeligt React-projekt (Vite), klar til at blive hostet på GitHub Pages.

**Hvorfor:** Når dashboardet ligger som et Claude-artefakt, blokerer browseren
kald til eksterne API'er som DMI og Nager.Date — derfor hænger vejr-kortet på
"Henter DMI-prognose…". Når det samme kode-projekt i stedet hostes et
almindeligt sted (som her, på GitHub Pages), er der ingen af de begrænsninger,
og de to live-kilder virker som de skal.

## 0. Forudsætninger

- En gratis [GitHub-konto](https://github.com/join)
- [Node.js](https://nodejs.org/) installeret lokalt (version 20 eller nyere) — kun
  nødvendigt hvis du vil teste projektet på din egen maskine først. Selve
  deploy'et til GitHub Pages sker automatisk i skyen og kræver ikke Node lokalt.
- Git installeret lokalt, eller brug GitHubs "upload files" i browseren (se trin 2b)

## 1. Opret et repo på GitHub

1. Gå til github.com → **New repository**.
2. Giv det et navn, fx `floorcontrol-dashboard`.
3. Vælg **Public** (nødvendigt for gratis GitHub Pages — se note om synlighed nederst).
4. Opret repoet **uden** README/gitignore (vi har allerede filerne).

## 2a. Push med Git (hvis du har Git installeret)

Fra denne mappe (`floorcontrol-dashboard/`):

```bash
git init
git add .
git commit -m "Første version af FloorControl"
git branch -M main
git remote add origin https://github.com/<dit-brugernavn>/floorcontrol-dashboard.git
git push -u origin main
```

## 2b. Alternativ: upload direkte i browseren (uden Git)

1. Åbn det nye, tomme repo på github.com.
2. Klik **Add file → Upload files**.
3. Træk hele indholdet af denne mappe ind (inkl. den skjulte `.github`-mappe —
   husk at Finder/Explorer kan skjule mapper der starter med punktum; sørg for
   at `.github/workflows/deploy.yml` også kommer med, ellers virker
   auto-deploy ikke).
4. Commit direkte på `main`.

## 3. Aktivér GitHub Pages

1. I repoet: **Settings → Pages**.
2. Under **Build and deployment → Source**, vælg **GitHub Actions** (ikke "Deploy from a branch").
3. Det er det — workflow-filen (`.github/workflows/deploy.yml`) er allerede sat op
   til at bygge og deploye automatisk, hver gang der pushes til `main`.

## 4. Vent på deploy og find linket

1. Gå til fanen **Actions** i repoet — der kører nu et workflow kaldet
   "Deploy til GitHub Pages" (tager typisk 1-2 minutter).
2. Når det er grønt, går du tilbage til **Settings → Pages** — der står nu et
   link i stil med:

   `https://<dit-brugernavn>.github.io/floorcontrol-dashboard/`

3. Åbn linket. Vejr-kortene bør nu vise rigtige tal fra DMI i stedet for at
   hænge på "Henter DMI-prognose…", og "Kommende helligdage i Europa" bør
   vise rigtige datoer fra Nager.Date.

## 5. Fremtidige opdateringer

Enhver ændring i `src/FloorControl.jsx` (fx når I kobler rigtige datakilder på
i stedet for eksempeldata) bliver automatisk deployet, så snart den pushes
til `main` — enten via `git push` eller ved at redigere/uploade filen direkte
på github.com. Der skal ikke gøres noget manuelt for at opdatere den
offentlige side.

## 6. Test lokalt (valgfrit)

```bash
npm install
npm run dev
```

Åbner dashboardet på `http://localhost:5173`.

---

## Vigtigt om synlighed

Repoet er sat op som **public**, hvilket er den gratis og enkleste vej til
GitHub Pages. Det betyder at **alle med linket** kan åbne dashboardet — der er
intet login. Linket bliver ikke indekseret af søgemaskiner, men er ikke
adgangsbeskyttet.

Lige nu viser dashboardet kun eksempeldata, så det er ikke et problem. Men når
I kobler rigtige kilder på (Navipartner, Vemcount, Lessor-vagtplan m.fl.),
vil siden vise ægte tal om bemanding, sygemeldinger og salg — og det linket
bør I tage stilling til, om skal være helt åbent. Muligheder, hvis I vil
lukke det ned senere:

- **Privat GitHub Pages** — kræver GitHub Pro/Team/Enterprise (betalt plan på
  organisationen), så siden kun er tilgængelig for logget-ind organisationsmedlemmer.
- **Flyt til Netlify eller Cloudflare Pages** med adgangskode/Basic Auth foran
  siden — samme kodebase, bare en anden hosting-tjeneste.
- **Egen server bag VPN/login**, hvis I allerede har en intern IT-løsning til den slags.

Sig til, hvis du vil have hjælp til at sætte en af de løsninger op, når I
kommer dertil.
