"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const prismaClientSingleton = () => {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not defined in environment variables');
    }
    const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    // In Prisma 7, the 'adapter' property is mandatory for direct local connections.
    // We use type assertion to bypass temporary type-checking issues with the new Prisma 7 types.
    return new client_1.PrismaClient({ adapter });
};
const prisma = globalThis.prisma ?? prismaClientSingleton();
exports.default = prisma;
if (process.env.NODE_ENV !== 'production')
    globalThis.prisma = prisma;
