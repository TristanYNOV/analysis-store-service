import { buildAppConfig } from './app-config.validation';

describe('buildAppConfig', () => {
  it('loads a valid production configuration', () => {
    const config = buildAppConfig({
      NODE_ENV: 'production',
      PORT: '4100',
      DATABASE_URL: 'postgres://user:pass@db:5432/analysis_store',
      DB_NAME: 'analysis_store',
      MASTER_KEY: 'prod-master-key',
      CRYPTO_KEY_VERSION: 'v2',
    });

    expect(config).toEqual({
      nodeEnv: 'production',
      port: 4100,
      databaseUrl: 'postgres://user:pass@db:5432/analysis_store',
      dbName: 'analysis_store',
      masterKey: 'prod-master-key',
      cryptoKeyVersion: 'v2',
    });
  });

  it('throws when a required variable is missing outside test environment', () => {
    expect(() =>
      buildAppConfig({
        NODE_ENV: 'development',
        PORT: '3000',
        MASTER_KEY: 'local-master-key',
        CRYPTO_KEY_VERSION: 'v1',
      }),
    ).toThrow('Missing required environment variable: DATABASE_URL.');
  });
});
