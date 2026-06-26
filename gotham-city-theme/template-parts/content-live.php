<section class="gotham-section"><div class="gotham-container"><div class="gotham-grid">
<?php $items = function_exists('gotham_query_items') ? gotham_query_items('gotham_streamer', 48) : []; ?>
<?php if ($items) : foreach ($items as $item) { gotham_post_card($item); } else : $empty = gotham_theme_section('live', 'empty-state'); ?>
<article class="gotham-card"><div class="gotham-card-body"><p><?php echo esc_html(gotham_theme_text($empty ?: [], 'description', 'No streamers are live right now.')); ?></p></div></article>
<?php endif; ?>
</div></div></section>
