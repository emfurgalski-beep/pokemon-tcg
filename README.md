# 🎴 From Alabastia - Pokemon TCG Database

Polska baza kart Pokemon Trading Card Game.

## 🚀 Tech Stack

- **Frontend**: React 18 + Vite + React Router
- **API**: Vercel Serverless Functions
- **Data Source**: PokemonTCG/pokemon-tcg-data (GitHub)
- **CDN**: jsDelivr (global, fast, no CORS)
- **Hosting**: Vercel

## 📦 Data Source

**Triple-fallback strategy for maximum reliability:**

1. **pokemontcg.io** (Primary) - Full data with variants
   - Optional API key for better reliability
   - Get free key: https://dev.pokemontcg.io/

2. **TCGdex** (Secondary) - Full data with variants
   - Free, no key required
   - Fast CDN

3. **GitHub CDN** (Tertiary) - Basic data, no variants
   - 99.9% uptime guarantee
   - Always works as last resort

**To add API key (optional but recommended):**
```bash
# Copy template
cp .env.example .env

# Add your key from https://dev.pokemontcg.io/
POKEMONTCG_API_KEY=your-key-here
```

Deploy to Vercel:
```bash
vercel env add POKEMONTCG_API_KEY
```

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

- ✅ Lista wszystkich setów Pokemon TCG (171+ sets)
- ✅ Grupowanie po seriach
- ✅ Wyszukiwarka setów
- ✅ Filtry i sortowanie (seria, data, nazwa, liczba kart)
- ✅ Strona setu z wszystkimi kartami
- ✅ **Wykrywanie wariantów** (holo, reverse holo, normal)
- ✅ Filtrowanie kart po typie Pokemon
- ✅ Szczegóły karty (HP, ataki, słabości, odporności)
- ✅ Breadcrumbs nawigacja
- ✅ Statystyki (total cards, type distribution)
- ✅ **Triple-source fallback** (pokemontcg.io → TCGdex → GitHub CDN)
- ✅ Szybkie ładowanie (CDN + caching)
- ✅ Responsive design
