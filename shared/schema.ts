import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
});

// Media model (for both movies and TV shows)
export const mediaItems = pgTable("media_items", {
  id: serial("id").primaryKey(),
  tmdbId: integer("tmdb_id").notNull(),
  type: text("type").notNull(), // 'movie' or 'tv'
  title: text("title").notNull(),
  posterPath: text("poster_path"),
  backdropPath: text("backdrop_path"),
  overview: text("overview"),
  releaseDate: text("release_date"),
  voteAverage: integer("vote_average"),
  episodeCount: integer("episode_count"),
  runtime: integer("runtime"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMediaItemSchema = createInsertSchema(mediaItems).omit({
  id: true,
});

// Watchlist model
export const watchlistItems = pgTable("watchlist_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  mediaId: integer("media_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWatchlistItemSchema = createInsertSchema(watchlistItems).omit({
  id: true,
  createdAt: true,
});

// Watched model
export const watchedItems = pgTable("watched_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  mediaId: integer("media_id").notNull(),
  rating: integer("rating"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWatchedItemSchema = createInsertSchema(watchedItems).omit({
  id: true,
  createdAt: true,
});

// Favorites model
export const favoriteItems = pgTable("favorite_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  mediaId: integer("media_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFavoriteItemSchema = createInsertSchema(favoriteItems).omit({
  id: true,
  createdAt: true,
});

// Custom lists model
export const lists = pgTable("lists", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertListSchema = createInsertSchema(lists).omit({
  id: true,
  createdAt: true,
});

// List items model
export const listItems = pgTable("list_items", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull(),
  mediaId: integer("media_id").notNull(),
  status: varchar("status", { length: 50 }).default("watched"),
  seasonsWatched: integer("seasons_watched"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertListItemSchema = createInsertSchema(listItems).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type MediaItem = typeof mediaItems.$inferSelect;
export type InsertMediaItem = z.infer<typeof insertMediaItemSchema>;

export type WatchlistItem = typeof watchlistItems.$inferSelect;
export type InsertWatchlistItem = z.infer<typeof insertWatchlistItemSchema>;

export type WatchedItem = typeof watchedItems.$inferSelect;
export type InsertWatchedItem = z.infer<typeof insertWatchedItemSchema>;

export type FavoriteItem = typeof favoriteItems.$inferSelect;
export type InsertFavoriteItem = z.infer<typeof insertFavoriteItemSchema>;

export type List = typeof lists.$inferSelect;
export type InsertList = z.infer<typeof insertListSchema>;

export type ListItem = typeof listItems.$inferSelect;
export type InsertListItem = z.infer<typeof insertListItemSchema>;

// TMDB API response types
export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
  backdrop_path: string | null;
  genre_ids: number[];
}

export interface TMDBTVShow {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
  overview: string;
  backdrop_path: string | null;
  genre_ids: number[];
}

export interface TMDBSearchResult {
  page: number;
  results: (TMDBMovie | TMDBTVShow)[];
  total_results: number;
  total_pages: number;
}
