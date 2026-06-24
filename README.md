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
