<?php
/**
 * Plugin Name: Gotham City Core
 * Description: Custom content, admin editor, tickets, applications, webhooks, and FiveM bridge client for Gotham City Theme.
 * Version: 1.0.0
 * Author: A2 Studio
 * Text Domain: gotham-city-core
 */

if (!defined('ABSPATH')) {
    exit;
}

define('GOTHAM_CORE_VERSION', '1.0.0');
define('GOTHAM_CORE_FILE', __FILE__);
define('GOTHAM_CORE_PATH', plugin_dir_path(__FILE__));
define('GOTHAM_CORE_URL', plugin_dir_url(__FILE__));

require_once GOTHAM_CORE_PATH . 'includes/schema.php';
require_once GOTHAM_CORE_PATH . 'includes/content.php';
require_once GOTHAM_CORE_PATH . 'includes/post-types.php';
require_once GOTHAM_CORE_PATH . 'includes/admin-editor.php';
require_once GOTHAM_CORE_PATH . 'includes/rest.php';
require_once GOTHAM_CORE_PATH . 'includes/bridge-client.php';
require_once GOTHAM_CORE_PATH . 'includes/shortcodes.php';

register_activation_hook(__FILE__, 'gotham_core_activate');

function gotham_core_activate() {
    gotham_core_register_post_types();
    gotham_core_create_tables();
    gotham_core_seed_defaults();
    flush_rewrite_rules();
}

add_action('init', 'gotham_core_register_post_types');
add_action('init', 'gotham_core_register_shortcodes');
add_action('admin_menu', 'gotham_core_register_admin_editor');
add_action('admin_enqueue_scripts', 'gotham_core_admin_assets');
add_action('rest_api_init', 'gotham_core_register_rest_routes');

function gotham_core_admin_assets($hook) {
    if ($hook !== 'toplevel_page_gotham-theme-editor') {
        return;
    }
    wp_enqueue_media();
    wp_enqueue_style('gotham-core-admin', GOTHAM_CORE_URL . 'assets/admin.css', [], GOTHAM_CORE_VERSION);
    wp_enqueue_script('gotham-core-admin', GOTHAM_CORE_URL . 'assets/admin.js', ['jquery'], GOTHAM_CORE_VERSION, true);
}

add_action('wp_head', function () {
    $settings = gotham_get_settings();
    $colors = [
        '--gotham-primary' => $settings['primary_color'],
        '--gotham-secondary' => $settings['secondary_color'],
        '--gotham-accent' => $settings['accent_color'],
        '--gotham-bg' => $settings['background_color'],
        '--gotham-card' => $settings['card_background'],
        '--gotham-border' => $settings['border_color'],
        '--gotham-text' => $settings['text_color'],
        '--gotham-muted' => $settings['muted_text_color'],
    ];
    echo '<style id="gotham-dynamic-colors">:root{';
    foreach ($colors as $name => $value) {
        printf('%s:%s;', esc_html($name), esc_html($value));
    }
    echo '}</style>';
}, 20);

add_action('template_redirect', function () {
    $settings = gotham_get_settings();
    if (empty($settings['maintenance_mode']) || current_user_can('manage_options') || is_admin()) {
        return;
    }
    status_header(503);
    nocache_headers();
    include GOTHAM_CORE_PATH . 'maintenance-template.php';
    exit;
});
