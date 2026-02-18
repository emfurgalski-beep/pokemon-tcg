# 🎴 From Alabastia - Pokemon TCG Database

Polska baza kart Pokemon Trading Card Game.

## 🚀 Tech Stack

- **Frontend**: React 18 + Vite + React Router
- **API**: Vercel Serverless Functions
- **Data Source**: PokemonTCG/pokemon-tcg-data (GitHub)
- **CDN**: jsDelivr (global, fast, no CORS)
- **Hosting**: Vercel

## 📦 Data Source

Dane pobierane bezpośrednio z oficjalnego repozytorium:
- Repo: `github.com/PokemonTCG/pokemon-tcg-data`
- CDN: `cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master`

Używamy JSON-ów zamiast API pokemontcg.io (brak CORS, klucze API, rate limits).

## 🛠️ Development

```bash
npm install
npm run dev
```

## 🌐 Deployment

Automatyczny deploy na Vercel po pushu do `main`.

```bash
git push origin main
```

## 📁 Structure

```
/api/tcg.js         - Serverless endpoint
/src/pages/         - React pages
/src/components/    - React components
/src/styles/        - CSS files
```

## ✅ Features

- ✅ Lista wszystkich setów Pokemon TCG
- ✅ Grupowanie po seriach
- ✅ Wyszukiwarka setów
- ✅ Szybkie ładowanie (jsDelivr CDN)
- 🚧 Lista kart w secie (in progress)
- 🚧 Szczegóły karty (in progress)
