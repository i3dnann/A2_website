<?php
if (!defined('ABSPATH')) {
    exit;
}

function gotham_core_register_admin_editor() {
    add_menu_page(
        'Gotham City Theme Editor',
        'Gotham City Theme Editor',
        'manage_options',
        'gotham-theme-editor',
        'gotham_core_render_admin_editor',
        'dashicons-admin-customizer',
        3
    );

    add_submenu_page(
        'gotham-theme-editor',
        'Theme Editor',
        'Theme Editor',
        'manage_options',
        'gotham-theme-editor',
        'gotham_core_render_admin_editor'
    );
}

function gotham_core_editor_tabs() {
    return [
        'global' => 'Global Settings',
        'header' => 'Header',
        'footer' => 'Footer',
        'home' => 'Home Page',
        'live' => 'Live Page',
        'roster' => 'Roster Page',
        'news' => 'News Page',
        'careers' => 'Careers Page',
        'map' => 'Map Page',
        'rules' => 'Rules Page',
        'gallery' => 'Gallery Page',
        'tickets' => 'Tickets Page',
        'auth' => 'Auth Pages',
        'dashboard' => 'Dashboard Page',
        'terms_privacy' => 'Terms / Privacy',
        'maintenance' => 'Maintenance Page',
        'seo' => 'SEO / Social Preview',
        'style' => 'Colors / Styling',
        'language' => 'Arabic / English Content',
    ];
}

function gotham_core_render_admin_editor() {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('You do not have permission to manage Gotham settings.', 'gotham-city-core'));
    }
    if (isset($_POST['gotham_editor_nonce']) && wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['gotham_editor_nonce'])), 'gotham_save_editor')) {
        $settings = isset($_POST['gotham_settings']) ? wp_unslash($_POST['gotham_settings']) : [];
        $sections = isset($_POST['gotham_sections']) ? wp_unslash($_POST['gotham_sections']) : [];
        update_option('gotham_theme_settings', gotham_core_sanitize_settings($settings), false);
        update_option('gotham_theme_sections', gotham_core_sanitize_sections($sections), false);
        gotham_core_insert_audit('theme_editor_saved', 'options', 0, 'Gotham City Theme Editor saved.');
        echo '<div class="notice notice-success"><p>Gotham City Theme Editor saved.</p></div>';
    }
    $settings = gotham_get_settings();
    $sections = gotham_get_sections();
    $tabs = gotham_core_editor_tabs();
    echo '<div class="wrap gotham-editor"><h1>Gotham City Theme Editor</h1>';
    echo '<p class="description">Manage all public text, images, links, sections, messages, and bilingual content from one panel. Repeatable content like news, streamers, jobs, rules, map zones, and gallery items can also be managed from the submenu post managers.</p>';
    echo '<form method="post">';
    wp_nonce_field('gotham_save_editor', 'gotham_editor_nonce');
    echo '<nav class="gotham-tabs">';
    foreach ($tabs as $key => $label) {
        printf('<a href="#tab-%s">%s</a>', esc_attr($key), esc_html($label));
    }
    echo '</nav>';
    foreach ($tabs as $key => $label) {
        printf('<section id="tab-%s" class="gotham-tab-panel"><h2>%s</h2>', esc_attr($key), esc_html($label));
        if ($key === 'global') {
            gotham_core_render_settings_fields($settings, ['website_name', 'discord_invite', 'server_connect_link', 'contact_email', 'enable_registration', 'enable_tickets', 'enable_careers', 'enable_gallery', 'enable_fivem_features', 'api_bridge_url', 'api_bridge_key']);
        } elseif ($key === 'header') {
            gotham_core_render_settings_fields($settings, ['logo_id', 'favicon_id']);
            gotham_core_render_repeater('gotham_settings[header_links]', $settings['header_links'], ['label_en', 'label_ar', 'url', 'visible', 'sort']);
        } elseif ($key === 'footer') {
            gotham_core_render_settings_fields($settings, ['footer_text_en', 'footer_text_ar', 'copyright_text_en', 'copyright_text_ar']);
            gotham_core_render_repeater('gotham_settings[footer_links]', $settings['footer_links'], ['label_en', 'label_ar', 'url', 'visible', 'sort']);
            gotham_core_render_repeater('gotham_settings[social_links]', $settings['social_links'], ['label', 'url', 'icon', 'visible', 'sort']);
        } elseif ($key === 'seo') {
            gotham_core_render_settings_fields($settings, ['default_seo_title_en', 'default_seo_title_ar', 'default_seo_description_en', 'default_seo_description_ar', 'og_image_id']);
        } elseif ($key === 'style') {
            gotham_core_render_settings_fields($settings, ['primary_color', 'secondary_color', 'accent_color', 'background_color', 'card_background', 'border_color', 'text_color', 'muted_text_color', 'font_family', 'button_style', 'card_style', 'background_style']);
        } elseif ($key === 'maintenance') {
            echo '<p class="description">Use image/video IDs from the Media Library, or paste direct video/audio links from any external source that allows embedding/hotlinking. External links override uploaded media IDs.</p>';
            gotham_core_render_settings_fields($settings, ['maintenance_mode', 'maintenance_headline_en', 'maintenance_headline_ar', 'maintenance_message_en', 'maintenance_message_ar', 'maintenance_background_id', 'maintenance_background_video_id', 'maintenance_video_url', 'maintenance_audio_id', 'maintenance_audio_url', 'maintenance_countdown']);
            gotham_core_render_page_sections($sections, 'maintenance');
        } elseif ($key === 'language') {
            echo '<p>Every section has English and Arabic fields. Use the page tabs above for page-specific translation content. The frontend language switcher reads these saved fields and enables RTL for Arabic.</p>';
            gotham_core_render_page_sections($sections, 'home');
            gotham_core_render_page_sections($sections, 'auth');
        } else {
            gotham_core_render_page_sections($sections, $key);
        }
        echo '</section>';
    }
    submit_button('Save Gotham City Theme Editor');
    echo '</form></div>';
}

