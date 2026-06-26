<?php
get_header();
$slug = get_post_field('post_name', get_queried_object_id());
$map = [
    'live' => 'live',
    'roster' => 'roster',
    'news' => 'news',
    'careers' => 'careers',
    'map' => 'map',
    'rules' => 'rules',
    'gallery' => 'gallery',
    'tickets' => 'tickets',
    'login' => 'auth',
    'register' => 'auth',
    'dashboard' => 'dashboard',
    'player-profile' => 'profile',
    'ban-status' => 'profile',
    'terms' => 'terms_privacy',
    'privacy' => 'terms_privacy',
];
$page_key = $map[$slug] ?? $slug;
if (in_array($slug, ['login', 'register'], true)) {
    gotham_render_hero('auth', $slug, get_the_title());
} elseif ($slug === 'terms' || $slug === 'privacy') {
    gotham_render_hero('terms_privacy', $slug, get_the_title());
} else {
    gotham_render_hero($page_key, 'hero', get_the_title());
}
if ($slug === 'live') {
    get_template_part('template-parts/content', 'live');
} elseif ($slug === 'roster') {
    get_template_part('template-parts/content', 'roster');
} elseif ($slug === 'news') {
    get_template_part('template-parts/content', 'news');
} elseif ($slug === 'careers') {
    get_template_part('template-parts/content', 'careers');
} elseif ($slug === 'map') {
    get_template_part('template-parts/content', 'map');
} elseif ($slug === 'rules') {
    get_template_part('template-parts/content', 'rules');
} elseif ($slug === 'gallery') {
    get_template_part('template-parts/content', 'gallery');
} elseif ($slug === 'tickets') {
    get_template_part('template-parts/content', 'tickets');
} else {
    gotham_render_section_cards($page_key, 'overview');
    echo '<main class="gotham-section"><div class="gotham-container gotham-card"><div class="gotham-card-body">';
    while (have_posts()) {
        the_post();
        the_content();
    }
    echo '</div></div></main>';
}
get_footer();
