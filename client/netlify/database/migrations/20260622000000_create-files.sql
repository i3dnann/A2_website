CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  blob_key TEXT NOT NULL UNIQUE,
  uploaded_at TIMESTAMP DEFAULT NOW()
);
