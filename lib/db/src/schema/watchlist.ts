import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const watchlistTable = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  contentId: integer("content_id").notNull(),
  contentType: text("content_type").notNull(), // 'anime' | 'movie'
  title: text("title").notNull(),
  poster: text("poster"),
  score: real("score"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const insertWatchlistSchema = createInsertSchema(watchlistTable).omit({
  id: true,
  addedAt: true,
});
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type Watchlist = typeof watchlistTable.$inferSelect;
