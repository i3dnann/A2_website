<?php
$settings = gotham_theme_settings();
$lang = function_exists('gotham_current_lang') ? gotham_current_lang() : 'en';
$logo = function_exists('gotham_image_url') ? gotham_image_url($settings['logo_id'] ?? 0, 'thumbnail') : '';
if (!$logo) {
    $logo = gotham_theme_asset('gotham-logo.png');
}
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<div class="gotham-shell">
<header class="gotham-header">
    <div class="gotham-container gotham-header-inner">
        <a class="gotham-brand" href="<?php echo esc_url(home_url('/')); ?>">
            <img src="<?php echo esc_url($logo); ?>" alt="">
            <span><?php echo esc_html($settings['website_name'] ?? get_bloginfo('name')); ?></span>
        </a>
        <nav class="gotham-nav" aria-label="<?php esc_attr_e('Primary navigation', 'gotham-city-theme'); ?>">
            <?php foreach (($settings['header_links'] ?? []) as $link) : if (empty($link['visible'])) continue; ?>
                <a href="<?php echo esc_url($link['url']); ?>"><?php echo esc_html(gotham_theme_text($link, 'label')); ?></a>
            <?php endforeach; ?>
        </nav>
        <div class="gotham-lang">
            <a href="<?php echo esc_url(add_query_arg('lang', 'en')); ?>" aria-current="<?php echo $lang === 'en' ? 'true' : 'false'; ?>">EN</a>
            <a href="<?php echo esc_url(add_query_arg('lang', 'ar')); ?>" aria-current="<?php echo $lang === 'ar' ? 'true' : 'false'; ?>">AR</a>
        </div>
    </div>
</header>
