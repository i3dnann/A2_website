<?php get_header(); ?>
<section class="gotham-section">
    <div class="gotham-container">
        <h1 class="gotham-page-title"><?php the_archive_title(); ?></h1>
        <div class="gotham-grid" style="margin-top:24px">
            <?php while (have_posts()) : the_post(); gotham_post_card(['post' => get_post(), 'meta' => get_post_meta(get_the_ID(), '_gotham_meta', true) ?: []]); endwhile; ?>
        </div>
    </div>
</section>
<?php get_footer(); ?>
