import { AppConfig, NodeEnv, RawAppEnv } from './app-config.types';

const DEFAULT_PORT = 3001;
const DEFAULT_DB_NAME = 'analysis_store';
const DEFAULT_RABBITMQ_EXCHANGE = 'domain.events';
const DEFAULT_RABBITMQ_QUEUE_ANALYSIS_STORE = 'analysis-store-service.user-deletion';

function parseNodeEnv(rawNodeEnv: string | undefined): NodeEnv {
  const nodeEnv = rawNodeEnv ?? 'development';

  if (nodeEnv === 'development' || nodeEnv === 'test' || nodeEnv === 'production') {
    return nodeEnv;
  }

  throw new Error(`Invalid NODE_ENV "${nodeEnv}". Allowed values: development, test, production.`);
}

function parsePort(rawPort: string | undefined): number {
  if (!rawPort) {
    return DEFAULT_PORT;
  }

  const port = Number.parseInt(rawPort, 10);

  if (Number.isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT "${rawPort}". Expected an integer between 1 and 65535.`);
  }

  return port;
}

function requireEnv(name: keyof RawAppEnv, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}.`);
  }

  return value;
}

function resolveCriticalValue(
  name: keyof RawAppEnv,
  value: string | undefined,
  nodeEnv: NodeEnv,
  testFallback: string,
): string {
  if (nodeEnv === 'test') {
    return value && value.trim().length > 0 ? value : testFallback;
  }

  return requireEnv(name, value);
}

export function buildAppConfig(rawEnv: RawAppEnv): AppConfig {
  const nodeEnv = parseNodeEnv(rawEnv.NODE_ENV);

  return {
    nodeEnv,
    port: parsePort(rawEnv.PORT),
    databaseUrl: resolveCriticalValue(
      'DATABASE_URL',
      rawEnv.DATABASE_URL,
      nodeEnv,
      'postgres://test:test@localhost:5432/analysis_store_test',
    ),
    dbName: rawEnv.DB_NAME?.trim() || DEFAULT_DB_NAME,
    masterKey: resolveCriticalValue('MASTER_KEY', rawEnv.MASTER_KEY, nodeEnv, 'test-master-key'),
    cryptoKeyVersion: resolveCriticalValue(
      'CRYPTO_KEY_VERSION',
      rawEnv.CRYPTO_KEY_VERSION,
      nodeEnv,
      'v1-test',
    ),
    rabbitmqUrl: rawEnv.RABBITMQ_URL?.trim() || undefined,
    rabbitmqExchange: rawEnv.RABBITMQ_EXCHANGE?.trim() || DEFAULT_RABBITMQ_EXCHANGE,
    rabbitmqQueueAnalysisStore:
      rawEnv.RABBITMQ_QUEUE_ANALYSIS_STORE?.trim() || DEFAULT_RABBITMQ_QUEUE_ANALYSIS_STORE,
  };
}
