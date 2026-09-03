const fs = require('node:fs');
const path = require('node:path');

const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');

const defaultDatabaseUrl = 'postgres://analysis_store:analysis_store@localhost:5432/analysis_store';
const migrationsFolder = path.resolve(__dirname, '..', 'drizzle');
const repairableBootstrapTags = new Set(['0000_special_ikaris', '0001_user_deletion_processed_events']);

const expectedEnums = {
  outbox_status: ['pending', 'published', 'failed'],
  visibility: ['private', 'club', 'public'],
};

const expectedTables = {
  outbox_events: {
    columns: {
      id: { type: 'uuid', nullable: false },
      event_type: { type: 'text', nullable: false },
      event_version: { type: 'integer', nullable: false },
      aggregate_type: { type: 'text', nullable: true },
      aggregate_id: { type: 'text', nullable: true },
      payload_json: { type: 'jsonb', nullable: false },
      status: { type: 'USER-DEFINED', udtName: 'outbox_status', nullable: false },
      created_at: { type: 'timestamp with time zone', nullable: false },
      published_at: { type: 'timestamp with time zone', nullable: true },
    },
    indexes: [
      'outbox_events_status_idx',
      'outbox_events_event_type_idx',
      'outbox_events_aggregate_idx',
      'outbox_events_created_at_idx',
    ],
  },
  panels: {
    columns: {
      id: { type: 'uuid', nullable: false },
      owner_user_id: { type: 'text', nullable: false },
      visibility: { type: 'USER-DEFINED', udtName: 'visibility', nullable: false },
      club_id: { type: 'text', nullable: true },
      title: { type: 'text', nullable: false },
      description: { type: 'text', nullable: true },
      has_anonymized_content: { type: 'boolean', nullable: false },
      content_json: { type: 'jsonb', nullable: false },
      sensitive_payload_encrypted: { type: 'text', nullable: true },
      crypto_suite: { type: 'text', nullable: true },
      key_version: { type: 'text', nullable: true },
      created_at: { type: 'timestamp with time zone', nullable: false },
      updated_at: { type: 'timestamp with time zone', nullable: false },
    },
    indexes: [
      'panels_owner_user_id_idx',
      'panels_visibility_idx',
      'panels_club_id_idx',
      'panels_created_at_idx',
      'panels_updated_at_idx',
    ],
    constraints: ['panels_club_visibility_consistency'],
  },
  timelines: {
    columns: {
      id: { type: 'uuid', nullable: false },
      owner_user_id: { type: 'text', nullable: false },
      visibility: { type: 'USER-DEFINED', udtName: 'visibility', nullable: false },
      club_id: { type: 'text', nullable: true },
      title: { type: 'text', nullable: false },
      description: { type: 'text', nullable: true },
      has_anonymized_content: { type: 'boolean', nullable: false },
      content_json: { type: 'jsonb', nullable: false },
      sensitive_payload_encrypted: { type: 'text', nullable: true },
      crypto_suite: { type: 'text', nullable: true },
      key_version: { type: 'text', nullable: true },
      created_at: { type: 'timestamp with time zone', nullable: false },
      updated_at: { type: 'timestamp with time zone', nullable: false },
    },
    indexes: [
      'timelines_owner_user_id_idx',
      'timelines_visibility_idx',
      'timelines_club_id_idx',
      'timelines_created_at_idx',
      'timelines_updated_at_idx',
    ],
    constraints: ['timelines_club_visibility_consistency'],
  },
  processed_events: {
    columns: {
      event_id: { type: 'text', nullable: false },
      event_type: { type: 'text', nullable: false },
      processed_at: { type: 'timestamp with time zone', nullable: false },
    },
    indexes: ['processed_events_event_type_idx', 'processed_events_processed_at_idx'],
  },
};

function log(message) {
  console.log(`[db:migrate] ${message}`);
}

function readJournalEntries() {
  const journalPath = path.join(migrationsFolder, 'meta', '_journal.json');
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
  return journal.entries;
}

