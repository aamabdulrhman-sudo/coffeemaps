# CoffeeMap

**CoffeeMap** is a full-stack web platform for discovering specialty coffee shops on an interactive map, saving favorites, writing photo-backed reviews, and tracking personal cafe exploration stats.

---

## Features

- **Authentication**: Email/password credentials and Google OAuth powered by NextAuth v5 (Auth.js) with Prisma Adapter, plus a customizable Profile page.
- **Interactive Full-Screen Map**: Leaflet map with custom rating markers, Airbnb-style split view, dark/light map tiles, live search, city & rating filters, and tag pills (`WiFi`, `Study Friendly`, `Specialty Coffee`, `Outdoor Seating`).
- **Geolocation & Nearest Shops**: One-click current location detection, Haversine distance calculations, and nearest-shop sorting.
- **Coffee Shop Pages**: Rich details including photography, description, opening hours, Google Maps deep link, tags, and direct share link.
- **Reviews & Photo Uploads**: Rate shops from 1 to 5 stars, upload review images, and edit or delete your own reviews.
- **Favorites & User Dashboard**: Save favorite cafes to a dedicated `/favorites` page and view personal stats (saved count, reviews written, rating distribution, cities explored) on `/dashboard`.
- **Premium Capabilities**:
  - **User Badges**: Automatically awarded achievements (`First Sip`, `Coffee Critic`, `Espresso Connoisseur`, `Cafe Curator`, `Latte Artist`, `City Explorer`).
  - **Trending Coffee Shops**: Ranked by weighted rating, review volume, and favorites.
  - **AI Review Summaries**: Summarizes community reviews via OpenAI (with an intelligent built-in theme analyzer fallback).
  - **Direct Sharing**: Share any shop via Web Share API or one-click clipboard copy.
- **SEO & Quality**: Dynamic Metadata, Open Graph tags, `sitemap.xml`, `robots.txt`, Dark Mode, Loading Skeletons, Empty/Error States, ESLint, Prettier, Husky, lint-staged, and Conventional Commits.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router) & TypeScript
- **Styling**: Tailwind CSS + shadcn/ui + `next-themes`
- **Database & ORM**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth v5 (Credentials + Google OAuth)
- **Data Fetching**: TanStack React Query
- **Maps**: Leaflet + React Leaflet
- **Validation**: Zod
- **Testing**: Vitest + React Testing Library
- **Containers**: Docker & Docker Compose

---

## Installation

### 1. Clone and install dependencies

```bash
git clone https://github.com/your-org/coffeemap.git
cd coffeemap
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL of the app (e.g. `http://localhost:3000`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | Auth callback base URL (`http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth Client Secret |
| `OPENAI_API_KEY` | Optional | OpenAI key for AI Review Summaries (uses built-in analyzer if omitted) |

---

## Database Setup

Start PostgreSQL (locally or via Docker), push the schema, and seed sample coffee shops:

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to PostgreSQL (or use `npm run db:migrate`)
npm run db:push

# Seed initial coffee shops, tags, reviews, and demo account
npm run db:seed
```

Demo credentials seeded by `prisma/seed.ts`:
- **Email**: `demo@coffeemap.app`
- **Password**: `CoffeeMap123!`

---

## Running Locally & Testing

```bash
# Development server
npm run dev

# Run Vitest test suite
npm test

# Type-check & lint
npm run typecheck
npm run lint
```

---

## Deployment

### Docker Compose (App + PostgreSQL — Zero Manual Setup)

```bash
docker compose up --build -d
```

This automatically starts PostgreSQL 16, pushes the Prisma schema (`db-init`), seeds the initial coffee shops & demo user, and starts CoffeeMap at `http://localhost:3000`.

To force re-seeding later:

```bash
docker compose run --rm -e FORCE_SEED=true db-init
```

### GitHub Setup

```bash
git init
git add .
git commit -m "feat: initial CoffeeMap release"
git branch -M main
git remote add origin https://github.com/<your-username>/coffeemap.git
git push -u origin main
```

### Production Build (Standalone)

```bash
npm run build
npm run start
```
