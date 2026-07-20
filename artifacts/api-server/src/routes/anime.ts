import { Router, type IRouter } from "express";
import {
  GetAnimeTrendingResponse,
  GetAnimeTopResponse,
  SearchAnimeResponse,
  GetAnimeGenresResponse,
  GetAnimeByIdResponse,
  GetAnimeEpisodesResponse,
  GetAnimeEmbedResponse,
  GetAnimeByIdParams,
  GetAnimeTrendingQueryParams,
  GetAnimeTopQueryParams,
  SearchAnimeQueryParams,
  GetAnimeEpisodesQueryParams,
  GetAnimeEmbedQueryParams,
} from "@workspace/api-zod";

const ANILIST = "https://graphql.anilist.co";

// ── AniList helpers ───────────────────────────────────────────────────────────

type AniListMedia = {
  id: number;
  idMal: number | null;
  title: { romaji: string; english: string | null };
  description: string | null;
  coverImage: { large: string | null; medium: string | null };
  bannerImage: string | null;
  episodes: number | null;
  averageScore: number | null;
  status: string | null;
  startDate: { year: number | null } | null;
  genres: string[];
  format: string | null;
  studios?: { nodes: Array<{ name: string }> };
  duration?: number | null;
  isAdult?: boolean;
  trailer?: { id: string; site: string } | null;
  ranking?: Array<{ type: string; rank: number }>;
  popularity?: number;
};

type AniListPage = {
  pageInfo: { total: number | null; hasNextPage: boolean };
  media: AniListMedia[];
};

async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const resp = await fetch(ANILIST, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!resp.ok) throw new Error(`AniList HTTP ${resp.status}`);
  const json = (await resp.json()) as { data: T; errors?: unknown[] };
  if (json.errors) throw new Error(`AniList GQL error`);
  return json.data;
}

function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  return html.replace(/<[^>]*>/g, "").replace(/\n\n+/g, "\n\n").trim() || null;
}

function transformMedia(m: AniListMedia) {
  return {
    mal_id: m.idMal ?? m.id, // fallback to AniList ID so embed still works
    title: m.title.romaji,
    title_english: m.title.english ?? null,
    synopsis: stripHtml(m.description),
    poster: m.coverImage.large ?? m.coverImage.medium ?? null,
    score: m.averageScore != null ? m.averageScore / 10 : null,
    episodes: m.episodes ?? null,
    status: m.status ?? "Unknown",
    year: m.startDate?.year ?? null,
    genres: m.genres ?? [],
    type: m.format ?? null,
  };
}

const MEDIA_FIELDS = `
  id idMal
  title { romaji english }
  description
  coverImage { large medium }
  episodes averageScore status
  startDate { year }
  genres format
`;

// ── Router ────────────────────────────────────────────────────────────────────

const router: IRouter = Router();

// GET /anime/trending
router.get("/anime/trending", async (req, res): Promise<void> => {
  const params = GetAnimeTrendingQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const perPage = params.success ? (params.data.limit ?? 20) : 20;

  const data = await gql<{ Page: AniListPage }>(
    `query($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage }
        media(type: ANIME, status: RELEASING, sort: TRENDING_DESC) { ${MEDIA_FIELDS} }
      }
    }`,
    { page, perPage },
  );

  const { media, pageInfo } = data.Page;
  res.json(
    GetAnimeTrendingResponse.parse({
      items: media.map(transformMedia),
      total: pageInfo.total ?? media.length,
      page,
      hasNext: pageInfo.hasNextPage,
    }),
  );
});

// GET /anime/top
router.get("/anime/top", async (req, res): Promise<void> => {
  const params = GetAnimeTopQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const perPage = params.success ? (params.data.limit ?? 20) : 20;
  const genre = params.success ? params.data.genre : undefined;

  const data = await gql<{ Page: AniListPage }>(
    `query($page: Int, $perPage: Int, $genre: String) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage }
        media(type: ANIME, sort: SCORE_DESC, genre: $genre) { ${MEDIA_FIELDS} }
      }
    }`,
    { page, perPage, genre: genre ?? null },
  );

  const { media, pageInfo } = data.Page;
  res.json(
    GetAnimeTopResponse.parse({
      items: media.map(transformMedia),
      total: pageInfo.total ?? media.length,
      page,
      hasNext: pageInfo.hasNextPage,
    }),
  );
});

// GET /anime/search
router.get("/anime/search", async (req, res): Promise<void> => {
  const params = SearchAnimeQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "Missing required query param: q" });
    return;
  }
  const { q, page = 1, genre } = params.data;

  const data = await gql<{ Page: AniListPage }>(
    `query($page: Int, $search: String, $genre: String) {
      Page(page: $page, perPage: 20) {
        pageInfo { total hasNextPage }
        media(type: ANIME, search: $search, genre: $genre) { ${MEDIA_FIELDS} }
      }
    }`,
    { page, search: q, genre: genre ?? null },
  );

  const { media, pageInfo } = data.Page;
  res.json(
    SearchAnimeResponse.parse({
      items: media.map(transformMedia),
      total: pageInfo.total ?? media.length,
      page,
      hasNext: pageInfo.hasNextPage,
    }),
  );
});

