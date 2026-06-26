<?php
if (!defined('ABSPATH')) {
    exit;
}

function gotham_core_register_shortcodes() {
    add_shortcode('gotham_ticket_form', 'gotham_ticket_form_shortcode');
}

add_action('init', 'gotham_ticket_form_handle_post');

function gotham_ticket_form_handle_post() {
    if (empty($_POST['gotham_ticket_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['gotham_ticket_nonce'])), 'gotham_ticket_form')) {
        return;
    }
    if (!is_user_logged_in()) {
        return;
    }
    $request = new WP_REST_Request('POST', '/gotham/v1/ticket');
    $request->set_param('category', isset($_POST['gotham_ticket_category']) ? sanitize_text_field(wp_unslash($_POST['gotham_ticket_category'])) : '');
    $request->set_param('subject', isset($_POST['gotham_ticket_subject']) ? sanitize_text_field(wp_unslash($_POST['gotham_ticket_subject'])) : '');
    $request->set_param('message', isset($_POST['gotham_ticket_message']) ? sanitize_textarea_field(wp_unslash($_POST['gotham_ticket_message'])) : '');
    $response = gotham_core_rest_create_ticket($request);
    if (is_wp_error($response)) {
        set_transient('gotham_ticket_notice_' . get_current_user_id(), ['type' => 'error', 'message' => $response->get_error_message()], MINUTE_IN_SECONDS);
    } else {
        $data = $response->get_data();
        set_transient('gotham_ticket_notice_' . get_current_user_id(), ['type' => 'success', 'message' => 'Ticket opened: ' . ($data['ticket_number'] ?? '')], MINUTE_IN_SECONDS);
    }
    wp_safe_redirect(wp_get_referer() ?: home_url('/tickets/'));
    exit;
}

function gotham_ticket_form_shortcode() {
    if (!is_user_logged_in()) {
        return '<p>' . esc_html(gotham_text(gotham_get_section('tickets', 'hero') ?: [], 'description', 'Please login before opening a ticket.')) . '</p>';
    }
    ob_start();
    $notice = get_transient('gotham_ticket_notice_' . get_current_user_id());
    delete_transient('gotham_ticket_notice_' . get_current_user_id());
    if ($notice) {
        printf('<p class="gotham-ticket-notice gotham-ticket-%s">%s</p>', esc_attr($notice['type']), esc_html($notice['message']));
    }
    ?>
    <form class="gotham-ticket-form" method="post">
        <?php wp_nonce_field('gotham_ticket_form', 'gotham_ticket_nonce'); ?>
        <label><?php esc_html_e('Category', 'gotham-city-core'); ?><input name="gotham_ticket_category" required></label>
        <label><?php esc_html_e('Subject', 'gotham-city-core'); ?><input name="gotham_ticket_subject" required></label>
        <label><?php esc_html_e('Message', 'gotham-city-core'); ?><textarea name="gotham_ticket_message" required></textarea></label>
        <button class="gotham-button" type="submit"><?php esc_html_e('Submit ticket', 'gotham-city-core'); ?></button>
    </form>
    <?php
    return ob_get_clean();
}
