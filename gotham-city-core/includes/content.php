<?php
if (!defined('ABSPATH')) {
    exit;
}

function gotham_core_default_settings() {
    return [
        'website_name' => 'Gotham City Roleplay',
        'logo_id' => 0,
        'favicon_id' => 0,
        'primary_color' => '#b7fe1a',
        'secondary_color' => '#101010',
        'accent_color' => '#8b5cf6',
        'background_color' => '#000000',
        'card_background' => '#141414',
        'border_color' => '#242424',
        'text_color' => '#ffffff',
        'muted_text_color' => '#b8b8b8',
        'font_family' => 'Inter, system-ui, sans-serif',
        'button_style' => 'sharp-glow',
        'card_style' => 'cinematic',
        'background_style' => 'cinematic-grid',
        'discord_invite' => 'https://discord.gg/change-me',
        'server_connect_link' => 'fivem://connect/127.0.0.1',
        'contact_email' => 'admin@gothamcity.example',
        'copyright_text_en' => 'All rights reserved.',
        'copyright_text_ar' => 'جميع الحقوق محفوظة.',
        'footer_text_en' => 'A cinematic FiveM roleplay community.',
        'footer_text_ar' => 'مجتمع فايف إم سينمائي لتقمص الأدوار.',
        'maintenance_mode' => 0,
        'maintenance_headline_en' => 'Gotham City is under maintenance',
        'maintenance_headline_ar' => 'مدينة جوثام تحت الصيانة',
        'maintenance_message_en' => 'We are preparing the city. Please check Discord for updates.',
        'maintenance_message_ar' => 'نقوم بتجهيز المدينة. تابع الديسكورد لمعرفة التحديثات.',
        'maintenance_background_id' => 0,
        'maintenance_countdown' => '',
        'default_seo_title_en' => 'Gotham City Roleplay',
        'default_seo_title_ar' => 'جوثام سيتي رول بلاي',
        'default_seo_description_en' => 'Gotham City FiveM roleplay community.',
        'default_seo_description_ar' => 'مجتمع جوثام سيتي لتقمص الأدوار في فايف إم.',
        'og_image_id' => 0,
        'api_bridge_url' => '',
        'api_bridge_key' => '',
        'enable_registration' => 1,
        'enable_tickets' => 1,
        'enable_careers' => 1,
        'enable_gallery' => 1,
        'enable_fivem_features' => 0,
        'header_links' => [
            ['label_en' => 'Home', 'label_ar' => 'الرئيسية', 'url' => '/', 'visible' => 1, 'sort' => 1],
            ['label_en' => 'Live', 'label_ar' => 'البث', 'url' => '/live/', 'visible' => 1, 'sort' => 2],
            ['label_en' => 'Roster', 'label_ar' => 'المبدعون', 'url' => '/roster/', 'visible' => 1, 'sort' => 3],
            ['label_en' => 'News', 'label_ar' => 'الأخبار', 'url' => '/news/', 'visible' => 1, 'sort' => 4],
            ['label_en' => 'Careers', 'label_ar' => 'التوظيف', 'url' => '/careers/', 'visible' => 1, 'sort' => 5],
            ['label_en' => 'Map', 'label_ar' => 'الخريطة', 'url' => '/map/', 'visible' => 1, 'sort' => 6],
            ['label_en' => 'Rules', 'label_ar' => 'القوانين', 'url' => '/rules/', 'visible' => 1, 'sort' => 7],
            ['label_en' => 'Tickets', 'label_ar' => 'التذاكر', 'url' => '/tickets/', 'visible' => 1, 'sort' => 8],
        ],
        'footer_links' => [
            ['label_en' => 'Terms', 'label_ar' => 'الشروط', 'url' => '/terms/', 'visible' => 1, 'sort' => 1],
            ['label_en' => 'Privacy', 'label_ar' => 'الخصوصية', 'url' => '/privacy/', 'visible' => 1, 'sort' => 2],
        ],
        'social_links' => [
            ['label' => 'Discord', 'url' => 'https://discord.gg/change-me', 'icon' => 'discord', 'visible' => 1, 'sort' => 1],
        ],
    ];
}

