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
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
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
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

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
    const userId = parseInt(req.params.userId);
    const mediaId = parseInt(req.params.mediaId);
    
    if (isNaN(userId) || isNaN(mediaId)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    await storage.removeFromWatchlist(userId, mediaId);
    res.status(204).end();
  });

  // Watched endpoints
  router.get("/api/users/:userId/watched", async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

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
    const userId = parseInt(req.params.userId);
    const mediaId = parseInt(req.params.mediaId);
    
    if (isNaN(userId) || isNaN(mediaId)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    await storage.removeFromWatched(userId, mediaId);
    res.status(204).end();
  });

  // Favorites endpoints
  router.get("/api/users/:userId/favorites", async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

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
    const userId = parseInt(req.params.userId);
    const mediaId = parseInt(req.params.mediaId);
    
    if (isNaN(userId) || isNaN(mediaId)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    await storage.removeFromFavorites(userId, mediaId);
    res.status(204).end();
  });

  // Lists endpoints
  router.get("/api/users/:userId/lists", async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const lists = await storage.getListsByUserId(userId);
    res.json(lists);
  });

  router.get("/api/lists/:id", async (req, res) => {
    const listId = parseInt(req.params.id);
    if (isNaN(listId)) {
      return res.status(400).json({ message: "Invalid list ID" });
    }

    const list = await storage.getListById(listId);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    res.json(list);
  });

  router.post("/api/lists", async (req, res) => {
    try {
      const listData = insertListSchema.parse(req.body);
      const newList = await storage.createList(listData);
      res.status(201).json(newList);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid list data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create list" });
    }
  });

  router.put("/api/lists/:id", async (req, res) => {
    const listId = parseInt(req.params.id);
    if (isNaN(listId)) {
      return res.status(400).json({ message: "Invalid list ID" });
    }

    try {
      const listData = insertListSchema.partial().parse(req.body);
      const updatedList = await storage.updateList(listId, listData);
      
      if (!updatedList) {
        return res.status(404).json({ message: "List not found" });
      }
      
      res.json(updatedList);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid list data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update list" });
    }
  });

  router.delete("/api/lists/:id", async (req, res) => {
    const listId = parseInt(req.params.id);
    if (isNaN(listId)) {
      return res.status(400).json({ message: "Invalid list ID" });
    }

    await storage.deleteList(listId);
    res.status(204).end();
  });

  router.post("/api/list-items", async (req, res) => {
    try {
      const listItemData = insertListItemSchema.parse(req.body);
      const newListItem = await storage.addToList(listItemData);
      res.status(201).json(newListItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid list item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add item to list" });
    }
  });

  router.delete("/api/lists/:listId/items/:mediaId", async (req, res) => {
    const listId = parseInt(req.params.listId);
    const mediaId = parseInt(req.params.mediaId);
    
    if (isNaN(listId) || isNaN(mediaId)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    await storage.removeFromList(listId, mediaId);
    res.status(204).end();
  });

  // Stats endpoints
  router.get("/api/users/:userId/stats", async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const stats = await storage.getUserStats(userId);
    res.json(stats);
  });

  router.get("/api/users/:userId/activity", async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const activity = await storage.getRecentActivity(userId, limit);
    res.json(activity);
  });

  // Register API router
  app.use(router);

  const httpServer = createServer(app);
  return httpServer;
}
