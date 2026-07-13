SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS newspaper_settings (
  id VARCHAR(64) PRIMARY KEY,
  newspaper_name VARCHAR(160) NOT NULL DEFAULT 'The Gotham Gazette',
  motto VARCHAR(255) NULL,
  logo_url TEXT NULL,
  style_json JSON NULL,
  sound_url TEXT NULL,
  created_by VARCHAR(64) NULL,
  updated_by VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS newspaper_issues (
  id VARCHAR(64) PRIMARY KEY,
  issue_number VARCHAR(40) NOT NULL,
  name VARCHAR(190) NOT NULL,
  slug VARCHAR(190) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  publication_date DATETIME NULL,
  scheduled_at DATETIME NULL,
  cover_image_url TEXT NULL,
  settings_json JSON NULL,
  created_by VARCHAR(64) NULL,
  updated_by VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uniq_newspaper_issue_slug (slug),
  INDEX idx_newspaper_issue_status_date (status, publication_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS newspaper_pages (
  id VARCHAR(64) PRIMARY KEY,
  issue_id VARCHAR(64) NOT NULL,
  page_number INT NOT NULL,
  internal_label VARCHAR(120) NULL,
  section_name VARCHAR(100) NULL,
  template_key VARCHAR(80) NOT NULL DEFAULT 'standard',
  blocks_json JSON NULL,
  style_json JSON NULL,
  is_hidden TINYINT(1) NOT NULL DEFAULT 0,
  created_by VARCHAR(64) NULL,
  updated_by VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uniq_newspaper_issue_page (issue_id, page_number),
  INDEX idx_newspaper_page_issue (issue_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS newspaper_ads (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  advertiser VARCHAR(160) NULL,
  headline VARCHAR(255) NULL,
  body_text TEXT NULL,
  image_url TEXT NULL,
  link_url TEXT NULL,
  cta_text VARCHAR(120) NULL,
  format VARCHAR(60) NOT NULL DEFAULT 'small-column',
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  start_date DATETIME NULL,
  end_date DATETIME NULL,
  created_by VARCHAR(64) NULL,
  updated_by VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS newspaper_revisions (
  id VARCHAR(64) PRIMARY KEY,
  issue_id VARCHAR(64) NOT NULL,
  action VARCHAR(80) NOT NULL,
  snapshot_json JSON NOT NULL,
  created_by VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_newspaper_revision_issue (issue_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO newspaper_settings (id, newspaper_name, motto, style_json)
VALUES ('default', 'The Gotham Gazette', 'Truth in every edition', JSON_OBJECT(
  'paperColor', '#e8ddc4', 'inkColor', '#171512', 'accentColor', '#6b2525',
  'headlineFont', 'Georgia', 'bodyFont', 'Georgia', 'aging', 0.34,
  'pageTurnSpeed', 720, 'imageFilter', 'grayscale'
)) ON DUPLICATE KEY UPDATE id = id;
