import {
  User, InsertUser,
  MediaItem, InsertMediaItem,
  WatchlistItem, InsertWatchlistItem,
  WatchedItem, InsertWatchedItem,
  FavoriteItem, InsertFavoriteItem,
  List, InsertList,
  ListItem, InsertListItem
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Media operations
  getMediaItem(id: number): Promise<MediaItem | undefined>;
  getMediaItemByTmdbId(tmdbId: number, type: string): Promise<MediaItem | undefined>;
  createMediaItem(item: InsertMediaItem): Promise<MediaItem>;

  // Watchlist operations
  getWatchlistByUserId(userId: number): Promise<(WatchlistItem & { media: MediaItem })[]>;
  addToWatchlist(item: InsertWatchlistItem): Promise<WatchlistItem>;
  removeFromWatchlist(userId: number, mediaId: number): Promise<void>;
  isInWatchlist(userId: number, mediaId: number): Promise<boolean>;

  // Watched operations
  getWatchedByUserId(userId: number): Promise<(WatchedItem & { media: MediaItem })[]>;
  addToWatched(item: InsertWatchedItem): Promise<WatchedItem>;
  removeFromWatched(userId: number, mediaId: number): Promise<void>;
  isWatched(userId: number, mediaId: number): Promise<boolean>;
  
  // Favorites operations
  getFavoritesByUserId(userId: number): Promise<(FavoriteItem & { media: MediaItem })[]>;
  addToFavorites(item: InsertFavoriteItem): Promise<FavoriteItem>;
  removeFromFavorites(userId: number, mediaId: number): Promise<void>;
  isInFavorites(userId: number, mediaId: number): Promise<boolean>;
  
  // Lists operations
  getListsByUserId(userId: number): Promise<List[]>;
  getListById(id: number): Promise<(List & { items: (ListItem & { media: MediaItem })[] }) | undefined>;
  createList(list: InsertList): Promise<List>;
  updateList(id: number, updates: Partial<InsertList>): Promise<List | undefined>;
  deleteList(id: number): Promise<void>;
  
  // List items operations
  addToList(item: InsertListItem): Promise<ListItem>;
  removeFromList(listId: number, mediaId: number): Promise<void>;
  
  // Stats operations
  getUserStats(userId: number): Promise<{
    moviesWatched: number;
    tvEpisodesWatched: number;
    averageRating: number;
    totalWatchtime: number;
  }>;

  getRecentActivity(userId: number, limit?: number): Promise<(WatchedItem | WatchlistItem | FavoriteItem)[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private mediaItems: Map<number, MediaItem>;
  private watchlistItems: Map<number, WatchlistItem>;
  private watchedItems: Map<number, WatchedItem>;
  private favoriteItems: Map<number, FavoriteItem>;
  private lists: Map<number, List>;
  private listItems: Map<number, ListItem>;
  
  private userIdCounter: number;
  private mediaIdCounter: number;
  private watchlistIdCounter: number;
  private watchedIdCounter: number;
  private favoriteIdCounter: number;
  private listIdCounter: number;
  private listItemIdCounter: number;

  constructor() {
    this.users = new Map();
    this.mediaItems = new Map();
    this.watchlistItems = new Map();
    this.watchedItems = new Map();
    this.favoriteItems = new Map();
    this.lists = new Map();
    this.listItems = new Map();
    
    this.userIdCounter = 1;
    this.mediaIdCounter = 1;
    this.watchlistIdCounter = 1;
    this.watchedIdCounter = 1;
    this.favoriteIdCounter = 1;
    this.listIdCounter = 1;
    this.listItemIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id, createdAt: new Date() };
    this.users.set(id, newUser);
    return newUser;
  }

  // Media operations
  async getMediaItem(id: number): Promise<MediaItem | undefined> {
    return this.mediaItems.get(id);
  }

  async getMediaItemByTmdbId(tmdbId: number, type: string): Promise<MediaItem | undefined> {
    return Array.from(this.mediaItems.values()).find(
      item => item.tmdbId === tmdbId && item.type === type
    );
  }

  async createMediaItem(item: InsertMediaItem): Promise<MediaItem> {
    const id = this.mediaIdCounter++;
    const newItem: MediaItem = { ...item, id };
    this.mediaItems.set(id, newItem);
    return newItem;
  }

  // Watchlist operations
  async getWatchlistByUserId(userId: number): Promise<(WatchlistItem & { media: MediaItem })[]> {
    const items = Array.from(this.watchlistItems.values())
      .filter(item => item.userId === userId);
    
    return items.map(item => {
      const media = this.mediaItems.get(item.mediaId);
      if (!media) throw new Error(`Media item ${item.mediaId} not found`);
      return { ...item, media };
    });
  }

  async addToWatchlist(item: InsertWatchlistItem): Promise<WatchlistItem> {
    const id = this.watchlistIdCounter++;
    const newItem: WatchlistItem = { ...item, id, addedAt: new Date() };
    this.watchlistItems.set(id, newItem);
    return newItem;
  }

  async removeFromWatchlist(userId: number, mediaId: number): Promise<void> {
    const items = Array.from(this.watchlistItems.entries());
    for (const [id, item] of items) {
      if (item.userId === userId && item.mediaId === mediaId) {
        this.watchlistItems.delete(id);
      }
    }
  }

  async isInWatchlist(userId: number, mediaId: number): Promise<boolean> {
    return Array.from(this.watchlistItems.values()).some(
      item => item.userId === userId && item.mediaId === mediaId
    );
  }

  // Watched operations
  async getWatchedByUserId(userId: number): Promise<(WatchedItem & { media: MediaItem })[]> {
    const items = Array.from(this.watchedItems.values())
      .filter(item => item.userId === userId);
    
    return items.map(item => {
      const media = this.mediaItems.get(item.mediaId);
      if (!media) throw new Error(`Media item ${item.mediaId} not found`);
      return { ...item, media };
    });
  }

  async addToWatched(item: InsertWatchedItem): Promise<WatchedItem> {
    const id = this.watchedIdCounter++;
    const newItem: WatchedItem = { ...item, id, watchedAt: new Date() };
    this.watchedItems.set(id, newItem);
    return newItem;
  }

  async removeFromWatched(userId: number, mediaId: number): Promise<void> {
    const items = Array.from(this.watchedItems.entries());
    for (const [id, item] of items) {
      if (item.userId === userId && item.mediaId === mediaId) {
        this.watchedItems.delete(id);
      }
    }
  }

  async isWatched(userId: number, mediaId: number): Promise<boolean> {
    return Array.from(this.watchedItems.values()).some(
      item => item.userId === userId && item.mediaId === mediaId
    );
  }

  // Favorites operations
  async getFavoritesByUserId(userId: number): Promise<(FavoriteItem & { media: MediaItem })[]> {
    const items = Array.from(this.favoriteItems.values())
      .filter(item => item.userId === userId);
    
    return items.map(item => {
      const media = this.mediaItems.get(item.mediaId);
      if (!media) throw new Error(`Media item ${item.mediaId} not found`);
      return { ...item, media };
    });
  }

  async addToFavorites(item: InsertFavoriteItem): Promise<FavoriteItem> {
    const id = this.favoriteIdCounter++;
    const newItem: FavoriteItem = { ...item, id, addedAt: new Date() };
    this.favoriteItems.set(id, newItem);
    return newItem;
  }

  async removeFromFavorites(userId: number, mediaId: number): Promise<void> {
    const items = Array.from(this.favoriteItems.entries());
    for (const [id, item] of items) {
      if (item.userId === userId && item.mediaId === mediaId) {
        this.favoriteItems.delete(id);
      }
    }
  }

  async isInFavorites(userId: number, mediaId: number): Promise<boolean> {
    return Array.from(this.favoriteItems.values()).some(
      item => item.userId === userId && item.mediaId === mediaId
    );
  }

  // Lists operations
  async getListsByUserId(userId: number): Promise<List[]> {
    return Array.from(this.lists.values())
      .filter(list => list.userId === userId);
  }

  async getListById(id: number): Promise<(List & { items: (ListItem & { media: MediaItem })[] }) | undefined> {
    const list = this.lists.get(id);
    if (!list) return undefined;

    const items = Array.from(this.listItems.values())
      .filter(item => item.listId === id)
      .map(item => {
        const media = this.mediaItems.get(item.mediaId);
        if (!media) throw new Error(`Media item ${item.mediaId} not found`);
        return { ...item, media };
      });

    return { ...list, items };
  }

  async createList(list: InsertList): Promise<List> {
    const id = this.listIdCounter++;
    const newList: List = { ...list, id, createdAt: new Date() };
    this.lists.set(id, newList);
    return newList;
  }

  async updateList(id: number, updates: Partial<InsertList>): Promise<List | undefined> {
    const list = this.lists.get(id);
    if (!list) return undefined;
    
    const updatedList = { ...list, ...updates };
    this.lists.set(id, updatedList);
    return updatedList;
  }

  async deleteList(id: number): Promise<void> {
    this.lists.delete(id);
    
    // Delete all list items for this list
    const listItemsToDelete = Array.from(this.listItems.entries())
      .filter(([_, item]) => item.listId === id);
    
    for (const [itemId] of listItemsToDelete) {
      this.listItems.delete(itemId);
    }
  }

  // List items operations
  async addToList(item: InsertListItem): Promise<ListItem> {
    const id = this.listItemIdCounter++;
    const newItem: ListItem = { ...item, id, addedAt: new Date() };
    this.listItems.set(id, newItem);
    return newItem;
  }

  async removeFromList(listId: number, mediaId: number): Promise<void> {
    const items = Array.from(this.listItems.entries());
    for (const [id, item] of items) {
      if (item.listId === listId && item.mediaId === mediaId) {
        this.listItems.delete(id);
      }
    }
  }

  // Stats operations
  async getUserStats(userId: number): Promise<{
    moviesWatched: number;
    tvEpisodesWatched: number;
    averageRating: number;
    totalWatchtime: number;
  }> {
    const watchedItems = Array.from(this.watchedItems.values())
      .filter(item => item.userId === userId);
    
    const watchedWithMedia = await Promise.all(
      watchedItems.map(async item => {
        const media = await this.getMediaItem(item.mediaId);
        return { ...item, media };
      })
    );
    
    const movies = watchedWithMedia.filter(item => item.media?.type === 'movie');
    const tvShows = watchedWithMedia.filter(item => item.media?.type === 'tv');
    
    // Calculate average rating
    const ratedItems = watchedItems.filter(item => item.rating !== undefined);
    const totalRating = ratedItems.reduce((sum, item) => sum + (item.rating || 0), 0);
    const averageRating = ratedItems.length > 0 ? totalRating / ratedItems.length : 0;
    
    // Mock total watchtime (in hours) based on assumption that movies are ~2h and episodes ~1h
    const movieHours = movies.length * 2;
    const tvHours = tvShows.length * 1;
    
    return {
      moviesWatched: movies.length,
      tvEpisodesWatched: tvShows.length,
      averageRating,
      totalWatchtime: movieHours + tvHours
    };
  }

  async getRecentActivity(userId: number, limit: number = 10): Promise<(WatchedItem | WatchlistItem | FavoriteItem)[]> {
    // Collect all activity
    const watched = Array.from(this.watchedItems.values())
      .filter(item => item.userId === userId)
      .map(item => ({ ...item, type: 'watched', date: item.watchedAt }));
    
    const watchlist = Array.from(this.watchlistItems.values())
      .filter(item => item.userId === userId)
      .map(item => ({ ...item, type: 'watchlist', date: item.addedAt }));
    
    const favorites = Array.from(this.favoriteItems.values())
      .filter(item => item.userId === userId)
      .map(item => ({ ...item, type: 'favorite', date: item.addedAt }));
    
    // Combine and sort by date
    const allActivity = [...watched, ...watchlist, ...favorites]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
    
    return allActivity;
  }
}

export const storage = new MemStorage();