function gotham_core_default_sections() {
    $pages = [
        'home' => ['hero', 'stats', 'features', 'server-info', 'featured-news', 'featured-streamers', 'gallery-preview', 'footer-cta'],
        'live' => ['hero', 'streams', 'empty-state'],
        'roster' => ['hero', 'streamers'],
        'news' => ['hero', 'news-list'],
        'careers' => ['hero', 'jobs', 'application-empty'],
        'map' => ['hero', 'zones'],
        'rules' => ['hero', 'rule-sections'],
        'gallery' => ['hero', 'gallery-items', 'submission-empty'],
        'tickets' => ['hero', 'ticket-form', 'messages'],
        'auth' => ['login', 'register', 'terms-notice', 'messages'],
        'dashboard' => ['overview', 'characters', 'tickets', 'empty-state'],
        'profile' => ['hero', 'character-info', 'ban-status'],
        'terms_privacy' => ['terms', 'privacy'],
        'maintenance' => ['maintenance'],
    ];
    $sections = [];
    foreach ($pages as $page => $slugs) {
        $order = 1;
        foreach ($slugs as $slug) {
            $title = ucwords(str_replace(['-', '_'], ' ', $slug));
            $sections[$page . '_' . $slug] = [
                'page' => $page,
                'slug' => $slug,
                'title_en' => $title,
                'title_ar' => $title,
                'subtitle_en' => '',
                'subtitle_ar' => '',
                'description_en' => '',
                'description_ar' => '',
                'button_text_en' => '',
                'button_text_ar' => '',
                'button_link' => '',
                'image_id' => 0,
                'icon' => '',
                'video_url' => '',
                'sort' => $order++,
                'visible' => 1,
                'featured' => 0,
                'items' => [],
            ];
        }
    }
    $sections['home_hero']['title_en'] = 'Gotham City Roleplay';
    $sections['home_hero']['title_ar'] = 'جوثام سيتي رول بلاي';
    $sections['home_hero']['subtitle_en'] = 'Premium FiveM community';
    $sections['home_hero']['subtitle_ar'] = 'مجتمع فايف إم احترافي';
    $sections['home_hero']['description_en'] = 'A serious QBCore roleplay city with creators, careers, live streams, tickets, and player tools.';
    $sections['home_hero']['description_ar'] = 'مدينة QBCore جادة لتقمص الأدوار مع مبدعين ووظائف وبث مباشر وتذاكر وأدوات للاعبين.';
    $sections['home_hero']['button_text_en'] = 'Join Discord';
    $sections['home_hero']['button_text_ar'] = 'انضم للديسكورد';
    $sections['home_hero']['button_link'] = 'https://discord.gg/change-me';
    $sections['home_stats']['items'] = [
        ['title_en' => 'Live creators', 'title_ar' => 'المبدعون المباشرون', 'description_en' => 'Checked through backend integrations', 'description_ar' => 'يتم التحقق عبر التكاملات الخلفية', 'icon' => 'radio', 'visible' => 1, 'featured' => 0, 'sort' => 1],
        ['title_en' => 'Support', 'title_ar' => 'الدعم', 'description_en' => 'Ticket transcripts are saved securely', 'description_ar' => 'يتم حفظ التذاكر بأمان', 'icon' => 'ticket', 'visible' => 1, 'featured' => 0, 'sort' => 2],
    ];
    $sections['live_empty-state']['description_en'] = 'No streamers are live right now.';
    $sections['live_empty-state']['description_ar'] = 'لا يوجد بث مباشر حاليا.';
    $sections['tickets_messages']['items'] = [
        ['title_en' => 'Ticket opened', 'title_ar' => 'تم فتح التذكرة', 'description_en' => 'Your ticket was submitted successfully.', 'description_ar' => 'تم إرسال تذكرتك بنجاح.', 'visible' => 1, 'featured' => 0, 'sort' => 1],
        ['title_en' => 'Ticket error', 'title_ar' => 'خطأ في التذكرة', 'description_en' => 'Please check the form and try again.', 'description_ar' => 'يرجى مراجعة النموذج والمحاولة مرة أخرى.', 'visible' => 1, 'featured' => 0, 'sort' => 2],
    ];
    return $sections;
}

function gotham_get_settings() {
    $saved = get_option('gotham_theme_settings', []);
    return wp_parse_args(is_array($saved) ? $saved : [], gotham_core_default_settings());
}

function gotham_get_sections() {
    $saved = get_option('gotham_theme_sections', []);
    return wp_parse_args(is_array($saved) ? $saved : [], gotham_core_default_sections());
}

function gotham_get_section($page, $slug) {
    $sections = gotham_get_sections();
    return $sections[$page . '_' . $slug] ?? null;
}

function gotham_current_lang() {
    $lang = isset($_GET['lang']) ? sanitize_key(wp_unslash($_GET['lang'])) : '';
    if ($lang === 'ar' || $lang === 'en') {
        setcookie('gotham_lang', $lang, time() + MONTH_IN_SECONDS, COOKIEPATH ?: '/', COOKIE_DOMAIN, is_ssl(), true);
        return $lang;
    }
    if (!empty($_COOKIE['gotham_lang']) && in_array($_COOKIE['gotham_lang'], ['en', 'ar'], true)) {
        return sanitize_key(wp_unslash($_COOKIE['gotham_lang']));
    }
    return 'en';
}

