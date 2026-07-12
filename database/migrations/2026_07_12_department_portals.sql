-- Department portals for EMS, Police, and FIB.
-- Safe to run repeatedly on an existing Gotham database.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  short_name VARCHAR(40) NOT NULL,
  description TEXT,
  logo_url TEXT,
  header_image_url TEXT,
  accent_style VARCHAR(40) DEFAULT 'purple',
  is_published TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_departments_slug (slug),
  INDEX idx_departments_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS department_ranks (
  id VARCHAR(64) PRIMARY KEY,
  department_id VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  short_name VARCHAR(40),
  hierarchy_level INT DEFAULT 0,
  description TEXT,
  image_url TEXT,
  display_order INT DEFAULT 9999,
  is_active TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uniq_department_rank_name (department_id, name),
  INDEX idx_department_ranks_department (department_id),
  INDEX idx_department_ranks_active (department_id, is_active),
  CONSTRAINT fk_department_ranks_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS department_wings (
  id VARCHAR(64) PRIMARY KEY,
  department_id VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  short_code VARCHAR(40),
  description TEXT,
  image_url TEXT,
  display_order INT DEFAULT 9999,
  is_active TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uniq_department_wing_name (department_id, name),
  INDEX idx_department_wings_department (department_id),
  INDEX idx_department_wings_active (department_id, is_active),
  CONSTRAINT fk_department_wings_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS department_memberships (
  id VARCHAR(64) PRIMARY KEY,
  department_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64),
  discord_user_id VARCHAR(32),
  discord_username VARCHAR(120),
  display_name VARCHAR(160),
  membership_role VARCHAR(40) DEFAULT 'member',
  employment_status VARCHAR(40) DEFAULT 'Active',
  character_name VARCHAR(160),
  unit_code VARCHAR(40),
  rank_id VARCHAR(64),
  primary_wing_id VARCHAR(64),
  profile_image_url TEXT,
  public_biography TEXT,
  display_order INT DEFAULT 9999,
  hired_at DATETIME NULL,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uniq_department_membership_user (department_id, user_id),
  UNIQUE KEY uniq_department_membership_discord (department_id, discord_user_id),
  UNIQUE KEY uniq_department_unit_code (department_id, unit_code),
  INDEX idx_department_members_department (department_id),
  INDEX idx_department_members_status (department_id, employment_status),
  INDEX idx_department_members_rank (rank_id),
  INDEX idx_department_members_unit (department_id, unit_code),
  CONSTRAINT fk_department_members_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  CONSTRAINT fk_department_members_rank FOREIGN KEY (rank_id) REFERENCES department_ranks(id) ON DELETE SET NULL,
  CONSTRAINT fk_department_members_primary_wing FOREIGN KEY (primary_wing_id) REFERENCES department_wings(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS department_membership_wings (
  membership_id VARCHAR(64) NOT NULL,
  wing_id VARCHAR(64) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (membership_id, wing_id),
  INDEX idx_department_membership_wings_wing (wing_id),
  CONSTRAINT fk_department_membership_wings_member FOREIGN KEY (membership_id) REFERENCES department_memberships(id) ON DELETE CASCADE,
  CONSTRAINT fk_department_membership_wings_wing FOREIGN KEY (wing_id) REFERENCES department_wings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS department_uniforms (
  id VARCHAR(64) PRIMARY KEY,
  department_id VARCHAR(64) NOT NULL,
  category VARCHAR(120),
  title VARCHAR(160) NOT NULL,
  description TEXT,
  image_url TEXT,
  storage_key VARCHAR(255),
  gender VARCHAR(40),
  component_data JSON,
  display_order INT DEFAULT 9999,
  is_published TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_department_uniforms_department (department_id),
  INDEX idx_department_uniforms_published (department_id, is_published),
  INDEX idx_department_uniforms_category (department_id, category),
  CONSTRAINT fk_department_uniforms_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS department_vehicles (
  id VARCHAR(64) PRIMARY KEY,
  department_id VARCHAR(64) NOT NULL,
  name VARCHAR(160) NOT NULL,
  model_code VARCHAR(80),
  category VARCHAR(120),
  description TEXT,
  image_url TEXT,
  storage_key VARCHAR(255),
  minimum_rank_id VARCHAR(64),
  required_wing_id VARCHAR(64),
  display_order INT DEFAULT 9999,
  is_published TINYINT(1) DEFAULT 1,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_department_vehicles_department (department_id),
  INDEX idx_department_vehicles_published (department_id, is_published),
  INDEX idx_department_vehicles_category (department_id, category),
  CONSTRAINT fk_department_vehicles_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  CONSTRAINT fk_department_vehicles_rank FOREIGN KEY (minimum_rank_id) REFERENCES department_ranks(id) ON DELETE SET NULL,
  CONSTRAINT fk_department_vehicles_wing FOREIGN KEY (required_wing_id) REFERENCES department_wings(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS department_role_assignments (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  department_id VARCHAR(64) NOT NULL,
  role VARCHAR(40) NOT NULL,
  assigned_by VARCHAR(64),
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  removed_by VARCHAR(64),
  removed_at DATETIME NULL,
  INDEX idx_department_roles_user (user_id, removed_at),
  INDEX idx_department_roles_department (department_id, role, removed_at),
  CONSTRAINT fk_department_roles_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS department_audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  department_id VARCHAR(64) NOT NULL,
  actor_user_id VARCHAR(64),
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(64),
  before_data MEDIUMTEXT,
  after_data MEDIUMTEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_department_audit_department (department_id, created_at),
  INDEX idx_department_audit_actor (actor_user_id),
  CONSTRAINT fk_department_audit_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO departments (id, slug, name, short_name, description, accent_style, is_published)
VALUES
  ('dept-ems', 'ems', 'EMS / Ambulance Department', 'EMS', 'Medical response, rescue coordination, and public care across Gotham City.', 'ems', 1),
  ('dept-police', 'police', 'Police Department', 'Police', 'Law enforcement, public safety, investigations, and city patrol operations.', 'police', 1),
  ('dept-fib', 'fib', 'FIB Department', 'FIB', 'Federal investigations, intelligence-led operations, and high-risk case coordination.', 'fib', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  short_name = VALUES(short_name),
  description = VALUES(description),
  accent_style = VALUES(accent_style),
  is_published = VALUES(is_published),
  updated_at = CURRENT_TIMESTAMP;
