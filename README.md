# tipico-frontend

Next.js app for the Tipico betting UI. All data comes from the **backend API on Render** (not API-Football from the browser).

## Deploy on Vercel (from GitHub)

1. Push this repo to GitHub.
2. [Vercel](https://vercel.com) → **Add New** → **Project** → import your repository.
3. **Framework preset:** Next.js (auto). **Root directory:** repo root for this app.
4. **Environment variables** (Production + Preview) — required for build and runtime:

   | Name | Example |
   |------|---------|
   | `NEXT_PUBLIC_API_URL` | `https://YOUR-BACKEND.onrender.com/api` |
   | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
   | `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Unsigned upload preset (deposits / admin logos) |

5. **Deploy.** After the first deploy, any env change needs **Redeploy**.

**CORS:** The Render API uses open `cors()` by default, so Vercel origins are allowed.

## Build

```bash
npm run build
```

Requires **Node 20+** and **`NEXT_PUBLIC_API_URL`** set (same value as on Vercel).
