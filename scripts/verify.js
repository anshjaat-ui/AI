import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const requiredFiles = [
  '.env.example',
  'api/chat.js',
  'index.html',
  'lib/ai/provider.js',
  'lib/ai/openai.js',
  'src/app.js',
  'src/styles.css',
  'vercel.json',
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

execFileSync('node', ['--check', 'src/app.js'], { stdio: 'inherit' });
execFileSync('node', ['--check', 'api/chat.js'], { stdio: 'inherit' });
execFileSync('node', ['--check', 'lib/ai/provider.js'], { stdio: 'inherit' });
execFileSync('node', ['--check', 'lib/ai/openai.js'], { stdio: 'inherit' });
execFileSync('node', ['--check', 'lib/ai/anthropic.js'], { stdio: 'inherit' });

const repoText = requiredFiles.map((file) => readFileSync(file, 'utf8')).join('\n');
const forbidden = [
  ['ol', 'lama'].join(''),
  ['localhost', '11434'].join(':'),
  ['code', 'llama'].join(''),
  ['OL', 'LAMA_ORIGINS'].join(''),
];
const matches = forbidden.filter((term) => repoText.toLowerCase().includes(term.toLowerCase()));

if (matches.length > 0) {
  throw new Error(`Forbidden obsolete references remain: ${matches.join(', ')}`);
}

console.log('Verification passed.');
