import { IStorage } from './storage';
import {
  User, Media, Watchlist, Watched, Favorite, List, ListItem,
  IUser, IMedia, IWatchlist, IWatched, IFavorite, IList, IListItem
} from './models';
import mongoose from 'mongoose';
import {
  User as UserType,
  InsertUser,
  MediaItem,
  InsertMediaItem,
  WatchlistItem,
  InsertWatchlistItem,
  WatchedItem,
  InsertWatchedItem,
  FavoriteItem,
  InsertFavoriteItem,
  List as ListType,
  InsertList,
  ListItem as ListItemType,
  InsertListItem
} from '@shared/schema';

export class MongoStorage implements IStorage {
  // Helper methods for converting MongoDB document to our schema types
  private userToSchema(user: IUser): UserType {
    return {
      id: parseInt(user._id.toString().substring(0, 8), 16),
      name: user.name || null,
      email: user.email,
      image: user.image || null,
      createdAt: user.createdAt || null
    };
  }

  private mediaToSchema(media: IMedia): MediaItem {
    return {
      id: parseInt(media._id.toString().substring(0, 8), 16),
      tmdbId: media.tmdbId,
      type: media.type,
      title: media.title,
      posterPath: media.posterPath,
      releaseDate: media.releaseDate,
      voteAverage: media.voteAverage
    };
  }

