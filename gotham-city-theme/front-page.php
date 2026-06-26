<?php get_header(); ?>
<?php gotham_render_hero('home', 'hero', get_bloginfo('name')); ?>
<?php gotham_render_section_cards('home', 'stats'); ?>
<?php gotham_render_section_cards('home', 'features'); ?>
<?php gotham_render_section_cards('home', 'server-info'); ?>
<section class="gotham-section">
    <div class="gotham-container">
        <div class="gotham-section-head"><div><span class="gotham-eyebrow"><?php esc_html_e('Updates', 'gotham-city-theme'); ?></span><h2><?php echo esc_html(gotham_theme_text(gotham_theme_section('home', 'featured-news') ?: [], 'title', 'Featured News')); ?></h2></div><a class="gotham-button secondary" href="<?php echo esc_url(home_url('/news/')); ?>"><?php esc_html_e('View all', 'gotham-city-theme'); ?></a></div>
        <div class="gotham-grid"><?php foreach (function_exists('gotham_query_items') ? gotham_query_items('gotham_news', 3, 1) : [] as $item) { gotham_post_card($item); } ?></div>
    </div>
</section>
<section class="gotham-section">
    <div class="gotham-container">
        <div class="gotham-section-head"><div><span class="gotham-eyebrow"><?php esc_html_e('Creators', 'gotham-city-theme'); ?></span><h2><?php echo esc_html(gotham_theme_text(gotham_theme_section('home', 'featured-streamers') ?: [], 'title', 'Featured Streamers')); ?></h2></div><a class="gotham-button secondary" href="<?php echo esc_url(home_url('/roster/')); ?>"><?php esc_html_e('Roster', 'gotham-city-theme'); ?></a></div>
        <div class="gotham-grid"><?php foreach (function_exists('gotham_query_items') ? gotham_query_items('gotham_streamer', 6, 1) : [] as $item) { gotham_post_card($item); } ?></div>
    </div>
</section>
<?php gotham_render_section_cards('home', 'gallery-preview'); ?>
<?php gotham_render_section_cards('home', 'footer-cta'); ?>
<?php get_footer(); ?>
