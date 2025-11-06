#!/usr/bin/env node

/**
 * Cache clearing utility
 * Clears Vite cache and build artifacts to prevent stale code issues
 */

import { rmSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const cacheDirs = [
    join(rootDir, 'node_modules', '.vite'),
    join(rootDir, 'dist'),
    join(rootDir, '.vite'),
];

console.log('🧹 Clearing caches...\n');

let cleared = 0;
for (const dir of cacheDirs) {
    if (existsSync(dir)) {
        try {
            rmSync(dir, { recursive: true, force: true });
            console.log(`✓ Cleared: ${dir.replace(rootDir, '.')}`);
            cleared++;
        } catch (error) {
            console.error(`✗ Failed to clear ${dir}:`, error.message);
        }
    }
}

if (cleared === 0) {
    console.log('No cache directories found to clear.');
} else {
    console.log(`\n✅ Cleared ${cleared} cache directory/directories.`);
    console.log('💡 Tip: Restart your dev server after clearing cache.');
}

