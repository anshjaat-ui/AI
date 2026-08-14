import { existsSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const requiredFiles = [
  'index.html',
  'src/app.js',
  'src/local-webllm.js',
  'src/webllm-worker.js',
  'src/styles.css',
  'scripts/dev-server.js',
  'scripts/verify.js',
  'vercel.json',
  'README.md',
];

const removedFiles = [
  ['api', 'chat.js'].join('/'),
  ['lib', 'ai', 'provider.js'].join('/'),
  ['lib', 'ai', ['open', 'ai'].join('') + '.js'].join('/'),
  ['lib', 'ai', ['anth', 'ropic'].join('') + '.js'].join('/'),
  '.env.example',
];

for (const file of requiredFiles) {
  if (!existsSync(file)) throw new Error(`Missing required file: ${file}`);
}

for (const file of removedFiles) {
  if (existsSync(file)) throw new Error(`Obsolete remote inference file still exists: ${file}`);
}

for (const file of ['src/app.js', 'src/local-webllm.js', 'src/webllm-worker.js', 'scripts/dev-server.js', 'scripts/verify.js']) {
  execFileSync('node', ['--check', file], { stdio: 'inherit' });
}

const trackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((file) => !file.startsWith('.git/'));
const repoText = trackedFiles.filter((file) => existsSync(file)).map((file) => readFileSync(file, 'utf8')).join('\n');
const forbidden = [
  ['ol', 'lama'].join(''),
  ['localhost', '11434'].join(':'),
  ['open', 'ai'].join(''),
  ['anth', 'ropic'].join(''),
  ['gem', 'ini'].join(''),
  ['AI', 'API', 'KEY'].join('_'),
  ['/', 'api', '/', 'chat'].join(''),
];
const matches = forbidden.filter((term) => repoText.toLowerCase().includes(term.toLowerCase()));

if (matches.length > 0) {
  throw new Error(`Obsolete remote/local-server references remain: ${matches.join(', ')}`);
}

rmSync('dist', { recursive: true, force: true });
console.log('Verification passed: browser-local WebGPU app has no normal-chat server inference dependency.');
