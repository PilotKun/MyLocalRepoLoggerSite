import {
  User, InsertUser,
  MediaItem, InsertMediaItem,
  WatchlistItem, InsertWatchlistItem,
  WatchedItem, InsertWatchedItem,
  FavoriteItem, InsertFavoriteItem,
  List, InsertList,
  ListItem, InsertListItem,
  users, mediaItems, watchlistItems, watchedItems, favoriteItems, lists, listItems
} from "@shared/schema";
import { db } from './db';
import { eq, and, sql, count, avg, desc } from 'drizzle-orm';

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Media operations
  getMediaItem(id: number): Promise<MediaItem | undefined>;
  getMediaItemByTmdbId(tmdbId: number, type: string): Promise<MediaItem | undefined>;
  createMediaItem(item: InsertMediaItem): Promise<MediaItem>;

  // Watchlist operations
  getWatchlistByUserId(userId: string): Promise<(WatchlistItem & { media: MediaItem })[]>;
  addToWatchlist(item: InsertWatchlistItem): Promise<WatchlistItem>;
  removeFromWatchlist(userId: string, mediaId: number): Promise<void>;
  isInWatchlist(userId: string, mediaId: number): Promise<boolean>;

  // Watched operations
  getWatchedByUserId(userId: string): Promise<(WatchedItem & { media: MediaItem })[]>;
  addToWatched(item: InsertWatchedItem): Promise<WatchedItem>;
  removeFromWatched(userId: string, mediaId: number): Promise<void>;
  isWatched(userId: string, mediaId: number): Promise<boolean>;
  
  // Favorites operations
  getFavoritesByUserId(userId: string): Promise<(FavoriteItem & { media: MediaItem })[]>;
  addToFavorites(item: InsertFavoriteItem): Promise<FavoriteItem>;
  removeFromFavorites(userId: string, mediaId: number): Promise<void>;
  isInFavorites(userId: string, mediaId: number): Promise<boolean>;
  
  // Lists operations
  getListsByUserId(userId: string): Promise<List[]>;
  getListById(id: number, userId?: string): Promise<(List & { items: (ListItem & { media: MediaItem; userRating?: number | null })[] }) | undefined>;
  createList(list: InsertList): Promise<List>;
  updateList(id: number, updates: Partial<InsertList>): Promise<List | undefined>;
  deleteList(id: number): Promise<void>;
  
  // List items operations
  addToList(item: InsertListItem): Promise<ListItem>;
  removeFromList(listId: number, mediaId: number): Promise<void>;
  
  // Stats operations
  getUserStats(userId: string): Promise<{
    moviesWatched: number;
    tvEpisodesWatched: number;
    averageRating: number;
    totalWatchtime: number;
  }>;

  getRecentActivity(userId: string, limit?: number): Promise<ActivityItem[]>;
}

type ActivityItem = {
  id: number;
  userId: string;
  mediaId: number;
  createdAt: Date;
  type: 'watched' | 'favorite' | 'added_to_list';
  rating?: number | null;
  media: {
    id: number;
    tmdbId: number;
    type: string;
    title: string;
    posterPath: string | null;
    backdropPath: string | null;
    overview: string | null;
    releaseDate: string | null;
    voteAverage: number | null;
    episodeCount: number | null;
    createdAt: Date | null;
  };
  list?: {
    id: number;
    userId: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    createdAt: Date;
  } | null;
};

