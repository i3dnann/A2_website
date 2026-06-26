<?php
$settings = gotham_get_settings();
$lang = gotham_current_lang();
$bg = gotham_image_url($settings['maintenance_background_id']);
?><!doctype html>
<html <?php language_attributes(); ?> dir="<?php echo $lang === 'ar' ? 'rtl' : 'ltr'; ?>">
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?php echo esc_html(gotham_text($settings, 'maintenance_headline', 'Maintenance')); ?></title>
    <?php wp_head(); ?>
</head>
<body class="gotham-maintenance" style="<?php echo $bg ? 'background-image:url(' . esc_url($bg) . ')' : ''; ?>">
    <main>
        <h1><?php echo esc_html(gotham_text($settings, 'maintenance_headline', 'Maintenance')); ?></h1>
        <p><?php echo esc_html(gotham_text($settings, 'maintenance_message', 'Please check back soon.')); ?></p>
        <?php if (!empty($settings['maintenance_countdown'])) : ?>
            <time><?php echo esc_html($settings['maintenance_countdown']); ?></time>
        <?php endif; ?>
        <a href="<?php echo esc_url($settings['discord_invite']); ?>"><?php esc_html_e('Discord', 'gotham-city-core'); ?></a>
    </main>
    <?php wp_footer(); ?>
</body>
</html>
