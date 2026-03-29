export interface AppEnv {
  PORT?: string;
  API_PORT?: string;
  NODE_ENV?: string;
  DATABASE_URL?: string;
  REDIS_URL?: string;
  JWT_SECRET?: string;
  JWT_EXPIRES_IN?: string;
}
