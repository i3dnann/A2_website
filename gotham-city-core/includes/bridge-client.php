<?php
if (!defined('ABSPATH')) {
    exit;
}

function gotham_bridge_config() {
    $settings = gotham_get_settings();
    $url = defined('GOTHAM_API_BRIDGE_URL') ? GOTHAM_API_BRIDGE_URL : ($settings['api_bridge_url'] ?? '');
    $key = defined('GOTHAM_API_BRIDGE_KEY') ? GOTHAM_API_BRIDGE_KEY : ($settings['api_bridge_key'] ?? '');
    return ['url' => untrailingslashit($url), 'key' => $key];
}

function gotham_bridge_request($path, $args = []) {
    $config = gotham_bridge_config();
    if (!$config['url'] || !$config['key']) {
        return ['ok' => false, 'error' => 'bridge_not_configured'];
    }
    $response = wp_remote_request($config['url'] . '/' . ltrim($path, '/'), wp_parse_args($args, [
        'timeout' => 10,
        'headers' => [
            'Accept' => 'application/json',
            'X-API-Key' => $config['key'],
        ],
    ]));
    if (is_wp_error($response)) {
        return ['ok' => false, 'error' => $response->get_error_message()];
    }
    $body = json_decode(wp_remote_retrieve_body($response), true);
    return is_array($body) ? $body : ['ok' => false, 'error' => 'invalid_bridge_response'];
}
