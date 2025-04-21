import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/lists/:listId - Get details for a single list
  if (req.method === 'GET') {
    try {
      const listId = req.query.listId as string;
      // Optional: Get userId from query to verify ownership if needed
      const userId = req.query.userId as string | undefined; 

      if (!listId) {
        return res.status(400).json({ message: "List ID is required in the path" });
      }

      const numericListId = parseInt(listId);
      if (isNaN(numericListId)) {
        return res.status(400).json({ message: "List ID must be a number" });
      }

      // 1. Fetch list details
      const listResult = await sql`
        SELECT id, name, description, is_public, user_id, created_at, updated_at 
        FROM lists 
        WHERE id = ${numericListId};
      `;

      if (listResult.rowCount === 0) {
        return res.status(404).json({ message: "List not found" });
      }

      const listDetails = listResult.rows[0];

      // Optional: Check ownership - uncomment if lists can be private
      // if (userId && listDetails.user_id !== userId && !listDetails.is_public) {
      //   return res.status(403).json({ message: "Forbidden: You don't have access to this list" });
      // }
      
      // 2. Fetch associated list items (joining with media table)
      // Adjust table and column names based on your actual schema
      const itemsResult = await sql`
        SELECT 
          li.id as list_item_id, 
          li.status, 
          li.rating, 
          li.notes, 
          li.added_at,
          li.seasons_watched, -- Include seasons_watched
          m.id as media_id, 
          m.tmdb_id, 
          m.type, 
          m.title, 
          m.poster_path, 
          m.release_date
        FROM list_items li
        JOIN media m ON li.media_id = m.id
        WHERE li.list_id = ${numericListId}
        ORDER BY li.added_at DESC; 
      `;

      // Map database columns to frontend expected format
      const items = itemsResult.rows.map(item => ({
        listItemId: item.list_item_id,
        status: item.status,
        rating: item.rating,
        notes: item.notes,
        addedAt: item.added_at,
        seasonsWatched: item.seasons_watched, // Map seasons_watched
        media: {
          id: item.media_id,
          tmdbId: item.tmdb_id,
          type: item.type,
          title: item.title,
          posterPath: item.poster_path,
          releaseDate: item.release_date,
        }
      }));

      // 3. Combine list details and items
      const responsePayload = {
        id: listDetails.id,
        name: listDetails.name,
        description: listDetails.description,
        isPublic: listDetails.is_public,
        userId: listDetails.user_id,
        createdAt: listDetails.created_at,
        updatedAt: listDetails.updated_at,
        items: items // Include the fetched items
      };

      return res.json(responsePayload);

    } catch (error) {
      console.error('Error fetching list details:', error);
      return res.status(500).json({ 
        message: "Failed to fetch list details",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // If method is not GET or OPTIONS
  res.setHeader('Allow', ['GET', 'OPTIONS']);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed on this route` });
} 