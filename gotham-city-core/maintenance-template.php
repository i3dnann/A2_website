<?php
if (!defined('ABSPATH')) {
    exit;
}

$settings = gotham_get_settings();
$lang = gotham_current_lang();
$image_url = gotham_image_url($settings['maintenance_background_id'] ?? 0);
$uploaded_video = function_exists('gotham_media_url') ? gotham_media_url($settings['maintenance_background_video_id'] ?? 0) : '';
$video_url = !empty($settings['maintenance_video_url']) ? esc_url_raw($settings['maintenance_video_url']) : $uploaded_video;
$uploaded_audio = function_exists('gotham_media_url') ? gotham_media_url($settings['maintenance_audio_id'] ?? 0) : '';
$audio_url = !empty($settings['maintenance_audio_url']) ? esc_url_raw($settings['maintenance_audio_url']) : $uploaded_audio;
$headline = gotham_text($settings, 'maintenance_headline', 'Maintenance');
$message = gotham_text($settings, 'maintenance_message', 'Please check back soon.');
?><!doctype html>
<html <?php language_attributes(); ?> dir="<?php echo esc_attr($lang === 'ar' ? 'rtl' : 'ltr'); ?>">
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?php echo esc_html($headline); ?></title>
    <?php wp_head(); ?>
    <style>
        html, body { margin: 0; min-height: 100%; background: #000; }
        body.gotham-maintenance {
            position: relative;
            min-height: 100vh;
            display: grid;
            place-items: center;
            overflow: hidden;
            color: #fff;
            background: #000 center/cover no-repeat;
            <?php if ($image_url && !$video_url) : ?>background-image: url('<?php echo esc_url($image_url); ?>');<?php endif; ?>
        }
        .gotham-maintenance-bg-video {
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 0;
            opacity: 1;
            filter: none;
        }
        body.gotham-maintenance main {
            position: relative;
            z-index: 2;
            width: min(900px, calc(100% - 32px));
            padding: 0;
            border: 0;
            border-radius: 0;
            background: transparent;
            box-shadow: none;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            text-align: center;
        }
        body.gotham-maintenance h1 {
            margin: 0 0 14px;
            font-size: clamp(46px, 9vw, 104px);
            line-height: 0.92;
            font-weight: 950;
            letter-spacing: -0.055em;
            color: #fff;
            text-shadow: 0 4px 18px #000, 0 0 42px rgba(0,0,0,.82);
        }
        body.gotham-maintenance p,
        body.gotham-maintenance time {
            display: block;
            margin: 0 auto 20px;
            max-width: 680px;
            color: #fff;
            font-size: clamp(17px, 2vw, 22px);
            line-height: 1.65;
            font-weight: 700;
            text-shadow: 0 3px 14px #000, 0 0 32px rgba(0,0,0,.9);
        }
        body.gotham-maintenance a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 46px;
            padding: 0 20px;
            border: 0;
            border-radius: 999px;
            background: #b7fe1a;
            color: #050505;
            font-weight: 900;
            text-decoration: none;
        }
        .gotham-maintenance-audio {
            position: fixed;
            left: 18px;
            bottom: 18px;
            z-index: 3;
            width: min(360px, calc(100% - 36px));
            opacity: .88;
        }
    </style>
</head>
<body class="gotham-maintenance">
    <?php if ($video_url) : ?>
        <video class="gotham-maintenance-bg-video" autoplay muted loop playsinline preload="auto">
            <source src="<?php echo esc_url($video_url); ?>">
        </video>
    <?php endif; ?>
    <main>
        <h1><?php echo esc_html($headline); ?></h1>
        <p><?php echo esc_html($message); ?></p>
        <?php if (!empty($settings['maintenance_countdown'])) : ?>
            <time><?php echo esc_html($settings['maintenance_countdown']); ?></time>
        <?php endif; ?>
        <?php if (!empty($settings['discord_invite'])) : ?>
            <a href="<?php echo esc_url($settings['discord_invite']); ?>"><?php esc_html_e('Join Discord', 'gotham-city-core'); ?></a>
        <?php endif; ?>
    </main>
    <?php if ($audio_url) : ?>
        <audio class="gotham-maintenance-audio" controls loop preload="auto">
            <source src="<?php echo esc_url($audio_url); ?>">
        </audio>
    <?php endif; ?>
    <?php wp_footer(); ?>
</body>
</html>
