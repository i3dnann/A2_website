# A2 Studio Website

Professional FiveM QBCore roleplay community website for A2 Studio. The frontend is a dark, responsive React/Vite app and the backend is an Express/MySQL API designed for Netlify frontend hosting and a VPS backend.

## Features

- Public pages: home, roster, live streams, team, careers, tickets, news, map, FAQ, terms, events, journey, famous characters.
- Account system: email/password, Discord OAuth2, Steam OpenID, linked providers per user.
- Player dashboard: account status, linked identifiers, ban status, tickets, and QBCore character data after Steam is connected.
- Admin panel: settings, homepage, theme/colors, performance mode, partners, journey, famous characters, roster/live, team, careers/questions/applications, tickets, news, map zones, FAQ, terms, events, users, admins, permissions, webhooks, audit logs, uploads.
- Live streams: backend-only Twitch/Kick checks with cached status.
- Security: bcrypt-compatible password hashing, JWT/http-only cookie sessions, CSRF guard for cookie-only unsafe requests, rate limits, Helmet, upload validation, RBAC, audit logs, webhook secrecy.

## Folder Structure

```text
/client     React + Vite + Tailwind frontend
/server     Node.js + Express + MySQL backend
/database   SQL schema and seed data
/docs       Security and deployment notes
```

## Quick Start

```powershell
copy .env.example .env
npm.cmd run install:all
npm.cmd run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3001/health`

For a real database, set `USE_DATABASE=true`, fill the MySQL values in `.env`, then import:

```powershell
mysql -u root -p qbcore < database/DATABASE_SCHEMA.sql
mysql -u root -p qbcore < database/seed.sql
```

## Admin Bootstrap

Set at least one of these before registering/logging in:

```env
MASTER_ADMIN_EMAILS=owner@example.com
MASTER_ADMIN_DISCORD_IDS=
MASTER_ADMIN_STEAM_IDS=
```

An account matching one of those values receives `Master Admin` permissions.

## QBCore Integration

The backend reads QBCore `players` data defensively from MySQL/MariaDB. It does not allow normal users to edit QBCore data. Steam must be linked before a player can view characters.

Used QBCore fields:

- `players.citizenid`
- `players.cid`
- `players.license`
- `players.name`
- `players.money`
- `players.charinfo`
- `players.job`
- `players.gang`
- `players.metadata`

If a table or column is missing, the API logs a warning and returns safe fallbacks instead of raw database errors.

## OAuth Setup

Discord:

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI=http://your-api-domain/api/auth/discord/callback`
- Optional: `DISCORD_GUILD_ID`

Steam:

- `STEAM_REALM=https://your-api-domain`
- `STEAM_RETURN_URL=https://your-api-domain/api/auth/steam/callback`
- Optional profile enrichment: `STEAM_API_KEY`

Twitch/Kick live status:

- Twitch: `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`
- Kick: `KICK_API_KEY` or `KICK_CLIENT_ID` + `KICK_CLIENT_SECRET`

Missing live credentials do not crash the site; streamers show offline/unknown.

## Webhooks

Webhook URLs are backend-only and are never exposed to the frontend. Configure them in `.env` or from `/admin/webhooks`:

- `WEBHOOK_TICKETS_OPEN`
- `WEBHOOK_TICKETS_CLOSED`
- `WEBHOOK_CAREERS`
- `WEBHOOK_ADMIN_LOGS`
- `WEBHOOK_SECURITY`
- `WEBHOOK_STREAMERS`
- `WEBHOOK_USER_ACCOUNTS`

## Change Website Name, Logo, Colors

Login as a Master Admin, then use:

- `/admin/settings` for website name, logo, favicon, nav links, maintenance and performance mode.
- `/admin/home` for hero text, background, buttons, and store/Discord/FiveM links.
- `/admin/theme` for colors.

## Deployment

Frontend deploys from `/client` to Netlify. Backend runs separately on a VPS with Node.js and MySQL access. See [INSTALL.md](INSTALL.md) and [DEPLOY_NETLIFY.md](DEPLOY_NETLIFY.md).
