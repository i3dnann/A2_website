<?php $settings = gotham_theme_settings(); ?>
<footer class="gotham-footer">
    <div class="gotham-container gotham-footer-inner">
        <div>
            <strong><?php echo esc_html($settings['website_name'] ?? get_bloginfo('name')); ?></strong>
            <p><?php echo esc_html(gotham_theme_text($settings, 'footer_text')); ?></p>
            <small><?php echo esc_html(gotham_theme_text($settings, 'copyright_text')); ?></small>
        </div>
        <nav aria-label="<?php esc_attr_e('Footer navigation', 'gotham-city-theme'); ?>">
            <?php foreach (($settings['footer_links'] ?? []) as $link) : if (empty($link['visible'])) continue; ?>
                <a href="<?php echo esc_url($link['url']); ?>"><?php echo esc_html(gotham_theme_text($link, 'label')); ?></a>
            <?php endforeach; ?>
            <?php foreach (($settings['social_links'] ?? []) as $link) : if (empty($link['visible'])) continue; ?>
                <a href="<?php echo esc_url($link['url']); ?>"><?php echo esc_html($link['label']); ?></a>
            <?php endforeach; ?>
        </nav>
    </div>
</footer>
</div>
<?php wp_footer(); ?>
</body>
</html>
