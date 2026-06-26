# Gotham City WordPress Build

This repository now includes the WordPress rebuild requested for Gotham City / A2 Website:

- `gotham-city-theme/` - public WordPress theme.
- `gotham-city-core/` - required plugin for admin editing, content types, tickets, settings, and bridge client.
- `gotham-fivem-bridge/` - secure Node.js API service for the FiveM VPS.

## Install WordPress Theme And Plugin

1. Copy `gotham-city-theme` to `wp-content/themes/gotham-city-theme`.
2. Copy `gotham-city-core` to `wp-content/plugins/gotham-city-core`.
3. In WordPress admin, activate **Gotham City Core**.
4. Activate **Gotham City Theme**.
5. Go to **Gotham City Theme Editor**.
6. Save the defaults once, then edit each tab.

Create normal WordPress pages with these slugs:

`live`, `roster`, `news`, `careers`, `map`, `rules`, `gallery`, `tickets`, `login`, `register`, `dashboard`, `player-profile`, `ban-status`, `terms`, `privacy`.

Set your home page to a static page if desired, or use the theme front page.

## Admin Editing

The central admin page is named **Gotham City Theme Editor** and includes tabs for:

Global Settings, Header, Footer, Home Page, Live Page, Roster Page, News Page, Careers Page, Map Page, Rules Page, Gallery Page, Tickets Page, Auth Pages, Dashboard Page, Terms / Privacy, Maintenance Page, SEO / Social Preview, Colors / Styling, and Arabic / English Content.

Each page section includes English/Arabic title, subtitle, description, button text, button link, image/background, icon, video URL, sort order, show/hide, featured, and repeatable cards/messages/items.

Repeatable public content is managed as WordPress custom post types:

- News
- Streamers
- Careers
- Map Zones
- Rules
- Gallery

Each item has bilingual custom fields and show/featured/sort controls.

## Secure Bridge Configuration

Preferred WordPress configuration in `wp-config.php`:

```php
define('GOTHAM_API_BRIDGE_URL', 'https://api.gothamcity.info');
define('GOTHAM_API_BRIDGE_KEY', 'change_this_strong_key');
```

If constants are not set, the plugin allows bridge URL/key in the admin editor, but `wp-config.php` is safer.

## Run The FiveM Bridge

On the FiveM VPS:

```bash
cd gotham-fivem-bridge
npm install
cp .env.example .env
nano .env
npm start
```

Use a process manager such as PM2 or systemd for production.

## MySQL User Safety

Use a limited MySQL account. Do not use root and do not reuse the FiveM server user.

Example:

```sql
CREATE USER 'gotham_bridge'@'127.0.0.1' IDENTIFIED BY 'strong_password';
GRANT SELECT ON qbcore_database.players TO 'gotham_bridge'@'127.0.0.1';
GRANT SELECT ON qbcore_database.bans TO 'gotham_bridge'@'127.0.0.1';
FLUSH PRIVILEGES;
```

Only grant additional tables after you add bridge endpoints that need them.

## Nginx Example

```nginx
server {
  server_name api.gothamcity.info;
  location / {
    proxy_pass http://127.0.0.1:3015;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

Use HTTPS with Certbot or your hosting control panel.

## Testing Checklist

- Activate plugin without fatal errors.
- Activate theme without fatal errors.
- Open **Gotham City Theme Editor** and save settings.
- Confirm public pages render dynamic admin content.
- Switch `?lang=ar` and confirm RTL layout.
- Add a streamer/news/job/rule/map/gallery item and confirm it appears.
- Submit a ticket while logged in.
- Test bridge health from WordPress admin or:

```bash
curl -H "X-API-Key: change_this_strong_key" https://api.gothamcity.info/health
```

- Confirm requests without `X-API-Key` return `401`.
- View page source and confirm no SQL credentials or webhook URLs are exposed.

## Notes

The theme uses fallback defaults only when admin content has not been saved yet. All important public content is editable through WordPress options, custom post meta, or custom tables using WordPress APIs.
