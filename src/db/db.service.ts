import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';
import { AppConfigService } from '../config/app-config.service';
import * as schema from './schema';

@Injectable()
export class DbService implements OnModuleDestroy {
  readonly pool: Pool;
  readonly db: NodePgDatabase<typeof schema>;

  constructor(private readonly appConfig: AppConfigService) {
    this.pool = new Pool({
      connectionString: this.appConfig.databaseUrl,
    });

    this.db = drizzle({ client: this.pool, schema });
  }

  async checkConnection(): Promise<void> {
    await this.db.execute(sql`select 1`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
