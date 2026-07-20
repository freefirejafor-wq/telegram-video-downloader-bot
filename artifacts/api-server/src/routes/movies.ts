import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import {
  GetMoviesTrendingResponse,
  GetMoviesTopResponse,
  SearchMoviesResponse,
  GetMovieGenresResponse,
  GetMovieByIdResponse,
  GetMovieEmbedResponse,
  GetMovieByIdParams,
  GetMovieEmbedParams,
  GetMoviesTrendingQueryParams,
  GetMoviesTopQueryParams,
  SearchMoviesQueryParams,
} from "@workspace/api-zod";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p";

function getTmdbKey(): string | null {
  return process.env.TMDB_API_KEY ?? null;
}

function posterUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${IMG_BASE}/w500${path}`;
}

function backdropUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${IMG_BASE}/w1280${path}`;
}

type TmdbMovie = {
  id: number;
  title: string;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number | null;
  release_date?: string | null;
  genre_ids?: number[];
};

type TmdbGenre = { id: number; name: string };

function transformMovie(
  m: TmdbMovie,
  genreMap: Map<number, string> = new Map(),
) {
  const year = m.release_date
    ? parseInt(m.release_date.split("-")[0], 10)
    : null;
  return {
    tmdb_id: m.id,
    title: m.title,
    overview: m.overview ?? null,
    poster: posterUrl(m.poster_path),
    backdrop: backdropUrl(m.backdrop_path),
    rating: m.vote_average ?? null,
    year: isNaN(year as number) ? null : year,
    genres: (m.genre_ids ?? []).map((id) => genreMap.get(id) ?? ""),
  };
}

const emptyList = {
  items: [],
  total: 0,
  page: 1,
  hasNext: false,
};

const router: IRouter = Router();

// GET /movies/trending
router.get("/movies/trending", async (req, res): Promise<void> => {
  const apiKey = getTmdbKey();
  if (!apiKey) {
    res.json(GetMoviesTrendingResponse.parse(emptyList));
    return;
  }
  const params = GetMoviesTrendingQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;

  const resp = await fetch(
    `${TMDB_BASE}/trending/movie/week?api_key=${apiKey}&page=${page}`,
    { headers: { Accept: "application/json" } },
  );
  if (!resp.ok) {
    logger.warn({ status: resp.status }, "TMDB trending fetch failed");
    res.json(GetMoviesTrendingResponse.parse(emptyList));
    return;
  }
  const data = (await resp.json()) as {
    results: TmdbMovie[];
    total_results: number;
    page: number;
    total_pages: number;
  };
  const items = (data.results ?? []).map((m) => transformMovie(m));
  res.json(
    GetMoviesTrendingResponse.parse({
      items,
      total: data.total_results ?? items.length,
      page,
      hasNext: page < (data.total_pages ?? 1),
    }),
  );
});

// GET /movies/top
router.get("/movies/top", async (req, res): Promise<void> => {
  const apiKey = getTmdbKey();
  if (!apiKey) {
    res.json(GetMoviesTopResponse.parse(emptyList));
    return;
  }
  const params = GetMoviesTopQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const genre = params.success ? params.data.genre : undefined;

  let url = `${TMDB_BASE}/movie/top_rated?api_key=${apiKey}&page=${page}`;
  if (genre) url += `&with_genres=${encodeURIComponent(genre)}`;

  const resp = await fetch(url, { headers: { Accept: "application/json" } });
  if (!resp.ok) {
    res.json(GetMoviesTopResponse.parse(emptyList));
    return;
  }
  const data = (await resp.json()) as {
    results: TmdbMovie[];
    total_results: number;
    page: number;
    total_pages: number;
  };
  const items = (data.results ?? []).map((m) => transformMovie(m));
  res.json(
    GetMoviesTopResponse.parse({
      items,
      total: data.total_results ?? items.length,
      page,
      hasNext: page < (data.total_pages ?? 1),
    }),
  );
});

// GET /movies/search
router.get("/movies/search", async (req, res): Promise<void> => {
  const apiKey = getTmdbKey();
  if (!apiKey) {
    res.json(SearchMoviesResponse.parse(emptyList));
    return;
  }
  const params = SearchMoviesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "Missing required query param: q" });
    return;
  }
  const { q, page = 1 } = params.data;

  const resp = await fetch(
    `${TMDB_BASE}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(q)}&page=${page}`,
    { headers: { Accept: "application/json" } },
  );
  if (!resp.ok) {
    res.json(SearchMoviesResponse.parse(emptyList));
    return;
  }
  const data = (await resp.json()) as {
    results: TmdbMovie[];
    total_results: number;
    page: number;
    total_pages: number;
  };
  const items = (data.results ?? []).map((m) => transformMovie(m));
  res.json(
    SearchMoviesResponse.parse({
      items,
      total: data.total_results ?? items.length,
      page,
      hasNext: page < (data.total_pages ?? 1),
    }),
  );
});

