/**
 * Migration to update list_items table schema
 * 
 * Changes:
 * - Remove the episodes_watched column
 * - Keep seasons_watched column
 */

export async function up(db) {
  console.log('Running migration: update list_items table');
  
  // First check if episodes_watched column exists to avoid errors
  const checkColumnQuery = `
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'list_items' AND column_name = 'episodes_watched'
    );
  `;
  
  const { rows } = await db.query(checkColumnQuery);
  const columnExists = rows[0].exists;
  
  if (columnExists) {
    // Drop the episodes_watched column if it exists
    await db.query(`
      ALTER TABLE list_items 
      DROP COLUMN IF EXISTS episodes_watched;
    `);
  }
  
  console.log('Migration completed successfully');
}

export async function down(db) {
  console.log('Running rollback: revert list_items table changes');
  
  // Add back the episodes_watched column
  await db.query(`
    ALTER TABLE list_items
    ADD COLUMN IF NOT EXISTS episodes_watched INTEGER;
  `);
  
  console.log('Rollback completed successfully');
} 