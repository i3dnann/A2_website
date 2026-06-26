<?php
if (!defined('ABSPATH')) {
    exit;
}

function gotham_core_content_types() {
    return [
        'gotham_news' => ['News', 'News', 'dashicons-media-document'],
        'gotham_streamer' => ['Streamers', 'Streamer', 'dashicons-video-alt3'],
        'gotham_career' => ['Careers', 'Career', 'dashicons-businessperson'],
        'gotham_map_zone' => ['Map Zones', 'Map Zone', 'dashicons-location-alt'],
        'gotham_rule' => ['Rules', 'Rule Section', 'dashicons-clipboard'],
        'gotham_gallery' => ['Gallery', 'Gallery Item', 'dashicons-format-gallery'],
    ];
}

function gotham_core_register_post_types() {
    foreach (gotham_core_content_types() as $type => $args) {
        register_post_type($type, [
            'labels' => [
                'name' => $args[0],
                'singular_name' => $args[1],
                'add_new_item' => 'Add ' . $args[1],
                'edit_item' => 'Edit ' . $args[1],
            ],
            'public' => true,
            'show_ui' => true,
            'show_in_menu' => 'gotham-theme-editor',
            'menu_icon' => $args[2],
            'supports' => ['title', 'editor', 'thumbnail', 'excerpt', 'page-attributes'],
            'has_archive' => str_replace('gotham_', '', $type),
            'rewrite' => ['slug' => str_replace(['gotham_', '_'], ['', '-'], $type)],
            'show_in_rest' => true,
            'capability_type' => 'post',
        ]);
    }
    foreach (array_keys(gotham_core_content_types()) as $type) {
        register_post_meta($type, '_gotham_meta', [
            'type' => 'object',
            'single' => true,
            'show_in_rest' => true,
            'sanitize_callback' => 'gotham_core_sanitize_post_meta',
            'auth_callback' => fn() => current_user_can('edit_posts'),
        ]);
    }
}

function gotham_core_sanitize_post_meta($value) {
    return gotham_core_sanitize_repeater([is_array($value) ? $value : []])[0] ?? [];
}

add_action('add_meta_boxes', function () {
    foreach (array_keys(gotham_core_content_types()) as $type) {
        add_meta_box('gotham_meta_box', 'Gotham Bilingual Fields', 'gotham_core_render_meta_box', $type, 'normal', 'high');
    }
});

function gotham_core_render_meta_box($post) {
    wp_nonce_field('gotham_save_meta', 'gotham_meta_nonce');
    $meta = get_post_meta($post->ID, '_gotham_meta', true);
    $meta = is_array($meta) ? $meta : [];
    $fields = [
        'title_en' => 'Title EN',
        'title_ar' => 'Title AR',
        'subtitle_en' => 'Subtitle EN',
        'subtitle_ar' => 'Subtitle AR',
        'description_en' => 'Description EN',
        'description_ar' => 'Description AR',
        'button_text_en' => 'Button Text EN',
        'button_text_ar' => 'Button Text AR',
        'button_link' => 'Button Link',
        'image_url' => 'Image URL',
        'icon' => 'Icon',
        'video_url' => 'Video URL',
        'category' => 'Category / Type',
        'status' => 'Status',
        'color' => 'Color',
        'social_links' => 'Social Links JSON',
        'form_schema' => 'Form Fields JSON',
        'sort' => 'Sort Order',
        'visible' => 'Show Section',
        'featured' => 'Featured',
    ];
    echo '<div class="gotham-meta-grid">';
    foreach ($fields as $key => $label) {
        $value = $meta[$key] ?? '';
        $is_area = str_contains($key, 'description') || str_contains($key, 'schema') || str_contains($key, 'social');
        printf('<label><strong>%s</strong>', esc_html($label));
        if ($key === 'visible' || $key === 'featured') {
            printf('<input type="checkbox" name="gotham_meta[%s]" value="1" %s></label>', esc_attr($key), checked($value, 1, false));
        } elseif ($is_area) {
            printf('<textarea name="gotham_meta[%s]" rows="4">%s</textarea></label>', esc_attr($key), esc_textarea($value));
        } else {
            printf('<input type="text" name="gotham_meta[%s]" value="%s"></label>', esc_attr($key), esc_attr($value));
        }
    }
    echo '</div>';
}

add_action('save_post', function ($post_id) {
    if (!isset($_POST['gotham_meta_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['gotham_meta_nonce'])), 'gotham_save_meta')) {
        return;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    $raw = isset($_POST['gotham_meta']) ? wp_unslash($_POST['gotham_meta']) : [];
    $clean = gotham_core_sanitize_repeater([$raw])[0] ?? [];
    update_post_meta($post_id, '_gotham_meta', $clean);
}, 10, 1);

function gotham_query_items($post_type, $limit = 12, $featured = null) {
    $meta_query = [
        [
            'key' => '_gotham_meta',
            'compare' => 'EXISTS',
        ],
    ];
    $query = new WP_Query([
        'post_type' => $post_type,
        'posts_per_page' => $limit,
        'post_status' => 'publish',
        'orderby' => ['menu_order' => 'ASC', 'date' => 'DESC'],
    ]);
    $items = [];
    foreach ($query->posts as $post) {
        $meta = get_post_meta($post->ID, '_gotham_meta', true);
        $meta = is_array($meta) ? $meta : [];
        if (isset($meta['visible']) && !$meta['visible']) {
            continue;
        }
        if ($featured !== null && intval($meta['featured'] ?? 0) !== intval($featured)) {
            continue;
        }
        $items[] = ['post' => $post, 'meta' => $meta];
    }
    wp_reset_postdata();
    return $items;
}
