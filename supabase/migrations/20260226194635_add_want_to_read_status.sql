-- Allow 'want_to_read' and 'paused' in the books status 
ALTER TABLE books DROP CONSTRAINT IF EXISTS books_status_check;
ALTER TABLE books ADD CONSTRAINT books_status_check CHECK (status IN ('not_started', 'in_progress', 'completed', 'want_to_read', 'paused'));
