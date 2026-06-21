# Security Notes

- Never expose `.env` or secrets in the frontend.
- Discord OAuth secrets, bot tokens, MySQL credentials, Firebase service accounts, Twitch secrets, Kick secrets, and FiveM API tokens belong only on the backend/VPS.
- The frontend uses HTTP-only session cookies. If deployed over HTTPS, set `COOKIE_SECURE=true`.
- Dangerous staff actions must require a reason and must be audited.
- Permanent blacklist removal and master-only settings must require `master_access`.
- File uploads only allow png, jpg, jpeg, webp, and pdf, with safe generated filenames.
- Streamer live status checks are backend-only and cached.
