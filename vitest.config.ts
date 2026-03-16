import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom', // Simulates browser globals like 'window'
        setupFiles: ['./tests/setup.ts'],
        globals: true, // Allows using 'describe', 'it', 'expect' without importing
        alias: {
            '@': path.resolve(__dirname, './app'),
        },
    },
});