import * as dotenv from 'dotenv';
dotenv.config();

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

export const config = {
  get jwtSecret() {
    return requireEnv('JWT_SECRET');
  },
  get databaseUrl() {
    return requireEnv('DATABASE_URL');
  },
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  port: parseInt(process.env.PORT || '3000', 10),
};
