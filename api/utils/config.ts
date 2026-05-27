import 'dotenv/config';

export const config = {
  databaseUrl: process.env.DATABASE_URL,
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret',
};

export default config;