function splitStatements(sql) {
  return sql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function applyRepairableBootstrapMigrations(pool) {
  const entries = readJournalEntries().filter((entry) => repairableBootstrapTags.has(entry.tag));

  if (!entries.length) {
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const entry of entries) {
      const migrationPath = path.join(migrationsFolder, `${entry.tag}.sql`);
      const statements = splitStatements(fs.readFileSync(migrationPath, 'utf8'));
      log(`Ensuring bootstrap migration ${entry.tag}.`);
      for (const statement of statements) {
        await client.query(statement);
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function loadEnumLabels(pool, enumName) {
  const result = await pool.query(
    `
      SELECT e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typname = $1
      ORDER BY e.enumsortorder
    `,
    [enumName],
  );

  return result.rows.map((row) => row.enumlabel);
}

async function loadColumns(pool, tableName) {
  const result = await pool.query(
    `
      SELECT column_name, data_type, udt_name, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
    `,
    [tableName],
  );

  return new Map(result.rows.map((row) => [row.column_name, row]));
}

async function loadIndexes(pool, tableName) {
  const result = await pool.query(
    `
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = $1
    `,
    [tableName],
  );

  return new Set(result.rows.map((row) => row.indexname));
}

async function loadConstraints(pool, tableName) {
  const result = await pool.query(
    `
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class r ON r.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = r.relnamespace
      WHERE n.nspname = 'public' AND r.relname = $1
    `,
    [tableName],
  );

  return new Set(result.rows.map((row) => row.conname));
}

function assertArrayEquals(label, actual, expected) {
  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    throw new Error(`${label} mismatch. Expected ${expected.join(', ')}, got ${actual.join(', ') || '<missing>'}.`);
  }
}

async function assertSchemaReady(pool) {
  for (const [enumName, labels] of Object.entries(expectedEnums)) {
    assertArrayEquals(`Enum ${enumName}`, await loadEnumLabels(pool, enumName), labels);
  }

  for (const [tableName, expectation] of Object.entries(expectedTables)) {
    const columns = await loadColumns(pool, tableName);
    if (!columns.size) {
      throw new Error(`Table public.${tableName} is missing.`);
    }

    for (const [columnName, columnExpectation] of Object.entries(expectation.columns)) {
      const column = columns.get(columnName);
      if (!column) {
        throw new Error(`Column public.${tableName}.${columnName} is missing.`);
      }
      if (column.data_type !== columnExpectation.type) {
        throw new Error(
          `Column public.${tableName}.${columnName} type mismatch. Expected ${columnExpectation.type}, got ${column.data_type}.`,
        );
      }
      if (columnExpectation.udtName && column.udt_name !== columnExpectation.udtName) {
        throw new Error(
          `Column public.${tableName}.${columnName} enum mismatch. Expected ${columnExpectation.udtName}, got ${column.udt_name}.`,
        );
      }
      if ((column.is_nullable === 'YES') !== columnExpectation.nullable) {
        throw new Error(
          `Column public.${tableName}.${columnName} nullability mismatch. Expected nullable=${columnExpectation.nullable}.`,
        );
      }
    }

    const indexes = await loadIndexes(pool, tableName);
    for (const indexName of expectation.indexes ?? []) {
      if (!indexes.has(indexName)) {
        throw new Error(`Index public.${indexName} is missing.`);
      }
    }

    const constraints = await loadConstraints(pool, tableName);
    for (const constraintName of expectation.constraints ?? []) {
      if (!constraints.has(constraintName)) {
        throw new Error(`Constraint public.${constraintName} is missing.`);
      }
    }
  }
}

async function run() {
  const databaseUrl = process.env.DATABASE_URL ?? defaultDatabaseUrl;
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    log('Checking and repairing bootstrap schema if needed.');
    await applyRepairableBootstrapMigrations(pool);

    log('Applying Drizzle migrations.');
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder });

    log('Verifying expected database schema.');
    await assertSchemaReady(pool);
    log('Database schema is ready.');
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error('[db:migrate] Database migration failed.');
  console.error(error);
  process.exitCode = 1;
});
