
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "test2@example.com"; // Using the user I created earlier
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
