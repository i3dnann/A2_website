-- Account verification badge system.
-- Safe to run repeatedly on older Gotham/A2 website databases.

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS a2_add_col;
DELIMITER //
CREATE PROCEDURE a2_add_col(IN p_table VARCHAR(64), IN p_column VARCHAR(64), IN p_definition TEXT)
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = p_table
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = p_table AND column_name = p_column
  ) THEN
    SET @a2_sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN ', p_definition);
    PREPARE a2_stmt FROM @a2_sql;
    EXECUTE a2_stmt;
    DEALLOCATE PREPARE a2_stmt;
  END IF;
END//
DELIMITER ;

CALL a2_add_col('web_users', 'verified_badge', 'verified_badge TINYINT(1) DEFAULT 0 AFTER avatar_url');
CALL a2_add_col('web_users', 'verified_at', 'verified_at DATETIME NULL AFTER verified_badge');
CALL a2_add_col('web_users', 'verified_by', 'verified_by VARCHAR(64) NULL AFTER verified_at');
CALL a2_add_col('web_users', 'verification_status', 'verification_status VARCHAR(40) DEFAULT ''none'' AFTER verified_by');

CALL a2_add_col('news_comments', 'author_verified', 'author_verified TINYINT(1) DEFAULT 0 AFTER author_name');

CREATE TABLE IF NOT EXISTS verification_requests (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  status VARCHAR(40) DEFAULT 'pending',
  reason TEXT,
  eligibility_json JSON,
  reviewed_by VARCHAR(64),
  reviewed_at DATETIME NULL,
  review_note TEXT,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_verification_requests_user (user_id),
  INDEX idx_verification_requests_status (status),
  INDEX idx_verification_requests_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS a2_add_col;
