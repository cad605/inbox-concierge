# Fly.io deployment

Docker images are built from the **repository root** (see [`packages/backend/Dockerfile`](../../packages/backend/Dockerfile) and [`packages/web/Dockerfile`](../../packages/web/Dockerfile)). CI uses [`.github/workflows/.deploy.yml`](../../.github/workflows/.deploy.yml).

## GitHub Actions secrets

| Secret          | Used by         | Purpose                                                                                                                              |
| --------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `FLY_API_TOKEN` | Deploy workflow | `flyctl deploy` authentication                                                                                                       |
| `VITE_API_URL`  | Web deploy step | Build-time `--build-arg`; set to the **public backend base URL** (no trailing slash), e.g. `https://inbox-concierge-backend.fly.dev` |

## Fly app secrets (backend: `inbox-concierge-backend`)

Set with `fly secrets set -a inbox-concierge-backend KEY=value` (or the Fly dashboard).

| Variable                    | Notes                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`              | Set automatically if you use **`fly postgres attach`** to this app; otherwise provide a Postgres URL.               |
| `ENCRYPTION_KEY`            | Required; token encryption (`ENCRYPTION_KEY`).                                                                      |
| `OPENROUTER_API_KEY`        | Required for AI features.                                                                                           |
| `AUTH_GOOGLE_CLIENT_ID`     | Google OAuth client ID.                                                                                             |
| `AUTH_GOOGLE_CLIENT_SECRET` | Google OAuth client secret.                                                                                         |
| `AUTH_GOOGLE_REDIRECT_URI`  | Must match an authorized redirect URI in Google Cloud (production callback URL).                                    |
| `CORS_ALLOWED_ORIGINS`      | Comma-separated origins allowed by the API; include the web app origin, e.g. `https://inbox-concierge-web.fly.dev`. |

Optional tuning: `PORT` (default 3000), `HOST` (default `0.0.0.0`), `PG_*`, `LOG_LEVEL`, etc. See backend `HttpConfig` and adapter config modules.

## Database

1. Create Postgres: `fly postgres create` (or use an existing cluster).
2. Attach to the backend app: `fly postgres attach <postgres-app-name> -a inbox-concierge-backend`.

Deploy runs **`[deploy] release_command`** in [`packages/backend/fly.toml`](../../packages/backend/fly.toml): `bun run db:migrate` before new machines serve traffic (requires `DATABASE_URL` on the release machine; Fly injects attached DB secrets).

## Web app

No runtime API URL secret is required if `VITE_API_URL` was correct at **image build** time. To change the API target, rebuild and redeploy the web app with a new `VITE_API_URL` build arg.

## Local Docker smoke test

From the repo root:

```bash
docker build -f packages/backend/Dockerfile -t inbox-backend:local .
docker build -f packages/web/Dockerfile --build-arg VITE_API_URL=https://example.com -t inbox-web:local .
```
