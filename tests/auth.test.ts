import { describe, it, expect } from 'vitest';
import { authClient } from '@/lib/auth-client'; // Your BetterAuth client
import { prisma } from '@/lib/prisma';

describe('Authentication Flow', () => {
    it('should create a user in the database on successful signup', async () => {
        const testUser = {
            email: 'richmano@test.com',
            password: 'securePassword123',
            name: 'Richmano',
        };

        // 1. Trigger the Signup
        const { data, error } = await authClient.signUp.email({
            email: testUser.email,
            password: testUser.password,
            name: testUser.name,
        });

        // 2. Check response
        expect(error).toBeNull();
        expect(data?.user).toBeDefined();

        // 3. The "Truth" Check: Query the real database
        const dbUser = await prisma.user.findUnique({
            where: { email: testUser.email },
        });

        expect(dbUser).not.toBeNull();
        expect(dbUser?.name).toBe(testUser.name);
    });
});