
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const email = "test@example.com";
    const password = "password123";

    console.log(`Testing auth for ${email}...`);

    try {
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
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
