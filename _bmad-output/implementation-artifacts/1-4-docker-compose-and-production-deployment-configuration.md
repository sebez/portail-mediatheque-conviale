# Story 1.4: Docker Compose & Production Deployment Configuration

Status: review

## Story

As a developer,
I want Docker Compose, nginx, and Dockerfiles configured so the app can be deployed to an OVH/Scaleway VPS with a single command,
So that NFR5 (HTTPS), NFR14 (uptime), NFR15 (backup), and NFR16 (auto-restart) are satisfied before any feature epic is built.

## Acceptance Criteria

1. **Given** a `.env` file is populated from `.env.example`, **when** `docker compose up -d --build` runs on the VPS, **then** the Angular SPA is served by nginx on port 443 with TLS termination **and** HTTP requests on port 80 are redirected to HTTPS **and** requests to `/api/*` are proxied to the backend container with the `/api` prefix stripped.

2. **Given** a backend container crash occurs, **when** Docker detects it, **then** the container restarts automatically (`restart: unless-stopped`) **and** the SQLite database file persists across restarts (stored in a named Docker volume, not in the image layer).

3. **Given** the daily backup cron is configured on the host, **when** it runs, **then** the SQLite named volume file is copied to a timestamped path on the host.

4. **Given** the dev override file exists, **when** `docker compose up` runs locally (without specifying the production file), **then** the dev ports and dev environment variables apply (Compose override convention).

## Tasks / Subtasks

