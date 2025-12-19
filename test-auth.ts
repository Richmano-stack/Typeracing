
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const email = "test@example.com";
    const password = "password123";

    console.log(`Testing auth for ${email}...`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.error("User not found!");
        return;
    }

    console.log("User found:", user.username);
    console.log("Hashed password:", user.hashedPassword);

    if (!user.hashedPassword) {
        console.error("No hashed password found on user!");
        return;
    }

    const isValid = await bcrypt.compare(password, user.hashedPassword);
    console.log("Password valid:", isValid);

    if (!isValid) {
        console.log("Comparing with manual hash...");
        const newHash = await bcrypt.hash(password, 12);
        console.log("New hash would be:", newHash);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
