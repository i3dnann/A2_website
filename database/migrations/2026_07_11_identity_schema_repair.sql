-- Run once on older Gotham/A2 website databases after pulling the latest code.
-- This repairs old INT user IDs, missing auth/user columns, missing ban columns,
-- and JSON audit columns that can reject large audit payloads.

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS a2_add_col;
DROP PROCEDURE IF EXISTS a2_modify_col;
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

CREATE PROCEDURE a2_modify_col(IN p_table VARCHAR(64), IN p_column VARCHAR(64), IN p_definition TEXT)
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = p_table AND column_name = p_column
  ) THEN
    SET @a2_sql = CONCAT('ALTER TABLE `', p_table, '` MODIFY COLUMN ', p_definition);
    PREPARE a2_stmt FROM @a2_sql;
    EXECUTE a2_stmt;
    DEALLOCATE PREPARE a2_stmt;
  END IF;
END//
DELIMITER ;

CALL a2_modify_col('web_users', 'id', 'id VARCHAR(64) NOT NULL');
CALL a2_modify_col('web_users', 'email', 'email VARCHAR(190) NULL');
CALL a2_modify_col('web_users', 'username', 'username VARCHAR(120) NOT NULL');
CALL a2_add_col('web_users', 'password_hash', 'password_hash VARCHAR(255) NULL AFTER email');
CALL a2_add_col('web_users', 'email_verified_at', 'email_verified_at DATETIME NULL AFTER password_hash');
CALL a2_add_col('web_users', 'avatar_url', 'avatar_url TEXT AFTER email_verified_at');
CALL a2_add_col('web_users', 'roles_json', 'roles_json JSON AFTER avatar_url');
CALL a2_add_col('web_users', 'permissions_json', 'permissions_json JSON AFTER roles_json');
CALL a2_add_col('web_users', 'account_status', 'account_status VARCHAR(32) DEFAULT ''active'' AFTER permissions_json');
CALL a2_add_col('web_users', 'admin_status', 'admin_status VARCHAR(32) DEFAULT ''active'' AFTER account_status');
CALL a2_add_col('web_users', 'preferred_language', 'preferred_language VARCHAR(8) DEFAULT ''en'' AFTER admin_status');
CALL a2_add_col('web_users', 'discord_id', 'discord_id VARCHAR(32) AFTER preferred_language');
CALL a2_add_col('web_users', 'discord_username', 'discord_username VARCHAR(120) AFTER discord_id');
CALL a2_add_col('web_users', 'steam_id', 'steam_id VARCHAR(32) AFTER discord_username');
CALL a2_add_col('web_users', 'steam_persona', 'steam_persona VARCHAR(160) AFTER steam_id');
CALL a2_add_col('web_users', 'linked_identifiers_json', 'linked_identifiers_json JSON AFTER steam_persona');
CALL a2_add_col('web_users', 'first_login_at', 'first_login_at DATETIME NULL AFTER linked_identifiers_json');
CALL a2_add_col('web_users', 'last_login_at', 'last_login_at DATETIME NULL AFTER first_login_at');
CALL a2_add_col('web_users', 'created_by', 'created_by VARCHAR(64) AFTER last_login_at');
CALL a2_add_col('web_users', 'updated_by', 'updated_by VARCHAR(64) AFTER created_by');
CALL a2_add_col('web_users', 'created_at', 'created_at DATETIME DEFAULT CURRENT_TIMESTAMP AFTER updated_by');
CALL a2_add_col('web_users', 'updated_at', 'updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');
CALL a2_add_col('web_users', 'deleted_at', 'deleted_at DATETIME NULL AFTER updated_at');

CREATE TABLE IF NOT EXISTS web_auth_providers (
  id VARCHAR(96) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  provider VARCHAR(40) NOT NULL,
  provider_user_id VARCHAR(190) NOT NULL,
  username VARCHAR(160),
  avatar_url TEXT,
  metadata_json JSON,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uniq_provider_user (provider, provider_user_id),
  UNIQUE KEY uniq_user_provider (user_id, provider),
  INDEX idx_auth_provider_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL a2_modify_col('web_auth_providers', 'id', 'id VARCHAR(96) NOT NULL');
CALL a2_modify_col('web_auth_providers', 'user_id', 'user_id VARCHAR(64) NOT NULL');
CALL a2_add_col('web_auth_providers', 'avatar_url', 'avatar_url TEXT AFTER username');
CALL a2_add_col('web_auth_providers', 'metadata_json', 'metadata_json JSON AFTER avatar_url');

CALL a2_modify_col('web_audit_logs', 'before_json', 'before_json MEDIUMTEXT NULL');
CALL a2_modify_col('web_audit_logs', 'after_json', 'after_json MEDIUMTEXT NULL');

CREATE TABLE IF NOT EXISTS player_bans (
  id VARCHAR(64) PRIMARY KEY,
  steam_id VARCHAR(32),
  discord_id VARCHAR(32),
  license VARCHAR(120),
  citizenid VARCHAR(64),
  reason TEXT,
  expires_at DATETIME NULL,
  ban_type VARCHAR(40) DEFAULT 'temporary',
  active TINYINT(1) DEFAULT 1,
  private_admin_notes TEXT,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL a2_add_col('player_bans', 'steam_id', 'steam_id VARCHAR(32) AFTER id');
CALL a2_add_col('player_bans', 'discord_id', 'discord_id VARCHAR(32) AFTER steam_id');
CALL a2_add_col('player_bans', 'license', 'license VARCHAR(120) AFTER discord_id');
CALL a2_add_col('player_bans', 'citizenid', 'citizenid VARCHAR(64) AFTER license');
CALL a2_add_col('player_bans', 'reason', 'reason TEXT AFTER citizenid');
CALL a2_add_col('player_bans', 'expires_at', 'expires_at DATETIME NULL AFTER reason');
CALL a2_add_col('player_bans', 'ban_type', 'ban_type VARCHAR(40) DEFAULT ''temporary'' AFTER expires_at');
CALL a2_add_col('player_bans', 'active', 'active TINYINT(1) DEFAULT 1 AFTER ban_type');

CREATE TABLE IF NOT EXISTS player_ban_cache (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  steam_id VARCHAR(32),
  discord_id VARCHAR(32),
  license VARCHAR(120),
  citizenid VARCHAR(64),
  status VARCHAR(40) DEFAULT 'Not banned',
  ban_id VARCHAR(120),
  reason TEXT,
  expires_at DATETIME NULL,
  ban_type VARCHAR(40),
  checked_at DATETIME NULL,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL a2_add_col('player_ban_cache', 'steam_id', 'steam_id VARCHAR(32) AFTER user_id');
CALL a2_add_col('player_ban_cache', 'expires_at', 'expires_at DATETIME NULL AFTER reason');
CALL a2_add_col('player_ban_cache', 'ban_type', 'ban_type VARCHAR(40) AFTER expires_at');

CALL a2_modify_col('admin_invites', 'id', 'id VARCHAR(64) NOT NULL');
CALL a2_add_col('admin_invites', 'steam_id', 'steam_id VARCHAR(32) AFTER discord_id');
CALL a2_add_col('admin_invites', 'expires_at', 'expires_at DATETIME NULL AFTER token_hash');

DROP PROCEDURE IF EXISTS a2_add_col;
DROP PROCEDURE IF EXISTS a2_modify_col;
