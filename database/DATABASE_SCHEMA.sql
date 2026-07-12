-- A2 Studio FiveM roleplay community website schema.
-- Import into the same MySQL/MariaDB database used by QBCore, or into a separate website DB.
-- This schema adds website tables only; it does not modify QBCore core tables.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS web_users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(120) NOT NULL,
  email VARCHAR(190) UNIQUE,
  password_hash VARCHAR(255),
  email_verified_at DATETIME NULL,
  avatar_url TEXT,
  verified_badge TINYINT(1) DEFAULT 0,
  verified_at DATETIME NULL,
  verified_by VARCHAR(64),
  verification_status VARCHAR(40) DEFAULT 'none',
  roles_json JSON,
  permissions_json JSON,
  account_status VARCHAR(32) DEFAULT 'active',
  admin_status VARCHAR(32) DEFAULT 'active',
  preferred_language VARCHAR(8) DEFAULT 'en',
  discord_id VARCHAR(32),
  discord_username VARCHAR(120),
  steam_id VARCHAR(32),
  steam_persona VARCHAR(160),
  linked_identifiers_json JSON,
  first_login_at DATETIME NULL,
  last_login_at DATETIME NULL,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_web_users_email (email),
  INDEX idx_web_users_discord_id (discord_id),
  INDEX idx_web_users_steam_id (steam_id),
  INDEX idx_web_users_status (account_status, admin_status),
  INDEX idx_web_users_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  INDEX idx_auth_provider_user (user_id),
  INDEX idx_auth_provider_provider (provider),
  INDEX idx_auth_provider_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS web_sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  ip_address VARCHAR(80),
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_web_sessions_user (user_id),
  INDEX idx_web_sessions_expires (expires_at),
  INDEX idx_web_sessions_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS web_roles (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  is_system TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_web_roles_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS web_permissions (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(80),
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_web_permissions_category (category),
  INDEX idx_web_permissions_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS web_user_roles (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  role_id VARCHAR(64) NOT NULL,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uniq_web_user_role (user_id, role_id),
  INDEX idx_web_user_roles_user (user_id),
  INDEX idx_web_user_roles_role (role_id),
  INDEX idx_web_user_roles_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS web_user_permissions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  permission_id VARCHAR(64) NOT NULL,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uniq_web_user_permission (user_id, permission_id),
  INDEX idx_web_user_permissions_user (user_id),
  INDEX idx_web_user_permissions_permission (permission_id),
  INDEX idx_web_user_permissions_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS web_admin_status (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL UNIQUE,
  status VARCHAR(32) DEFAULT 'active',
  frozen_reason TEXT,
  frozen_by VARCHAR(64),
  frozen_at DATETIME NULL,
  disabled_by VARCHAR(64),
  disabled_at DATETIME NULL,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_web_admin_status_user (user_id),
  INDEX idx_web_admin_status_status (status),
  INDEX idx_web_admin_status_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS web_settings (
  id VARCHAR(64) PRIMARY KEY,
  setting_key VARCHAR(120) NOT NULL UNIQUE,
  setting_value JSON,
  is_secret TINYINT(1) DEFAULT 0,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_web_settings_key (setting_key),
  INDEX idx_web_settings_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS web_theme_settings (
  id VARCHAR(64) PRIMARY KEY,
  primary_color VARCHAR(16),
  background_color VARCHAR(16),
  text_color VARCHAR(16),
  secondary_color VARCHAR(16),
  card_background VARCHAR(16),
  border_color VARCHAR(16),
  muted_text_color VARCHAR(16),
  danger_color VARCHAR(16),
  warning_color VARCHAR(16),
  success_color VARCHAR(16),
  performance_mode TINYINT(1) DEFAULT 0,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_web_theme_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS web_audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  action VARCHAR(160) NOT NULL,
  staff_id VARCHAR(64),
  staff_name VARCHAR(160),
  target_type VARCHAR(120),
  target_id VARCHAR(120),
  reason TEXT,
  ip VARCHAR(80),
  before_json JSON,
  after_json JSON,
  status VARCHAR(40) DEFAULT 'success',
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_audit_action (action),
  INDEX idx_audit_staff (staff_id),
  INDEX idx_audit_target (target_type, target_id),
  INDEX idx_audit_status (status),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS web_files (
  id VARCHAR(64) PRIMARY KEY,
  owner_user_id VARCHAR(64),
  original_name VARCHAR(255),
  stored_name VARCHAR(255),
  mime_type VARCHAR(120),
  size_bytes BIGINT,
  url TEXT,
  storage_driver VARCHAR(40) DEFAULT 'local',
  metadata_json JSON,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_web_files_owner (owner_user_id),
  INDEX idx_web_files_mime (mime_type),
  INDEX idx_web_files_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_terms_agreements (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  terms_version VARCHAR(40) NOT NULL,
  agreed_at DATETIME NOT NULL,
  ip_address VARCHAR(80),
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_terms_user (user_id),
  INDEX idx_terms_version (terms_version),
  INDEX idx_terms_agreed_at (agreed_at),
  INDEX idx_terms_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  INDEX idx_player_links_citizenid (citizenid),
  INDEX idx_player_links_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  deleted_at DATETIME NULL,
  INDEX idx_ban_cache_user (user_id),
  INDEX idx_ban_cache_steam (steam_id),
  INDEX idx_ban_cache_discord (discord_id),
  INDEX idx_ban_cache_license (license),
  INDEX idx_ban_cache_citizenid (citizenid),
  INDEX idx_ban_cache_status (status),
  INDEX idx_ban_cache_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  deleted_at DATETIME NULL,
  INDEX idx_player_bans_steam (steam_id),
  INDEX idx_player_bans_discord (discord_id),
  INDEX idx_player_bans_license (license),
  INDEX idx_player_bans_citizenid (citizenid),
  INDEX idx_player_bans_status (active, ban_type),
  INDEX idx_player_bans_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS player_blacklists (
  id VARCHAR(64) PRIMARY KEY,
  steam_id VARCHAR(32),
  discord_id VARCHAR(32),
  license VARCHAR(120),
  citizenid VARCHAR(64),
  reason TEXT,
  active TINYINT(1) DEFAULT 1,
  private_admin_notes TEXT,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  removed_by VARCHAR(64),
  removed_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_blacklists_steam (steam_id),
  INDEX idx_blacklists_discord (discord_id),
  INDEX idx_blacklists_license (license),
  INDEX idx_blacklists_citizenid (citizenid),
  INDEX idx_blacklists_status (active),
  INDEX idx_blacklists_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS partners (
  id VARCHAR(64) PRIMARY KEY,
  partner_name VARCHAR(160) NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  sort_order INT DEFAULT 9999,
  is_visible TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_partners_visible (is_visible),
  INDEX idx_partners_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS journey_items (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(190),
  description MEDIUMTEXT,
  journey_date DATE NULL,
  journey_time VARCHAR(20),
  image_url TEXT,
  icon VARCHAR(80),
  status VARCHAR(40) DEFAULT 'past',
  sort_order INT DEFAULT 9999,
  is_visible TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_journey_status (status),
  INDEX idx_journey_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS famous_characters (
  id VARCHAR(64) PRIMARY KEY,
  character_name VARCHAR(160) NOT NULL,
  header VARCHAR(190),
  picture_url TEXT,
  bio TEXT,
  description MEDIUMTEXT,
  role_name VARCHAR(120),
  gang_business VARCHAR(160),
  social_links_json JSON,
  is_featured TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 9999,
  is_visible TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_famous_name (character_name),
  INDEX idx_famous_featured (is_featured),
  INDEX idx_famous_visible (is_visible),
  INDEX idx_famous_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS streamers (
  id VARCHAR(64) PRIMARY KEY,
  display_name VARCHAR(160) NOT NULL,
  profile_image_url TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  bio MEDIUMTEXT,
  discord_id VARCHAR(32),
  discord_username VARCHAR(120),
  steam_id VARCHAR(32),
  character_name VARCHAR(120),
  category VARCHAR(80) DEFAULT 'Other',
  twitch_username VARCHAR(120),
  kick_username VARCHAR(120),
  youtube_url TEXT,
  tiktok_url TEXT,
  instagram_url TEXT,
  x_url TEXT,
  discord_url TEXT,
  is_featured TINYINT(1) DEFAULT 0,
  is_approved TINYINT(1) DEFAULT 0,
  is_hidden TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_streamers_discord (discord_id),
  INDEX idx_streamers_steam (steam_id),
  INDEX idx_streamers_twitch (twitch_username),
  INDEX idx_streamers_kick (kick_username),
  INDEX idx_streamers_status (is_approved, is_hidden),
  INDEX idx_streamers_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS streamer_social_links (
  id VARCHAR(64) PRIMARY KEY,
  streamer_id VARCHAR(64) NOT NULL,
  platform VARCHAR(80),
  url TEXT,
  sort_order INT DEFAULT 9999,
  is_visible TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_streamer_social_streamer (streamer_id),
  INDEX idx_streamer_social_platform (platform),
  INDEX idx_streamer_social_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS streamer_live_status (
  id VARCHAR(64) PRIMARY KEY,
  streamer_id VARCHAR(64) NOT NULL,
  platform VARCHAR(40) NOT NULL,
  is_live TINYINT(1) DEFAULT 0,
  stream_title VARCHAR(255),
  viewer_count INT,
  thumbnail_url TEXT,
  stream_url TEXT,
  started_at DATETIME NULL,
  last_checked_at DATETIME NULL,
  raw_response_json JSON,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uniq_streamer_platform (streamer_id, platform),
  INDEX idx_live_status_streamer (streamer_id),
  INDEX idx_live_status_live (is_live),
  INDEX idx_live_status_checked (last_checked_at),
  INDEX idx_live_status_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS team_members (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  role_title VARCHAR(160),
  category VARCHAR(80) DEFAULT 'Other',
  profile_image_url TEXT,
  banner_url TEXT,
  bio TEXT,
  discord_url TEXT,
  twitch_url TEXT,
  kick_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  instagram_url TEXT,
  x_url TEXT,
  sort_order INT DEFAULT 9999,
  is_visible TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_team_category (category),
  INDEX idx_team_visible (is_visible),
  INDEX idx_team_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS career_jobs (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(190) NOT NULL,
  description MEDIUMTEXT,
  department VARCHAR(120),
  image_url TEXT,
  is_open TINYINT(1) DEFAULT 1,
  start_date DATE NULL,
  end_date DATE NULL,
  requirements MEDIUMTEXT,
  sort_order INT DEFAULT 9999,
  is_visible TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_career_jobs_status (is_open, is_visible),
  INDEX idx_career_jobs_department (department),
  INDEX idx_career_jobs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS career_sections (
  id VARCHAR(64) PRIMARY KEY,
  job_id VARCHAR(64) NOT NULL,
  title VARCHAR(190) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 9999,
  is_visible TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_career_sections_job (job_id),
  INDEX idx_career_sections_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS career_questions (
  id VARCHAR(64) PRIMARY KEY,
  job_id VARCHAR(64) NOT NULL,
  section_id VARCHAR(64),
  question TEXT NOT NULL,
  help_text TEXT,
  question_type VARCHAR(40) DEFAULT 'short_text',
  options_json JSON,
  is_required TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 9999,
  is_visible TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_career_questions_job (job_id),
  INDEX idx_career_questions_section (section_id),
  INDEX idx_career_questions_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS career_applications (
  id VARCHAR(64) PRIMARY KEY,
  job_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  discord_id VARCHAR(32),
  steam_id VARCHAR(32),
  citizenid VARCHAR(64),
  status VARCHAR(40) DEFAULT 'Submitted',
  reviewed_by VARCHAR(64),
  reviewed_at DATETIME NULL,
  internal_notes TEXT,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_career_applications_job (job_id),
  INDEX idx_career_applications_user (user_id),
  INDEX idx_career_applications_discord (discord_id),
  INDEX idx_career_applications_steam (steam_id),
  INDEX idx_career_applications_citizenid (citizenid),
  INDEX idx_career_applications_status (status),
  INDEX idx_career_applications_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS career_answers (
  id VARCHAR(64) PRIMARY KEY,
  application_id VARCHAR(64) NOT NULL,
  section_id VARCHAR(64),
  question_id VARCHAR(64),
  question_snapshot TEXT,
  answer_text MEDIUMTEXT,
  file_url TEXT,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_career_answers_application (application_id),
  INDEX idx_career_answers_question (question_id),
  INDEX idx_career_answers_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS career_application_notes (
  id VARCHAR(64) PRIMARY KEY,
  application_id VARCHAR(64) NOT NULL,
  admin_id VARCHAR(64),
  note TEXT,
  is_internal TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_career_notes_application (application_id),
  INDEX idx_career_notes_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tickets (
  id VARCHAR(64) PRIMARY KEY,
  ticket_number VARCHAR(80) UNIQUE,
  user_id VARCHAR(64) NOT NULL,
  category VARCHAR(80),
  subject VARCHAR(190),
  message_preview TEXT,
  status VARCHAR(40) DEFAULT 'Open',
  priority VARCHAR(40) DEFAULT 'Normal',
  assigned_to VARCHAR(64),
  closed_by VARCHAR(64),
  closed_at DATETIME NULL,
  discord_id VARCHAR(32),
  steam_id VARCHAR(32),
  citizenid VARCHAR(64),
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_tickets_user (user_id),
  INDEX idx_tickets_discord (discord_id),
  INDEX idx_tickets_steam (steam_id),
  INDEX idx_tickets_citizenid (citizenid),
  INDEX idx_tickets_status (status),
  INDEX idx_tickets_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_messages (
  id VARCHAR(64) PRIMARY KEY,
  ticket_id VARCHAR(64) NOT NULL,
  author_id VARCHAR(64),
  author_type VARCHAR(40),
  message MEDIUMTEXT,
  internal_only TINYINT(1) DEFAULT 0,
  read_at DATETIME NULL,
  read_by VARCHAR(64),
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_ticket_messages_ticket (ticket_id),
  INDEX idx_ticket_messages_read_at (read_at),
  INDEX idx_ticket_messages_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_attachments (
  id VARCHAR(64) PRIMARY KEY,
  ticket_id VARCHAR(64) NOT NULL,
  message_id VARCHAR(64),
  file_url TEXT,
  original_name VARCHAR(255),
  mime_type VARCHAR(120),
  size_bytes BIGINT,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_ticket_attachments_ticket (ticket_id),
  INDEX idx_ticket_attachments_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_participants (
  id VARCHAR(64) PRIMARY KEY,
  ticket_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64),
  discord_id VARCHAR(32),
  steam_id VARCHAR(32),
  added_by VARCHAR(64),
  role_name VARCHAR(80) DEFAULT 'Participant',
  is_active TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_ticket_participants_ticket (ticket_id),
  INDEX idx_ticket_participants_user (user_id),
  INDEX idx_ticket_participants_discord (discord_id),
  INDEX idx_ticket_participants_steam (steam_id),
  INDEX idx_ticket_participants_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_notes (
  id VARCHAR(64) PRIMARY KEY,
  ticket_id VARCHAR(64) NOT NULL,
  admin_id VARCHAR(64),
  note TEXT,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_ticket_notes_ticket (ticket_id),
  INDEX idx_ticket_notes_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS news_categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) UNIQUE,
  description TEXT,
  sort_order INT DEFAULT 9999,
  is_visible TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_news_categories_slug (slug),
  INDEX idx_news_categories_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS news_articles (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(190),
  subtitle VARCHAR(190),
  content MEDIUMTEXT,
  image_url TEXT,
  video_url TEXT,
  category VARCHAR(80),
  author_name VARCHAR(120),
  published_at DATETIME NULL,
  status VARCHAR(40) DEFAULT 'Draft',
  is_featured TINYINT(1) DEFAULT 0,
  likes INT DEFAULT 0,
  dislikes INT DEFAULT 0,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_news_category (category),
  INDEX idx_news_status (status),
  INDEX idx_news_featured (is_featured),
  INDEX idx_news_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS news_comments (
  id VARCHAR(64) PRIMARY KEY,
  news_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64),
  author_name VARCHAR(120),
  author_verified TINYINT(1) DEFAULT 0,
  body TEXT,
  status VARCHAR(40) DEFAULT 'pending',
  approved TINYINT DEFAULT 0,
  is_hidden TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_news_comments_news (news_id),
  INDEX idx_news_comments_status (status),
  INDEX idx_news_comments_user (user_id),
  INDEX idx_news_comments_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS news_votes (
  id VARCHAR(96) PRIMARY KEY,
  news_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  vote_type VARCHAR(16) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_news_vote_user (news_id, user_id),
  INDEX idx_news_votes_news (news_id),
  INDEX idx_news_votes_user (user_id),
  INDEX idx_news_votes_type (vote_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS map_zones (
  id VARCHAR(64) PRIMARY KEY,
  zone_name VARCHAR(160),
  zone_type VARCHAR(80),
  description MEDIUMTEXT,
  image_url TEXT,
  position_x DECIMAL(8,4) DEFAULT 50,
  position_y DECIMAL(8,4) DEFAULT 50,
  fivem_x DECIMAL(12,4) NULL,
  fivem_y DECIMAL(12,4) NULL,
  fivem_z DECIMAL(12,4) NULL,
  radius DECIMAL(12,2) NULL,
  color VARCHAR(16),
  icon VARCHAR(80),
  sort_order INT DEFAULT 9999,
  is_visible TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_map_zones_type (zone_type),
  INDEX idx_map_zones_visible (is_visible),
  INDEX idx_map_zones_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS faq_categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 9999,
  is_visible TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_faq_categories_visible (is_visible),
  INDEX idx_faq_categories_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS faq_items (
  id VARCHAR(64) PRIMARY KEY,
  category_id VARCHAR(64),
  question TEXT NOT NULL,
  answer MEDIUMTEXT,
  sort_order INT DEFAULT 9999,
  is_visible TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_faq_items_category (category_id),
  INDEX idx_faq_items_visible (is_visible),
  INDEX idx_faq_items_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS terms_pages (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(190),
  content MEDIUMTEXT,
  version VARCHAR(40),
  effective_date DATE NULL,
  is_visible TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_terms_pages_version (version),
  INDEX idx_terms_pages_visible (is_visible),
  INDEX idx_terms_pages_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(190),
  description MEDIUMTEXT,
  image_url TEXT,
  location VARCHAR(190),
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  status_override VARCHAR(40),
  category VARCHAR(80),
  sort_order INT DEFAULT 9999,
  is_visible TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_events_status (status_override),
  INDEX idx_events_start (starts_at),
  INDEX idx_events_category (category),
  INDEX idx_events_visible (is_visible),
  INDEX idx_events_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_invites (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(190),
  discord_id VARCHAR(32),
  steam_id VARCHAR(32),
  role_name VARCHAR(120),
  permissions_json JSON,
  token_hash VARCHAR(255),
  expires_at DATETIME NULL,
  status VARCHAR(40) DEFAULT 'pending',
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_admin_invites_email (email),
  INDEX idx_admin_invites_discord (discord_id),
  INDEX idx_admin_invites_steam (steam_id),
  INDEX idx_admin_invites_status (status),
  INDEX idx_admin_invites_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
