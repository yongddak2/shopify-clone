# Local PC Hosting

This project can run its application and database on the same Windows PC. PostgreSQL and the other infrastructure services must remain private; only the HTTPS reverse proxy should accept internet traffic.

## Local infrastructure

Start Docker Desktop, then run from the repository root:

```powershell
docker compose up -d postgres redis
docker compose ps
```

The application connects to PostgreSQL at `localhost:5432/shopdb`. The named `postgres_data` volume preserves data across container restarts and recreation. Do not run `docker compose down -v` unless permanent data deletion is intended.

## Network boundary

The Compose ports bind to `127.0.0.1`, so PostgreSQL, Redis, Elasticsearch, Kafka, and their management ports are not directly reachable from the LAN or internet.

- Do not forward ports `5432`, `6379`, `9200`, `2181`, `9092`, or `8989` on the router.
- Put the frontend/backend behind an HTTPS reverse proxy such as Caddy or Nginx.
- Forward only TCP `80` and `443` to the reverse proxy host.
- Restrict Windows Firewall inbound rules to the required web ports.

## Before real traffic

Replace all development passwords and keys with randomly generated secrets stored only in ignored local environment files. Configure automatic PostgreSQL backups to a different physical device or encrypted remote storage, and perform a restore test. A named Docker volume is persistence, not a backup.

This setup does not clear the launch blockers in `docs/PRODUCTION_READINESS.md`.
