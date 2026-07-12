# Department portals

This feature adds public EMS, Police, and FIB pages plus protected department-management tools.

## Routes

- Public hub: `/departments`
- EMS: `/departments/ems`
- Police: `/departments/police`
- FIB: `/departments/fib`
- Management: `/departments/ems/manage`, `/departments/police/manage`, `/departments/fib/manage`

Public visitors can view department directories, ranks, wings, uniforms, and vehicles. Management controls are loaded only for users that pass backend authorization.

## Backend APIs

Public:

- `GET /api/departments`
- `GET /api/departments/:department`
- `GET /api/departments/:department/employees`
- `GET /api/departments/:department/ranks`
- `GET /api/departments/:department/wings`
- `GET /api/departments/:department/uniforms`
- `GET /api/departments/:department/vehicles`

Protected:

- `GET /api/departments/:department/access`
- `GET /api/departments/:department/users/search`
- `POST/PATCH/DELETE /api/departments/:department/employees`
- `POST/DELETE /api/departments/:department/roles/member`
- `POST/DELETE /api/departments/:department/roles/management`
- `POST/PATCH/DELETE /api/departments/:department/ranks`
- `POST/PATCH/DELETE /api/departments/:department/wings`
- `POST/PATCH/DELETE /api/departments/:department/uniforms`
- `POST/PATCH/DELETE /api/departments/:department/vehicles`
- `GET /api/departments/:department/audit-log`

Every protected write checks the current logged-in user on the server.

## Roles

Database-backed application roles are stored in `department_role_assignments`:

- `ems_member`
- `ems_management`
- `police_member`
- `police_management`
- `fib_member`
- `fib_management`

Management roles inherit member access. Department managers can grant/remove regular member access only for their own department. Only existing Master Admins can grant/remove management roles.

Existing Master Admin accounts automatically manage all departments through the normal `master_access` permission. You do not need to duplicate Master Admins into the department role table.

## Discord

The site already uses Discord OAuth for login/linking. Department portals reuse that flow.

Optional Discord role IDs can be kept in backend environment variables for future bot synchronization:

```env
DISCORD_GUILD_ID=
DISCORD_EMS_MEMBER_ROLE_ID=
DISCORD_EMS_MANAGEMENT_ROLE_ID=
DISCORD_POLICE_MEMBER_ROLE_ID=
DISCORD_POLICE_MANAGEMENT_ROLE_ID=
DISCORD_FIB_MEMBER_ROLE_ID=
DISCORD_FIB_MANAGEMENT_ROLE_ID=
```

Do not put real bot tokens, client secrets, or role IDs in frontend `VITE_*` variables.

## Migration

Run this once on the production database after pulling the commit:

```powershell
mysql -u root -p qbcore < C:\A2_website\database\migrations\2026_07_12_department_portals.sql
```

Use your real MySQL username/database name if they differ from `root` and `qbcore`.

The migration creates department tables and seeds only:

- EMS
- Police
- FIB

It does not create fake employees, ranks, wings, uniforms, or vehicles.

## Uploads

Uniform and vehicle images use the existing backend upload middleware and Cloudinary service. Make sure the backend VPS has:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Production deployment checklist

1. Pull latest code on the VPS.
2. Run the migration above.
3. Confirm backend `.env` has Discord OAuth, JWT/session secrets, CORS origins, MySQL, and Cloudinary values.
4. Restart the backend process with updated env.
5. Deploy the Netlify frontend build.
6. Log in as Master Admin.
7. Open `/departments/ems/manage`, `/departments/police/manage`, and `/departments/fib/manage`.
8. Add the first real management users from the Member access section.
9. Add real ranks and wings.
10. Add real employees, uniforms, and vehicles.

## Troubleshooting

- `department_database_not_ready`: run the migration on the backend database.
- `department_permission_denied`: the logged-in user is not Master Admin and does not have that department's management role.
- Upload failures: verify Cloudinary env vars and backend restart.
- Discord login loops: verify `DISCORD_REDIRECT_URI`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `JWT_SECRET`, `SESSION_SECRET`, and `OAUTH_STATE_SECRET`.
