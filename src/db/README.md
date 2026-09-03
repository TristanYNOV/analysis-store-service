# Database layer (P3)

This folder now contains the PostgreSQL + Drizzle bootstrap used by the next implementation phases.

## Files

- `schema.ts`: Drizzle schema for `timelines`, `panels`, and `outbox_events`.
- `db.service.ts`: Nest service exposing Drizzle + PostgreSQL pool.
- `db.module.ts`: Global Nest module exporting `DbService`.
- `scripts/check-connection.ts`: simple runtime DB connection check.

## Commands

- `npm run db:generate` to generate migration files from schema.
- `npm run db:migrate` to ensure, apply, and verify migrations.
- `npm run db:migrate:raw` to run Drizzle's migrator directly.
- `npm run db:studio` to inspect data with Drizzle Studio.
- `npm run db:check` to verify connection with current `DATABASE_URL`.

## PostgreSQL local reminder

The Docker service is initialized with:
- `POSTGRES_USER=analysis_store`
- `POSTGRES_PASSWORD=analysis_store`
- `POSTGRES_DB=analysis_store`

So local checks must use:

```bash
docker compose exec postgres psql -U analysis_store -d analysis_store
```
