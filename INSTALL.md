# Install A2 Studio Website

## Requirements

- Node.js 20+
- MySQL/MariaDB reachable from the backend VPS
- HeidiSQL or MySQL CLI for importing schema

## Local Install

```powershell
copy .env.example .env
npm.cmd run install:all
```

Edit `.env`:

```env
USE_DATABASE=true
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=qbcore
MASTER_ADMIN_EMAILS=your@email.com
JWT_SECRET=replace_with_long_random_secret
SESSION_SECRET=replace_with_long_random_secret
```

Import database:

```powershell
mysql -u root -p qbcore < database/DATABASE_SCHEMA.sql
mysql -u root -p qbcore < database/seed.sql
```

Run both apps:

```powershell
npm.cmd run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:3001/health`

## Backend VPS

```bash
cd A2_website
cp .env.example .env
npm run install:all
npm run start:server
```

Use PM2 for production:

```bash
npm install -g pm2
pm2 start "npm run start:server" --name a2-website-api
pm2 save
```

## First Admin

1. Set `MASTER_ADMIN_EMAILS` or `MASTER_ADMIN_DISCORD_IDS`.
2. Register/login with the matching account.
3. Open `/admin`.
4. Configure site settings, theme, webhooks, content, users, and admins.

## Steam Character Lookup

Players must link Steam from `/account/settings`. After Steam is linked, the backend searches QBCore safely by available identifiers and only returns that account's own characters.
