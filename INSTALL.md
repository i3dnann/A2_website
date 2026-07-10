# Install A2 Studio Website

If your VPS is Windows Server and you connect with Remote Desktop, use [docs/WINDOWS_VPS_INSTALL.md](docs/WINDOWS_VPS_INSTALL.md) instead of the Ubuntu/Nginx section.

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

These steps assume Ubuntu 22.04/24.04 and a domain such as `a2.yourdomain.com`.

### 1. Update VPS packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx mysql-client
```

### 2. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 3. Download the website

```bash
cd /var/www
sudo git clone https://github.com/i3dnann/A2_website.git
sudo chown -R $USER:$USER /var/www/A2_website
cd /var/www/A2_website
```

### 4. Install dependencies

```bash
npm run install:all
```

### 5. Configure backend environment

```bash
cp .env.example .env
nano .env
```

Minimum production values:

```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://a2.yourdomain.com
CORS_ALLOWED_ORIGINS=https://a2.yourdomain.com
USE_DATABASE=true

MYSQL_HOST=YOUR_DB_HOST
MYSQL_PORT=3306
MYSQL_USER=YOUR_DB_USER
MYSQL_PASSWORD=YOUR_DB_PASSWORD
MYSQL_DATABASE=qbcore

JWT_SECRET=replace_with_a_long_random_secret
SESSION_SECRET=replace_with_a_long_random_secret
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
MASTER_ADMIN_EMAILS=your@email.com

DISCORD_REDIRECT_URI=https://a2.yourdomain.com/api/auth/discord/callback
STEAM_REALM=https://a2.yourdomain.com
STEAM_RETURN_URL=https://a2.yourdomain.com/api/auth/steam/callback
```

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 6. Import database tables

If MySQL is on the same VPS:

```bash
mysql -u root -p qbcore < database/DATABASE_SCHEMA.sql
mysql -u root -p qbcore < database/seed.sql
```

If MySQL is on another host:

```bash
mysql -h YOUR_DB_HOST -u YOUR_DB_USER -p qbcore < database/DATABASE_SCHEMA.sql
mysql -h YOUR_DB_HOST -u YOUR_DB_USER -p qbcore < database/seed.sql
```

### 7. Build the frontend

```bash
npm run build --prefix client
```

### 8. Start backend with PM2

```bash
sudo npm install -g pm2
pm2 start "npm run start:server" --name a2-website-api
pm2 save
pm2 startup
```

Run the command printed by `pm2 startup`, then check:

```bash
pm2 status
curl http://127.0.0.1:3001/health
```

### 9. Configure Nginx

Create the site config:

```bash
sudo nano /etc/nginx/sites-available/a2-website
```

Paste this, replacing `a2.yourdomain.com`:

```nginx
server {
    listen 80;
    server_name a2.yourdomain.com;

    root /var/www/A2_website/client/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3001/uploads/;
        proxy_set_header Host $host;
    }

    location /health {
        proxy_pass http://127.0.0.1:3001/health;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/a2-website /etc/nginx/sites-enabled/a2-website
sudo nginx -t
sudo systemctl reload nginx
```

### 10. Add HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d a2.yourdomain.com
```

After HTTPS works, visit:

```text
https://a2.yourdomain.com
https://a2.yourdomain.com/health
```

### 11. Create the first admin

1. Make sure your email is in `MASTER_ADMIN_EMAILS`.
2. Register on the website with that email.
3. Open `/admin`.
4. Add other admins from `/admin/admins`.

## First Admin

1. Set `MASTER_ADMIN_EMAILS` or `MASTER_ADMIN_DISCORD_IDS`.
2. Register/login with the matching account.
3. Open `/admin`.
4. Configure site settings, theme, webhooks, content, users, and admins.

## Steam Character Lookup

Players must link Steam from `/account/settings`. After Steam is linked, the backend searches CFW data safely by available identifiers and only returns that account's own characters.
