# Windows VPS Install Guide

This guide is for a Windows Server VPS that you access with Remote Desktop.

## 1. Connect to VPS

On your PC:

1. Press `Windows + R`
2. Type `mstsc`
3. Connect to your VPS IP
4. Login as `Administrator`

All commands below are typed inside the VPS.

## 2. Install Programs

Download and install:

- Node.js 20 LTS: https://nodejs.org/
- Git for Windows: https://git-scm.com/download/win

Restart PowerShell after installing.

Check:

```powershell
node -v
npm -v
git --version
```

## 3. Download Website

Open PowerShell as Administrator:

```powershell
cd C:\
git clone https://github.com/i3dnann/A2_website.git
cd C:\A2_website
npm.cmd run install:all
```

## 4. Create Environment File

```powershell
Copy-Item .env.example .env
notepad .env
```

Minimum settings:

```env
PORT=80
NODE_ENV=production
FRONTEND_URL=http://YOUR_VPS_IP
CORS_ALLOWED_ORIGINS=http://YOUR_VPS_IP
USE_DATABASE=true

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=YOUR_MYSQL_PASSWORD
MYSQL_DATABASE=qbcore

JWT_SECRET=PASTE_LONG_RANDOM_SECRET
SESSION_SECRET=PASTE_LONG_RANDOM_SECRET
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
MASTER_ADMIN_EMAILS=your@email.com
```

Generate secrets:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Run it twice. Use one value for `JWT_SECRET` and one for `SESSION_SECRET`.

If you use a real HTTPS domain later, change:

```env
FRONTEND_URL=https://yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
COOKIE_SECURE=true
```

## 5. Import Database

If MySQL is installed on the VPS and `mysql.exe` works:

```powershell
mysql -u root -p qbcore < database\DATABASE_SCHEMA.sql
mysql -u root -p qbcore < database\seed.sql
```

If PowerShell says `mysql` is not recognized, import `database\DATABASE_SCHEMA.sql` and `database\seed.sql` with HeidiSQL:

1. Open HeidiSQL
2. Connect to your CFW database
3. Select the `qbcore` database
4. File > Load SQL file
5. Open `C:\A2_website\database\DATABASE_SCHEMA.sql`
6. Press Run
7. Repeat for `C:\A2_website\database\seed.sql`

## 6. Build Website

```powershell
npm.cmd run build --prefix client
```

## 7. Start Website

For a quick test:

```powershell
npm.cmd run start:server
```

Open in browser on the VPS:

```text
http://127.0.0.1
http://127.0.0.1/health
```

From your own PC:

```text
http://YOUR_VPS_IP
http://YOUR_VPS_IP/health
```

## 8. Keep It Running With PM2

```powershell
npm.cmd install -g pm2
pm2 start "npm.cmd run start:server" --name a2-website
pm2 save
```

If Windows Firewall asks, allow Node.js on public/private networks.

## 9. Open Firewall Port

In Administrator PowerShell:

```powershell
New-NetFirewallRule -DisplayName "A2 Website HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
```

If you use backend on port `3001` instead of `80`, open:

```powershell
New-NetFirewallRule -DisplayName "A2 Website API" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

## 10. First Admin

1. Register using the email in `MASTER_ADMIN_EMAILS`
2. Open `/admin`
3. Add more admins from `/admin/admins`

## Updating Later

```powershell
cd C:\A2_website
git pull
npm.cmd run install:all
npm.cmd run build --prefix client
pm2 restart a2-website
```
