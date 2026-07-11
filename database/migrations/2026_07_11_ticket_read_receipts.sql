ALTER TABLE ticket_messages
  ADD COLUMN read_at DATETIME NULL AFTER internal_only,
  ADD COLUMN read_by VARCHAR(64) NULL AFTER read_at,
  ADD INDEX idx_ticket_messages_read_at (read_at);
