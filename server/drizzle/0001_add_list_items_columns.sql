-- Add status and seasons_watched columns to list_items table
ALTER TABLE list_items
ADD COLUMN IF NOT EXISTS status varchar(50) DEFAULT 'watched',
ADD COLUMN IF NOT EXISTS seasons_watched integer; 