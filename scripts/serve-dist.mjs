import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const distRoot = path.join(root, 'dist');
const portArgument = process.argv.find((argument) => argument.startsWith('--port='));
const port = Number(portArgument?.split('=', 2)[1] ?? process.env.PORT ?? 4173);

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.md', 'text/markdown; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

const htaccess = await readFile(path.join(distRoot, '.htaccess'), 'utf8');
const securityHeaders = new Map();
for (const match of htaccess.matchAll(/^\s*Header set ([\w-]+) "([^"]*)"/gm)) {
  securityHeaders.set(match[1], match[2]);
}

async function resolveFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const relativePath = decoded.replace(/^\/+/, '');
  const candidate = path.resolve(distRoot, relativePath || 'index.html');
  if (!candidate.startsWith(`${distRoot}${path.sep}`)) return null;

  try {
    const details = await stat(candidate);
    return details.isDirectory() ? path.join(candidate, 'index.html') : candidate;
  } catch {
    if (relativePath.startsWith('manual/')) return null;
    return path.join(distRoot, 'index.html');
  }
}

const server = createServer(async (request, response) => {
  for (const [name, value] of securityHeaders) response.setHeader(name, value);
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405).end('Method Not Allowed');
    return;
  }

  try {
    const pathname = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`).pathname;
    const filePath = await resolveFile(pathname);
    if (!filePath) {
      response.writeHead(404).end('Not Found');
      return;
    }
    const content = await readFile(filePath);
    response.setHeader('Content-Type', mimeTypes.get(path.extname(filePath)) ?? 'application/octet-stream');
    response.writeHead(200);
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    response.writeHead(500).end(error instanceof Error ? error.message : 'Internal Server Error');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving dist with deployment headers at http://127.0.0.1:${port}`);
});
