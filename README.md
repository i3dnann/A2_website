# A2 Studio Website Platform

A2 Studio is a full-stack website platform for a FiveM QBCore roleplay server. It combines the public website, player portal, staff/admin panel, Police MDC, EMS medical panel, court system, businesses, gangs, streamers, tickets, ban appeals, server status, CMS settings, database schema, and a FiveM bridge resource in one modular project.

The default brand is **A2 Studio**, but the name, logo, favicon, colors, backgrounds, Discord links, FiveM connect link, homepage content, rules, terms, streamer settings, and performance options are editable from `/staff/settings`.

## Stack

- Client: React, Vite, Tailwind CSS, Framer Motion, Lucide icons, i18n English/Arabic.
- Server: Node.js, Express, MySQL2, Discord OAuth2, JWT HTTP-only cookie sessions, RBAC middleware, rate limiting, uploads, webhook logging.
- Database: MySQL schema in `database/DATABASE_SCHEMA.sql`.
- FiveM: `fivem-resource/a2_cityhub` bridge for server heartbeat, players, and safe queued actions.

## Folder Structure

```text
/client          React/Vite frontend
/server          Express backend/API
/fivem-resource  a2_cityhub FiveM bridge resource
/database        MySQL schema and seed data
/docs            Extra deployment notes
```

## Local Install

```powershell
npm.cmd install
npm.cmd run install:all
Copy-Item .env.example .env
npm.cmd run dev
```

Frontend: `http://localhost:5173`  
Backend health: `http://localhost:3001/health`

Use the development login button on `/login` while Discord OAuth is not configured. In production, configure Discord OAuth and set strong secrets in `.env`.

## Production Notes

- Do not commit `.env`, secrets, tokens, service accounts, private keys, `node_modules`, `dist`, `build`, logs, or uploads.
- Frontend can deploy to Netlify from `/client`.
- Backend should run on your FiveM VPS or another secure VPS.
- FiveM must talk only to the backend with `FIVEM_API_TOKEN`.
- Frontend never calls Twitch, Kick, Discord bot, MySQL, or FiveM secrets directly.

## Key Features

- Public routes: home, news, events, businesses, map, jobs, characters, streamers, status, rules, terms, archive, story, whitelist, tickets, ban appeals.
- Player portal: Discord profile, linked QBCore characters, tickets, appeals, whitelist status, character/profile areas.
- Staff panel: tickets, whitelist, appeals, logs, CMS, permissions, settings, streamers.
- Police/EMS/Court: protected dashboards, citizen search, reports, warrants, fines, medical records, cases.
- Streamers: public creator cards, featured sorting, backend-only Twitch/Kick live checks, cached live status, safe fallback if credentials are missing.
- CMS/settings: global branding, colors, terms, rules, maintenance mode, performance mode, streamer settings.
- Security: RBAC, audit logs, webhooks, rate limits, upload validation, safe env handling, master-only dangerous controls.

More detailed setup is in `INSTALL.md`, `DEPLOY_NETLIFY.md`, and `FIVEM_SETUP.md`.
