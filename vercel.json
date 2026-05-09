# Shift Schedule App

> Built for teams that never stop.

Multi-business shift scheduling app — Supabase + Vercel + GitHub.

---

## Stack
- **Frontend**: Vanilla HTML/CSS/JS (no framework)
- **Backend**: Vercel Serverless Functions (`/api/*.js`)
- **Database**: Supabase (PostgreSQL)
- **Deploy**: GitHub → Vercel (auto-deploy on push)

---

## Setup

### 1. Supabase — Run the SQL schema

1. Open your Supabase project
2. Go to **SQL Editor** → **New query**
3. Paste the entire contents of `supabase_schema.sql`
4. Click **Run**

This creates all tables and seeds Thunder's account.

### 2. GitHub — Push the code

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/shift-schedule.git
git push -u origin main
```

### 3. Vercel — Deploy

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New → Project**
3. Import your `shift-schedule` GitHub repo
4. Before deploying, add **Environment Variables**:
   - `SUPABASE_URL` = `https://wohislvabmhscsebhtrk.supabase.co`
   - `SUPABASE_SERVICE_KEY` = your service_role key (from Supabase → Settings → API → Legacy → service_role)
5. Click **Deploy**

Your app is live at `https://shift-schedule-xxx.vercel.app`

---

## Credentials

### Thunder (Super Admin)
- Username: `thunder`
- Password: `Thunder@SuperAdmin99`
- No business code needed

### Creating your first business
1. Log in as Thunder
2. Click **+ New Business** 
3. Give it a name — you'll get a Business Code (e.g. `BIZ-4X9K`)
4. Click **Edit** on the business → **+ Manager** to add the first manager
5. Share the Business Code with your team

---

## Project Structure

```
shift-schedule/
├── index.html              ← Main app (login + dashboard)
├── css/
│   └── styles.css          ← All styles
├── js/
│   ├── config.js           ← Public config (Supabase URL)
│   └── app.js              ← All client-side logic
├── api/
│   ├── _supabase.js        ← Shared Supabase client (server-only)
│   ├── auth.js             ← Login endpoint
│   ├── businesses.js       ← CRUD businesses + members
│   ├── schedule.js         ← Weekly schedule
│   ├── attendance.js       ← Clock in/out
│   └── data.js             ← Leave, resets, notifications, settings
├── supabase_schema.sql     ← Run this in Supabase SQL Editor
├── vercel.json             ← Vercel config
├── package.json            ← Dependencies
└── .env.example            ← Copy to .env.local (never commit)
```

---

## Security

- **Service key** is only in Vercel environment variables — never in client code
- **Publishable key** is not used (all DB access goes through `/api/*` routes)
- Row Level Security is enabled on all tables
- Passwords are stored as plain text currently — upgrade to bcrypt for production
