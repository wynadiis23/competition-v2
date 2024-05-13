import Joi from 'joi';

export const schemaValidation = Joi.object({
  // APP Configuration
  NODE_ENV: Joi.string().required(),
  APP_TZ: Joi.string().required(),

  METRICS_APP_NAME: Joi.string().required(),

  LOG_LOKI: Joi.boolean().required(),
  LOG_LOKI_URL: Joi.string().required(),

  GOOGLE_SERVICE_ACCOUNT_EMAIL: Joi.string().required(),
  GOOGLE_PRIVATE_KEY: Joi.string().required(),
  GOOGLE_SHEET_ID: Joi.string().required(),
  API_KEY_PROJECT: Joi.string().required(),

  // Database Configuration
  // DS_HOST: Joi.string().required(),
  // DS_PORT: Joi.number().default(5432),
  // DS_USERNAME: Joi.string().required(),
  // DS_PASSWORD: Joi.string().required(),
  // DS_NAME: Joi.string().required(),
  // DS_SYNCHRONIZE: Joi.boolean().default(false),

  REDIS_TTL: Joi.number().required(),
  REDIS_URL: Joi.string().required(),
});
