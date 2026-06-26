<?php
if (!defined('ABSPATH')) {
    exit;
}

add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('custom-logo');
    register_nav_menus(['primary' => __('Primary Menu', 'gotham-city-theme')]);
});

add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('gotham-city-theme', get_stylesheet_uri(), [], '1.0.0');
});

add_filter('language_attributes', function ($output) {
    if (function_exists('gotham_current_lang') && gotham_current_lang() === 'ar') {
        $output .= ' dir="rtl"';
    }
    return $output;
});

add_filter('body_class', function ($classes) {
    if (function_exists('gotham_current_lang') && gotham_current_lang() === 'ar') {
        $classes[] = 'rtl';
    }
    return $classes;
});

function gotham_theme_asset($file) {
    return get_template_directory_uri() . '/assets/images/' . ltrim($file, '/');
}

function gotham_theme_settings() {
    return function_exists('gotham_get_settings') ? gotham_get_settings() : [];
}

function gotham_theme_section($page, $slug) {
    return function_exists('gotham_get_section') ? gotham_get_section($page, $slug) : null;
}

function gotham_theme_text($data, $field, $fallback = '') {
    return function_exists('gotham_text') ? gotham_text($data, $field, $fallback) : ($data[$field . '_en'] ?? $fallback);
}

function gotham_theme_image($id, $fallback = '') {
    if (function_exists('gotham_image_url')) {
        return gotham_image_url($id) ?: $fallback;
    }
    return $fallback;
}

function gotham_render_hero($page, $slug = 'hero', $fallback_title = '') {
    $section = gotham_theme_section($page, $slug);
    if (!$section || empty($section['visible'])) {
        return;
    }
    $image = gotham_theme_image($section['image_id'] ?? 0, gotham_theme_asset('gotham-banner.gif'));
    ?>
    <section class="gotham-hero">
        <?php if ($image) : ?><img class="gotham-hero-media" src="<?php echo esc_url($image); ?>" alt=""><?php endif; ?>
        <div class="gotham-container gotham-hero-content">
            <?php if (gotham_theme_text($section, 'subtitle')) : ?><span class="gotham-eyebrow"><?php echo esc_html(gotham_theme_text($section, 'subtitle')); ?></span><?php endif; ?>
            <h1><?php echo esc_html(gotham_theme_text($section, 'title', $fallback_title)); ?></h1>
            <?php if (gotham_theme_text($section, 'description')) : ?><p><?php echo wp_kses_post(gotham_theme_text($section, 'description')); ?></p><?php endif; ?>
            <?php if (!empty($section['button_link']) && gotham_theme_text($section, 'button_text')) : ?>
                <div class="gotham-actions"><a class="gotham-button" href="<?php echo esc_url($section['button_link']); ?>"><?php echo esc_html(gotham_theme_text($section, 'button_text')); ?></a></div>
            <?php endif; ?>
        </div>
    </section>
    <?php
}

function gotham_render_section_cards($page, $slug) {
    $section = gotham_theme_section($page, $slug);
    if (!$section || empty($section['visible'])) {
        return;
    }
    $items = $section['items'] ?? [];
    ?>
    <section class="gotham-section">
        <div class="gotham-container">
            <div class="gotham-section-head">
                <div>
                    <?php if (gotham_theme_text($section, 'subtitle')) : ?><span class="gotham-eyebrow"><?php echo esc_html(gotham_theme_text($section, 'subtitle')); ?></span><?php endif; ?>
                    <h2><?php echo esc_html(gotham_theme_text($section, 'title')); ?></h2>
                    <?php if (gotham_theme_text($section, 'description')) : ?><p class="gotham-lead"><?php echo wp_kses_post(gotham_theme_text($section, 'description')); ?></p><?php endif; ?>
                </div>
                <?php if (!empty($section['button_link']) && gotham_theme_text($section, 'button_text')) : ?><a class="gotham-button secondary" href="<?php echo esc_url($section['button_link']); ?>"><?php echo esc_html(gotham_theme_text($section, 'button_text')); ?></a><?php endif; ?>
            </div>
            <?php if ($items) : ?>
                <div class="gotham-grid">
                    <?php foreach ($items as $item) : if (isset($item['visible']) && !$item['visible']) continue; ?>
                        <article class="gotham-card">
                            <?php if (!empty($item['image_url'])) : ?><img src="<?php echo esc_url($item['image_url']); ?>" alt=""><?php endif; ?>
                            <div class="gotham-card-body">
                                <?php if (!empty($item['icon'])) : ?><span class="gotham-badge"><?php echo esc_html($item['icon']); ?></span><?php endif; ?>
                                <h3><?php echo esc_html(gotham_theme_text($item, 'title')); ?></h3>
                                <p><?php echo wp_kses_post(gotham_theme_text($item, 'description')); ?></p>
                                <?php if (!empty($item['button_link']) && gotham_theme_text($item, 'button_text')) : ?><a class="gotham-button secondary" href="<?php echo esc_url($item['button_link']); ?>"><?php echo esc_html(gotham_theme_text($item, 'button_text')); ?></a><?php endif; ?>
                            </div>
                        </article>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </section>
    <?php
}

function gotham_post_card($item, $link = true) {
    $post = $item['post'];
    $meta = $item['meta'];
    $title = gotham_theme_text($meta, 'title', get_the_title($post));
    $desc = gotham_theme_text($meta, 'description', get_the_excerpt($post));
    $image = $meta['image_url'] ?? get_the_post_thumbnail_url($post, 'large');
    $open = $link ? '<a href="' . esc_url(get_permalink($post)) . '">' : '<div>';
    $close = $link ? '</a>' : '</div>';
    echo $open . '<article class="gotham-card">';
    if ($image) {
        echo '<img src="' . esc_url($image) . '" alt="">';
    }
    echo '<div class="gotham-card-body">';
    if (!empty($meta['category']) || !empty($meta['status'])) {
        echo '<span class="gotham-badge">' . esc_html($meta['category'] ?? $meta['status']) . '</span>';
    }
    echo '<h3>' . esc_html($title) . '</h3><p>' . wp_kses_post($desc) . '</p></div></article>' . $close;
}
