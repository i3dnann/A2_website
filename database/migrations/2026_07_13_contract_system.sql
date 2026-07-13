-- Secure dual-signature roleplay contract system.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS contracts (
  id VARCHAR(64) PRIMARY KEY,
  contract_number VARCHAR(40) NOT NULL,
  verification_code VARCHAR(96) NOT NULL,
  title VARCHAR(190) NOT NULL,
  contract_type VARCHAR(60) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Draft',
  current_version INT NOT NULL DEFAULT 1,
  created_by_user_id VARCHAR(64) NOT NULL,
  effective_date DATE NULL,
  expiration_date DATETIME NULL,
  completed_at DATETIME NULL,
  archived_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  cancelled_by_user_id VARCHAR(64) NULL,
  cancellation_reason TEXT NULL,
  voided_at DATETIME NULL,
  voided_by_user_id VARCHAR(64) NULL,
  void_reason TEXT NULL,
  public_verification_enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_contract_number (contract_number),
  UNIQUE KEY uniq_verification_code (verification_code),
  INDEX idx_contract_status (status),
  INDEX idx_contract_type (contract_type),
  INDEX idx_contract_creator (created_by_user_id),
  INDEX idx_contract_effective (effective_date),
  INDEX idx_contract_expiration (expiration_date),
  INDEX idx_contract_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contract_versions (
  id VARCHAR(64) PRIMARY KEY,
  contract_id VARCHAR(64) NOT NULL,
  version_number INT NOT NULL,
  document_snapshot JSON NULL,
  document_hash CHAR(64) NULL,
  content_json JSON NOT NULL,
  internal_admin_notes TEXT NULL,
  created_by_user_id VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  superseded_at DATETIME NULL,
  UNIQUE KEY uniq_contract_version (contract_id, version_number),
  CONSTRAINT fk_contract_version_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contract_parties (
  id VARCHAR(64) PRIMARY KEY,
  contract_id VARCHAR(64) NOT NULL,
  contract_version_id VARCHAR(64) NOT NULL,
  party_position ENUM('PARTY_A','PARTY_B') NOT NULL,
  party_type VARCHAR(40) NOT NULL,
  organization_id VARCHAR(64) NULL,
  character_id VARCHAR(64) NULL,
  display_name VARCHAR(190) NOT NULL,
  registration_identifier VARCHAR(120) NULL,
  logo_url TEXT NULL,
  logo_storage_key VARCHAR(255) NULL,
  representative_user_id VARCHAR(64) NOT NULL,
  representative_character_id VARCHAR(64) NULL,
  representative_name VARCHAR(190) NOT NULL,
  representative_role VARCHAR(160) NULL,
  contact_information TEXT NULL,
  address TEXT NULL,
  exceptional_dual_signer_override TINYINT(1) NOT NULL DEFAULT 0,
  override_reason TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_contract_party_position (contract_version_id, party_position),
  INDEX idx_party_org (organization_id),
  INDEX idx_party_signer (representative_user_id),
  CONSTRAINT fk_contract_party_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  CONSTRAINT fk_contract_party_version FOREIGN KEY (contract_version_id) REFERENCES contract_versions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contract_clauses (
  id VARCHAR(64) PRIMARY KEY,
  contract_version_id VARCHAR(64) NOT NULL,
  clause_number VARCHAR(20) NOT NULL,
  title VARCHAR(190) NOT NULL,
  content MEDIUMTEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_clause_version_order (contract_version_id, sort_order),
  CONSTRAINT fk_contract_clause_version FOREIGN KEY (contract_version_id) REFERENCES contract_versions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contract_signatures (
  id VARCHAR(64) PRIMARY KEY,
  contract_id VARCHAR(64) NOT NULL,
  contract_version_id VARCHAR(64) NOT NULL,
  party_id VARCHAR(64) NOT NULL,
  signer_user_id VARCHAR(64) NOT NULL,
  signer_character_id VARCHAR(64) NULL,
  signer_character_name VARCHAR(190) NOT NULL,
  signer_role VARCHAR(160) NULL,
  signature_method ENUM('typed','drawn') NOT NULL,
  typed_signature VARCHAR(190) NULL,
  drawn_signature_data MEDIUMTEXT NULL,
  signed_document_hash CHAR(64) NOT NULL,
  consent_text_version VARCHAR(40) NOT NULL,
  signed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME NULL,
  revocation_reason TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_active_party_signature (contract_version_id, party_id),
  INDEX idx_signature_signer (signer_user_id),
  CONSTRAINT fk_signature_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  CONSTRAINT fk_signature_version FOREIGN KEY (contract_version_id) REFERENCES contract_versions(id) ON DELETE CASCADE,
  CONSTRAINT fk_signature_party FOREIGN KEY (party_id) REFERENCES contract_parties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contract_attachments (
  id VARCHAR(64) PRIMARY KEY, contract_id VARCHAR(64) NOT NULL, contract_version_id VARCHAR(64) NOT NULL,
  original_filename VARCHAR(255) NOT NULL, safe_filename VARCHAR(255) NOT NULL, storage_key VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL, mime_type VARCHAR(120) NOT NULL, file_size BIGINT NOT NULL, file_hash CHAR(64) NOT NULL,
  uploaded_by_user_id VARCHAR(64) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_attachment_contract (contract_id),
  CONSTRAINT fk_attachment_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  CONSTRAINT fk_attachment_version FOREIGN KEY (contract_version_id) REFERENCES contract_versions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contract_audit_events (
  id VARCHAR(64) PRIMARY KEY, contract_id VARCHAR(64) NOT NULL, contract_version_id VARCHAR(64) NULL,
  actor_user_id VARCHAR(64) NULL, actor_character_id VARCHAR(64) NULL, action VARCHAR(80) NOT NULL,
  metadata JSON NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contract_audit (contract_id, created_at),
  CONSTRAINT fk_audit_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contract_pdf_files (
  id VARCHAR(64) PRIMARY KEY, contract_id VARCHAR(64) NOT NULL, contract_version_id VARCHAR(64) NOT NULL,
  storage_key VARCHAR(255) NOT NULL, file_url TEXT NOT NULL, file_hash CHAR(64) NOT NULL,
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, generated_by_user_id VARCHAR(64) NULL,
  UNIQUE KEY uniq_contract_version_pdf (contract_version_id),
  CONSTRAINT fk_pdf_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  CONSTRAINT fk_pdf_version FOREIGN KEY (contract_version_id) REFERENCES contract_versions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
