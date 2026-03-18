import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const passages = [
    { content: "The quick brown fox jumps over the lazy dog.", difficulty: "EASY", source: "Typography" },
    { content: "Practice makes perfect. Consistency in typing helps improve accuracy.", difficulty: "EASY", source: "Educational" },
    { content: "Welcome to the typing race! Your fingers dance across the keyboard.", difficulty: "EASY", source: "Game Intro" },
    { content: "JavaScript revolutionized web development by enabling interactive experiences.", difficulty: "MEDIUM", source: "Tech" },
    { content: "Algorithms and data structures form the foundation of computer science.", difficulty: "MEDIUM", source: "Tech" },
    { content: "Maintaining proper posture during typing reduces fatigue and physical strain.", difficulty: "MEDIUM", source: "Health" },
    {
        content: "The fastest typists are not always those who press the keys quickly, but those who combine speed with impeccable accuracy.",
        difficulty: "HARD",
        source: "Pro Tips"
    },
    {
        content: "Typing is not merely pressing keys quickly; it is a combination of focus, muscle memory, and mental agility. Each session challenges your concentration as you learn to maintain speed without sacrificing accuracy.",
        difficulty: "HARD",
        source: "Deep Practice"
    },
];

async function main() {
    console.log('Seeding text passages...');

    // Clear existing passages to ensure it's idempotent
    await prisma.textPassage.deleteMany();

    // Batch create the new passages
    await prisma.textPassage.createMany({
        data: passages.map(p => ({
            content: p.content,
            difficulty: p.difficulty,
            source: p.source || "General",
            length: p.content.length,
        }))
    });

    console.log('✅ Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });