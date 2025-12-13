
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
});

async function main() {
    try {
        await prisma.$connect();
        console.log('Successfully connected to the database.');
        await prisma.$disconnect();
    } catch (e) {
        console.error('Connection failed:', e);
        process.exit(1);
    }
}

main();
