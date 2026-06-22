# Kick Live Status Setup

Kick live checks run on the backend only. Do not put `KICK_CLIENT_SECRET` in Netlify or frontend code.

## Required `.env` values

Put these in the Windows VPS backend `.env` file:

```env
KICK_API_BASE_URL=https://api.kick.com/public/v1
KICK_OAUTH_BASE_URL=https://id.kick.com
KICK_CLIENT_ID=your_client_id
KICK_CLIENT_SECRET=your_client_secret
```

`KICK_API_KEY` is not required for the new integration.

## How it works

1. The backend requests an app access token from:

```text
https://id.kick.com/oauth/token
```

2. It uses:

```text
grant_type=client_credentials
client_id=KICK_CLIENT_ID
client_secret=KICK_CLIENT_SECRET
```

3. The backend caches the token until shortly before it expires.
4. The frontend calls only your backend:

```text
/api/kick/status/:slug
```

5. The backend calls Kick with:

```text
Authorization: Bearer ACCESS_TOKEN
```

## Admin roster setup

In `/admin/roster`, put only the Kick username/slug:

```text
streamername
```

If you paste a full URL like this:

```text
https://kick.com/streamername
```

the backend cleans it and saves:

```text
streamername
```

## Restart after editing `.env`

On the VPS:

```powershell
cd C:\A2_website
pm2 restart a2-website-api --update-env
```

If you run manually instead of PM2, stop the backend with `CTRL + C`, then:

```powershell
cd C:\A2_website
node .\server\src\index.js
```

## Check logs

```powershell
pm2 logs a2-website-api --lines 100
```

Look for lines starting with:

```text
[kick]
[streamers] Kick live check failed
```

## Test Kick status

Replace `streamername` with a real Kick channel slug:

```text
https://ancient-liver-drool.ngrok-free.dev/api/kick/status/streamername
```

Expected live response:

```json
{
  "slug": "streamername",
  "online": true,
  "channel": {},
  "stream": {},
  "checkedAt": "2026-06-22T00:00:00.000Z"
}
```

Expected offline response:

```json
{
  "slug": "streamername",
  "online": false,
  "channel": {},
  "stream": null,
  "checkedAt": "2026-06-22T00:00:00.000Z"
}
```

## Troubleshooting

- `kick_not_configured`: one of `KICK_API_BASE_URL`, `KICK_OAUTH_BASE_URL`, `KICK_CLIENT_ID`, or `KICK_CLIENT_SECRET` is missing from backend `.env`.
- `kick_token_failed`: Kick rejected the client ID/secret or token request.
- `kick_api_failed`: the token worked, but the channel/livestream API call failed.
- If `.env` was changed, always run `pm2 restart a2-website-api --update-env`.
- Never put `KICK_CLIENT_SECRET` in Netlify environment variables.
