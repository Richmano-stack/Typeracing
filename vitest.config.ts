import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        environment: "node",
        setupFiles: ["./src/tests/setup.ts"],
        include: ["src/tests/**/*.test.ts"],
        testTimeout: 15000,
        fileParallelism: false,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
