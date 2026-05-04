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

const operationLabels = ['resource', 'operation', 'result'];

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

export const analysisTimelinesCreatedTotal = counter(
  'analysis_timelines_created_total',
  'Total number of timeline creation operations.',
  operationLabels,
);

export const analysisTimelinesUpdatedTotal = counter(
  'analysis_timelines_updated_total',
  'Total number of timeline update operations.',
  operationLabels,
);

export const analysisTimelinesDeletedTotal = counter(
  'analysis_timelines_deleted_total',
  'Total number of timeline deletion operations.',
  operationLabels,
);

export const analysisTimelinesExportedTotal = counter(
  'analysis_timelines_exported_total',
  'Total number of timeline export operations.',
  operationLabels,
);

export const analysisPanelsCreatedTotal = counter(
  'analysis_panels_created_total',
  'Total number of panel creation operations.',
  operationLabels,
);

export const analysisPanelsUpdatedTotal = counter(
  'analysis_panels_updated_total',
  'Total number of panel update operations.',
  operationLabels,
);

export const analysisPanelsDeletedTotal = counter(
  'analysis_panels_deleted_total',
  'Total number of panel deletion operations.',
  operationLabels,
);

export const analysisPanelsExportedTotal = counter(
  'analysis_panels_exported_total',
  'Total number of panel export operations.',
  operationLabels,
);

export const analysisImportValidationTotal = counter(
  'analysis_import_validation_total',
  'Total number of import validation operations.',
  operationLabels,
);

export const analysisImportValidationFailedTotal = counter(
  'analysis_import_validation_failed_total',
  'Total number of failed import validation operations.',
  operationLabels,
);
