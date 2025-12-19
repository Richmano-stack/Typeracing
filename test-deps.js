
console.log("Starting deps test...");
try {
    console.log("Requiring bcryptjs...");
    const bcrypt = require("bcryptjs");
    console.log("bcryptjs loaded.");

    console.log("Requiring dotenv...");
    require("dotenv").config();
    console.log("dotenv loaded.");

    console.log("Requiring @prisma/client...");
    const { PrismaClient } = require("@prisma/client");
    console.log("@prisma/client loaded.");

    console.log("Requiring pg...");
    const { Pool } = require("pg");
    console.log("Requiring @prisma/adapter-pg...");
    const { PrismaPg } = require("@prisma/adapter-pg");

    console.log("Creating Pool...");
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });

    console.log("Creating Adapter...");
    const adapter = new PrismaPg(pool);

    console.log("Instantiating PrismaClient with adapter...");
    const prisma = new PrismaClient({ adapter });
    console.log("PrismaClient instantiated.");

    console.log("Connecting...");
    prisma.$connect().then(() => {
        console.log("Connected!");
        return prisma.$disconnect();
    }).catch(e => {
        console.error("Connection failed:", e);
    });

} catch (e) {
    console.error("Crash:", e);
}
