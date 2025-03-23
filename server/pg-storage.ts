import { db } from './db';
import { IStorage } from './storage';
import { eq, and } from 'drizzle-orm';
import {
  User,
  MediaItem,
  WatchlistItem,
  WatchedItem,
  FavoriteItem,
  List,
  ListItem,
  InsertUser,
  InsertMediaItem,
  InsertWatchlistItem,
  InsertWatchedItem, 
  InsertFavoriteItem,
  InsertList,
  InsertListItem,
  users,
  mediaItems,
  watchlistItems,
  watchedItems,
  favoriteItems,
  lists,
  listItems
} from '../shared/schema';

export class PostgresStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
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
  async getWatchlistByUserId(userId: number): Promise<(WatchlistItem & { media: MediaItem })[]> {
    const result = await db
      .select({
        id: watchlistItems.id,
        userId: watchlistItems.userId,
        mediaId: watchlistItems.mediaId,
        addedAt: watchlistItems.addedAt,
        media: mediaItems
      })
      .from(watchlistItems)
      .innerJoin(mediaItems, eq(watchlistItems.mediaId, mediaItems.id))
      .where(eq(watchlistItems.userId, userId));
    
    return result;
  }

  async addToWatchlist(item: InsertWatchlistItem): Promise<WatchlistItem> {
    const result = await db.insert(watchlistItems).values(item).returning();
    return result[0];
  }

  async removeFromWatchlist(userId: number, mediaId: number): Promise<void> {
    await db.delete(watchlistItems).where(
      and(
        eq(watchlistItems.userId, userId),
        eq(watchlistItems.mediaId, mediaId)
      )
    );
  }

  async isInWatchlist(userId: number, mediaId: number): Promise<boolean> {
    const result = await db.select().from(watchlistItems).where(
      and(
        eq(watchlistItems.userId, userId),
        eq(watchlistItems.mediaId, mediaId)
      )
    );
    return result.length > 0;
  }

  // Watched operations
  async getWatchedByUserId(userId: number): Promise<(WatchedItem & { media: MediaItem })[]> {
    const result = await db
      .select({
        id: watchedItems.id,
        userId: watchedItems.userId,
        mediaId: watchedItems.mediaId,
        rating: watchedItems.rating,
        watchedAt: watchedItems.watchedAt,
        media: mediaItems
      })
      .from(watchedItems)
      .innerJoin(mediaItems, eq(watchedItems.mediaId, mediaItems.id))
      .where(eq(watchedItems.userId, userId));
    
    return result;
  }

  async addToWatched(item: InsertWatchedItem): Promise<WatchedItem> {
    const result = await db.insert(watchedItems).values(item).returning();
    return result[0];
  }

  async removeFromWatched(userId: number, mediaId: number): Promise<void> {
    await db.delete(watchedItems).where(
      and(
        eq(watchedItems.userId, userId),
        eq(watchedItems.mediaId, mediaId)
      )
    );
  }

  async isWatched(userId: number, mediaId: number): Promise<boolean> {
    const result = await db.select().from(watchedItems).where(
      and(
        eq(watchedItems.userId, userId),
        eq(watchedItems.mediaId, mediaId)
      )
    );
    return result.length > 0;
  }

  // Favorites operations
  async getFavoritesByUserId(userId: number): Promise<(FavoriteItem & { media: MediaItem })[]> {
    const result = await db
      .select({
        id: favoriteItems.id,
        userId: favoriteItems.userId,
        mediaId: favoriteItems.mediaId,
        addedAt: favoriteItems.addedAt,
        media: mediaItems
      })
      .from(favoriteItems)
      .innerJoin(mediaItems, eq(favoriteItems.mediaId, mediaItems.id))
      .where(eq(favoriteItems.userId, userId));
    
    return result;
  }

  async addToFavorites(item: InsertFavoriteItem): Promise<FavoriteItem> {
    const result = await db.insert(favoriteItems).values(item).returning();
    return result[0];
  }

  async removeFromFavorites(userId: number, mediaId: number): Promise<void> {
    await db.delete(favoriteItems).where(
      and(
        eq(favoriteItems.userId, userId),
        eq(favoriteItems.mediaId, mediaId)
      )
    );
  }

  async isInFavorites(userId: number, mediaId: number): Promise<boolean> {
    const result = await db.select().from(favoriteItems).where(
      and(
        eq(favoriteItems.userId, userId),
        eq(favoriteItems.mediaId, mediaId)
      )
    );
    return result.length > 0;
  }

  // Lists operations
  async getListsByUserId(userId: number): Promise<List[]> {
    const result = await db
      .select()
      .from(lists)
      .where(eq(lists.userId, userId));
    
    return result;
  }

  async getListById(id: number): Promise<(List & { items: (ListItem & { media: MediaItem })[] }) | undefined> {
    const listResult = await db
      .select()
      .from(lists)
      .where(eq(lists.id, id));
    
    if (listResult.length === 0) {
      return undefined;
    }
    
    const list = listResult[0];
    
    const itemsResult = await db
      .select({
        id: listItems.id,
        listId: listItems.listId,
        mediaId: listItems.mediaId,
        addedAt: listItems.addedAt,
        media: mediaItems
      })
      .from(listItems)
      .innerJoin(mediaItems, eq(listItems.mediaId, mediaItems.id))
      .where(eq(listItems.listId, id));
    
    return {
      ...list,
      items: itemsResult
    };
  }

  async createList(list: InsertList): Promise<List> {
    const result = await db.insert(lists).values(list).returning();
    return result[0];
  }

  async updateList(id: number, updates: Partial<InsertList>): Promise<List | undefined> {
    const result = await db
      .update(lists)
      .set(updates)
      .where(eq(lists.id, id))
      .returning();
    
    return result[0];
  }

  async deleteList(id: number): Promise<void> {
    // First delete all items in the list
    await db.delete(listItems).where(eq(listItems.listId, id));
    
    // Then delete the list itself
    await db.delete(lists).where(eq(lists.id, id));
  }

  // List items operations
  async addToList(item: InsertListItem): Promise<ListItem> {
    const result = await db.insert(listItems).values(item).returning();
    return result[0];
  }

  async removeFromList(listId: number, mediaId: number): Promise<void> {
    await db.delete(listItems).where(
      and(
        eq(listItems.listId, listId),
        eq(listItems.mediaId, mediaId)
      )
    );
  }

  // Stats operations
  async getUserStats(userId: number): Promise<{
    moviesWatched: number;
    tvEpisodesWatched: number;
    averageRating: number;
    totalWatchtime: number;
  }> {
    // Get all watched items for this user
    const watchedMovies = await db
      .select()
      .from(watchedItems)
      .innerJoin(mediaItems, eq(watchedItems.mediaId, mediaItems.id))
      .where(
        and(
          eq(watchedItems.userId, userId),
          eq(mediaItems.type, 'movie')
        )
      );
    
    const watchedTVShows = await db
      .select()
      .from(watchedItems)
      .innerJoin(mediaItems, eq(watchedItems.mediaId, mediaItems.id))
      .where(
        and(
          eq(watchedItems.userId, userId),
          eq(mediaItems.type, 'tv')
        )
      );
    
    // Get rated items to calculate average rating
    const ratedItems = await db
      .select()
      .from(watchedItems)
      .where(
        and(
          eq(watchedItems.userId, userId),
          // Only include items with a rating
          // This assumes your rating field can be null
        )
      );
    
    // Calculate totals
    const moviesWatched = watchedMovies.length;
    const tvEpisodesWatched = watchedTVShows.length;
    
    // Calculate average rating (if any ratings exist)
    let averageRating = 0;
    if (ratedItems.length > 0) {
      const totalRating = ratedItems.reduce((sum, item) => sum + (item.watchedItems.rating || 0), 0);
      averageRating = totalRating / ratedItems.length;
    }
    
    // Estimate watch time (in hours)
    // Assuming average movie is ~2 hours and TV episode is ~1 hour
    const totalWatchtime = (moviesWatched * 2) + (tvEpisodesWatched * 1);
    
    return {
      moviesWatched,
      tvEpisodesWatched,
      averageRating,
      totalWatchtime
    };
  }

  async getRecentActivity(userId: number, limit: number = 10): Promise<(WatchedItem | WatchlistItem | FavoriteItem)[]> {
    // Get recent watched items
    const watched = await db
      .select({
        ...watchedItems,
        type: () => db.val('watched'),
        date: watchedItems.watchedAt
      })
      .from(watchedItems)
      .where(eq(watchedItems.userId, userId))
      .limit(limit);
    
    // Get recent watchlist items
    const watchlist = await db
      .select({
        ...watchlistItems,
        type: () => db.val('watchlist'),
        date: watchlistItems.addedAt
      })
      .from(watchlistItems)
      .where(eq(watchlistItems.userId, userId))
      .limit(limit);
    
    // Get recent favorite items
    const favorites = await db
      .select({
        ...favoriteItems,
        type: () => db.val('favorite'),
        date: favoriteItems.addedAt
      })
      .from(favoriteItems)
      .where(eq(favoriteItems.userId, userId))
      .limit(limit);
    
    // Combine all activity
    const allActivity = [
      ...watched,
      ...watchlist,
      ...favorites
    ]
    .sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, limit);
    
    return allActivity;
  }
}