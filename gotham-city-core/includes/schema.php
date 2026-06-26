<?php
if (!defined('ABSPATH')) {
    exit;
}

function gotham_core_create_tables() {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $charset = $wpdb->get_charset_collate();
    $tickets = $wpdb->prefix . 'gotham_tickets';
    $messages = $wpdb->prefix . 'gotham_ticket_messages';
    $applications = $wpdb->prefix . 'gotham_applications';
    $audit = $wpdb->prefix . 'gotham_audit_logs';
    dbDelta("CREATE TABLE $tickets (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        ticket_number VARCHAR(40) NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
        category VARCHAR(120) NOT NULL DEFAULT '',
        subject VARCHAR(190) NOT NULL DEFAULT '',
        status VARCHAR(40) NOT NULL DEFAULT 'open',
        priority VARCHAR(40) NOT NULL DEFAULT 'normal',
        discord_id VARCHAR(80) NOT NULL DEFAULT '',
        steam_id VARCHAR(80) NOT NULL DEFAULT '',
        citizenid VARCHAR(80) NOT NULL DEFAULT '',
        ip VARCHAR(80) NOT NULL DEFAULT '',
        user_agent TEXT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        closed_at DATETIME NULL,
        PRIMARY KEY (id),
        KEY user_id (user_id),
        KEY status (status)
    ) $charset;");
    dbDelta("CREATE TABLE $messages (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        ticket_id BIGINT UNSIGNED NOT NULL,
        author_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
        author_type VARCHAR(30) NOT NULL DEFAULT 'user',
        message LONGTEXT NOT NULL,
        internal_only TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id),
        KEY ticket_id (ticket_id)
    ) $charset;");
    dbDelta("CREATE TABLE $applications (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        job_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
        user_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
        answers LONGTEXT NULL,
        status VARCHAR(40) NOT NULL DEFAULT 'submitted',
        reviewer_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
        notes LONGTEXT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        PRIMARY KEY (id),
        KEY job_id (job_id),
        KEY user_id (user_id)
    ) $charset;");
    dbDelta("CREATE TABLE $audit (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
        action VARCHAR(120) NOT NULL,
        target_type VARCHAR(80) NOT NULL DEFAULT '',
        target_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
        message TEXT NULL,
        ip VARCHAR(80) NOT NULL DEFAULT '',
        user_agent TEXT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id),
        KEY action (action),
        KEY user_id (user_id)
    ) $charset;");
}

function gotham_core_insert_audit($action, $target_type = '', $target_id = 0, $message = '') {
    global $wpdb;
    $wpdb->insert($wpdb->prefix . 'gotham_audit_logs', [
        'user_id' => get_current_user_id(),
        'action' => sanitize_key($action),
        'target_type' => sanitize_text_field($target_type),
        'target_id' => absint($target_id),
        'message' => sanitize_textarea_field($message),
        'ip' => sanitize_text_field($_SERVER['REMOTE_ADDR'] ?? ''),
        'user_agent' => sanitize_textarea_field($_SERVER['HTTP_USER_AGENT'] ?? ''),
        'created_at' => current_time('mysql'),
    ]);
}
