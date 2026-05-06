import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  register,
} from 'prom-client';

export const SERVICE_NAME = 'analysis-store-service';

let defaultMetricsStarted = false;

export function setupMetrics(): void {
  register.setDefaultLabels({ service: SERVICE_NAME });

  if (
    defaultMetricsStarted ||
    register.getSingleMetric('process_cpu_user_seconds_total')
  ) {
    return;
  }

  collectDefaultMetrics({
    register,
    eventLoopMonitoringPrecision: 20,
  });
  defaultMetricsStarted = true;
}

function counter(name: string, help: string, labelNames: string[]): Counter {
  return (
    (register.getSingleMetric(name) as Counter | undefined) ??
    new Counter({ name, help, labelNames, registers: [register] })
  );
}

function gauge(name: string, help: string, labelNames: string[]): Gauge {
  return (
    (register.getSingleMetric(name) as Gauge | undefined) ??
    new Gauge({ name, help, labelNames, registers: [register] })
  );
}

function histogram(
  name: string,
  help: string,
  labelNames: string[],
): Histogram {
  return (
    (register.getSingleMetric(name) as Histogram | undefined) ??
    new Histogram({
      name,
      help,
      labelNames,
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [register],
    })
  );
}

export const httpRequestsTotal = counter(
  'http_requests_total',
  'Total number of HTTP requests.',
  ['method', 'route', 'status_code'],
);

export const httpRequestDurationSeconds = histogram(
  'http_request_duration_seconds',
  'HTTP request duration in seconds.',
  ['method', 'route', 'status_code'],
);

export const httpRequestsInFlight = gauge(
  'http_requests_in_flight',
  'Number of HTTP requests currently in flight.',
  ['method', 'route'],
);

const importValidationLabels = ['resource', 'operation', 'result'];

export const analysisImportValidationTotal = counter(
  'analysis_import_validation_total',
  'Total number of import validation operations.',
  importValidationLabels,
);

export const analysisImportValidationFailedTotal = counter(
  'analysis_import_validation_failed_total',
  'Total number of failed import validation operations.',
  importValidationLabels,
);

export function recordImportValidation(
  resource: 'timeline' | 'panel',
  valid: boolean,
): void {
  const result = valid ? 'success' : 'failure';

  analysisImportValidationTotal
    .labels(resource, 'validate_import', result)
    .inc();

  if (!valid) {
    analysisImportValidationFailedTotal
      .labels(resource, 'validate_import', 'failure')
      .inc();
  }
}

export const rabbitmqBusinessEventsPublishedTotal = counter(
  'rabbitmq_business_events_published_total',
  'Total number of RabbitMQ business events published.',
  ['event_type', 'routing_key', 'result'],
);

export const rabbitmqBusinessEventsConsumedTotal = counter(
  'rabbitmq_business_events_consumed_total',
  'Total number of RabbitMQ business events consumed.',
  ['event_type', 'routing_key', 'result'],
);

export const rabbitmqBusinessEventPublishDurationSeconds = histogram(
  'rabbitmq_business_event_publish_duration_seconds',
  'RabbitMQ business event publish duration in seconds.',
  ['event_type', 'routing_key', 'result'],
);

export const rabbitmqBusinessEventProcessingDurationSeconds = histogram(
  'rabbitmq_business_event_processing_duration_seconds',
  'RabbitMQ business event consumer processing duration in seconds.',
  ['event_type', 'routing_key', 'result'],
);

export const analysisUserCleanupResourcesTotal = counter(
  'analysis_user_cleanup_resources_total',
  'Total number of resources deleted or anonymized during user cleanup.',
  ['resource', 'action'],
);

export const analysisUserCleanupDurationSeconds = histogram(
  'analysis_user_cleanup_duration_seconds',
  'User cleanup duration in seconds.',
  ['result'],
);
