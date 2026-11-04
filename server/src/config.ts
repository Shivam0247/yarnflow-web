import 'dotenv/config';

const env = process.env;

export const config = {
  databaseUrl: env.DATABASE_URL ?? 'postgres://yarnflow:yarnflow@localhost:5432/yarnflow',
  jwtSecret: env.JWT_SECRET ?? 'dev-only-secret-change-me',
  jwtExpiresIn: env.JWT_EXPIRES_IN ?? '12h',
  port: Number(env.PORT ?? 4000),
  host: env.HOST ?? '0.0.0.0',
  corsOrigin: (env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((s) => s.trim()),
  isTest: env.NODE_ENV === 'test'
};
