# tipico-frontend

Next.js app for the Tipico betting UI. All data comes from the **backend API** (not API-Football from the browser).

## Local development

```bash
npm install
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL to your API (e.g. http://localhost:4000/api or Render)
npm run dev
```

## Deploy on Vercel (from GitHub)

1. Push this repo to GitHub.
2. [Vercel](https://vercel.com) → **Add New** → **Project** → import **`Shikur-Ebrahim/tipico-frontend`** (or your fork).
3. **Framework preset:** Next.js (auto). **Root directory:** leave default (repo root).
4. **Environment variables** (Production + Preview):

   | Name | Example |
   |------|---------|
   | `NEXT_PUBLIC_API_URL` | `https://YOUR-BACKEND.onrender.com/api` |
   | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
   | `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Unsigned upload preset (deposits / admin logos) |

5. **Deploy.** After the first deploy, any env change needs **Redeploy**.

**CORS:** The backend must allow your Vercel origin (this project’s API uses open `cors()` by default).

## Build

```bash
npm run build
```

Requires **Node 20+** (matches Vercel default).
