# Photo Portfolio — Setup Guide

A professional photography portfolio built with React, TanStack Router, Supabase, and AWS S3.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ installed
- A [Supabase](https://supabase.com/) account (free tier works)
- An [AWS](https://aws.amazon.com/) account with S3 access
- (Optional) A [Vercel](https://vercel.com/) account for deployment

---

## 1. Clone & Install

```bash
git clone <your-repo-url>
cd photo-portfolio
npm install
```

## 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com/dashboard)
2. Go to **SQL Editor** and paste the entire contents of [`supabase-setup.sql`](supabase-setup.sql), then click **Run**
3. Find your project credentials in **Project Settings > API**:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon (public) key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role (secret) key** → `SUPABASE_SERVICE_KEY`

## 3. Set Up AWS S3

1. Create an S3 bucket in your preferred region
2. Enable **public read** access on the bucket (so images can be served)
3. Create an IAM user with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` permissions on the bucket
4. Note down the IAM access key and secret
5. (Optional) Create a CloudFront distribution in front of the bucket for faster CDN delivery

> See [S3_SETUP.md](S3_SETUP.md) for detailed step-by-step AWS instructions.

## 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Your site name (shown in header + meta tags)
VITE_SITE_NAME=My Photography
VITE_SITE_URL=https://www.yourdomain.com

# AWS (server-only — never exposed to browser)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name

# CloudFront CDN (optional, for faster image delivery)
VITE_CLOUDFRONT_DOMAIN=your-distribution.cloudfront.net

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Google Analytics (optional)
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

> **Security note:** AWS credentials and the Supabase service key do NOT have the `VITE_` prefix — this keeps them server-only and out of the browser bundle.

## 5. Create Your Admin Account

1. Start the dev server: `npm run dev`
2. Visit `http://localhost:3000/login` and **sign up** with your email
3. Promote yourself to admin in Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

4. Refresh the page — you'll now see the **Dashboard** link in the header

## 6. Start Using It

- **Dashboard** (`/dashboard`): Upload photos, manage categories & cameras, edit home page text, edit contact info, edit your site name
- **Gallery** (`/gallery`): Your public photo gallery
- **Home** (`/`): Hero section + featured photos + about preview
- **Contact** (`/contact`): Your contact details

## 7. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add all your `.env` variables as **Environment Variables** in the Vercel dashboard (Project Settings > Environment Variables).

The app is configured for Vercel via `vercel.json`. It uses Nitro as the server runtime for image optimization and S3 API routes.

---

## Uploading Photos

### Via Dashboard (recommended)
Use the Upload button in the Dashboard. It handles image optimization (3 sizes: thumbnail, medium, large) automatically server-side.

### Via CLI Script
For bulk uploads, place images in `scripts/uploads/` and run:

```bash
npm run upload-photos
```

---

## Project Structure

```
src/
  routes/        # File-based routing (TanStack Router)
  components/    # React components
  data/          # Supabase data fetching
  hooks/         # Custom React hooks
  lib/           # Supabase client, S3 URL helpers
  contexts/      # Auth context
server/
  api/           # Server API routes (Nitro)
    optimize-image.post.ts   # Server-side image optimization
    presigned-upload.post.ts # Generate S3 upload URLs
    delete-image.post.ts     # Delete images from S3
scripts/         # CLI tools for bulk operations
```

## Customization

| What | Where |
|------|-------|
| Site name / branding | Dashboard > Home Page > Site Branding, or `VITE_SITE_NAME` in `.env` |
| Hero text & about bio | Dashboard > Home Page |
| Contact details | Dashboard > Contact Page |
| Categories | Dashboard > Gallery Categories |
| Logo icon | Replace `public/shutter.ico` and `public/shutter.png` |
| Hero background | Replace `public/images/hero/hero-background.jpg` |
| Colors / styling | Edit `src/styles.css` (Tailwind CSS) |
| PWA manifest | Edit `public/manifest.json` |
