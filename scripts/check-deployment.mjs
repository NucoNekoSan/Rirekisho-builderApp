import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

async function collectHtml(relativeDirectory) {
  const entries = await readdir(path.join(root, relativeDirectory), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtml(relativePath));
    if (entry.isFile() && entry.name.endsWith('.html')) files.push(relativePath);
  }
  return files;
}

const [sourceHtaccess, builtHtaccess] = await Promise.all([
  read(path.join('public', '.htaccess')),
  read(path.join('dist', '.htaccess')),
]);

if (sourceHtaccess.replace(/\r\n/g, '\n') !== builtHtaccess.replace(/\r\n/g, '\n')) {
  failures.push('dist/.htaccess differs from public/.htaccess');
}

for (const directive of [
  "script-src 'self'",
  "frame-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
]) {
  if (!sourceHtaccess.includes(directive)) failures.push(`CSP is missing: ${directive}`);
}

for (const htmlPath of await collectHtml('dist')) {
  const html = await read(htmlPath);
  if (/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i.test(html)) {
    failures.push(`${htmlPath} contains an inline script blocked by the deployment CSP`);
  }
  if (/\son[a-z]+\s*=/i.test(html)) {
    failures.push(`${htmlPath} contains an inline event handler blocked by the deployment CSP`);
  }
}

const manualFiles = [
  'INDEX.md',
  '01-introduction.md',
  '02-overview.md',
  '03-input-guide.md',
  '04-accommodation.md',
  '05-pdf-output.md',
  '06-save-load.md',
  '07-faq.md',
  '08-appendix.md',
  'index.html',
  'manual.js',
  'style.css',
];
const serviceWorker = await read(path.join('dist', 'sw.js'));
for (const name of manualFiles) {
  try {
    await read(path.join('dist', 'manual', name));
  } catch {
    failures.push(`dist/manual/${name} is missing`);
  }
  if (!serviceWorker.includes(`manual/${name}`)) {
    failures.push(`service worker does not precache manual/${name}`);
  }
}

if (failures.length > 0) {
  console.error('Deployment consistency check failed:');
  for (const failure of failures.sort()) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Deployment consistency check passed.');
}
