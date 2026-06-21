# Install Guide

## 1. Requirements

- Node.js 20+
- MySQL or MariaDB
- A FiveM QBCore server for live data
- Discord application with OAuth2 credentials

## 2. Install Dependencies

```powershell
npm.cmd install
npm.cmd run install:all
```

## 3. Configure Environment

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set:

- `JWT_SECRET` and `SESSION_SECRET` to long random values.
- `FRONTEND_URL` to your Netlify or local frontend URL.
- `MYSQL_*` values for your QBCore database.
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`, and `DISCORD_GUILD_ID`.
- `FIVEM_API_TOKEN` to the same token used in `fivem-resource/a2_cityhub/config.lua`.
- Twitch/Kick credentials only if you want live streamer checks.
- Webhook URLs only on the backend or secure VPS.

If Firebase, Twitch, or Kick credentials are empty, the backend continues running and shows disabled/unknown statuses.

## 4. Import Database

```powershell
mysql -u root -p qbcore < database/DATABASE_SCHEMA.sql
mysql -u root -p qbcore < database/seed.sql
```

The website schema is separate from core QBCore tables. The backend reads QBCore `players` and `player_vehicles` when database mode is enabled, but this schema does not modify those tables.

## 5. Run Locally

```powershell
npm.cmd run dev
```

Open:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001/health`

## 6. Discord OAuth2

In the Discord Developer Portal:

1. Create an application.
2. Add an OAuth2 redirect URL matching `DISCORD_REDIRECT_URI`, for example `http://localhost:3001/api/auth/discord/callback`.
3. Copy the client ID and secret into `.env`.
4. Add your guild ID to `DISCORD_GUILD_ID`.

The backend stores Discord ID, username, avatar, email if available, guild role IDs, first login, last login, preferred language, and calculated website permissions.

## 7. Roles and Permissions

Default roles and permissions live in `server/src/data/permissions.js`. The admin panel exposes `/staff/permissions` and the database schema includes role/permission tables for expansion.

Only `master_access` should be allowed to remove blacklists and perform dangerous master-only settings changes.

## 8. Streamers

Go to `/staff/streamers` or `/staff/streamers/create`.

Add Twitch and/or Kick channel names. The frontend only reads cached live status from the backend. It never calls Twitch/Kick APIs directly.

## 9. Change Website Name, Logo, Colors

Login as an admin and open `/staff/settings`. Update:

- Website name
- Logo and favicon URL
- Theme colors
- Background image
- Discord invite
- FiveM connect link
- Terms and rules
- Streamer page settings
- Maintenance/performance mode
