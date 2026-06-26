<?php get_header(); ?>
<?php
while (have_posts()) :
    the_post();
    $meta = get_post_meta(get_the_ID(), '_gotham_meta', true);
    $meta = is_array($meta) ? $meta : [];
    $title = gotham_theme_text($meta, 'title', get_the_title());
    $subtitle = gotham_theme_text($meta, 'subtitle', get_the_excerpt());
    $image = $meta['image_url'] ?? get_the_post_thumbnail_url(get_the_ID(), 'full') ?: gotham_theme_asset('gotham-banner.gif');
?>
<section class="gotham-hero">
    <img class="gotham-hero-media" src="<?php echo esc_url($image); ?>" alt="">
    <div class="gotham-container gotham-hero-content">
        <h1><?php echo esc_html($title); ?></h1>
        <?php if ($subtitle) : ?><p><?php echo esc_html($subtitle); ?></p><?php endif; ?>
    </div>
</section>
<main class="gotham-section">
    <div class="gotham-container gotham-card"><div class="gotham-card-body">
        <?php echo wp_kses_post(gotham_theme_text($meta, 'description')); ?>
        <?php the_content(); ?>
    </div></div>
</main>
<?php endwhile; ?>
<?php get_footer(); ?>
