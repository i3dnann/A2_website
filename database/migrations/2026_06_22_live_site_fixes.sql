-- Run this once on the same MySQL database used by the website/QBCore.
-- It upgrades older A2 website installs without deleting data.

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

CREATE TABLE IF NOT EXISTS player_links (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  steam_id VARCHAR(32),
  discord_id VARCHAR(32),
  license VARCHAR(120),
  fivem_id VARCHAR(80),
  citizenid VARCHAR(64),
  identifiers_json JSON,
  verified_at DATETIME NULL,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_player_links_user (user_id),
  INDEX idx_player_links_steam (steam_id),
  INDEX idx_player_links_discord (discord_id),
  INDEX idx_player_links_license (license),
  INDEX idx_player_links_citizenid (citizenid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL a2_add_col('web_settings', 'is_secret', 'is_secret TINYINT(1) DEFAULT 0 AFTER setting_value');

CALL a2_add_col('streamers', 'profile_image_url', 'profile_image_url TEXT AFTER display_name');
CALL a2_add_col('streamers', 'avatar_url', 'avatar_url TEXT AFTER profile_image_url');
CALL a2_add_col('streamers', 'banner_url', 'banner_url TEXT AFTER avatar_url');
CALL a2_add_col('streamers', 'discord_id', 'discord_id VARCHAR(32) AFTER bio');
CALL a2_add_col('streamers', 'discord_username', 'discord_username VARCHAR(120) AFTER discord_id');
CALL a2_add_col('streamers', 'steam_id', 'steam_id VARCHAR(32) AFTER discord_username');
CALL a2_add_col('streamers', 'character_name', 'character_name VARCHAR(120) AFTER steam_id');
CALL a2_add_col('streamers', 'twitch_username', 'twitch_username VARCHAR(120) AFTER category');
CALL a2_add_col('streamers', 'kick_username', 'kick_username VARCHAR(120) AFTER twitch_username');
CALL a2_add_col('streamers', 'youtube_url', 'youtube_url TEXT AFTER kick_username');
CALL a2_add_col('streamers', 'tiktok_url', 'tiktok_url TEXT AFTER youtube_url');
CALL a2_add_col('streamers', 'instagram_url', 'instagram_url TEXT AFTER tiktok_url');
CALL a2_add_col('streamers', 'x_url', 'x_url TEXT AFTER instagram_url');
CALL a2_add_col('streamers', 'discord_url', 'discord_url TEXT AFTER x_url');
CALL a2_add_col('streamers', 'is_featured', 'is_featured TINYINT(1) DEFAULT 0');
CALL a2_add_col('streamers', 'is_approved', 'is_approved TINYINT(1) DEFAULT 1');
CALL a2_add_col('streamers', 'is_hidden', 'is_hidden TINYINT(1) DEFAULT 0');

CALL a2_add_col('famous_characters', 'picture_url', 'picture_url TEXT AFTER header');
CALL a2_add_col('famous_characters', 'bio', 'bio TEXT AFTER picture_url');
CALL a2_add_col('famous_characters', 'description', 'description MEDIUMTEXT AFTER bio');
CALL a2_add_col('famous_characters', 'role_name', 'role_name VARCHAR(120) AFTER description');
CALL a2_add_col('famous_characters', 'gang_business', 'gang_business VARCHAR(160) AFTER role_name');
CALL a2_add_col('famous_characters', 'social_links_json', 'social_links_json JSON AFTER gang_business');
CALL a2_add_col('famous_characters', 'is_featured', 'is_featured TINYINT(1) DEFAULT 0');
CALL a2_add_col('famous_characters', 'is_visible', 'is_visible TINYINT(1) DEFAULT 1');

CALL a2_add_col('team_members', 'profile_image_url', 'profile_image_url TEXT AFTER category');
CALL a2_add_col('team_members', 'discord_url', 'discord_url TEXT AFTER bio');
CALL a2_add_col('team_members', 'twitch_url', 'twitch_url TEXT AFTER discord_url');
CALL a2_add_col('team_members', 'kick_url', 'kick_url TEXT AFTER twitch_url');
CALL a2_add_col('team_members', 'youtube_url', 'youtube_url TEXT AFTER kick_url');
CALL a2_add_col('team_members', 'tiktok_url', 'tiktok_url TEXT AFTER youtube_url');
CALL a2_add_col('team_members', 'instagram_url', 'instagram_url TEXT AFTER tiktok_url');
CALL a2_add_col('team_members', 'x_url', 'x_url TEXT AFTER instagram_url');
CALL a2_add_col('team_members', 'is_visible', 'is_visible TINYINT(1) DEFAULT 1');

CALL a2_add_col('tickets', 'ticket_number', 'ticket_number VARCHAR(80) UNIQUE AFTER id');
CALL a2_add_col('tickets', 'message_preview', 'message_preview TEXT AFTER subject');
CALL a2_add_col('tickets', 'priority', 'priority VARCHAR(40) DEFAULT ''Normal'' AFTER status');
CALL a2_add_col('tickets', 'assigned_to', 'assigned_to VARCHAR(64) AFTER priority');
CALL a2_add_col('tickets', 'closed_by', 'closed_by VARCHAR(64) AFTER assigned_to');
CALL a2_add_col('tickets', 'closed_at', 'closed_at DATETIME NULL AFTER closed_by');
CALL a2_add_col('tickets', 'discord_id', 'discord_id VARCHAR(32) AFTER closed_at');
CALL a2_add_col('tickets', 'steam_id', 'steam_id VARCHAR(32) AFTER discord_id');
CALL a2_add_col('tickets', 'citizenid', 'citizenid VARCHAR(64) AFTER steam_id');

CALL a2_add_col('ticket_messages', 'author_type', 'author_type VARCHAR(40) AFTER author_id');
CALL a2_add_col('ticket_messages', 'internal_only', 'internal_only TINYINT(1) DEFAULT 0 AFTER message');
CALL a2_add_col('ticket_notes', 'admin_id', 'admin_id VARCHAR(64) AFTER ticket_id');

CALL a2_add_col('career_applications', 'discord_id', 'discord_id VARCHAR(32) AFTER user_id');
CALL a2_add_col('career_applications', 'steam_id', 'steam_id VARCHAR(32) AFTER discord_id');
CALL a2_add_col('career_applications', 'citizenid', 'citizenid VARCHAR(64) AFTER steam_id');
CALL a2_add_col('career_applications', 'reviewed_by', 'reviewed_by VARCHAR(64) AFTER status');
CALL a2_add_col('career_applications', 'reviewed_at', 'reviewed_at DATETIME NULL AFTER reviewed_by');
CALL a2_add_col('career_applications', 'internal_notes', 'internal_notes TEXT AFTER reviewed_at');
CALL a2_add_col('career_application_notes', 'is_internal', 'is_internal TINYINT(1) DEFAULT 1 AFTER note');

CALL a2_add_col('map_zones', 'image_url', 'image_url TEXT AFTER description');
CALL a2_add_col('map_zones', 'position_x', 'position_x DECIMAL(8,4) DEFAULT 50');
CALL a2_add_col('map_zones', 'position_y', 'position_y DECIMAL(8,4) DEFAULT 50');
CALL a2_add_col('map_zones', 'fivem_x', 'fivem_x DECIMAL(12,4) NULL');
CALL a2_add_col('map_zones', 'fivem_y', 'fivem_y DECIMAL(12,4) NULL');
CALL a2_add_col('map_zones', 'fivem_z', 'fivem_z DECIMAL(12,4) NULL');
CALL a2_add_col('map_zones', 'radius', 'radius DECIMAL(12,2) NULL');
CALL a2_add_col('map_zones', 'color', 'color VARCHAR(16)');
CALL a2_add_col('map_zones', 'icon', 'icon VARCHAR(80)');
CALL a2_add_col('map_zones', 'is_visible', 'is_visible TINYINT(1) DEFAULT 1');

CALL a2_add_col('terms_pages', 'content', 'content MEDIUMTEXT AFTER title');
CALL a2_add_col('terms_pages', 'version', 'version VARCHAR(40) AFTER content');
CALL a2_add_col('terms_pages', 'effective_date', 'effective_date DATE NULL AFTER version');
CALL a2_add_col('terms_pages', 'is_visible', 'is_visible TINYINT(1) DEFAULT 1');
CALL a2_add_col('terms_pages', 'sort_order', 'sort_order INT DEFAULT 9999');

CALL a2_add_col('events', 'image_url', 'image_url TEXT AFTER description');
CALL a2_add_col('events', 'starts_at', 'starts_at DATETIME NULL AFTER location');
CALL a2_add_col('events', 'ends_at', 'ends_at DATETIME NULL AFTER starts_at');
CALL a2_add_col('events', 'status_override', 'status_override VARCHAR(40) AFTER ends_at');
CALL a2_add_col('events', 'category', 'category VARCHAR(80) AFTER status_override');
CALL a2_add_col('events', 'is_visible', 'is_visible TINYINT(1) DEFAULT 1');
CALL a2_add_col('events', 'sort_order', 'sort_order INT DEFAULT 9999');

CALL a2_add_col('player_links', 'user_id', 'user_id VARCHAR(64) NOT NULL DEFAULT ''fivem-unknown'' AFTER id');
CALL a2_add_col('player_links', 'steam_id', 'steam_id VARCHAR(32) AFTER user_id');
CALL a2_add_col('player_links', 'discord_id', 'discord_id VARCHAR(32) AFTER steam_id');
CALL a2_add_col('player_links', 'license', 'license VARCHAR(120) AFTER discord_id');
CALL a2_add_col('player_links', 'fivem_id', 'fivem_id VARCHAR(80) AFTER license');
CALL a2_add_col('player_links', 'citizenid', 'citizenid VARCHAR(64) AFTER fivem_id');
CALL a2_add_col('player_links', 'identifiers_json', 'identifiers_json JSON AFTER citizenid');
CALL a2_add_col('player_links', 'verified_at', 'verified_at DATETIME NULL AFTER identifiers_json');

DROP PROCEDURE IF EXISTS a2_add_col;
