import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { eq, and } from "drizzle-orm";
import { db, watchlistTable } from "@workspace/db";
import {
  GetWatchlistResponse,
  AddToWatchlistBody,
  AddToWatchlistResponse,
  RemoveFromWatchlistParams,
} from "@workspace/api-zod";

const SESSION_COOKIE = "streambox_sid";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

function getOrCreateSession(
  req: Parameters<Parameters<IRouter["get"]>[1]>[0],
  res: Parameters<Parameters<IRouter["get"]>[1]>[1],
): string {
  const existing = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (existing) return existing;
  const sid = randomUUID();
  res.cookie(SESSION_COOKIE, sid, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
  });
  return sid;
}

const router: IRouter = Router();

// GET /watchlist
router.get("/watchlist", async (req, res): Promise<void> => {
  const sessionId = getOrCreateSession(req, res);
  const rows = await db
    .select()
    .from(watchlistTable)
    .where(eq(watchlistTable.sessionId, sessionId))
    .orderBy(watchlistTable.addedAt);

  res.json(
    GetWatchlistResponse.parse(
      rows.map((r) => ({
        id: r.id,
        contentId: r.contentId,
        contentType: r.contentType,
        title: r.title,
        poster: r.poster ?? null,
        score: r.score ?? null,
        addedAt: r.addedAt.toISOString(),
      })),
    ),
  );
});

// POST /watchlist
router.post("/watchlist", async (req, res): Promise<void> => {
  const sessionId = getOrCreateSession(req, res);
  const body = AddToWatchlistBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const { contentId, contentType, title, poster, score } = body.data;

  const [row] = await db
    .insert(watchlistTable)
    .values({
      sessionId,
      contentId,
      contentType,
      title,
      poster: poster ?? null,
      score: score ?? null,
    })
    .returning();

  res.status(201).json(
    AddToWatchlistResponse.parse({
      id: row.id,
      contentId: row.contentId,
      contentType: row.contentType,
      title: row.title,
      poster: row.poster ?? null,
      score: row.score ?? null,
      addedAt: row.addedAt.toISOString(),
    }),
  );
});

// DELETE /watchlist/:itemId
router.delete("/watchlist/:itemId", async (req, res): Promise<void> => {
  const sessionId = getOrCreateSession(req, res);
  const raw = Array.isArray(req.params.itemId)
    ? req.params.itemId[0]
    : req.params.itemId;
  const parsed = RemoveFromWatchlistParams.safeParse({ itemId: raw });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid item ID" });
    return;
  }
  const { itemId } = parsed.data;

  await db
    .delete(watchlistTable)
    .where(
      and(
        eq(watchlistTable.id, itemId),
        eq(watchlistTable.sessionId, sessionId),
      ),
    );

  res.sendStatus(204);
});

export default router;
