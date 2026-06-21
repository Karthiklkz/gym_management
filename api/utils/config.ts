import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;

if (isProduction && (!jwtSecret || jwtSecret === 'fallback_secret')) {
  throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing or insecure in production.');
}

export const config = {
  databaseUrl: process.env.DATABASE_URL,
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: jwtSecret || 'fallback_secret',
};

export default config;
