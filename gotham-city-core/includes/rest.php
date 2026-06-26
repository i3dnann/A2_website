<?php
if (!defined('ABSPATH')) {
    exit;
}

function gotham_core_register_rest_routes() {
    register_rest_route('gotham/v1', '/settings', [
        'methods' => 'GET',
        'callback' => fn() => rest_ensure_response(['settings' => gotham_get_settings(), 'sections' => gotham_get_sections()]),
        'permission_callback' => '__return_true',
    ]);
    register_rest_route('gotham/v1', '/ticket', [
        'methods' => 'POST',
        'callback' => 'gotham_core_rest_create_ticket',
        'permission_callback' => fn() => is_user_logged_in(),
    ]);
    register_rest_route('gotham/v1', '/bridge/health', [
        'methods' => 'GET',
        'callback' => fn() => rest_ensure_response(gotham_bridge_request('/health')),
        'permission_callback' => fn() => current_user_can('manage_options'),
    ]);
}

function gotham_core_rest_create_ticket(WP_REST_Request $request) {
    global $wpdb;
    $settings = gotham_get_settings();
    if (empty($settings['enable_tickets'])) {
        return new WP_Error('tickets_disabled', 'Tickets are currently disabled.', ['status' => 403]);
    }
    $subject = sanitize_text_field($request->get_param('subject'));
    $message = sanitize_textarea_field($request->get_param('message'));
    $category = sanitize_text_field($request->get_param('category'));
    if (!$subject || !$message) {
        return new WP_Error('missing_fields', 'Subject and message are required.', ['status' => 400]);
    }
    $now = current_time('mysql');
    $number = 'GC-' . gmdate('Ymd') . '-' . wp_rand(1000, 9999);
    $wpdb->insert($wpdb->prefix . 'gotham_tickets', [
        'ticket_number' => $number,
        'user_id' => get_current_user_id(),
        'category' => $category ?: 'General support',
        'subject' => $subject,
        'status' => 'open',
        'priority' => 'normal',
        'ip' => sanitize_text_field($_SERVER['REMOTE_ADDR'] ?? ''),
        'user_agent' => sanitize_textarea_field($_SERVER['HTTP_USER_AGENT'] ?? ''),
        'created_at' => $now,
        'updated_at' => $now,
    ]);
    $ticket_id = (int) $wpdb->insert_id;
    $wpdb->insert($wpdb->prefix . 'gotham_ticket_messages', [
        'ticket_id' => $ticket_id,
        'author_id' => get_current_user_id(),
        'author_type' => 'user',
        'message' => $message,
        'internal_only' => 0,
        'created_at' => $now,
    ]);
    gotham_core_insert_audit('ticket_created', 'ticket', $ticket_id, $subject);
    return rest_ensure_response(['ok' => true, 'ticket_id' => $ticket_id, 'ticket_number' => $number]);
}
