import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const prismaClientSingleton = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in environment variables');
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool as any);

  // In Prisma 7, the 'adapter' property is mandatory for direct local connections.
  // We use type assertion to bypass temporary type-checking issues with the new Prisma 7 types.
  return new PrismaClient({ adapter } as any);
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
