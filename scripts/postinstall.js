#!/usr/bin/env node

const { execSync } = require('child_process');

try {
  process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/db';
  execSync('prisma generate', { stdio: 'inherit', env: process.env });
} catch (error) {
  // Ignore errors during postinstall
  process.exit(0);
}

