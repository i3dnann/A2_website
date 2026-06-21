# Deploy Frontend to Netlify

The frontend is static and deploys from `/client`. The backend must run separately on a VPS.

## Netlify Settings

- Base directory: `client`
- Build command: `npm run build`
- Publish directory: `client/dist`
- Node version: `20`

The included `netlify.toml` already matches this setup.

## Frontend Environment Variable

Set this in Netlify:

```env
VITE_API_BASE_URL=https://your-backend-domain.com
```

Do not put Discord, Steam, Twitch, Kick, webhook, JWT, session, MySQL, or Firebase private values in Netlify frontend env vars.

## Backend URLs

Update backend `.env` on the VPS:

```env
FRONTEND_URL=https://your-netlify-site.netlify.app
CORS_ALLOWED_ORIGINS=https://your-netlify-site.netlify.app
DISCORD_REDIRECT_URI=https://your-backend-domain.com/api/auth/discord/callback
STEAM_REALM=https://your-backend-domain.com
STEAM_RETURN_URL=https://your-backend-domain.com/api/auth/steam/callback
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
```

## Deploy

```powershell
npm.cmd run build --prefix client
```

Then connect the GitHub repo in Netlify or upload the generated `client/dist` output.

## Secret Hygiene

Netlify secret scanning can fail even after a successful build if secrets are committed in docs or example files. Keep `.env.example` placeholder-only and rotate any exposed secret immediately.
