-- Create list_items table
CREATE TABLE IF NOT EXISTS list_items (
    id SERIAL PRIMARY KEY,
    list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups by list_id
CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);

-- Add index for sorting by created_at
CREATE INDEX IF NOT EXISTS idx_list_items_created_at ON list_items(created_at DESC); 