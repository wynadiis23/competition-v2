import { registerAs } from '@nestjs/config';

export const appConfiguration = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV,

  loki: {
    logLoki: process.env.LOG_LOKI === 'true',
    logLokiUrl: process.env.LOG_LOKI_URL,
  },

  metrics: {
    metricsAppName: process.env.METRICS_APP_NAME,
  },
}));
