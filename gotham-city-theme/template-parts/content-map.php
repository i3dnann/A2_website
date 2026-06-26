<?php $settings = gotham_theme_settings(); $map = gotham_theme_asset('fivem-map.svg'); ?>
<section class="gotham-section"><div class="gotham-container"><div class="gotham-map" style="background-image:url('<?php echo esc_url($map); ?>')">
<?php foreach (function_exists('gotham_query_items') ? gotham_query_items('gotham_map_zone', 100) : [] as $item) : $meta = $item['meta']; ?>
<span class="gotham-marker" style="left:<?php echo esc_attr($meta['position_x'] ?? 50); ?>%;top:<?php echo esc_attr($meta['position_y'] ?? 50); ?>%;background:<?php echo esc_attr($meta['color'] ?? 'var(--gotham-primary)'); ?>" title="<?php echo esc_attr(gotham_theme_text($meta, 'title', get_the_title($item['post']))); ?>"></span>
<?php endforeach; ?>
</div><div class="gotham-grid" style="margin-top:16px"><?php foreach (function_exists('gotham_query_items') ? gotham_query_items('gotham_map_zone', 100) : [] as $item) { gotham_post_card($item, false); } ?></div></div></section>