// GET /anime/genres
router.get("/anime/genres", async (_req, res): Promise<void> => {
  const data = await gql<{ GenreCollection: string[] }>(
    `query { GenreCollection }`,
  );
  const genres = (data.GenreCollection ?? []).map((name, idx) => ({
    id: idx + 1,
    name,
  }));
  res.json(GetAnimeGenresResponse.parse({ genres }));
});

// GET /anime/episodes?malId=X&page=Y  — must come before /anime/:id
router.get("/anime/episodes", async (req, res): Promise<void> => {
  const params = GetAnimeEpisodesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "Missing required query param: malId" });
    return;
  }
  const { malId, page = 1 } = params.data;
  const perPage = 50;

  // Fetch total episode count from AniList by MAL ID
  let totalEpisodes: number | null = null;
  try {
    const data = await gql<{ Media: { episodes: number | null } }>(
      `query($idMal: Int) { Media(idMal: $idMal, type: ANIME) { episodes } }`,
      { idMal: malId },
    );
    totalEpisodes = data.Media?.episodes ?? null;
  } catch {
    // AniList might not find by MAL ID — generate a placeholder list
  }

  if (!totalEpisodes) {
    // Return a placeholder paginated list
    const start = (page - 1) * perPage + 1;
    const placeholderCount = 13; // common cour length
    const end = Math.min(start + perPage - 1, placeholderCount);
    const items = Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => ({
      number: start + i,
      title: null,
      aired: null,
      filler: false,
    }));
    res.json(
      GetAnimeEpisodesResponse.parse({
        items,
        page,
        hasNext: end < placeholderCount,
      }),
    );
    return;
  }

  const start = (page - 1) * perPage + 1;
  const end = Math.min(start + perPage - 1, totalEpisodes);
  const items = Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => ({
    number: start + i,
    title: null,
    aired: null,
    filler: false,
  }));

  res.json(
    GetAnimeEpisodesResponse.parse({
      items,
      page,
      hasNext: end < totalEpisodes,
    }),
  );
});

// GET /anime/embed?malId=X&ep=Y&dubbed=false  — must come before /anime/:id
router.get("/anime/embed", async (req, res): Promise<void> => {
  const params = GetAnimeEmbedQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "Missing required query param: malId" });
    return;
  }
  const { malId, ep = 1, dubbed = false } = params.data;
  const dubSuffix = dubbed ? "/dub" : "";
  const primary = `https://vidsrc.pro/embed/anime/${malId}/${ep}${dubSuffix}`;
  const alt2 = `https://vidsrc.to/embed/anime/${malId}/${ep}`;
  res.json(
    GetAnimeEmbedResponse.parse({
      embedUrl: primary,
      sources: [
        { label: dubbed ? "Dubbed" : "Subbed", url: primary },
        { label: "Mirror", url: alt2 },
      ],
    }),
  );
});

// GET /anime/:id
router.get("/anime/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetAnimeByIdParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid anime ID" });
    return;
  }
  const { id } = parsed.data;

  let data: { Media: AniListMedia } | null = null;

  // Try by MAL ID first, then by AniList ID
  try {
    data = await gql<{ Media: AniListMedia }>(
      `query($idMal: Int) {
        Media(idMal: $idMal, type: ANIME) {
          id idMal
          title { romaji english }
          description
          coverImage { large medium }
          bannerImage
          episodes averageScore status
          startDate { year }
          genres format duration
          studios(isMain: true) { nodes { name } }
          trailer { id site }
          ranking { type rank }
        }
      }`,
      { idMal: id },
    );
  } catch {
    try {
      data = await gql<{ Media: AniListMedia }>(
        `query($id: Int) {
          Media(id: $id, type: ANIME) {
            id idMal
            title { romaji english }
            description
            coverImage { large medium }
            bannerImage
            episodes averageScore status
            startDate { year }
            genres format duration
            studios(isMain: true) { nodes { name } }
            trailer { id site }
            ranking { type rank }
          }
        }`,
        { id },
      );
    } catch {
      res.status(404).json({ error: "Anime not found" });
      return;
    }
  }

  if (!data?.Media) {
    res.status(404).json({ error: "Anime not found" });
    return;
  }

  const m = data.Media;
  const trailerUrl =
    m.trailer?.site === "youtube"
      ? `https://www.youtube.com/embed/${m.trailer.id}`
      : null;
  const scoreRank =
    m.ranking?.find((r) => r.type === "RATED")?.rank ?? null;

  res.json(
    GetAnimeByIdResponse.parse({
      mal_id: m.idMal ?? m.id,
      title: m.title.romaji,
      title_english: m.title.english ?? null,
      synopsis: stripHtml(m.description),
      poster: m.coverImage.large ?? m.coverImage.medium ?? null,
      trailer_url: trailerUrl,
      score: m.averageScore != null ? m.averageScore / 10 : null,
      rank: scoreRank,
      episodes: m.episodes ?? null,
      status: m.status ?? "Unknown",
      year: m.startDate?.year ?? null,
      genres: m.genres ?? [],
      studios: m.studios?.nodes.map((s) => s.name) ?? [],
      type: m.format ?? null,
      duration: m.duration ? `${m.duration} min` : null,
      rating: null,
    }),
  );
});

export default router;