function gotham_core_render_settings_fields($settings, $keys) {
    echo '<div class="gotham-field-grid">';
    foreach ($keys as $key) {
        $value = $settings[$key] ?? '';
        $label = ucwords(str_replace('_', ' ', $key));
        printf('<label><strong>%s</strong>', esc_html($label));
        if (str_ends_with($key, '_id')) {
            printf('<div class="gotham-media-field"><input type="number" name="gotham_settings[%s]" value="%s"><button type="button" class="button gotham-pick-media">Pick media</button></div>', esc_attr($key), esc_attr($value));
            if (str_contains($key, 'video')) {
                echo '<small>Choose an uploaded video file such as MP4, WebM, MOV, or M4V.</small>';
            } elseif (str_contains($key, 'audio')) {
                echo '<small>Choose an uploaded audio file such as MP3, WAV, OGG, M4A, FLAC, or AAC.</small>';
            }
        } elseif (str_contains($key, 'color')) {
            printf('<input type="color" name="gotham_settings[%s]" value="%s">', esc_attr($key), esc_attr($value));
        } elseif (str_starts_with($key, 'enable_') || str_ends_with($key, '_mode')) {
            printf('<input type="checkbox" name="gotham_settings[%s]" value="1" %s>', esc_attr($key), checked($value, 1, false));
        } elseif (str_contains($key, 'description') || str_contains($key, 'message') || str_contains($key, 'text')) {
            printf('<textarea name="gotham_settings[%s]" rows="3">%s</textarea>', esc_attr($key), esc_textarea($value));
        } elseif (str_contains($key, 'url') || str_contains($key, 'link')) {
            printf('<input type="url" name="gotham_settings[%s]" value="%s" placeholder="https://">', esc_attr($key), esc_attr($value));
        } else {
            printf('<input type="text" name="gotham_settings[%s]" value="%s">', esc_attr($key), esc_attr($value));
        }
        echo '</label>';
    }
    echo '</div>';
}