  // User operations
  async getUser(id: number): Promise<UserType | undefined> {
    try {
      // Since we're converting ObjectIds to numbers for the API,
      // we have to find the user by iterating and matching the derived id
      const users = await User.find();
      for (const user of users) {
        const derivedId = parseInt(user._id.toString().substring(0, 8), 16);
        if (derivedId === id) {
          return this.userToSchema(user);
        }
      }
      return undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<UserType | undefined> {
    try {
      const user = await User.findOne({ email });
      return user ? this.userToSchema(user) : undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<UserType> {
    try {
      const newUser = await User.create({
        name: user.name,
        email: user.email,
        password: user.password || 'defaultpassword', // You should validate this earlier
        image: user.image
      });
      return this.userToSchema(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Media operations
  async getMediaItem(id: number): Promise<MediaItem | undefined> {
    try {
      // Similar to user lookup, find media by derived id
      const allMedia = await Media.find();
      for (const media of allMedia) {
        const derivedId = parseInt(media._id.toString().substring(0, 8), 16);
        if (derivedId === id) {
          return this.mediaToSchema(media);
        }
      }
      return undefined;
    } catch (error) {
      console.error('Error getting media:', error);
      return undefined;
    }
  }

  async getMediaItemByTmdbId(tmdbId: number, type: string): Promise<MediaItem | undefined> {
    try {
      const media = await Media.findOne({ tmdbId, type });
      return media ? this.mediaToSchema(media) : undefined;
    } catch (error) {
      console.error('Error getting media by TMDB ID:', error);
      return undefined;
    }
  }

  async createMediaItem(item: InsertMediaItem): Promise<MediaItem> {
    try {
      const newMedia = await Media.create({
        tmdbId: item.tmdbId,
        type: item.type,
        title: item.title,
        posterPath: item.posterPath,
        releaseDate: item.releaseDate,
        voteAverage: item.voteAverage
      });
      return this.mediaToSchema(newMedia);
    } catch (error) {
      console.error('Error creating media item:', error);
      throw error;
    }
  }

  // Watchlist operations
  async getWatchlistByUserId(userId: number): Promise<(WatchlistItem & { media: MediaItem })[]> {
    try {
      // Get user by derived id
      const user = await this.getUserById(userId);
      if (!user) return [];

      // Find watchlist items for this user
      const watchlistItems = await Watchlist.find({ userId: user._id }).populate('mediaId');
      
      return watchlistItems.map(item => ({
        id: parseInt(item._id.toString().substring(0, 8), 16),
        userId,
        mediaId: parseInt(item.mediaId._id.toString().substring(0, 8), 16),
        addedAt: item.addedAt,
        media: this.mediaToSchema(item.mediaId as unknown as IMedia)
      }));
    } catch (error) {
      console.error('Error getting watchlist:', error);
      return [];
    }
  }

  async addToWatchlist(item: InsertWatchlistItem): Promise<WatchlistItem> {
    try {
      const user = await this.getUserById(item.userId);
      if (!user) throw new Error('User not found');

      const media = await this.getMediaById(item.mediaId);
      if (!media) throw new Error('Media not found');

      const newWatchlistItem = await Watchlist.create({
        userId: user._id,
        mediaId: media._id
      });

      return {
        id: parseInt(newWatchlistItem._id.toString().substring(0, 8), 16),
        userId: item.userId,
        mediaId: item.mediaId,
        addedAt: newWatchlistItem.addedAt
      };
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  }

  async removeFromWatchlist(userId: number, mediaId: number): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return;

      const media = await this.getMediaById(mediaId);
      if (!media) return;

      await Watchlist.deleteOne({ userId: user._id, mediaId: media._id });
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  }

  async isInWatchlist(userId: number, mediaId: number): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return false;

      const media = await this.getMediaById(mediaId);
      if (!media) return false;

      const count = await Watchlist.countDocuments({ userId: user._id, mediaId: media._id });
      return count > 0;
    } catch (error) {
      console.error('Error checking watchlist:', error);
      return false;
    }
  }

  // Watched operations
  async getWatchedByUserId(userId: number): Promise<(WatchedItem & { media: MediaItem })[]> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return [];

      const watchedItems = await Watched.find({ userId: user._id }).populate('mediaId');
      
      return watchedItems.map(item => ({
        id: parseInt(item._id.toString().substring(0, 8), 16),
        userId,
        mediaId: parseInt(item.mediaId._id.toString().substring(0, 8), 16),
        watchedAt: item.watchedAt,
        rating: item.rating,
        media: this.mediaToSchema(item.mediaId as unknown as IMedia)
      }));
    } catch (error) {
      console.error('Error getting watched items:', error);
      return [];
    }
  }

  async addToWatched(item: InsertWatchedItem): Promise<WatchedItem> {
    try {
      const user = await this.getUserById(item.userId);
      if (!user) throw new Error('User not found');

      const media = await this.getMediaById(item.mediaId);
      if (!media) throw new Error('Media not found');

      const newWatchedItem = await Watched.create({
        userId: user._id,
        mediaId: media._id,
        rating: item.rating
      });

      return {
        id: parseInt(newWatchedItem._id.toString().substring(0, 8), 16),
        userId: item.userId,
        mediaId: item.mediaId,
        watchedAt: newWatchedItem.watchedAt,
        rating: newWatchedItem.rating
      };
    } catch (error) {
      console.error('Error adding to watched:', error);
      throw error;
    }
  }

  async removeFromWatched(userId: number, mediaId: number): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return;

      const media = await this.getMediaById(mediaId);
      if (!media) return;

      await Watched.deleteOne({ userId: user._id, mediaId: media._id });
    } catch (error) {
      console.error('Error removing from watched:', error);
    }
  }

  async isWatched(userId: number, mediaId: number): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return false;

      const media = await this.getMediaById(mediaId);
      if (!media) return false;

      const count = await Watched.countDocuments({ userId: user._id, mediaId: media._id });
      return count > 0;
    } catch (error) {
      console.error('Error checking watched:', error);
      return false;
    }
  }

  // Favorites operations
  async getFavoritesByUserId(userId: number): Promise<(FavoriteItem & { media: MediaItem })[]> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return [];

      const favoriteItems = await Favorite.find({ userId: user._id }).populate('mediaId');
      
      return favoriteItems.map(item => ({
        id: parseInt(item._id.toString().substring(0, 8), 16),
        userId,
        mediaId: parseInt(item.mediaId._id.toString().substring(0, 8), 16),
        addedAt: item.addedAt,
        media: this.mediaToSchema(item.mediaId as unknown as IMedia)
      }));
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  async addToFavorites(item: InsertFavoriteItem): Promise<FavoriteItem> {
    try {
      const user = await this.getUserById(item.userId);
      if (!user) throw new Error('User not found');

      const media = await this.getMediaById(item.mediaId);
      if (!media) throw new Error('Media not found');

      const newFavoriteItem = await Favorite.create({
        userId: user._id,
        mediaId: media._id
      });

      return {
        id: parseInt(newFavoriteItem._id.toString().substring(0, 8), 16),
        userId: item.userId,
        mediaId: item.mediaId,
        addedAt: newFavoriteItem.addedAt
      };
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  async removeFromFavorites(userId: number, mediaId: number): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return;

      const media = await this.getMediaById(mediaId);
      if (!media) return;

      await Favorite.deleteOne({ userId: user._id, mediaId: media._id });
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  }

  async isInFavorites(userId: number, mediaId: number): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return false;

      const media = await this.getMediaById(mediaId);
      if (!media) return false;

      const count = await Favorite.countDocuments({ userId: user._id, mediaId: media._id });
      return count > 0;
    } catch (error) {
      console.error('Error checking favorites:', error);
      return false;
    }
  }

  // Lists operations
  async getListsByUserId(userId: number): Promise<ListType[]> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return [];

      const lists = await List.find({ userId: user._id });
      
      return lists.map(list => ({
        id: parseInt(list._id.toString().substring(0, 8), 16),
        name: list.name,
        userId,
        description: list.description,
        isPublic: list.isPublic,
        createdAt: list.createdAt
      }));
    } catch (error) {
      console.error('Error getting lists:', error);
      return [];
    }
  }

  async getListById(id: number): Promise<(ListType & { items: (ListItemType & { media: MediaItem })[] }) | undefined> {
    try {
      // Find list by derived id
      const allLists = await List.find();
      let targetList: IList | null = null;
      
      for (const list of allLists) {
        const derivedId = parseInt(list._id.toString().substring(0, 8), 16);
        if (derivedId === id) {
          targetList = list;
          break;
        }
      }
      
      if (!targetList) return undefined;

      // Get list items for this list
      const listItems = await ListItem.find({ listId: targetList._id }).populate('mediaId');
      
      const items = listItems.map(item => ({
        id: parseInt(item._id.toString().substring(0, 8), 16),
        listId: id,
        mediaId: parseInt(item.mediaId._id.toString().substring(0, 8), 16),
        addedAt: item.addedAt,
        media: this.mediaToSchema(item.mediaId as unknown as IMedia)
      }));

      return {
        id,
        name: targetList.name,
        userId: parseInt(targetList.userId.toString().substring(0, 8), 16),
        description: targetList.description,
        isPublic: targetList.isPublic,
        createdAt: targetList.createdAt,
        items
      };
    } catch (error) {
      console.error('Error getting list by id:', error);
      return undefined;
    }
  }

  async createList(list: InsertList): Promise<ListType> {
    try {
      const user = await this.getUserById(list.userId);
      if (!user) throw new Error('User not found');

      const newList = await List.create({
        name: list.name,
        userId: user._id,
        description: list.description,
        isPublic: list.isPublic
      });

      return {
        id: parseInt(newList._id.toString().substring(0, 8), 16),
        name: newList.name,
        userId: list.userId,
        description: newList.description,
        isPublic: newList.isPublic,
        createdAt: newList.createdAt
      };
    } catch (error) {
      console.error('Error creating list:', error);
      throw error;
    }
  }

  async updateList(id: number, updates: Partial<InsertList>): Promise<ListType | undefined> {
    try {
      // Find list by derived id
      const allLists = await List.find();
      let targetList: IList | null = null;
      
      for (const list of allLists) {
        const derivedId = parseInt(list._id.toString().substring(0, 8), 16);
        if (derivedId === id) {
          targetList = list;
          break;
        }
      }
      
      if (!targetList) return undefined;

      // Apply updates
      if (updates.name) targetList.name = updates.name;
      if (updates.description !== undefined) targetList.description = updates.description;
      if (updates.isPublic !== undefined) targetList.isPublic = updates.isPublic;

      await targetList.save();

      return {
        id,
        name: targetList.name,
        userId: parseInt(targetList.userId.toString().substring(0, 8), 16),
        description: targetList.description,
        isPublic: targetList.isPublic,
        createdAt: targetList.createdAt
      };
    } catch (error) {
      console.error('Error updating list:', error);
      return undefined;
    }
  }

  async deleteList(id: number): Promise<void> {
    try {
      // Find list by derived id
      const allLists = await List.find();
      let targetListId: mongoose.Types.ObjectId | null = null;
      
      for (const list of allLists) {
        const derivedId = parseInt(list._id.toString().substring(0, 8), 16);
        if (derivedId === id) {
          targetListId = list._id;
          break;
        }
      }
      
      if (!targetListId) return;

      // Delete the list
      await List.deleteOne({ _id: targetListId });
      
      // Delete all list items
      await ListItem.deleteMany({ listId: targetListId });
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  }

  // List items operations
  async addToList(item: InsertListItem): Promise<ListItemType> {
    try {
      // Find list by derived id
      const allLists = await List.find();
      let targetList: IList | null = null;
      
      for (const list of allLists) {
        const derivedId = parseInt(list._id.toString().substring(0, 8), 16);
        if (derivedId === item.listId) {
          targetList = list;
          break;
        }
      }
      
      if (!targetList) throw new Error('List not found');

      const media = await this.getMediaById(item.mediaId);
      if (!media) throw new Error('Media not found');

      const newListItem = await ListItem.create({
        listId: targetList._id,
        mediaId: media._id
      });

      return {
        id: parseInt(newListItem._id.toString().substring(0, 8), 16),
        listId: item.listId,
        mediaId: item.mediaId,
        addedAt: newListItem.addedAt
      };
    } catch (error) {
      console.error('Error adding to list:', error);
      throw error;
    }
  }

  async removeFromList(listId: number, mediaId: number): Promise<void> {
    try {
      // Find list by derived id
      const allLists = await List.find();
      let targetList: IList | null = null;
      
      for (const list of allLists) {
        const derivedId = parseInt(list._id.toString().substring(0, 8), 16);
        if (derivedId === listId) {
          targetList = list;
          break;
        }
      }
      
      if (!targetList) return;

      const media = await this.getMediaById(mediaId);
      if (!media) return;

      await ListItem.deleteOne({ listId: targetList._id, mediaId: media._id });
    } catch (error) {
      console.error('Error removing from list:', error);
    }
  }

  // Stats operations
  async getUserStats(userId: number): Promise<{
    moviesWatched: number;
    tvEpisodesWatched: number;
    averageRating: number;
    totalWatchtime: number;
  }> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return { moviesWatched: 0, tvEpisodesWatched: 0, averageRating: 0, totalWatchtime: 0 };

      const watchedItems = await Watched.find({ userId: user._id }).populate('mediaId');
      
      const movies = watchedItems.filter(item => (item.mediaId as any).type === 'movie');
      const tvShows = watchedItems.filter(item => (item.mediaId as any).type === 'tv');
      
      // Calculate average rating
      const ratedItems = watchedItems.filter(item => item.rating !== null);
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
    } catch (error) {
      console.error('Error getting user stats:', error);
      return { moviesWatched: 0, tvEpisodesWatched: 0, averageRating: 0, totalWatchtime: 0 };
    }
  }

  async getRecentActivity(userId: number, limit: number = 10): Promise<(WatchedItem | WatchlistItem | FavoriteItem)[]> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return [];

      // Get all activity items
      const watched = await Watched.find({ userId: user._id }).sort({ watchedAt: -1 }).limit(limit).populate('mediaId');
      const watchlist = await Watchlist.find({ userId: user._id }).sort({ addedAt: -1 }).limit(limit).populate('mediaId');
      const favorites = await Favorite.find({ userId: user._id }).sort({ addedAt: -1 }).limit(limit).populate('mediaId');
      
      // Convert to the right format
      const watchedItems = watched.map(item => ({
        id: parseInt(item._id.toString().substring(0, 8), 16),
        userId,
        mediaId: parseInt(item.mediaId._id.toString().substring(0, 8), 16),
        watchedAt: item.watchedAt,
        rating: item.rating,
        type: 'watched',
        date: item.watchedAt
      }));
      
      const watchlistItems = watchlist.map(item => ({
        id: parseInt(item._id.toString().substring(0, 8), 16),
        userId,
        mediaId: parseInt(item.mediaId._id.toString().substring(0, 8), 16),
        addedAt: item.addedAt,
        type: 'watchlist',
        date: item.addedAt
      }));
      
      const favoriteItems = favorites.map(item => ({
        id: parseInt(item._id.toString().substring(0, 8), 16),
        userId,
        mediaId: parseInt(item.mediaId._id.toString().substring(0, 8), 16),
        addedAt: item.addedAt,
        type: 'favorite',
        date: item.addedAt
      }));
      
      // Combine and sort by date
      const allActivity = [...watchedItems, ...watchlistItems, ...favoriteItems]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, limit);
      
      return allActivity;
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  // Helper methods to get MongoDB documents by schema IDs
  private async getUserById(id: number): Promise<IUser | null> {
    const users = await User.find();
    for (const user of users) {
      const derivedId = parseInt(user._id.toString().substring(0, 8), 16);
      if (derivedId === id) {
        return user;
      }
    }
    return null;
  }

  private async getMediaById(id: number): Promise<IMedia | null> {
    const allMedia = await Media.find();
    for (const media of allMedia) {
      const derivedId = parseInt(media._id.toString().substring(0, 8), 16);
      if (derivedId === id) {
        return media;
      }
    }
    return null;
  }
}