// PostgreSQL implementation
export class PostgresStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Media operations
  async getMediaItem(id: number): Promise<MediaItem | undefined> {
    const result = await db.select().from(mediaItems).where(eq(mediaItems.id, id));
    return result[0];
  }

  async getMediaItemByTmdbId(tmdbId: number, type: string): Promise<MediaItem | undefined> {
    const result = await db.select().from(mediaItems).where(
      and(
        eq(mediaItems.tmdbId, tmdbId),
        eq(mediaItems.type, type)
      )
    );
    return result[0];
  }

  async createMediaItem(item: InsertMediaItem): Promise<MediaItem> {
    const result = await db.insert(mediaItems).values(item).returning();
    return result[0];
  }

  // Watchlist operations
  async getWatchlistByUserId(userId: string): Promise<(WatchlistItem & { media: MediaItem })[]> {
    const result = await db
      .select({
        id: watchlistItems.id,
        userId: watchlistItems.userId,
        mediaId: watchlistItems.mediaId,
        createdAt: watchlistItems.createdAt,
        media: {
          id: mediaItems.id,
          tmdbId: mediaItems.tmdbId,
          type: mediaItems.type,
          title: mediaItems.title,
          posterPath: mediaItems.posterPath,
          backdropPath: mediaItems.backdropPath,
          overview: mediaItems.overview,
          releaseDate: mediaItems.releaseDate,
          voteAverage: mediaItems.voteAverage,
          episodeCount: mediaItems.episodeCount,
          createdAt: mediaItems.createdAt,
        },
      })
      .from(watchlistItems)
      .innerJoin(mediaItems, eq(watchlistItems.mediaId, mediaItems.id))
      .where(eq(watchlistItems.userId, userId));
    
    return result.map(item => ({
      ...item,
      createdAt: item.createdAt ?? new Date(),
      media: {
        ...item.media,
        createdAt: item.media.createdAt ?? null,
      },
    }));
  }

  async addToWatchlist(item: InsertWatchlistItem): Promise<WatchlistItem> {
    const result = await db.insert(watchlistItems).values(item).returning();
    return result[0];
  }

  async removeFromWatchlist(userId: string, mediaId: number): Promise<void> {
    await db
      .delete(watchlistItems)
      .where(
        and(
          eq(watchlistItems.userId, userId),
          eq(watchlistItems.mediaId, mediaId)
        )
      );
  }

  async isInWatchlist(userId: string, mediaId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(watchlistItems)
      .where(
        and(
          eq(watchlistItems.userId, userId),
          eq(watchlistItems.mediaId, mediaId)
        )
      );
    return result.length > 0;
  }

  // Watched operations
  async getWatchedByUserId(userId: string): Promise<(WatchedItem & { media: MediaItem })[]> {
    const result = await db
      .select({
        id: watchedItems.id,
        userId: watchedItems.userId,
        mediaId: watchedItems.mediaId,
        rating: watchedItems.rating,
        createdAt: watchedItems.createdAt,
        media: {
          id: mediaItems.id,
          tmdbId: mediaItems.tmdbId,
          type: mediaItems.type,
          title: mediaItems.title,
          posterPath: mediaItems.posterPath,
          backdropPath: mediaItems.backdropPath,
          overview: mediaItems.overview,
          releaseDate: mediaItems.releaseDate,
          voteAverage: mediaItems.voteAverage,
          episodeCount: mediaItems.episodeCount,
          createdAt: mediaItems.createdAt,
        },
      })
      .from(watchedItems)
      .innerJoin(mediaItems, eq(watchedItems.mediaId, mediaItems.id))
      .where(eq(watchedItems.userId, userId));
    
    return result.map(item => ({
      ...item,
      createdAt: item.createdAt ?? new Date(),
      media: {
        ...item.media,
        createdAt: item.media.createdAt ?? null,
      },
    }));
  }

  async addToWatched(item: InsertWatchedItem): Promise<WatchedItem> {
    const result = await db.insert(watchedItems).values(item).returning();
    return result[0];
  }

  async removeFromWatched(userId: string, mediaId: number): Promise<void> {
    await db
      .delete(watchedItems)
      .where(
        and(
          eq(watchedItems.userId, userId),
          eq(watchedItems.mediaId, mediaId)
        )
      );
  }

  async isWatched(userId: string, mediaId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(watchedItems)
      .where(
        and(
          eq(watchedItems.userId, userId),
          eq(watchedItems.mediaId, mediaId)
        )
      );
    return result.length > 0;
  }

  // Favorites operations
  async getFavoritesByUserId(userId: string): Promise<(FavoriteItem & { media: MediaItem })[]> {
    const result = await db
      .select({
        id: favoriteItems.id,
        userId: favoriteItems.userId,
        mediaId: favoriteItems.mediaId,
        createdAt: favoriteItems.createdAt,
        media: {
          id: mediaItems.id,
          tmdbId: mediaItems.tmdbId,
          type: mediaItems.type,
          title: mediaItems.title,
          posterPath: mediaItems.posterPath,
          backdropPath: mediaItems.backdropPath,
          overview: mediaItems.overview,
          releaseDate: mediaItems.releaseDate,
          voteAverage: mediaItems.voteAverage,
          episodeCount: mediaItems.episodeCount,
          createdAt: mediaItems.createdAt,
        },
      })
      .from(favoriteItems)
      .innerJoin(mediaItems, eq(favoriteItems.mediaId, mediaItems.id))
      .where(eq(favoriteItems.userId, userId));
    
    return result.map(item => ({
      ...item,
      createdAt: item.createdAt ?? new Date(),
      media: {
        ...item.media,
        createdAt: item.media.createdAt ?? null,
      },
    }));
  }

  async addToFavorites(item: InsertFavoriteItem): Promise<FavoriteItem> {
    const result = await db.insert(favoriteItems).values(item).returning();
    return result[0];
  }

  async removeFromFavorites(userId: string, mediaId: number): Promise<void> {
    await db
      .delete(favoriteItems)
      .where(
        and(
          eq(favoriteItems.userId, userId),
          eq(favoriteItems.mediaId, mediaId)
        )
      );
  }

  async isInFavorites(userId: string, mediaId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(favoriteItems)
      .where(
        and(
          eq(favoriteItems.userId, userId),
          eq(favoriteItems.mediaId, mediaId)
        )
      );
    return result.length > 0;
  }

  // Lists operations
  async getListsByUserId(userId: string): Promise<List[]> {
    try {
      console.log("Fetching lists for user:", userId);
      const result = await db
        .select({
          id: lists.id,
          userId: lists.userId,
          name: lists.name,
          description: lists.description,
          isPublic: lists.isPublic,
          createdAt: lists.createdAt,
        })
        .from(lists)
        .where(eq(lists.userId, userId));
      
      console.log("Found lists:", result);
      return result.map(list => ({
        ...list,
        createdAt: list.createdAt ?? new Date(),
        isPublic: list.isPublic ?? false,
      }));
    } catch (error) {
      console.error("Error fetching lists:", error);
      throw error;
    }
  }

  async getListById(id: number, userId?: string): Promise<(List & { items: (ListItem & { media: MediaItem; userRating?: number | null })[] }) | undefined> {
    try {
      console.log(`Fetching list by ID: ${id} for user: ${userId || 'anonymous'}`);
      
      // First check if the list exists
      const listExists = await db
        .select({ id: lists.id })
        .from(lists)
        .where(eq(lists.id, id));

      if (!listExists.length) {
        console.log(`List with ID ${id} does not exist in the database`);
        return undefined;
      }

      console.log(`List ${id} found, fetching details and items using userId: ${userId}`);
      
      const result = await db.select({
        id: lists.id,
        userId: lists.userId,
        name: lists.name,
        description: lists.description,
        isPublic: lists.isPublic,
        createdAt: lists.createdAt,
        items: sql<(ListItem & { media: MediaItem; userRating?: number | null })[]>` 
          COALESCE(
            (
              SELECT ARRAY_AGG(
                json_build_object(
                  'id', li.id,
                  'listId', li.list_id,
                  'mediaId', li.media_id,
                  'status', li.status,
                  'seasonsWatched', li.seasons_watched,
                  'createdAt', li.created_at,
                  'media', json_build_object(
                    'id', mi.id,
                    'tmdbId', mi.tmdb_id,
                    'type', mi.type,
                    'title', mi.title,
                    'posterPath', mi.poster_path,
                    'backdropPath', mi.backdrop_path,
                    'overview', mi.overview,
                    'releaseDate', mi.release_date,
                    'voteAverage', mi.vote_average,
                    'episodeCount', mi.episode_count,
                    'createdAt', mi.created_at
                  ),
                  'userRating', wi.rating
                )
              )
              FROM ${listItems} li
              LEFT JOIN ${mediaItems} mi ON li.media_id = mi.id
              ${userId ? sql`LEFT JOIN ${watchedItems} wi ON li.media_id = wi.media_id AND wi.user_id = ${userId}` : sql`LEFT JOIN ${watchedItems} wi ON false`}
              WHERE li.list_id = ${id}
            ),
            ARRAY[]::json[]
          )
        `
      })
      .from(lists)
      .where(eq(lists.id, id))
      .groupBy(lists.id);

      console.log(`Raw database result for list ${id}:`, JSON.stringify(result, null, 2));

      if (!result[0]) {
        console.log(`Failed to fetch list details for ID ${id}`);
        return undefined;
      }

      console.log(`Processing raw items for list ${id}:`, JSON.stringify(result[0].items, null, 2));
      console.log('Items with ratings before mapping:', result[0].items.map(item => ({
        title: item.media.title,
        userRating: item.userRating
      })));
      
      const listData = {
        ...result[0],
        createdAt: result[0].createdAt ?? new Date(),
        isPublic: result[0].isPublic ?? false,
        items: (result[0].items || []).map(item => ({
          ...item,
          createdAt: item.createdAt ?? new Date(),
          media: {
            ...item.media,
            createdAt: item.media.createdAt ?? null,
          }
        }))
      };
      return listData;
    } catch (error) {
      console.error(`Error fetching list ${id}:`, error);
      throw error;
    }
  }

  async createList(list: InsertList): Promise<List> {
    try {
      console.log("Creating list:", list);
      const result = await db.insert(lists).values({
        ...list,
        isPublic: list.isPublic ?? false,
      }).returning();
      
      console.log("List created:", result[0]);
      return {
        ...result[0],
        createdAt: result[0].createdAt ?? new Date(),
        isPublic: result[0].isPublic ?? false,
      };
    } catch (error) {
      console.error("Error creating list:", error);
      throw error;
    }
  }

  async updateList(id: number, updates: Partial<InsertList>): Promise<List | undefined> {
    try {
      console.log("Updating list:", id, updates);
      const result = await db
        .update(lists)
        .set(updates)
        .where(eq(lists.id, id))
        .returning();
      
      if (!result[0]) {
        console.log("List not found:", id);
        return undefined;
      }

      console.log("List updated:", result[0]);
      return {
        ...result[0],
        createdAt: result[0].createdAt ?? new Date(),
        isPublic: result[0].isPublic ?? false,
      };
    } catch (error) {
      console.error("Error updating list:", error);
      throw error;
    }
  }

  async deleteList(id: number): Promise<void> {
    try {
      console.log("Deleting list:", id);
      // First delete all items in the list
      await db.delete(listItems).where(eq(listItems.listId, id));
      
      // Then delete the list itself
      await db.delete(lists).where(eq(lists.id, id));
      console.log("List deleted:", id);
    } catch (error) {
      console.error("Error deleting list:", error);
      throw error;
    }
  }

  // List items operations
  async addToList(item: InsertListItem): Promise<ListItem> {
    try {
      console.log("Adding item to list with payload:", JSON.stringify(item, null, 2));
      
      // Validate input data
      if (!item.listId || !item.mediaId) {
        throw new Error("List ID and Media ID are required");
      }
      
      // Validate status
      const validStatuses = ["watched", "watchlist", "watching", "on hold", "dropped"];
      const status = item.status || "watched";
      if (!validStatuses.includes(status)) {
        console.warn(`Invalid status provided: ${status}. Proceeding with insertion.`); 
      }
      
      // Check if the item already exists in the list
      const existingItem = await db.select()
        .from(listItems)
        .where(
          and(
            eq(listItems.listId, item.listId),
            eq(listItems.mediaId, item.mediaId)
          )
        );
      
      if (existingItem.length > 0) {
        throw new Error("Item already exists in this list");
      }
      
      // Prepare data for insert
      const insertData = {
        listId: item.listId,
        mediaId: item.mediaId,
        status: status,
        seasonsWatched: item.seasonsWatched || 0,
        createdAt: new Date()
      };
      
      console.log("Final insert data:", insertData);
      
      // Insert the new item
      const result = await db.insert(listItems).values(insertData).returning();
      console.log("Item added to list successfully:", result[0]);
      return result[0];
    } catch (error) {
      console.error("Error adding item to list:", error);
      throw error;
    }
  }

  async removeFromList(listId: number, mediaId: number): Promise<void> {
    try {
      console.log("Removing item from list:", listId, mediaId);
      await db.delete(listItems).where(
        and(
          eq(listItems.listId, listId),
          eq(listItems.mediaId, mediaId)
        )
      );
      console.log("Item removed from list:", listId, mediaId);
    } catch (error) {
      console.error("Error removing item from list:", error);
      throw error;
    }
  }

  // Stats operations
  async getUserStats(userId: string): Promise<{
    moviesWatched: number;
    tvEpisodesWatched: number;
    averageRating: number;
    totalWatchtime: number;
  }> {
    const [moviesResult, tvResult, ratingResult] = await Promise.all([
      db
        .select({ count: count() })
        .from(watchedItems)
        .innerJoin(mediaItems, eq(watchedItems.mediaId, mediaItems.id))
        .where(and(eq(watchedItems.userId, userId), eq(mediaItems.type, 'movie')))
        .then(res => res[0]?.count || 0),
      
      db
        .select({ count: count() })
        .from(watchedItems)
        .innerJoin(mediaItems, eq(watchedItems.mediaId, mediaItems.id))
        .where(and(eq(watchedItems.userId, userId), eq(mediaItems.type, 'tv')))
        .then(res => res[0]?.count || 0),
      
      db
        .select({ average: avg(watchedItems.rating) })
        .from(watchedItems)
        .where(eq(watchedItems.userId, userId))
        .then(res => res[0]?.average || 0)
    ]);

    return {
      moviesWatched: Number(moviesResult),
      tvEpisodesWatched: Number(tvResult),
      averageRating: Number(ratingResult),
      totalWatchtime: 0, // TODO: Implement runtime calculation
    };
  }

  async getRecentActivity(userId: string): Promise<ActivityItem[]> {
    // Get watched activity
    const watchedActivity = await db.select({
      id: watchedItems.id,
      userId: watchedItems.userId,
      mediaId: watchedItems.mediaId,
      createdAt: watchedItems.createdAt,
      rating: watchedItems.rating,
      media: {
        id: mediaItems.id,
        tmdbId: mediaItems.tmdbId,
        type: mediaItems.type,
        title: mediaItems.title,
        posterPath: mediaItems.posterPath,
        backdropPath: mediaItems.backdropPath,
        overview: mediaItems.overview,
        releaseDate: mediaItems.releaseDate,
        voteAverage: mediaItems.voteAverage,
        episodeCount: mediaItems.episodeCount,
        createdAt: mediaItems.createdAt,
      },
      type: sql<'watched'>`'watched'::text`,
    })
    .from(watchedItems)
    .innerJoin(mediaItems, eq(watchedItems.mediaId, mediaItems.id))
    .where(eq(watchedItems.userId, userId))
    .orderBy(desc(watchedItems.createdAt))
    .limit(10);

    // Get favorites activity
    const favoritesActivity = await db.select({
      id: favoriteItems.id,
      userId: favoriteItems.userId,
      mediaId: favoriteItems.mediaId,
      createdAt: favoriteItems.createdAt,
      media: {
        id: mediaItems.id,
        tmdbId: mediaItems.tmdbId,
        type: mediaItems.type,
        title: mediaItems.title,
        posterPath: mediaItems.posterPath,
        backdropPath: mediaItems.backdropPath,
        overview: mediaItems.overview,
        releaseDate: mediaItems.releaseDate,
        voteAverage: mediaItems.voteAverage,
        episodeCount: mediaItems.episodeCount,
        createdAt: mediaItems.createdAt,
      },
      type: sql<'favorite'>`'favorite'::text`,
    })
    .from(favoriteItems)
    .innerJoin(mediaItems, eq(favoriteItems.mediaId, mediaItems.id))
    .where(eq(favoriteItems.userId, userId))
    .orderBy(desc(favoriteItems.createdAt))
    .limit(10);

    // Get list activity
    const listActivity = await db.select({
      id: listItems.id,
      userId: lists.userId,
      mediaId: listItems.mediaId,
      createdAt: listItems.createdAt,
      media: {
        id: mediaItems.id,
        tmdbId: mediaItems.tmdbId,
        type: mediaItems.type,
        title: mediaItems.title,
        posterPath: mediaItems.posterPath,
        backdropPath: mediaItems.backdropPath,
        overview: mediaItems.overview,
        releaseDate: mediaItems.releaseDate,
        voteAverage: mediaItems.voteAverage,
        episodeCount: mediaItems.episodeCount,
        createdAt: mediaItems.createdAt,
      },
      type: sql<'added_to_list'>`'added_to_list'::text`,
      list: {
        id: lists.id,
        userId: lists.userId,
        name: lists.name,
        description: lists.description,
        isPublic: sql<boolean>`COALESCE(${lists.isPublic}, false)`,
        createdAt: lists.createdAt,
      },
    })
    .from(listItems)
    .innerJoin(mediaItems, eq(listItems.mediaId, mediaItems.id))
    .innerJoin(lists, eq(listItems.listId, lists.id))
    .where(eq(lists.userId, userId))
    .orderBy(desc(listItems.createdAt))
    .limit(10);

    // Combine and sort all activities
    const allActivity = [
      ...watchedActivity.map(item => ({
        ...item,
        createdAt: item.createdAt ?? new Date(),
        media: {
          ...item.media,
          createdAt: item.media.createdAt ?? null,
        },
      })),
      ...favoritesActivity.map(item => ({
        ...item,
        createdAt: item.createdAt ?? new Date(),
        media: {
          ...item.media,
          createdAt: item.media.createdAt ?? null,
        },
      })),
      ...listActivity.map(item => ({
        ...item,
        createdAt: item.createdAt ?? new Date(),
        media: {
          ...item.media,
          createdAt: item.media.createdAt ?? null,
        },
        list: item.list ? {
          ...item.list,
          createdAt: item.list.createdAt ?? new Date(),
          isPublic: item.list.isPublic ?? false,
        } : null,
      })),
    ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

    return allActivity;
  }
}

// Keep the in-memory implementation for fallback

// Export a single instance
export const storage = new PostgresStorage();