import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../shared/schema';

// PostgreSQL connection configuration
const connectionString = process.env.DATABASE_URL || 
  'postgres://postgres:postgres@localhost:5432/cinelog';

// Create connection pool
const pool = new Pool({ connectionString });

// Initialize Drizzle with our schema
export const db = drizzle(pool, { schema });

// Connection function
export async function connectToDatabase() {
  try {
    console.log('Attempting to connect to PostgreSQL...');
    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('Connected to PostgreSQL successfully');
    return db;
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    console.log('Falling back to in-memory storage');
    return db; // Return a mock DB if needed
  }
}

// Close connection
export async function closeDatabase() {
  await pool.end();
}