import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
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
      });
    } catch (error) {
      console.error('Error creating list:', error);
      return res.status(500).json({ 
        message: "Failed to create list",
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
          message: "List ID is required in query parameter 'id'" 
        });
      }

      const numericListId = parseInt(listId as string);
      if (isNaN(numericListId)) {
         return res.status(400).json({ 
          message: "List ID must be a number" 
        });
      }

      const result = await sql`
        DELETE FROM lists 
        WHERE id = ${numericListId};
      `;

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "List not found" });
      }

      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting list:', error);
      return res.status(500).json({ 
        message: "Failed to delete list" 
      });
    }
  }

  res.setHeader('Allow', ['POST', 'DELETE', 'OPTIONS']);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed on this route` });
} 