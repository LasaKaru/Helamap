import dotenv from 'dotenv';

dotenv.config();

const required = (key: string, fallback: string): string => {
  const value = process.env[key];
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(`⚠️  ${key} is not set — using an insecure default. Set it in .env!`);
    }
    return fallback;
  }
  return value;
};

export const config = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  databasePath: process.env.DATABASE_PATH ?? './data/facilityflow.db',
  accessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret-change-me'),
  refreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'),
  accessTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
  refreshTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7),
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? 'admin@facilityflow.local',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!',
  seedAdminName: process.env.SEED_ADMIN_NAME ?? 'Super Admin',
};
