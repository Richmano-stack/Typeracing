
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const email = "test2@example.com";
    console.log(`Checking races for ${email}...`);

    const user = await prisma.user.findUnique({
        where: { email },
        include: { races: true }
    });

    if (!user) {
        console.error("User not found!");
        return;
    }

    console.log(`User ${user.username} has ${user.races.length} races.`);
    user.races.forEach(race => {
        console.log(`- Race ID: ${race.id}, WPM: ${race.wpm}, Date: ${race.completedAt}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
