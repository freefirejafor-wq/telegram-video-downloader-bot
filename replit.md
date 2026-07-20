# StreamBox — মুভি ও অ্যানিমে স্ট্রিমিং

A cinematic dark-mode streaming website for watching movies and anime. Netflix meets Crunchyroll.

## Run & Operate

- `pnpm --filter @workspace/streambox run dev` — run the frontend (port assigned by workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS + Wouter (routing)
- API: Express 5 (artifacts/api-server)
- DB: PostgreSQL + Drizzle ORM (watchlist table)
- Anime data: AniList GraphQL API (free, no key needed)
- Movie data: TMDB API (requires `TMDB_API_KEY` secret)
- Video embeds: vidsrc.pro for anime (MAL ID), vidsrc.to for movies (TMDB ID)
- API codegen: Orval (from OpenAPI spec in lib/api-spec/openapi.yaml)

## Where things live

- `artifacts/streambox/` — React frontend
- `artifacts/api-server/src/routes/anime.ts` — Anime proxy routes (AniList GraphQL)
- `artifacts/api-server/src/routes/movies.ts` — Movie proxy routes (TMDB)
- `artifacts/api-server/src/routes/watchlist.ts` — Watchlist CRUD (session-based cookie)
- `lib/db/src/schema/watchlist.ts` — Watchlist DB table
- `lib/api-spec/openapi.yaml` — OpenAPI source of truth

## Architecture decisions

- AniList GraphQL chosen over Jikan/MAL because MAL is frequently unreliable; AniList is stable and provides `idMal` for MAL ID compatibility
- Watchlist uses a session cookie (UUID) without requiring user auth — no login needed
- Video embeds use vidsrc.pro for anime (MAL ID format) and vidsrc.to for movies
- Movies section gracefully returns empty when TMDB_API_KEY is not set

## Product

- Home: Hero banner with trending anime, horizontal scroll rows
- Anime Browse: Grid with genre filter, search, pagination
- Movies Browse: Same layout (requires TMDB key)
- Anime Detail: Cinematic backdrop, episode list with play buttons
- Movie Detail: Hero layout, cast, play button
- Watch pages: Fullscreen iframe video player
- Watchlist: Session-based saved content

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After OpenAPI spec changes, always run `pnpm --filter @workspace/api-spec run codegen` before typecheck
- `/anime/episodes` and `/anime/embed` routes MUST come before `/anime/:id` in the router to avoid capture
- For movies, set `TMDB_API_KEY` secret at themoviedb.org (free signup)
- Jikan API (MyAnimeList) is sometimes down — anime routes now use AniList instead

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
