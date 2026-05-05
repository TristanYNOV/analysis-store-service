import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const visibilityEnum = pgEnum('visibility', ['private', 'club', 'public']);
export const outboxStatusEnum = pgEnum('outbox_status', ['pending', 'published', 'failed']);

export const timelines = pgTable(
  'timelines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerUserId: text('owner_user_id').notNull(),
    visibility: visibilityEnum('visibility').notNull().default('private'),
    clubId: text('club_id'),
    title: text('title').notNull(),
    description: text('description'),
    hasAnonymizedContent: boolean('has_anonymized_content').notNull().default(false),
    contentJson: jsonb('content_json').$type<Record<string, unknown>>().notNull().default({}),
    sensitivePayloadEncrypted: text('sensitive_payload_encrypted'),
    cryptoSuite: text('crypto_suite'),
    keyVersion: text('key_version'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'timelines_club_visibility_consistency',
      sql`(${table.visibility} <> 'club' OR ${table.clubId} IS NOT NULL)`,
    ),
    index('timelines_owner_user_id_idx').on(table.ownerUserId),
    index('timelines_visibility_idx').on(table.visibility),
    index('timelines_club_id_idx').on(table.clubId),
    index('timelines_created_at_idx').on(table.createdAt),
    index('timelines_updated_at_idx').on(table.updatedAt),
  ],
);

export const panels = pgTable(
  'panels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerUserId: text('owner_user_id').notNull(),
    visibility: visibilityEnum('visibility').notNull().default('private'),
    clubId: text('club_id'),
    title: text('title').notNull(),
    description: text('description'),
    hasAnonymizedContent: boolean('has_anonymized_content').notNull().default(false),
    contentJson: jsonb('content_json').$type<Record<string, unknown>>().notNull().default({}),
    sensitivePayloadEncrypted: text('sensitive_payload_encrypted'),
    cryptoSuite: text('crypto_suite'),
    keyVersion: text('key_version'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'panels_club_visibility_consistency',
      sql`(${table.visibility} <> 'club' OR ${table.clubId} IS NOT NULL)`,
    ),
    index('panels_owner_user_id_idx').on(table.ownerUserId),
    index('panels_visibility_idx').on(table.visibility),
    index('panels_club_id_idx').on(table.clubId),
    index('panels_created_at_idx').on(table.createdAt),
    index('panels_updated_at_idx').on(table.updatedAt),
  ],
);

export const outboxEvents = pgTable(
  'outbox_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventType: text('event_type').notNull(),
    eventVersion: integer('event_version').notNull().default(1),
    aggregateType: text('aggregate_type'),
    aggregateId: text('aggregate_id'),
    payloadJson: jsonb('payload_json').$type<Record<string, unknown>>().notNull(),
    status: outboxStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
  },
  (table) => [
    index('outbox_events_status_idx').on(table.status),
    index('outbox_events_event_type_idx').on(table.eventType),
    index('outbox_events_aggregate_idx').on(table.aggregateType, table.aggregateId),
    index('outbox_events_created_at_idx').on(table.createdAt),
  ],
);

export const processedEvents = pgTable(
  'processed_events',
  {
    eventId: text('event_id').primaryKey(),
    eventType: text('event_type').notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('processed_events_event_type_idx').on(table.eventType),
    index('processed_events_processed_at_idx').on(table.processedAt),
  ],
);

export type Timeline = typeof timelines.$inferSelect;
export type Panel = typeof panels.$inferSelect;
export type OutboxEvent = typeof outboxEvents.$inferSelect;
export type ProcessedEvent = typeof processedEvents.$inferSelect;
