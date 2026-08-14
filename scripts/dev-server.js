import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT || 5173);
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

createServer((request, response) => {
  const url = new URL(request.url || '/', `http://localhost:${port}`);
  const safePath = normalize(url.pathname).replace(/^\.\.(\/|\\|$)/, '');
  let filePath = join(root, safePath === '/' ? 'index.html' : safePath);

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(root, 'index.html');
  }

  response.setHeader('Content-Type', mimeTypes[extname(filePath)] || 'application/octet-stream');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  createReadStream(filePath).pipe(response);
}).listen(port, () => {
  console.log(`NoLimit Coder AI local dev server: http://localhost:${port}`);
});