// GET /movies/genres
router.get("/movies/genres", async (_req, res): Promise<void> => {
  const apiKey = getTmdbKey();
  if (!apiKey) {
    res.json(GetMovieGenresResponse.parse({ genres: [] }));
    return;
  }
  const resp = await fetch(
    `${TMDB_BASE}/genre/movie/list?api_key=${apiKey}`,
    { headers: { Accept: "application/json" } },
  );
  if (!resp.ok) {
    res.json(GetMovieGenresResponse.parse({ genres: [] }));
    return;
  }
  const data = (await resp.json()) as { genres: TmdbGenre[] };
  res.json(
    GetMovieGenresResponse.parse({
      genres: (data.genres ?? []).map((g) => ({ id: g.id, name: g.name })),
    }),
  );
});

// GET /movies/:id  — must come before /movies/:id/embed
router.get("/movies/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetMovieByIdParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid movie ID" });
    return;
  }
  const { id } = parsed.data;

  const apiKey = getTmdbKey();
  if (!apiKey) {
    res.status(503).json({ error: "TMDB API key not configured" });
    return;
  }

  const [detailResp, creditsResp, videosResp] = await Promise.all([
    fetch(`${TMDB_BASE}/movie/${id}?api_key=${apiKey}`, {
      headers: { Accept: "application/json" },
    }),
    fetch(`${TMDB_BASE}/movie/${id}/credits?api_key=${apiKey}`, {
      headers: { Accept: "application/json" },
    }),
    fetch(`${TMDB_BASE}/movie/${id}/videos?api_key=${apiKey}`, {
      headers: { Accept: "application/json" },
    }),
  ]);

  if (detailResp.status === 404) {
    res.status(404).json({ error: "Movie not found" });
    return;
  }
  if (!detailResp.ok) {
    res.status(502).json({ error: "Failed to fetch from TMDB" });
    return;
  }

  type TmdbDetailMovie = TmdbMovie & {
    runtime?: number | null;
    genres?: TmdbGenre[];
    imdb_id?: string | null;
  };
  const detail = (await detailResp.json()) as TmdbDetailMovie;
  const credits = creditsResp.ok
    ? ((await creditsResp.json()) as {
        cast: Array<{ name: string; order: number }>;
      })
    : { cast: [] };
  const videos = videosResp.ok
    ? ((await videosResp.json()) as {
        results: Array<{
          type: string;
          site: string;
          key: string;
          official: boolean;
        }>;
      })
    : { results: [] };

  const trailer = videos.results.find(
    (v) =>
      v.type === "Trailer" && v.site === "YouTube",
  );
  const cast = credits.cast
    .sort((a, b) => a.order - b.order)
    .slice(0, 10)
    .map((c) => c.name);

  const year = detail.release_date
    ? parseInt(detail.release_date.split("-")[0], 10)
    : null;

  res.json(
    GetMovieByIdResponse.parse({
      tmdb_id: detail.id,
      title: detail.title,
      overview: detail.overview ?? null,
      poster: posterUrl(detail.poster_path),
      backdrop: backdropUrl(detail.backdrop_path),
      rating: detail.vote_average ?? null,
      year: isNaN(year as number) ? null : year,
      runtime: detail.runtime ?? null,
      genres: (detail.genres ?? []).map((g) => g.name),
      cast,
      trailer_url: trailer
        ? `https://www.youtube.com/embed/${trailer.key}`
        : null,
      imdb_id: detail.imdb_id ?? null,
    }),
  );
});

// GET /movies/:id/embed
router.get("/movies/:id/embed", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetMovieEmbedParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid movie ID" });
    return;
  }
  const { id } = parsed.data;

  const primary = `https://vidsrc.to/embed/movie/${id}`;
  const alt = `https://www.2embed.cc/embed/${id}`;
  res.json(
    GetMovieEmbedResponse.parse({
      embedUrl: primary,
      sources: [
        { label: "vidsrc", url: primary },
        { label: "2embed", url: alt },
      ],
    }),
  );
});

export default router;
