# Deploy Frontend to Netlify

## Build Settings

Use these Netlify settings:

- Base directory: `client`
- Build command: `npm run build`
- Publish directory: `client/dist`

## Environment Variables

Add:

```text
VITE_API_BASE_URL=https://your-api-domain.com
```

Do not add backend secrets, Discord secrets, MySQL passwords, Twitch secrets, Kick secrets, Firebase service accounts, or FiveM tokens to Netlify.

## Deploy Steps

1. Push this repository to GitHub.
2. Create a new Netlify site from the GitHub repository.
3. Set the base directory, build command, and publish directory above.
4. Add `VITE_API_BASE_URL`.
5. Deploy.

## Backend CORS

On the VPS `.env`, set:

```text
FRONTEND_URL=https://your-netlify-site.netlify.app
CORS_ALLOWED_ORIGINS=https://your-netlify-site.netlify.app
```

If the Netlify URL changes, update these backend values and restart the API.