function gotham_text($data, $field, $fallback = '') {
    $lang = gotham_current_lang();
    $localized = $field . '_' . $lang;
    if (is_array($data) && isset($data[$localized]) && $data[$localized] !== '') {
        return $data[$localized];
    }
    $english = $field . '_en';
    if (is_array($data) && isset($data[$english]) && $data[$english] !== '') {
        return $data[$english];
    }
    return $fallback;
}

function gotham_image_url($id, $size = 'large') {
    $id = absint($id);
    if (!$id) {
        return '';
    }
    return wp_get_attachment_image_url($id, $size) ?: '';
}

function gotham_core_sanitize_settings($settings) {
    $defaults = gotham_core_default_settings();
    $clean = [];
    foreach ($defaults as $key => $default) {
        $value = $settings[$key] ?? $default;
        if (is_array($default)) {
            $clean[$key] = gotham_core_sanitize_repeater($value);
        } elseif (str_contains($key, 'color')) {
            $clean[$key] = sanitize_hex_color($value) ?: $default;
        } elseif (str_ends_with($key, '_id')) {
            $clean[$key] = absint($value);
        } elseif (str_starts_with($key, 'enable_') || str_ends_with($key, '_mode')) {
            $clean[$key] = empty($value) ? 0 : 1;
        } elseif (str_contains($key, 'url') || str_contains($key, 'link') || $key === 'discord_invite') {
            $clean[$key] = esc_url_raw($value);
        } else {
            $clean[$key] = is_scalar($value) ? sanitize_text_field($value) : $default;
        }
    }
    return $clean;
}

function gotham_core_sanitize_sections($sections) {
    $clean = [];
    foreach ((array) $sections as $key => $section) {
        $safe_key = sanitize_key($key);
        $clean[$safe_key] = [
            'page' => sanitize_key($section['page'] ?? ''),
            'slug' => sanitize_key($section['slug'] ?? ''),
            'title_en' => sanitize_text_field($section['title_en'] ?? ''),
            'title_ar' => sanitize_text_field($section['title_ar'] ?? ''),
            'subtitle_en' => sanitize_text_field($section['subtitle_en'] ?? ''),
            'subtitle_ar' => sanitize_text_field($section['subtitle_ar'] ?? ''),
            'description_en' => wp_kses_post($section['description_en'] ?? ''),
            'description_ar' => wp_kses_post($section['description_ar'] ?? ''),
            'button_text_en' => sanitize_text_field($section['button_text_en'] ?? ''),
            'button_text_ar' => sanitize_text_field($section['button_text_ar'] ?? ''),
            'button_link' => esc_url_raw($section['button_link'] ?? ''),
            'image_id' => absint($section['image_id'] ?? 0),
            'icon' => sanitize_text_field($section['icon'] ?? ''),
            'video_url' => esc_url_raw($section['video_url'] ?? ''),
            'sort' => intval($section['sort'] ?? 0),
            'visible' => empty($section['visible']) ? 0 : 1,
            'featured' => empty($section['featured']) ? 0 : 1,
            'items' => gotham_core_sanitize_repeater($section['items'] ?? []),
        ];
    }
    return $clean;
}

function gotham_core_sanitize_repeater($rows) {
    $clean = [];
    foreach ((array) $rows as $row) {
        if (!is_array($row)) {
            continue;
        }
        $clean_row = [];
        foreach ($row as $key => $value) {
            $key = sanitize_key($key);
            if (str_contains($key, 'url') || str_contains($key, 'link')) {
                $clean_row[$key] = esc_url_raw($value);
            } elseif (str_ends_with($key, '_id')) {
                $clean_row[$key] = absint($value);
            } elseif (in_array($key, ['visible', 'featured', 'required', 'open'], true)) {
                $clean_row[$key] = empty($value) ? 0 : 1;
            } elseif ($key === 'sort') {
                $clean_row[$key] = intval($value);
            } elseif (str_contains($key, 'description') || str_contains($key, 'content') || str_contains($key, 'message')) {
                $clean_row[$key] = wp_kses_post($value);
            } else {
                $clean_row[$key] = is_scalar($value) ? sanitize_text_field($value) : '';
            }
        }
        $clean[] = $clean_row;
    }
    usort($clean, fn($a, $b) => intval($a['sort'] ?? 0) <=> intval($b['sort'] ?? 0));
    return $clean;
}

function gotham_core_seed_defaults() {
    if (!get_option('gotham_theme_settings')) {
        update_option('gotham_theme_settings', gotham_core_default_settings(), false);
    }
    if (!get_option('gotham_theme_sections')) {
        update_option('gotham_theme_sections', gotham_core_default_sections(), false);
    }
}
