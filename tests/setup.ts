import { beforeAll, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';

beforeAll(async () => {
    await prisma.$connect();
});

beforeEach(async () => {
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});