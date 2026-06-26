<?php
/**
 * Main fallback template for Gotham City Theme.
 *
 * WordPress requires standalone themes to include an index.php template.
 */
if (!defined('ABSPATH')) {
    exit;
}

get_header();

if (is_home() || is_archive() || is_search()) : ?>
    <main class="gotham-section">
        <div class="gotham-container">
            <header class="gotham-section-head">
                <div>
                    <span class="gotham-eyebrow"><?php echo esc_html(get_bloginfo('name')); ?></span>
                    <h1 class="gotham-page-title"><?php echo esc_html(single_post_title('', false) ?: get_the_archive_title() ?: __('Updates', 'gotham-city-theme')); ?></h1>
                </div>
            </header>
            <div class="gotham-grid">
                <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
                    <article <?php post_class('gotham-card'); ?>>
                        <?php if (has_post_thumbnail()) : ?>
                            <a href="<?php the_permalink(); ?>"><?php the_post_thumbnail('large'); ?></a>
                        <?php endif; ?>
                        <div class="gotham-card-body">
                            <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
                            <p><?php echo esc_html(wp_trim_words(get_the_excerpt() ?: get_the_content(), 28)); ?></p>
                            <a class="gotham-button secondary" href="<?php the_permalink(); ?>"><?php esc_html_e('Read more', 'gotham-city-theme'); ?></a>
                        </div>
                    </article>
                <?php endwhile; else : ?>
                    <article class="gotham-card"><div class="gotham-card-body"><p><?php esc_html_e('No content found.', 'gotham-city-theme'); ?></p></div></article>
                <?php endif; ?>
            </div>
        </div>
    </main>
<?php else : ?>
    <main class="gotham-section">
        <div class="gotham-container gotham-card">
            <div class="gotham-card-body">
                <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
                    <h1 class="gotham-page-title"><?php the_title(); ?></h1>
                    <?php the_content(); ?>
                <?php endwhile; else : ?>
                    <h1 class="gotham-page-title"><?php esc_html_e('Page not found', 'gotham-city-theme'); ?></h1>
                    <p><?php esc_html_e('The requested page could not be found.', 'gotham-city-theme'); ?></p>
                <?php endif; ?>
            </div>
        </div>
    </main>
<?php endif;

get_footer();
