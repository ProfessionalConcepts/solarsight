# SolarSight Deployment

The frontend and backend deploy as separate services:

- Vercel hosts `frontend/`.
- Railway hosts `backend/`, PostgreSQL, and Redis.

## Vercel frontend

1. Push the repository to GitHub.
2. In Vercel, import the repository and set **Root Directory** to `frontend`.
3. Leave the framework as **Next.js** and use the default build settings:

   ```text
   Install command: npm install
   Build command: npm run build
   Output directory: `.next`
   ```

   If Vercel shows custom settings under **Settings → Build and Deployment**, set them exactly to `npm install`, `npm run build`, and `.next`. Do not use `--prefix frontend` when the Root Directory is already `frontend`.

4. Add this environment variable in the Vercel project settings:

   ```text
   NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-SERVICE.up.railway.app/api
   ```

5. Deploy. Every push to the selected Git branch will create a new deployment.

The frontend can also be built manually from the repository root:

```bash
npm install --prefix frontend
npm run build --prefix frontend
```

## Railway backend

Create a Railway project with three services:

1. Add a PostgreSQL service.
2. Add a Redis service.
3. Add the GitHub repository as a service and set its root directory to `backend`.

Railway will use `backend/railway.toml` and `backend/Dockerfile`. Add these variables to the backend service:

```text
DATABASE_URL=<Railway PostgreSQL connection URL>
REDIS_URL=<Railway Redis connection URL>
ADMIN_TOKEN=<long random secret>
FRONTEND_ORIGIN=https://YOUR-VERCEL-DOMAIN.vercel.app
CONTACT_EMAIL=your-email@example.com
```

The container runs migrations before starting FastAPI. After deployment, verify:

```text
https://YOUR-RAILWAY-SERVICE.up.railway.app/api/health
```

Expected response:

```json
{"status":"ok"}
```

Copy that Railway URL into Vercel as `NEXT_PUBLIC_API_URL`, then redeploy the frontend.

## Custom domains and CORS

If you add a custom Vercel domain, update `FRONTEND_ORIGIN` on Railway to the exact `https://` origin and redeploy the backend. Never commit database URLs, Redis URLs, or `ADMIN_TOKEN`.