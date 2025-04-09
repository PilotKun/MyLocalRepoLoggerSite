import { db } from '../db';
import fs from 'fs/promises';
import path from 'path';

async function runMigrations() {
  try {
    console.log('Running migrations...');
    
    // Read and execute the migration SQL
    const sql = await fs.readFile(
      path.join(process.cwd(), 'server/drizzle/0001_add_list_items_columns.sql'),
      'utf-8'
    );
    
    await db.execute(sql);
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations(); 