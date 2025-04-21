import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS - You might want to restrict this in production
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/users/:userId/lists - Get lists for a user
  if (req.method === 'GET') {
    let userId: string | null = null; // Declare userId outside the try block
    try {
      // In this file structure, Vercel puts the dynamic part ([userId]) 
      // directly into req.query
      userId = req.query.userId as string; // Assign value inside the try block
      
      if (!userId) {
        return res.status(400).json({ 
          message: "User ID is required in the path" 
        });
      }

      const result = await sql`
        SELECT * FROM lists 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC;
      `;

      // Map database columns (snake_case) to frontend expected format (camelCase)
      const lists = result.rows.map(list => ({
        id: list.id,
        name: list.name,
        description: list.description,
        isPublic: list.is_public, 
        userId: list.user_id, 
        createdAt: list.created_at,
      }));

      return res.json(lists);
    } catch (error) {
      // Now userId is accessible here
      console.error('Error fetching lists for user:', userId, error);
      return res.status(500).json({ 
        message: "Failed to fetch lists",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // If method is not GET or OPTIONS
  res.setHeader('Allow', ['GET', 'OPTIONS']);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed on this route` });
} 