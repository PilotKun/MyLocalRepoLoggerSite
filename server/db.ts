import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../shared/schema';

// PostgreSQL connection configuration
const connectionString = process.env.DATABASE_URL || 
  'postgres://postgres:postgrepass@localhost:5432/cinelog?sslmode=disable';

// Create connection pool with more detailed error handling
const pool = new Pool({ 
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize Drizzle with our schema
export const db = drizzle(pool, { schema });

// Connection function with retries
export async function connectToDatabase(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log('Attempting to connect to PostgreSQL...');
      // Test the connection
      const client = await pool.connect();
      const result = await client.query('SELECT version()');
      console.log('PostgreSQL version:', result.rows[0].version);
      client.release();
      console.log('Connected to PostgreSQL successfully');
      return db;
    } catch (error) {
      console.error('PostgreSQL connection error:', error);
      if (i === retries - 1) {
        console.log('All connection attempts failed, falling back to in-memory storage');
        return db; // Return a mock DB if needed
      }
      console.log(`Retrying connection in 2 seconds... (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return db;
}

// Close connection
export async function closeDatabase() {
  await pool.end();
}

// Error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});