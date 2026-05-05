export type NodeEnv = 'development' | 'test' | 'production';

export interface RawAppEnv {
  NODE_ENV?: string;
  PORT?: string;
  DATABASE_URL?: string;
  DB_NAME?: string;
  MASTER_KEY?: string;
  CRYPTO_KEY_VERSION?: string;
  RABBITMQ_URL?: string;
  RABBITMQ_EXCHANGE?: string;
  RABBITMQ_QUEUE_ANALYSIS_STORE?: string;
}

export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  databaseUrl: string;
  dbName: string;
  masterKey: string;
  cryptoKeyVersion: string;
  rabbitmqUrl?: string;
  rabbitmqExchange: string;
  rabbitmqQueueAnalysisStore: string;
}
