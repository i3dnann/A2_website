-- A2 Studio website database schema.
-- This schema adds website tables next to QBCore. It does not modify core QBCore tables.
-- Import with: mysql -u root -p qbcore < database/DATABASE_SCHEMA.sql

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS web_users (
  id VARCHAR(64) PRIMARY KEY,
  discord_id VARCHAR(32) NOT NULL UNIQUE,
  username VARCHAR(120),
  discord_username VARCHAR(120),
  avatar_url TEXT,
  email VARCHAR(190),
  roles_json JSON,
  discord_roles_json JSON,
  permissions_json JSON,
  preferred_language VARCHAR(8) DEFAULT 'en',
  account_status VARCHAR(32) DEFAULT 'active',
  first_login_at DATETIME,
  last_login_at DATETIME,
  linked_citizenids_json JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_web_users_discord_id (discord_id),
  INDEX idx_web_users_status (account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS web_roles (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  is_system TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 9999,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS web_permissions (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(80),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS web_user_roles (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  role_id VARCHAR(64) NOT NULL,
  created_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_role (user_id, role_id),
  INDEX idx_user_roles_user (user_id),
  INDEX idx_user_roles_role (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS web_role_permissions (
  id VARCHAR(64) PRIMARY KEY,
  role_id VARCHAR(64) NOT NULL,
  permission_id VARCHAR(64) NOT NULL,
  created_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_role_permission (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS web_sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  ip VARCHAR(80),
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_web_sessions_user (user_id),
  INDEX idx_web_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS web_settings (
  id VARCHAR(64) PRIMARY KEY,
  setting_key VARCHAR(120) NOT NULL UNIQUE,
  setting_value JSON,
  is_secret TINYINT(1) DEFAULT 0,
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
  sort_order INT DEFAULT 9999,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_audit_action (action),
  INDEX idx_audit_staff (staff_id),
  INDEX idx_audit_target (target_type, target_id),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS whitelist_applications (
  id VARCHAR(64) PRIMARY KEY,
  discord_id VARCHAR(32) NOT NULL,
  discord_username VARCHAR(120),
  character_name VARCHAR(120),
  age_confirmed TINYINT(1) DEFAULT 0,
  rules_agreed TINYINT(1) DEFAULT 0,
  terms_agreed TINYINT(1) DEFAULT 0,
  language VARCHAR(8) DEFAULT 'en',
  backstory MEDIUMTEXT,
  roleplay_experience MEDIUMTEXT,
  status VARCHAR(40) DEFAULT 'Draft',
  review_reason TEXT,
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_whitelist_discord (discord_id),
  INDEX idx_whitelist_status (status),
  INDEX idx_whitelist_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS whitelist_reviews (
  id VARCHAR(64) PRIMARY KEY,
  application_id VARCHAR(64) NOT NULL,
  reviewer_id VARCHAR(64),
  decision VARCHAR(40),
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_whitelist_reviews_application (application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tickets (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(190),
  ticket_type VARCHAR(80),
  description MEDIUMTEXT,
  discord_id VARCHAR(32),
  citizenid VARCHAR(64),
  status VARCHAR(40) DEFAULT 'Open',
  priority VARCHAR(40) DEFAULT 'Normal',
  assigned_to VARCHAR(64),
  compensation_status VARCHAR(80),
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_tickets_discord (discord_id),
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ticket_messages_ticket (ticket_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_attachments (
  id VARCHAR(64) PRIMARY KEY,
  ticket_id VARCHAR(64) NOT NULL,
  media_upload_id VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ticket_attachments_ticket (ticket_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ban_appeals (
  id VARCHAR(64) PRIMARY KEY,
  ban_id VARCHAR(120),
  discord_id VARCHAR(32),
  citizenid VARCHAR(64),
  ban_reason TEXT,
  player_explanation MEDIUMTEXT,
  why_unban MEDIUMTEXT,
  evidence_url TEXT,
  status VARCHAR(40) DEFAULT 'Submitted',
  decision_reason TEXT,
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_ban_appeals_ban (ban_id),
  INDEX idx_ban_appeals_discord (discord_id),
  INDEX idx_ban_appeals_citizenid (citizenid),
  INDEX idx_ban_appeals_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ban_appeal_messages (
  id VARCHAR(64) PRIMARY KEY,
  appeal_id VARCHAR(64) NOT NULL,
  author_id VARCHAR(64),
  message MEDIUMTEXT,
  internal_only TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ban_appeal_messages_appeal (appeal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff_notes (
  id VARCHAR(64) PRIMARY KEY,
  target_discord_id VARCHAR(32),
  target_citizenid VARCHAR(64),
  note MEDIUMTEXT,
  created_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_staff_notes_discord (target_discord_id),
  INDEX idx_staff_notes_citizenid (target_citizenid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS player_warnings (
  id VARCHAR(64) PRIMARY KEY,
  discord_id VARCHAR(32),
  citizenid VARCHAR(64),
  reason TEXT,
  active TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_warnings_discord (discord_id),
  INDEX idx_warnings_citizenid (citizenid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS player_bans (
  id VARCHAR(64) PRIMARY KEY,
  discord_id VARCHAR(32),
  citizenid VARCHAR(64),
  license VARCHAR(120),
  reason TEXT,
  expires_at DATETIME NULL,
  active TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_bans_discord (discord_id),
  INDEX idx_bans_citizenid (citizenid),
  INDEX idx_bans_license (license)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS player_blacklists (
  id VARCHAR(64) PRIMARY KEY,
  discord_id VARCHAR(32),
  citizenid VARCHAR(64),
  license VARCHAR(120),
  reason TEXT,
  active TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  removed_by VARCHAR(64),
  removed_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_blacklists_discord (discord_id),
  INDEX idx_blacklists_citizenid (citizenid),
  INDEX idx_blacklists_license (license)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS police_reports (
  id VARCHAR(64) PRIMARY KEY,
  case_number VARCHAR(80),
  title VARCHAR(190),
  description MEDIUMTEXT,
  citizenid VARCHAR(64),
  character_name VARCHAR(120),
  officer_name VARCHAR(120),
  category VARCHAR(80),
  status VARCHAR(40) DEFAULT 'Open',
  danger_level VARCHAR(40),
  fine_amount DECIMAL(12,2) DEFAULT 0,
  jail_time INT DEFAULT 0,
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_police_reports_case (case_number),
  INDEX idx_police_reports_citizenid (citizenid),
  INDEX idx_police_reports_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS police_warrants (
  id VARCHAR(64) PRIMARY KEY,
  citizenid VARCHAR(64),
  character_name VARCHAR(120),
  reason TEXT,
  danger_level VARCHAR(40),
  assigned_officer VARCHAR(120),
  status VARCHAR(40) DEFAULT 'Active',
  expires_at DATETIME NULL,
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_police_warrants_citizenid (citizenid),
  INDEX idx_police_warrants_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS police_fines (
  id VARCHAR(64) PRIMARY KEY,
  citizenid VARCHAR(64),
  character_name VARCHAR(120),
  officer_name VARCHAR(120),
  reason TEXT,
  amount DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(40) DEFAULT 'Issued',
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_police_fines_citizenid (citizenid),
  INDEX idx_police_fines_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS police_evidence (
  id VARCHAR(64) PRIMARY KEY,
  report_id VARCHAR(64),
  title VARCHAR(190),
  description TEXT,
  media_upload_id VARCHAR(64),
  created_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_police_evidence_report (report_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ems_records (
  id VARCHAR(64) PRIMARY KEY,
  patient_name VARCHAR(120),
  citizenid VARCHAR(64),
  blood_type VARCHAR(8),
  known_injuries TEXT,
  medical_history MEDIUMTEXT,
  medication_notes MEDIUMTEXT,
  treatment_notes MEDIUMTEXT,
  assigned_doctor VARCHAR(120),
  status VARCHAR(40) DEFAULT 'Active',
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_ems_records_citizenid (citizenid),
  INDEX idx_ems_records_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ems_reports (
  id VARCHAR(64) PRIMARY KEY,
  record_id VARCHAR(64),
  report_type VARCHAR(80),
  title VARCHAR(190),
  description MEDIUMTEXT,
  created_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_ems_reports_record (record_id),
  INDEX idx_ems_reports_type (report_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS court_cases (
  id VARCHAR(64) PRIMARY KEY,
  case_number VARCHAR(80),
  title VARCHAR(190),
  description MEDIUMTEXT,
  defendant VARCHAR(160),
  plaintiff VARCHAR(160),
  judge_name VARCHAR(120),
  lawyer_name VARCHAR(120),
  status VARCHAR(40) DEFAULT 'Draft',
  fine_amount DECIMAL(12,2) DEFAULT 0,
  jail_time INT DEFAULT 0,
  appeal_status VARCHAR(40),
  evidence_json JSON,
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_court_cases_case (case_number),
  INDEX idx_court_cases_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS court_documents (
  id VARCHAR(64) PRIMARY KEY,
  case_id VARCHAR(64),
  document_type VARCHAR(80),
  title VARCHAR(190),
  content MEDIUMTEXT,
  pdf_url TEXT,
  status VARCHAR(40) DEFAULT 'Draft',
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_court_documents_case (case_id),
  INDEX idx_court_documents_type (document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS businesses (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160),
  business_type VARCHAR(80),
  logo_url TEXT,
  banner_url TEXT,
  description MEDIUMTEXT,
  owner_id VARCHAR(64),
  owner_name VARCHAR(120),
  opening_hours VARCHAR(190),
  location VARCHAR(190),
  weekly_rating DECIMAL(4,2) DEFAULT 0,
  revenue_stats_json JSON,
  is_approved TINYINT(1) DEFAULT 0,
  status VARCHAR(40) DEFAULT 'Pending',
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_businesses_name (name),
  INDEX idx_businesses_type (business_type),
  INDEX idx_businesses_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS business_employees (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64),
  citizenid VARCHAR(64),
  employee_name VARCHAR(120),
  rank_name VARCHAR(80),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_business_employees_business (business_id),
  INDEX idx_business_employees_citizenid (citizenid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS business_menu_items (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64),
  name VARCHAR(160),
  description TEXT,
  price DECIMAL(12,2) DEFAULT 0,
  available TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 9999,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_business_menu_business (business_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS business_reviews (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64),
  user_id VARCHAR(64),
  rating INT,
  review TEXT,
  status VARCHAR(40) DEFAULT 'Published',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_business_reviews_business (business_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS business_applications (
  id VARCHAR(64) PRIMARY KEY,
  business_name VARCHAR(160),
  business_type VARCHAR(80),
  applicant_name VARCHAR(120),
  discord_id VARCHAR(32),
  description MEDIUMTEXT,
  status VARCHAR(40) DEFAULT 'Submitted',
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_business_applications_discord (discord_id),
  INDEX idx_business_applications_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gangs (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160),
  logo_url TEXT,
  color VARCHAR(16),
  leader_name VARCHAR(120),
  territory VARCHAR(160),
  reputation INT DEFAULT 0,
  public_description MEDIUMTEXT,
  description MEDIUMTEXT,
  allies_json JSON,
  enemies_json JSON,
  war_status VARCHAR(80),
  warnings_json JSON,
  admin_notes MEDIUMTEXT,
  is_public TINYINT(1) DEFAULT 1,
  status VARCHAR(40) DEFAULT 'Active',
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_gangs_name (name),
  INDEX idx_gangs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gang_members (
  id VARCHAR(64) PRIMARY KEY,
  gang_id VARCHAR(64),
  citizenid VARCHAR(64),
  member_name VARCHAR(120),
  rank_name VARCHAR(80),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_gang_members_gang (gang_id),
  INDEX idx_gang_members_citizenid (citizenid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gang_territories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160),
  controlled_by VARCHAR(160),
  conflict_level VARCHAR(40),
  danger_level VARCHAR(40),
  fear_level VARCHAR(40),
  last_conflict_at DATETIME NULL,
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_gang_territories_controlled_by (controlled_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gang_war_logs (
  id VARCHAR(64) PRIMARY KEY,
  gang_a VARCHAR(160),
  gang_b VARCHAR(160),
  winner VARCHAR(160),
  reason TEXT,
  notes MEDIUMTEXT,
  screenshots_json JSON,
  created_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS news_articles (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(190),
  subtitle VARCHAR(190),
  image_url TEXT,
  content MEDIUMTEXT,
  category VARCHAR(80),
  author_name VARCHAR(120),
  language VARCHAR(8) DEFAULT 'en',
  tags TEXT,
  is_featured TINYINT(1) DEFAULT 0,
  status VARCHAR(40) DEFAULT 'Draft',
  publish_at DATETIME NULL,
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_news_category (category),
  INDEX idx_news_status (status),
  INDEX idx_news_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(190),
  description MEDIUMTEXT,
  image_url TEXT,
  category VARCHAR(80),
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  location VARCHAR(190),
  requirements TEXT,
  allowed_jobs_json JSON,
  max_participants INT DEFAULT 0,
  reward VARCHAR(190),
  host VARCHAR(120),
  status VARCHAR(40) DEFAULT 'Draft',
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_events_status (status),
  INDEX idx_events_start (starts_at),
  INDEX idx_events_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_participants (
  id VARCHAR(64) PRIMARY KEY,
  event_id VARCHAR(64),
  user_id VARCHAR(64),
  status VARCHAR(40) DEFAULT 'Registered',
  approved_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uniq_event_participant (event_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS character_profiles (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  citizenid VARCHAR(64),
  character_name VARCHAR(120),
  age INT,
  backstory MEDIUMTEXT,
  personality TEXT,
  job VARCHAR(120),
  gang VARCHAR(120),
  profile_image_url TEXT,
  friends_json JSON,
  enemies_json JSON,
  family_json JSON,
  life_events_json JSON,
  quotes_json JSON,
  public_reputation VARCHAR(190),
  privacy VARCHAR(40) DEFAULT 'Public',
  status VARCHAR(40) DEFAULT 'Published',
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_character_profiles_citizenid (citizenid),
  INDEX idx_character_profiles_privacy (privacy),
  INDEX idx_character_profiles_name (character_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS character_gallery (
  id VARCHAR(64) PRIMARY KEY,
  profile_id VARCHAR(64),
  media_upload_id VARCHAR(64),
  caption TEXT,
  sort_order INT DEFAULT 9999,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_character_gallery_profile (profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shop_products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160),
  description MEDIUMTEXT,
  image_url TEXT,
  price DECIMAL(12,2) DEFAULT 0,
  category VARCHAR(80),
  availability VARCHAR(40) DEFAULT 'Available',
  requires_approval TINYINT(1) DEFAULT 1,
  status VARCHAR(40) DEFAULT 'Active',
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_shop_products_category (category),
  INDEX idx_shop_products_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shop_orders (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64),
  user_id VARCHAR(64),
  discord_id VARCHAR(32),
  citizenid VARCHAR(64),
  price DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(40) DEFAULT 'Pending',
  delivery_note TEXT,
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_shop_orders_discord (discord_id),
  INDEX idx_shop_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS city_archive (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(190),
  week_number INT,
  month VARCHAR(60),
  major_events MEDIUMTEXT,
  biggest_crime TEXT,
  biggest_court_case TEXT,
  best_police VARCHAR(120),
  best_ems VARCHAR(120),
  best_business VARCHAR(120),
  best_gang VARCHAR(120),
  best_streamer VARCHAR(120),
  most_watched_streamer VARCHAR(120),
  most_wanted VARCHAR(120),
  deaths TEXT,
  server_changes TEXT,
  screenshots_json JSON,
  video_links_json JSON,
  story_summary MEDIUMTEXT,
  status VARCHAR(40) DEFAULT 'Draft',
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_archive_week (week_number),
  INDEX idx_archive_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS map_markers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160),
  marker_type VARCHAR(80),
  description MEDIUMTEXT,
  x DECIMAL(12,4) DEFAULT 0,
  y DECIMAL(12,4) DEFAULT 0,
  z DECIMAL(12,4) DEFAULT 0,
  icon VARCHAR(80),
  color VARCHAR(16),
  image_url TEXT,
  visibility VARCHAR(40) DEFAULT 'Public',
  status VARCHAR(40) DEFAULT 'Published',
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_map_markers_type (marker_type),
  INDEX idx_map_markers_visibility (visibility)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS job_pages (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160),
  description MEDIUMTEXT,
  requirements TEXT,
  how_to_apply TEXT,
  vehicles TEXT,
  uniforms TEXT,
  rules MEDIUMTEXT,
  bosses TEXT,
  employees_public TINYINT(1) DEFAULT 0,
  status VARCHAR(40) DEFAULT 'Draft',
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_job_pages_name (name),
  INDEX idx_job_pages_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS job_ranks (
  id VARCHAR(64) PRIMARY KEY,
  job_page_id VARCHAR(64),
  rank_name VARCHAR(120),
  rank_level INT DEFAULT 0,
  permissions_json JSON,
  sort_order INT DEFAULT 9999,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_job_ranks_job (job_page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS story_campaigns (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160),
  title VARCHAR(190),
  description MEDIUMTEXT,
  status VARCHAR(40) DEFAULT 'Draft',
  start_date DATETIME NULL,
  end_date DATETIME NULL,
  visibility VARCHAR(40) DEFAULT 'Public',
  linked_event_id VARCHAR(64),
  linked_map_markers_json JSON,
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_story_campaigns_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS story_chapters (
  id VARCHAR(64) PRIMARY KEY,
  campaign_id VARCHAR(64),
  title VARCHAR(190),
  content MEDIUMTEXT,
  release_at DATETIME NULL,
  status VARCHAR(40) DEFAULT 'Draft',
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_story_chapters_campaign (campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS story_clues (
  id VARCHAR(64) PRIMARY KEY,
  campaign_id VARCHAR(64),
  title VARCHAR(190),
  content MEDIUMTEXT,
  clue_type VARCHAR(80),
  encrypted_payload TEXT,
  release_at DATETIME NULL,
  visibility VARCHAR(40) DEFAULT 'Public',
  status VARCHAR(40) DEFAULT 'Draft',
  metadata_json JSON,
  sort_order INT DEFAULT 9999,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_story_clues_campaign (campaign_id),
  INDEX idx_story_clues_release (release_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS streamers (
  id VARCHAR(64) PRIMARY KEY,
  display_name VARCHAR(160) NOT NULL,
  discord_id VARCHAR(32),
  discord_username VARCHAR(120),
  avatar_url TEXT,
  banner_url TEXT,
  bio MEDIUMTEXT,
  main_platform VARCHAR(40),
  twitch_username VARCHAR(120),
  kick_username VARCHAR(120),
  youtube_url TEXT,
  tiktok_url TEXT,
  discord_url TEXT,
  character_name VARCHAR(120),
  category VARCHAR(80) DEFAULT 'Other',
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
  INDEX idx_streamers_twitch (twitch_username),
  INDEX idx_streamers_kick (kick_username),
  INDEX idx_streamers_category (category),
  INDEX idx_streamers_approved_hidden (is_approved, is_hidden)
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_streamer_platform (streamer_id, platform),
  INDEX idx_streamer_live_status_streamer (streamer_id),
  INDEX idx_streamer_live_status_live (is_live),
  INDEX idx_streamer_live_status_checked (last_checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS server_status_cache (
  id VARCHAR(64) PRIMARY KEY,
  server_name VARCHAR(160),
  online TINYINT(1) DEFAULT 0,
  current_players INT DEFAULT 0,
  max_players INT DEFAULT 0,
  queue_count INT DEFAULT 0,
  ping INT,
  last_restart DATETIME NULL,
  next_restart DATETIME NULL,
  endpoint_status VARCHAR(40),
  database_status VARCHAR(40),
  discord_bot_status VARCHAR(40),
  website_api_status VARCHAR(40),
  firebase_status VARCHAR(40),
  streamer_live_checker_status VARCHAR(40),
  online_players_json JSON,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_uploads (
  id VARCHAR(64) PRIMARY KEY,
  owner_user_id VARCHAR(64),
  original_name VARCHAR(255),
  stored_name VARCHAR(255),
  mime_type VARCHAR(120),
  size_bytes BIGINT,
  url TEXT,
  storage_driver VARCHAR(40) DEFAULT 'local',
  metadata_json JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_media_uploads_owner (owner_user_id),
  INDEX idx_media_uploads_mime (mime_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
