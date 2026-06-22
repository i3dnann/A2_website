# Live Site Update Guide

This guide updates the Netlify frontend, Windows VPS backend, MySQL tables, and the optional FiveM character-link bridge.

## 1. Update the code on the Windows VPS

Open PowerShell on the VPS:

```powershell
cd C:\A2_website
git pull
npm.cmd run install:all
npm.cmd run build --prefix client
```

## 2. Run the database migration in HeidiSQL

1. Open HeidiSQL.
2. Connect to the same database used in `.env` as `MYSQL_DATABASE`.
3. Select the database, for example `qbcore`.
4. Click **File > Load SQL file**.
5. Open:

```text
C:\A2_website\database\migrations\2026_06_22_live_site_fixes.sql
```

6. Press **Run**.

This adds missing columns for settings, roster, famous, tickets, applications, map, terms, events, and the `player_links` table.

## 3. Check the backend `.env`

Open:

```powershell
cd C:\A2_website
notepad .env
```

Make sure these values are correct:

```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://gmcity.netlify.app
CORS_ALLOWED_ORIGINS=https://gmcity.netlify.app
USE_DATABASE=true

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=YOUR_XAMPP_MYSQL_PASSWORD
MYSQL_DATABASE=qbcore

DISCORD_REDIRECT_URI=https://ancient-liver-drool.ngrok-free.dev/api/auth/discord/callback
STEAM_REALM=https://ancient-liver-drool.ngrok-free.dev
STEAM_RETURN_URL=https://ancient-liver-drool.ngrok-free.dev/api/auth/steam/callback
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
```

## 4. Restart the backend

If using PM2:

```powershell
cd C:\A2_website
pm2 restart a2-website-api --update-env
pm2 status
```

If running manually:

```powershell
cd C:\A2_website
node .\server\src\index.js
```

Test:

```powershell
Invoke-RestMethod http://127.0.0.1:3001/health
Invoke-RestMethod http://127.0.0.1:3001/api/auth/providers
```

## 5. Start ngrok

Open a second PowerShell window:

```powershell
ngrok http 3001
```

Your current public API URL is:

```text
https://ancient-liver-drool.ngrok-free.dev
```

Test in browser:

```text
https://ancient-liver-drool.ngrok-free.dev/health
https://ancient-liver-drool.ngrok-free.dev/api/auth/providers
```

## 6. Update Netlify

In Netlify site settings, set:

```env
VITE_API_BASE_URL=https://ancient-liver-drool.ngrok-free.dev
```

Then go to **Deploys > Trigger deploy > Clear cache and deploy site**.

## 7. Install the FiveM character-link resource

Only do this if your account page says it cannot find your character.

Copy this folder:

```text
C:\A2_website\fivem-resource\gmcity_website_bridge
```

To your FiveM server resources folder:

```text
resources\[local]\gmcity_website_bridge
```

In `server.cfg`, make sure `oxmysql` and `qb-core` start before it:

```cfg
ensure oxmysql
ensure qb-core
ensure gmcity_website_bridge
```

Restart the FiveM server, then join the server with your character once. The bridge writes your Steam/Discord/license/citizenid into `player_links`, and the website can show your own characters safely.

## 8. Final checks

Open:

```text
https://gmcity.netlify.app/famous
https://gmcity.netlify.app/team
https://gmcity.netlify.app/map
https://gmcity.netlify.app/account/tickets
https://gmcity.netlify.app/account/applications
```

Admin checks:

```text
https://gmcity.netlify.app/admin/tickets
https://gmcity.netlify.app/admin/careers
https://gmcity.netlify.app/admin/roster
https://gmcity.netlify.app/admin/famous
https://gmcity.netlify.app/admin/map
https://gmcity.netlify.app/admin/terms
https://gmcity.netlify.app/admin/events
```