- [x] Task 1: Complete `docker-compose.yml` (production) (AC: #1, #2)
  - [x] Add `ASPNETCORE_ENVIRONMENT=Production` to backend service
  - [x] Add full environment variable mapping from `.env` to backend service
  - [x] Add TLS certificate volume mount to nginx service
  - [x] Confirm `db-data` volume is mounted at `/data` in backend container
  - [x] Verify all services have `restart: unless-stopped`

- [x] Task 2: Complete `docker-compose.override.yml` (dev) (AC: #4)
  - [x] Add `db-data` volume mount at `/data` for backend in dev
  - [x] Add `ASPNETCORE_ENVIRONMENT=Development` already present — confirm correct
  - [x] Confirm ports: backend `5000:5000`, frontend `4200:80`

- [x] Task 3: Complete `nginx/nginx.conf` (AC: #1)
  - [x] Enable TLS cert directives (file paths: `/etc/nginx/certs/fullchain.pem`, `/etc/nginx/certs/privkey.pem`)
  - [x] Replace `root /usr/share/nginx/html;` approach with `proxy_pass http://frontend:80;` for `/` location
  - [x] Confirm `/api/` location uses `proxy_pass http://backend:5000/;` (trailing slash strips prefix)
  - [x] Add `proxy_set_header X-Forwarded-Proto $scheme;` headers

- [x] Task 4: Complete `backend/Dockerfile` (AC: #2)
  - [x] Ensure `/data` directory is created in the image so Docker volume can mount cleanly
  - [x] Confirm `EXPOSE 5000` and `ASPNETCORE_URLS=http://+:5000` are set correctly

- [x] Task 5: Complete `frontend/Dockerfile` (AC: #1)
  - [x] Verify Angular build output path: `dist/frontend/browser` (Angular project name is `frontend`)
  - [x] Confirm nginx serves on port 80

- [x] Task 6: Update `.env.example` (AC: #1, #4)
  - [x] Add all missing backend environment variable keys for production

- [x] Task 7: Document backup cron setup (AC: #3)
  - [x] Backup cron command documented in `.env.example` with full explanation of volume naming

- [x] Task 8: Validation
  - [x] `dotnet build` — 0 errors, 0 warnings (Docker not available locally but build artifacts verified)
  - [x] `dotnet test` — 14/14 pass, no regressions
  - [x] Angular dist path `dist/frontend/browser` verified to exist with built files
  - [x] `.env` gitignore entry confirmed
  - [ ] `docker compose up -d` (dev override) — to be verified on a Docker-enabled environment
  - [ ] Full end-to-end Docker deployment — to be verified on VPS

## Dev Notes

### What Already Exists — DO NOT Recreate

| File | Current state | Action for this story |
|------|---------------|----------------------|
| `docker-compose.yml` | Stub — services defined, volumes defined, `restart: unless-stopped` in place, `env_file: .env` in place | COMPLETE: add env vars, TLS cert volume, `/data` mount confirmation |
| `docker-compose.override.yml` | Stub — dev ports and `ASPNETCORE_ENVIRONMENT=Development` | COMPLETE: add `db-data` volume mount for dev |
| `nginx/nginx.conf` | Stub — HTTP→HTTPS redirect present, SSL server block structure present, `/api/` proxy_pass to `backend:5000/` present | COMPLETE: enable TLS certs, replace `root/try_files` with `proxy_pass http://frontend:80;` |
| `backend/Dockerfile` | Stub — multi-stage build: `sdk:10.0` → `aspnet:10.0`, copies publish output | COMPLETE: add `RUN mkdir -p /data` |
| `frontend/Dockerfile` | Stub — `node:22-alpine` build → `nginx:alpine` final, COPY to `/usr/share/nginx/html` | VERIFY dist path is `dist/frontend/browser` |
| `.env.example` | Partially filled — `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, `GOOGLE_BOOKS_API_KEY`, `CORS_ORIGIN` present | ADD missing keys: `ConnectionStrings__DefaultConnection`, `Cors__AllowedOrigins`, `Jwt__Secret` |
| `backend/Program.cs` | COMPLETE — reads all config correctly, CORS from `Cors:AllowedOrigins`, JWT from `Jwt:Secret` | NO CHANGE NEEDED |
| `backend/appsettings.Development.json` | COMPLETE — `ConnectionStrings:DefaultConnection = Data Source=Data/mediatheque.db` (local path) | NO CHANGE NEEDED |

### docker-compose.yml — Complete Final Version

Replace the stub content entirely with:

```yaml
# Production Docker Compose
# Deploy with: docker compose up -d --build
# Requires a .env file populated from .env.example

version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file: .env
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      # All secrets come from .env file (env_file above)
      # These are mapped to ASP.NET Core config via double-underscore convention:
      # ConnectionStrings__DefaultConnection → Configuration.GetConnectionString("DefaultConnection")
      # Jwt__Secret → Configuration["Jwt:Secret"]
      # Cors__AllowedOrigins → Configuration["Cors:AllowedOrigins"]
      # ADMIN_USERNAME and ADMIN_PASSWORD → read directly in Program.cs
    volumes:
      - db-data:/data

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt/live/your-domain.com/fullchain.pem:/etc/nginx/certs/fullchain.pem:ro
      - /etc/letsencrypt/live/your-domain.com/privkey.pem:/etc/nginx/certs/privkey.pem:ro
    depends_on:
      - frontend
      - backend

volumes:
  db-data:
    # Named volume — persists SQLite DB across container restarts and image upgrades
    # Mounted at /data inside backend container → actual DB file: /data/mediatheque.db
```

**IMPORTANT — TLS cert paths:** The nginx cert volume mounts use Let's Encrypt default paths (`/etc/letsencrypt/live/your-domain.com/`). Replace `your-domain.com` with the actual VPS hostname. On OVH/Scaleway, these are created by `certbot` and renewed automatically. If using OVH-managed certificates, adjust paths accordingly.

### docker-compose.override.yml — Complete Final Version

Replace with:

```yaml
# Local dev overrides — applied automatically when running: docker compose up
# Do NOT use this file on the VPS.

version: '3.8'

services:
  backend:
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      # Dev DB + config are from appsettings.Development.json
      # No ADMIN_USERNAME/ADMIN_PASSWORD needed — Program.cs falls back to "admin"/"admin" in dev
    ports:
      - "5000:5000"
    volumes:
      - db-data:/data  # Keep SQLite persisted in dev too

  frontend:
    ports:
      - "4200:80"  # Angular static files served by the frontend nginx container on 4200

volumes:
  db-data:
```

**Why dev also mounts `db-data`:** Without this, the dev backend tries to write `Data Source=Data/mediatheque.db` (from `appsettings.Development.json`) — a local path inside the container that won't survive restarts. But since `appsettings.Development.json` uses the relative path (`Data Source=Data/mediatheque.db`), the volume mount at `/data` is NOT used in dev — instead the DB lives inside the container at the relative path. This is acceptable for dev: losing the dev DB on container rebuild is fine. If the developer wants a persistent dev DB, they must manually set `ConnectionStrings__DefaultConnection=Data Source=/data/mediatheque.db` in the override. **Do NOT change `appsettings.Development.json` for this** — keep the relative path there.

### nginx/nginx.conf — Complete Final Version

Replace the stub content entirely with:

```nginx
# nginx reverse proxy configuration
# Serves Angular SPA (via proxy to frontend container)
# Proxies /api/* to backend container (strips /api prefix)
# Handles TLS termination and HTTP→HTTPS redirect

server {
    listen 80;
    server_name _;

    # Redirect all HTTP traffic to HTTPS (NFR5)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name _;

    # TLS certificates (mounted via Docker Compose volumes)
    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    # Modern TLS — disable old protocols
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # API proxy — strip /api prefix, forward to backend container
    # CRITICAL: trailing slash on proxy_pass strips the /api prefix
    # /api/books → http://backend:5000/books (NOT /api/books)
    location /api/ {
        proxy_pass http://backend:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA proxy — forward all other requests to the Angular frontend container
    # The frontend nginx handles Angular router's try_files logic internally
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Why `proxy_pass http://frontend:80` instead of `root /usr/share/nginx/html`:**
The `frontend` Docker service already runs an nginx that serves the Angular static files and handles client-side routing (`try_files $uri $uri/ /index.html`). Proxying to it avoids sharing volumes between containers and keeps the architecture clean. The two-nginx hop is inconsequential for this scale.

**Why trailing slash on `/api/` proxy_pass:**
`proxy_pass http://backend:5000/;` — the trailing slash causes nginx to strip the `/api` prefix before forwarding. Without the trailing slash, `/api/books` would forward as `/api/books` to the backend, causing 404 because the backend routes are `/books`, `/auth`, etc. (no `/api` prefix in .NET routes).

### backend/Dockerfile — Complete Final Version

Replace with:

```dockerfile
# Backend Dockerfile — multi-stage build
# Stage 1: SDK build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["PortailMediatheque.Api.csproj", "."]
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Stage 2: Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Create /data directory for SQLite volume mount
# Docker will mount the named volume here; the directory must exist
RUN mkdir -p /data

COPY --from=build /app/publish .

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000

ENTRYPOINT ["dotnet", "PortailMediatheque.Api.dll"]
```

**Why `RUN mkdir -p /data`:** When Docker Compose mounts `db-data:/data`, the mount point must exist in the image. Without this, Docker creates it automatically but with root ownership — which can cause permission issues. Explicitly creating it ensures correct behavior.

**Why `ENV ASPNETCORE_URLS=http://+:5000`:** The `appsettings.json` has `"Urls": "http://0.0.0.0:5000"` which already handles this, but the environment variable is an explicit safety net. Both approaches are equivalent.

### frontend/Dockerfile — Complete Final Version

Replace with:

```dockerfile
# Frontend Dockerfile — multi-stage build
# Stage 1: Angular build
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Stage 2: nginx serving the static Angular build output
FROM nginx:alpine AS final

# Angular project name is "frontend" (from angular.json) → dist/frontend/browser
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Angular SPA routing: serve index.html for all unmatched routes
# This is needed because Angular uses client-side routing
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

**Important:** This Dockerfile requires a `frontend/nginx-spa.conf` file (see below).

**Create `frontend/nginx-spa.conf`** with content:
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Why a separate SPA nginx config:** Without `try_files $uri $uri/ /index.html`, deep-linking to Angular routes (e.g., `/livres/42`) returns 404 from nginx because the file doesn't exist on disk. The Angular router handles routing client-side only if the HTML shell is served first.

**Why `dist/frontend/browser`:** Angular 17+ with the esbuild builder outputs to `dist/<project-name>/browser/` (the extra `browser/` subfolder is new in Angular 17). The project name in `angular.json` is `frontend` (created by `ng new portail-mediatheque-frontend --directory ./frontend` or equivalent).

### .env.example — Complete Final Version

Replace with:

```bash
# ─── Admin credentials ────────────────────────────────────────────────────────
# Seeded on first backend startup (Story 1.2) — idempotent
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-secure-password

# ─── JWT configuration ────────────────────────────────────────────────────────
# Must be at least 32 characters — used as HMAC signing key
# ASP.NET Core config key: Jwt:Secret → env var: Jwt__Secret
Jwt__Secret=replace-with-at-least-32-char-random-string

# ─── Database (production only) ───────────────────────────────────────────────
# In production, SQLite is stored in the Docker named volume at /data/
# ASP.NET Core config key: ConnectionStrings:DefaultConnection → env var: ConnectionStrings__DefaultConnection
ConnectionStrings__DefaultConnection=Data Source=/data/mediatheque.db

# ─── CORS (production only) ───────────────────────────────────────────────────
# The domain(s) allowed to call the API — must match the Angular production URL
# Multiple domains: comma-separated (e.g., https://a.com,https://b.com)
# ASP.NET Core config key: Cors:AllowedOrigins → env var: Cors__AllowedOrigins
Cors__AllowedOrigins=https://your-production-domain.com

# ─── Google Books API (Story 6.1) ─────────────────────────────────────────────
GOOGLE_BOOKS_API_KEY=your-google-books-api-key
```

**ASP.NET Core environment variable convention:** Double underscores (`__`) replace colons (`:`) in config keys when using environment variables. So `Jwt:Secret` → `Jwt__Secret` and `Cors:AllowedOrigins` → `Cors__AllowedOrigins`.

**Do NOT add `ASPNETCORE_ENVIRONMENT` to `.env.example`:** That variable is set directly in `docker-compose.yml` under the `backend.environment` section — not from the `.env` file. This prevents accidentally deploying with `Development` environment.

### Host Backup Cron — Required Manual Step on VPS

The daily SQLite backup is NOT automated via Docker — it's a host-level cron job. Instruct the VPS operator to run:

```bash
# Add to crontab (crontab -e) on the VPS host
# Runs at 2:00 AM daily, copies SQLite volume file to timestamped backup
0 2 * * * docker run --rm -v portail-mediatheque-conviale_db-data:/data -v /opt/backups/mediatheque:/backup alpine \
  cp /data/mediatheque.db /backup/mediatheque-$(date +\%Y\%m\%d).db
```

**How it works:**
- `portail-mediatheque-conviale_db-data` is the Docker volume name (Compose prefixes with the project directory name)
- Spins up a temporary alpine container, mounts both the data volume and a host backup directory
- Copies the `.db` file with a datestamped filename
- No Docker Compose project needs to be stopped during backup (SQLite WAL mode handles concurrent reads)

### Environment Variable Mapping Reference

| `.env` key | ASP.NET Core config path | Read in `Program.cs` as |
|---|---|---|
| `ADMIN_USERNAME` | `ADMIN_USERNAME` (flat) | `app.Configuration["ADMIN_USERNAME"]` |
| `ADMIN_PASSWORD` | `ADMIN_PASSWORD` (flat) | `app.Configuration["ADMIN_PASSWORD"]` |
| `Jwt__Secret` | `Jwt:Secret` | `builder.Configuration["Jwt:Secret"]` |
| `ConnectionStrings__DefaultConnection` | `ConnectionStrings:DefaultConnection` | `builder.Configuration.GetConnectionString("DefaultConnection")` |
| `Cors__AllowedOrigins` | `Cors:AllowedOrigins` | `builder.Configuration["Cors:AllowedOrigins"]` |
| `GOOGLE_BOOKS_API_KEY` | `GOOGLE_BOOKS_API_KEY` (flat) | Used in Story 6.1 `IsbnService` |

**Critical:** In production, `Program.cs` throws if `Jwt:Secret` is missing:
```csharp
if (string.IsNullOrWhiteSpace(jwtSecret) && builder.Environment.IsProduction())
    throw new InvalidOperationException("Jwt:Secret must be configured in production.");
```
Ensure `Jwt__Secret` is always set in the production `.env` file.

### NFRs Addressed

| NFR | Implementation |
|-----|----------------|
| NFR5 (HTTPS) | nginx HTTP→HTTPS redirect (`return 301`) + TLS termination on port 443 |
| NFR9 (No stack traces) | `ASPNETCORE_ENVIRONMENT=Production` in `docker-compose.yml` — activates `ExceptionHandlingMiddleware` production branch |
| NFR14 (≥99% uptime) | `restart: unless-stopped` on all services — Docker restarts crashed containers |
| NFR15 (Daily backup) | Host cron + named Docker volume — documented in Dev Notes above |
| NFR16 (Auto-restart) | `restart: unless-stopped` in `docker-compose.yml` |

### Anti-Patterns to Avoid

| Anti-pattern | Correct approach |
|---|---|
| `proxy_pass http://backend:5000/api/;` (keeps prefix) | `proxy_pass http://backend:5000/;` — trailing slash strips `/api` prefix |
| Hardcoding `ASPNETCORE_ENVIRONMENT=Development` in `docker-compose.yml` | Set `Production` in prod file; override to `Development` in `.override.yml` |
| Storing SQLite file inside the Docker image layer | Named volume at `/data` — persists across image rebuilds |
| Using `root /usr/share/nginx/html` in the reverse proxy nginx | `proxy_pass http://frontend:80` — the frontend container handles SPA routing |
| Committing `.env` with real secrets to git | Only `.env.example` goes in git; `.env` is gitignored |
| Forgetting `nginx-spa.conf` in the frontend build | Without `try_files`, Angular deep links return 404 |
| Volume name mismatch in backup cron | Volume is `<compose-project-name>_db-data` — verify with `docker volume ls` |

### Cross-Story Dependencies

- **Story 1.2** set `ADMIN_USERNAME`/`ADMIN_PASSWORD` as required env vars in production — this story wires them via `.env` + `env_file`.
- **Story 1.3** set `ASPNETCORE_ENVIRONMENT=Production` as the trigger for no-stack-trace ProblemDetails — this story sets that variable in `docker-compose.yml`.
- **All future stories**: API routes in .NET use NO `/api` prefix — nginx strips it. Backend routes stay as `/books`, `/auth`, etc. This is an architectural invariant established here.
- **Story 6.1**: `GOOGLE_BOOKS_API_KEY` is already in `.env.example` — no change needed at that point.

### Deployment Command Reference

```bash
# On the VPS — first deployment
git clone <repo> && cd portail-mediatheque-conviale
cp .env.example .env
# Edit .env with real secrets: ADMIN_PASSWORD, Jwt__Secret, Cors__AllowedOrigins, GOOGLE_BOOKS_API_KEY
# Ensure TLS certs exist at /etc/letsencrypt/live/<domain>/

docker compose up -d --build

# Subsequent deployments
git pull
docker compose up -d --build

# Verify all containers running
docker compose ps

# View backend logs
docker compose logs backend --tail=50
```

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `dotnet build` — 0 errors, 0 warnings (backend + backend.Tests)
- `dotnet test` — 14/14 passed (no regressions from infrastructure changes; Docker config does not affect .NET unit tests)
- Angular dist path `frontend/dist/frontend/browser` verified to contain production build artifacts
- `.env` gitignore entry confirmed on line 1-2 of `.gitignore`
- Docker not available in local dev environment — `docker compose build` not run; all config reviewed manually for correctness

### Completion Notes List

- ✅ Task 1: `docker-compose.yml` completed — `ASPNETCORE_ENVIRONMENT=Production` added to backend environment; TLS cert volume mounts added for nginx (Let's Encrypt paths); `db-data` volume mounted at `/data` in backend; all services have `restart: unless-stopped`; env var convention documented in comments.
- ✅ Task 2: `docker-compose.override.yml` completed — `db-data:/data` volume mount added for backend in dev; ports confirmed (`5000:5000`, `4200:80`); `ASPNETCORE_ENVIRONMENT=Development` present.
- ✅ Task 3: `nginx/nginx.conf` completed — TLS cert directives enabled; `root/try_files` approach replaced with `proxy_pass http://frontend:80;` (SPA routing handled by frontend nginx internally); `/api/` uses `proxy_pass http://backend:5000/;` with trailing slash to strip prefix; `X-Forwarded-Proto` header added; TLSv1.2/1.3 only.
- ✅ Task 4: `backend/Dockerfile` completed — `RUN mkdir -p /data` added before copying publish output; `ENV ASPNETCORE_URLS=http://+:5000` set; `EXPOSE 5000` confirmed.
- ✅ Task 5: `frontend/Dockerfile` completed — dist path `dist/frontend/browser` verified against actual build output; `nginx-spa.conf` created and copied into image for Angular SPA routing (`try_files $uri $uri/ /index.html`).
- ✅ Task 6: `.env.example` updated — `Jwt__Secret`, `ConnectionStrings__DefaultConnection`, `Cors__AllowedOrigins` added with double-underscore naming convention explained; backup cron command included as comment.
- ✅ Task 7: Backup cron documented in `.env.example` with full docker run command, volume naming explanation, and crontab placement instructions.
- ✅ Task 8: `dotnet build` 0 errors, `dotnet test` 14/14 — no regressions. Docker end-to-end deployment to be verified on VPS with actual TLS certs.

## File List

**Modified files:**
- `docker-compose.yml` — completed from stub: production environment, TLS cert mounts, volume comments
- `docker-compose.override.yml` — completed from stub: db-data volume mount, port confirmations
- `nginx/nginx.conf` — completed from stub: TLS enabled, proxy_pass to frontend:80, X-Forwarded-Proto headers
- `backend/Dockerfile` — completed from stub: added `RUN mkdir -p /data`, `ENV ASPNETCORE_URLS`
- `frontend/Dockerfile` — completed from stub: added `nginx-spa.conf` COPY step
- `.env.example` — updated: added `Jwt__Secret`, `ConnectionStrings__DefaultConnection`, `Cors__AllowedOrigins`, backup cron documentation

**New files:**
- `frontend/nginx-spa.conf` — nginx config for Angular SPA routing (`try_files $uri $uri/ /index.html`)

## Change Log

| Date | Change |
|------|--------|
| 2026-04-14 | Story created — Docker Compose, nginx, Dockerfiles, .env.example plan documented. |
| 2026-04-14 | Implementation complete — all 6 stub files completed; `frontend/nginx-spa.conf` created; backup cron documented; 14/14 tests pass. |
