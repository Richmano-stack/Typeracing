import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url, token }, request) => {
            console.log(`\n\n========================================`);
            console.log(`PASSWORD RESET LINK FOR ${user.email}`);
            console.log(`${url}`);
            console.log(`========================================\n\n`);
        },
    },
    user: {
        additionalFields: {
            total_races: {
                type: "number",
                defaultValue: 0,
                fieldName: "total_races",
            },
            average_wpm: {
                type: "number",
                defaultValue: 0,
                fieldName: "average_wpm",
            },
            best_wpm: {
                type: "number",
                defaultValue: 0,
                fieldName: "best_wpm",
            },
        },
    },
});
