# Glass Auth API

NestJS/TypeScript modular authentication backend for the existing React application in `../MY Dashborad Glass morfisam`. Docker work is deferred until the final stage. No deployment or business modules are included.

## Local setup

Use Node 22.20+ and npm. MySQL **8+** and Redis must be running; XAMPP's MariaDB is not the test target. The local verification installation uses native MySQL 8.4.10 at `127.0.0.1:3307` and Redis 8.0.6 in WSL Kali at `127.0.0.1:6380`. Existing port 3306 is untouched. Downloads/data/credentials live under ignored `.local/` and `.env`.

```powershell
Set-Location 'D:\UI Project\MY Dashborad Glass morfisam api'
npm ci
# On another machine: copy .env.example to .env and configure credentials.
# The current workspace already has an ignored .env; preserve it.
npm run prisma:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Start the native instances after a restart (configuration is prepared in this workspace):

```powershell
Set-Location 'D:\UI Project\MY Dashborad Glass morfisam api'
$apiRoot = (Get-Location).Path
$mysqlExe = Join-Path $apiRoot '.local\mysql-8.4.10-winx64\bin\mysqld.exe'
$mysqlConfig = Join-Path $apiRoot '.local\my.ini'
Start-Process -FilePath $mysqlExe -ArgumentList ('--defaults-file="' + $mysqlConfig + '"') -WindowStyle Hidden
wsl -d kali-linux -u root -- sh -lc 'mkdir -p /tmp/glass-auth-redis; redis-server --bind 127.0.0.1 --port 6380 --protected-mode yes --daemonize yes --dir /tmp/glass-auth-redis --pidfile /tmp/glass-auth-redis/redis.pid --logfile /tmp/glass-auth-redis/redis.log --appendonly yes'
```

For a fresh native installation, obtain the MySQL Windows ZIP from the [official download site](https://dev.mysql.com/downloads/mysql/), extract it into `.local`, initialize a new data directory, and configure separate application/test databases and a scoped DB account. `node scripts/configure-local.cjs` can prepare ignored local secrets/configuration for the documented paths only when `.env` does not already exist. Do not rerun initialization on an existing data directory. Redis was installed in the existing Kali WSL distribution with `apt-get install redis-server`; no container runtime is involved.

In separate terminals, start the local email viewer, worker, then frontend:

```powershell
# API directory; all messages stay on this machine
npm run mail:dev
npm run dev:worker

Set-Location 'D:\UI Project\MY Dashborad Glass morfisam'
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. Vite proxies `/api` to `127.0.0.1:3000`. Use the same host consistently for cookies. The local email viewer runs at `http://127.0.0.1:8025` and stores messages only in process memory. For real email, configure SMTP or Resend explicitly; no external email was sent during development.

## Commands and verification

```powershell
npm run check             # ESLint, build, unit tests
npm run typecheck         # includes tests
npm run db:migrate:test   # apply migrations to isolated TEST_DATABASE_URL
npm run test:integration  # isolated TEST_DATABASE_URL, real Redis/BullMQ/local SMTP
npm run build
npm start
npm run start:worker

# Frontend directory
npm run check             # lint/build/Chromium/Firefox/WebKit
npm run test:live         # API + worker + local mail viewer must already be running
```

Apply the same migration to `TEST_DATABASE_URL` before integration tests. The runner refuses non-test database names. Tests create uniquely named fixtures and never flush Redis or modify another application's database. No claims about concurrent-user capacity follow from these functional tests.

## Documentation

- [HTTP contract](docs/api.md)
- [Database schema and migrations](docs/database.md)
- [Architecture, security and retry behavior](docs/architecture.md)
- [Capacity testing and deployment preparation](docs/operations.md)
- [Implementation and verification handoff](docs/handoff.md)

Prisma 6.19.3 uses the native MySQL connector and a bounded process-wide pool. Its tooling dependency `deepmerge-ts` is overridden to 8.0.0 to address the dependency audit finding; schema generation/migration are checked with that override. Credentials, generated client/build output and local artifacts are ignored.
