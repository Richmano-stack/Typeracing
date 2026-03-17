import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
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
