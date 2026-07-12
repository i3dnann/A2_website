# A2 Studio Website

Professional FiveM CFW Roleplay community website for A2 Studio. The frontend is a dark, responsive React/Vite app and the backend is an Express/MySQL API designed for Netlify frontend hosting and a VPS backend.

## Features

- Public pages: home, roster, live server status, team, careers, tickets, news, snapshots, map, FAQ, terms, events, journey, famous characters.
- Department portals: public EMS, Police, and FIB pages with directories, ranks, wings, uniform galleries, vehicle galleries, and protected department-management tools.
- Account system: email/password, Discord OAuth2, Steam OpenID, linked providers per user.
- Player dashboard: account status, linked identifiers, ban status, tickets, and CFW character data after Steam is connected.
- Admin panel: settings, homepage, theme/colors, performance mode, journey, famous characters, roster, team, careers/questions/applications, tickets, news, map zones, FAQ, terms, events, users, admins, permissions, webhooks, audit logs, uploads.
- Live server status: backend FiveM status checks for players/max players, latency, queue, and configured/offline states.
- Security: bcrypt-compatible password hashing, JWT/http-only cookie sessions, CSRF guard for cookie-only unsafe requests, rate limits, Helmet, upload validation, RBAC, audit logs, webhook secrecy.

## Folder Structure

```text
/client     React + Vite + Tailwind frontend
/server     Node.js + Express + MySQL backend
/database   SQL schema and seed data
/docs       Security and deployment notes
/gotham-fivem-bridge  Secure VPS API bridge for CFW/MySQL
```

## Quick Start

```powershell
copy .env.example .env
npm.cmd run install:all
npm.cmd run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3001/health`

Live Netlify/Windows VPS update steps: [`docs/LIVE_SITE_UPDATE_GUIDE.md`](docs/LIVE_SITE_UPDATE_GUIDE.md)

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

## CFW Integration

The backend reads roleplay `players` data defensively from MySQL/MariaDB. It does not allow normal users to edit game data. Steam must be linked before a player can view characters.

Used player fields:

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
- Optional future department role sync: `DISCORD_EMS_MEMBER_ROLE_ID`, `DISCORD_EMS_MANAGEMENT_ROLE_ID`, `DISCORD_POLICE_MEMBER_ROLE_ID`, `DISCORD_POLICE_MANAGEMENT_ROLE_ID`, `DISCORD_FIB_MEMBER_ROLE_ID`, `DISCORD_FIB_MANAGEMENT_ROLE_ID`

Steam:

- `STEAM_REALM=https://your-api-domain`
- `STEAM_RETURN_URL=https://your-api-domain/api/auth/steam/callback`
- Optional profile enrichment: `STEAM_API_KEY`

FiveM live status:

- Direct endpoint mode: `FIVEM_PLAYERS_URL`, `FIVEM_DYNAMIC_URL`, `FIVEM_INFO_URL`
- Server mode: `FIVEM_SERVER_IP`, `FIVEM_SERVER_PORT`, `FIVEM_MAX_PLAYERS`, `FIVEM_SERVER_NAME`

If live status is not configured, the API reports `not_configured` instead of pretending the server is offline.

## Webhooks

Webhook URLs are backend-only and are never exposed to the frontend. Configure them in `.env` or from `/admin/webhooks`:

- `WEBHOOK_TICKETS_OPEN`
- `WEBHOOK_TICKETS_CLOSED`
- `WEBHOOK_CAREERS`
- `WEBHOOK_ADMIN_LOGS`
- `WEBHOOK_SECURITY`
- `WEBHOOK_USER_ACCOUNTS`

## Change Website Name, Logo, Colors

Login as a Master Admin, then use:

- `/admin/settings` for website name, logo, favicon, nav links, maintenance and performance mode.
- `/admin/home` for hero text, background, buttons, and store/Discord/FiveM links.
- `/admin/theme` for colors.

Default branding assets are stored in:

- `client/public/assets/gotham-banner.gif`
- `client/public/assets/gotham-logo.png`

The default settings use those files as the hero background, site logo, and favicon. Replace the files or update `/admin/home` and `/admin/settings` to change them without touching code.

## Deployment

Frontend deploys from `/client` to Netlify. Backend runs separately on a VPS with Node.js and MySQL access. See [INSTALL.md](INSTALL.md) and [DEPLOY_NETLIFY.md](DEPLOY_NETLIFY.md).

For a Windows Server VPS, use [docs/WINDOWS_VPS_INSTALL.md](docs/WINDOWS_VPS_INSTALL.md). The backend can serve the built React frontend directly after `npm run build --prefix client`.

Department setup and migration notes: [docs/DEPARTMENT_PORTALS.md](docs/DEPARTMENT_PORTALS.md).
