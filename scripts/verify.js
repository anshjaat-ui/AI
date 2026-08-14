import { existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// This is a static browser app. Vercel does not need to bundle it;
// the build step only verifies that the required files and JavaScript
// modules are present and syntactically valid.
const requiredFiles = [
  'index.html',
  'src/app.js',
  'src/local-webllm.js',
  'src/webllm-worker.js',
  'src/styles.css',
  'scripts/dev-server.js',
  'scripts/verify.js',
  'vercel.json',
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

const javascriptFiles = [
  'src/app.js',
  'src/local-webllm.js',
  'src/webllm-worker.js',
  'scripts/dev-server.js',
  'scripts/verify.js',
];

for (const file of javascriptFiles) {
  execFileSync('node', ['--check', file], { stdio: 'inherit' });
}

rmSync('dist', { recursive: true, force: true });
console.log('Build verification passed. No bundling is required for this static browser-local app.');
