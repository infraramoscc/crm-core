import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
    schema: 'prisma/schema.prisma',
    datasource: {
        // Usa DIRECT_URL para migraciones (prisma db push), fallback a DATABASE_URL
        url: process.env.DIRECT_URL || process.env.DATABASE_URL || '',
    }
});
