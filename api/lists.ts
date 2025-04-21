import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST /api/lists - Create a new list
  if (req.method === 'POST') {
    try {
      const { name, description, isPublic, userId } = req.body;
      
      if (!name || !userId) {
        return res.status(400).json({ 
          message: "Name and userId are required" 
        });
      }

      const result = await sql`
        INSERT INTO lists (name, description, is_public, user_id)
        VALUES (${name}, ${description || null}, ${isPublic || false}, ${userId})
        RETURNING *;
      `;

      const newList = result.rows[0];
      return res.status(201).json({
        id: newList.id,
        name: newList.name,
        description: newList.description,
        isPublic: newList.is_public,
        userId: newList.user_id,
        createdAt: newList.created_at,
        updatedAt: newList.updated_at
      });
    } catch (error) {
      console.error('Error creating list:', error);
      return res.status(500).json({ 
        message: "Failed to create list",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // GET /api/users/:userId/lists - Get lists for a user
  if (req.method === 'GET') {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({ 
          message: "User ID is required" 
        });
      }

      const result = await sql`
        SELECT * FROM lists 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC;
      `;

      const lists = result.rows.map(list => ({
        id: list.id,
        name: list.name,
        description: list.description,
        isPublic: list.is_public,
        userId: list.user_id,
        createdAt: list.created_at,
        updatedAt: list.updated_at
      }));

      return res.json(lists);
    } catch (error) {
      console.error('Error fetching lists:', error);
      return res.status(500).json({ 
        message: "Failed to fetch lists",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // DELETE /api/lists/:id - Delete a list
  if (req.method === 'DELETE') {
    try {
      const listId = req.query.id;
      
      if (!listId) {
        return res.status(400).json({ 
          message: "List ID is required" 
        });
      }

      await sql`
        DELETE FROM lists 
        WHERE id = ${listId as string};
      `;

      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting list:', error);
      return res.status(500).json({ 
        message: "Failed to delete list" 
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
} 