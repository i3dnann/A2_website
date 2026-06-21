# Security Notes

- Never commit `.env`, API keys, tokens, Discord secrets, Steam secrets, Twitch/Kick secrets, webhook URLs, database passwords, private keys, logs, `node_modules`, `dist`, or `build`.
- Passwords use bcrypt-compatible hashing via `bcryptjs`.
- Sessions are issued as JWTs and stored in an HTTP-only cookie; the frontend also stores a bearer token for API requests.
- Cookie-only unsafe requests are protected by a CSRF token check.
- RBAC is enforced on every admin route. Frozen or disabled admins cannot use admin routes.
- Only `master_access` can delete/freeze/unfreeze admins or perform dangerous admin changes.
- File uploads are restricted to `png`, `jpg`, `jpeg`, `webp`, and `pdf`; executable/script extensions are rejected.
- Twitch/Kick live checks and all Discord webhooks run only on the backend.
- QBCore character lookup is read-only for normal users and is limited to identifiers linked to the logged-in account.
- Raw database errors are logged server-side and returned as safe API messages.
