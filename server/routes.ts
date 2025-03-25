import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertMediaItemSchema,
  insertWatchlistItemSchema,
  insertWatchedItemSchema,
  insertFavoriteItemSchema,
  insertListSchema,
  insertListItemSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();

  // User endpoints
  router.get("/api/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  router.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }
      
      const newUser = await storage.createUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Media endpoints
  router.get("/api/media/:id", async (req, res) => {
    const mediaId = parseInt(req.params.id);
    if (isNaN(mediaId)) {
      return res.status(400).json({ message: "Invalid media ID" });
    }

    const media = await storage.getMediaItem(mediaId);
    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    res.json(media);
  });

  // Media check by TMDB ID endpoint
  router.get("/api/media/check/:tmdbId", async (req, res) => {
    try {
      const tmdbId = parseInt(req.params.tmdbId);
      const type = req.query.type as string;
      
      if (isNaN(tmdbId) || !type) {
        return res.status(400).json({ message: "Invalid TMDB ID or missing media type" });
      }

      console.log(`Checking for media with TMDB ID ${tmdbId} and type ${type}`);
      const media = await storage.getMediaItemByTmdbId(tmdbId, type);
      
      if (!media) {
        return res.status(404).json({ message: "Media not found" });
      }

      res.json(media);
    } catch (error) {
      console.error("Error checking media:", error);
      res.status(500).json({ message: "Failed to check media" });
    }
  });

  router.post("/api/media", async (req, res) => {
    try {
      const mediaData = insertMediaItemSchema.parse(req.body);
      const existingMedia = await storage.getMediaItemByTmdbId(mediaData.tmdbId, mediaData.type);
      
      if (existingMedia) {
        return res.json(existingMedia); // Return existing media if already in database
      }
      
      const newMedia = await storage.createMediaItem(mediaData);
      res.status(201).json(newMedia);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid media data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create media item" });
    }
  });

  // Watchlist endpoints
  router.get("/api/users/:userId/watchlist", async (req, res) => {
    const userId = req.params.userId;
    const watchlist = await storage.getWatchlistByUserId(userId);
    res.json(watchlist);
  });

  router.post("/api/watchlist", async (req, res) => {
    try {
      const watchlistData = insertWatchlistItemSchema.parse(req.body);
      
      // Check if already in watchlist
      const isInWatchlist = await storage.isInWatchlist(watchlistData.userId, watchlistData.mediaId);
      if (isInWatchlist) {
        return res.status(409).json({ message: "Item already in watchlist" });
      }
      
      const newWatchlistItem = await storage.addToWatchlist(watchlistData);
      res.status(201).json(newWatchlistItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid watchlist data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to watchlist" });
    }
  });

  router.delete("/api/users/:userId/watchlist/:mediaId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const mediaId = parseInt(req.params.mediaId);
      
      if (isNaN(mediaId)) {
        return res.status(400).json({ message: "Invalid media ID" });
      }

      await storage.removeFromWatchlist(userId, mediaId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from watchlist" });
    }
  });

  // Watched endpoints
  router.get("/api/users/:userId/watched", async (req, res) => {
    const userId = req.params.userId;
    const watched = await storage.getWatchedByUserId(userId);
    res.json(watched);
  });

  router.post("/api/watched", async (req, res) => {
    try {
      const watchedData = insertWatchedItemSchema.parse(req.body);
      
      // Check if already marked as watched
      const isWatched = await storage.isWatched(watchedData.userId, watchedData.mediaId);
      if (isWatched) {
        // Update the existing entry (e.g., change rating)
        await storage.removeFromWatched(watchedData.userId, watchedData.mediaId);
      }
      
      const newWatchedItem = await storage.addToWatched(watchedData);
      res.status(201).json(newWatchedItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid watched data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to watched" });
    }
  });

  router.delete("/api/users/:userId/watched/:mediaId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const mediaId = parseInt(req.params.mediaId);
      
      if (isNaN(mediaId)) {
        return res.status(400).json({ message: "Invalid media ID" });
      }

      await storage.removeFromWatched(userId, mediaId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from watched" });
    }
  });

  // Favorites endpoints
  router.get("/api/users/:userId/favorites", async (req, res) => {
    const userId = req.params.userId;
    const favorites = await storage.getFavoritesByUserId(userId);
    res.json(favorites);
  });

  router.post("/api/favorites", async (req, res) => {
    try {
      const favoriteData = insertFavoriteItemSchema.parse(req.body);
      
      // Check if already in favorites
      const isInFavorites = await storage.isInFavorites(favoriteData.userId, favoriteData.mediaId);
      if (isInFavorites) {
        return res.status(409).json({ message: "Item already in favorites" });
      }
      
      const newFavoriteItem = await storage.addToFavorites(favoriteData);
      res.status(201).json(newFavoriteItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid favorite data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to favorites" });
    }
  });

  router.delete("/api/users/:userId/favorites/:mediaId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const mediaId = parseInt(req.params.mediaId);
      
      if (isNaN(mediaId)) {
        return res.status(400).json({ message: "Invalid media ID" });
      }

      await storage.removeFromFavorites(userId, mediaId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from favorites" });
    }
  });

  // Lists endpoints
  router.get("/api/users/:userId/lists", async (req, res) => {
    try {
      const userId = req.params.userId;
      const lists = await storage.getListsByUserId(userId);
      res.json(lists);
    } catch (error) {
      console.error("Error fetching lists:", error);
      res.status(500).json({ message: "Failed to fetch lists" });
    }
  });

  router.get("/api/lists/:id", async (req, res) => {
    try {
      const listId = parseInt(req.params.id);
      if (isNaN(listId)) {
        return res.status(400).json({ message: "Invalid list ID" });
      }

      const list = await storage.getListById(listId);
      if (!list) {
        return res.status(404).json({ message: "List not found" });
      }

      res.json(list);
    } catch (error) {
      console.error("Error fetching list:", error);
      res.status(500).json({ message: "Failed to fetch list" });
    }
  });

  router.post("/api/lists", async (req, res) => {
    try {
      const listData = insertListSchema.parse(req.body);
      console.log("Creating list:", listData);
      const newList = await storage.createList(listData);
      console.log("List created:", newList);
      res.status(201).json(newList);
    } catch (error) {
      console.error("Error creating list:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid list data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create list" });
    }
  });

  router.put("/api/lists/:id", async (req, res) => {
    try {
      const listId = parseInt(req.params.id);
      if (isNaN(listId)) {
        return res.status(400).json({ message: "Invalid list ID" });
      }

      const listData = insertListSchema.partial().parse(req.body);
      const updatedList = await storage.updateList(listId, listData);
      
      if (!updatedList) {
        return res.status(404).json({ message: "List not found" });
      }
      
      res.json(updatedList);
    } catch (error) {
      console.error("Error updating list:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid list data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update list" });
    }
  });

  router.delete("/api/lists/:id", async (req, res) => {
    try {
      const listId = parseInt(req.params.id);
      if (isNaN(listId)) {
        return res.status(400).json({ message: "Invalid list ID" });
      }

      await storage.deleteList(listId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting list:", error);
      res.status(500).json({ message: "Failed to delete list" });
    }
  });

  router.post("/api/list-items", async (req, res) => {
    try {
      const listItemData = insertListItemSchema.parse(req.body);
      console.log("Adding item to list:", listItemData);
      const newListItem = await storage.addToList(listItemData);
      console.log("Item added to list:", newListItem);
      res.status(201).json(newListItem);
    } catch (error) {
      console.error("Error adding item to list:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid list item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add item to list" });
    }
  });

  router.delete("/api/lists/:listId/items/:mediaId", async (req, res) => {
    try {
      const listId = parseInt(req.params.listId);
      const mediaId = parseInt(req.params.mediaId);
      
      if (isNaN(listId) || isNaN(mediaId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      await storage.removeFromList(listId, mediaId);
      res.status(204).end();
    } catch (error) {
      console.error("Error removing item from list:", error);
      res.status(500).json({ message: "Failed to remove item from list" });
    }
  });

  // Stats endpoints
  router.get("/api/users/:userId/stats", async (req, res) => {
    try {
      const userId = req.params.userId;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Activity endpoint
  router.get("/api/users/:userId/activity", async (req, res) => {
    try {
      const userId = req.params.userId;
      const activity = await storage.getRecentActivity(userId);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  // Rating endpoint
  router.post("/api/media/:mediaId/rate", async (req, res) => {
    try {
      const mediaId = parseInt(req.params.mediaId);
      const { userId, rating } = req.body;
      
      if (isNaN(mediaId) || !userId || typeof rating !== 'number' || rating < 0 || rating > 10) {
        return res.status(400).json({ message: "Invalid rating data" });
      }

      // Add to watched with rating
      const watchedData = {
        userId,
        mediaId,
        rating,
      };
      
      // Check if already marked as watched
      const isWatched = await storage.isWatched(userId, mediaId);
      if (isWatched) {
        // Update the existing entry
        await storage.removeFromWatched(userId, mediaId);
      }
      
      const newWatchedItem = await storage.addToWatched(watchedData);
      res.status(201).json(newWatchedItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to rate media item" });
    }
  });

  // Register API router
  app.use(router);

  const httpServer = createServer(app);
  return httpServer;
}