function gotham_core_render_page_sections($sections, $page) {
    $page_sections = array_filter($sections, fn($section) => ($section['page'] ?? '') === $page);
    uasort($page_sections, fn($a, $b) => intval($a['sort'] ?? 0) <=> intval($b['sort'] ?? 0));
    echo '<div class="gotham-sections">';
    foreach ($page_sections as $key => $section) {
        printf('<details open class="gotham-section"><summary>%s</summary>', esc_html($section['title_en'] ?: $section['slug']));
        foreach (['page', 'slug'] as $hidden) {
            printf('<input type="hidden" name="gotham_sections[%s][%s]" value="%s">', esc_attr($key), esc_attr($hidden), esc_attr($section[$hidden] ?? ''));
        }
        echo '<div class="gotham-field-grid">';
        foreach (['title_en', 'title_ar', 'subtitle_en', 'subtitle_ar', 'description_en', 'description_ar', 'button_text_en', 'button_text_ar', 'button_link', 'image_id', 'icon', 'video_url', 'sort', 'visible', 'featured'] as $field) {
            $value = $section[$field] ?? '';
            printf('<label><strong>%s</strong>', esc_html(ucwords(str_replace('_', ' ', $field))));
            if (in_array($field, ['visible', 'featured'], true)) {
                printf('<input type="checkbox" name="gotham_sections[%s][%s]" value="1" %s>', esc_attr($key), esc_attr($field), checked($value, 1, false));
            } elseif ($field === 'description_en' || $field === 'description_ar') {
                printf('<textarea name="gotham_sections[%s][%s]" rows="4">%s</textarea>', esc_attr($key), esc_attr($field), esc_textarea($value));
            } elseif ($field === 'image_id') {
                printf('<div class="gotham-media-field"><input type="number" name="gotham_sections[%s][%s]" value="%s"><button type="button" class="button gotham-pick-media">Pick media</button></div>', esc_attr($key), esc_attr($field), esc_attr($value));
            } else {
                printf('<input type="text" name="gotham_sections[%s][%s]" value="%s">', esc_attr($key), esc_attr($field), esc_attr($value));
            }
            echo '</label>';
        }
        echo '</div><h3>Repeatable Cards / Messages / Items</h3>';
        gotham_core_render_repeater(sprintf('gotham_sections[%s][items]', esc_attr($key)), $section['items'] ?? [], ['title_en', 'title_ar', 'description_en', 'description_ar', 'button_text_en', 'button_text_ar', 'button_link', 'image_url', 'icon', 'visible', 'featured', 'sort']);
        echo '</details>';
    }
    echo '</div>';
}

function gotham_core_render_repeater($name, $rows, $fields) {
    echo '<div class="gotham-repeater" data-fields="' . esc_attr(wp_json_encode($fields)) . '">';
    $rows = array_values((array) $rows);
    if (!$rows) {
        $rows = [[]];
    }
    foreach ($rows as $index => $row) {
        echo '<div class="gotham-repeat-row">';
        foreach ($fields as $field) {
            $value = $row[$field] ?? '';
            printf('<label><span>%s</span>', esc_html(ucwords(str_replace('_', ' ', $field))));
            if (in_array($field, ['visible', 'featured'], true)) {
                printf('<input type="checkbox" name="%s[%d][%s]" value="1" %s>', esc_attr($name), $index, esc_attr($field), checked($value, 1, false));
            } elseif (str_contains($field, 'description') || str_contains($field, 'content')) {
                printf('<textarea name="%s[%d][%s]" rows="2">%s</textarea>', esc_attr($name), $index, esc_attr($field), esc_textarea($value));
            } else {
                printf('<input type="text" name="%s[%d][%s]" value="%s">', esc_attr($name), $index, esc_attr($field), esc_attr($value));
            }
            echo '</label>';
        }
        echo '<button type="button" class="button gotham-remove-row">Delete row</button></div>';
    }
    echo '<button type="button" class="button button-secondary gotham-add-row">Add row</button></div>';
}
