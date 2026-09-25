import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];

const normalizeText = (value) => value.replace(/\r\n/g, '\n');

async function readText(relativePath) {
  return normalizeText(await readFile(path.join(root, relativePath), 'utf8'));
}

async function collectMarkdown(relativeDirectory) {
  const absoluteDirectory = path.join(root, relativeDirectory);
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectMarkdown(relativePath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(relativePath);
    }
  }

  return files;
}

async function pathExists(absolutePath) {
  try {
    await stat(absolutePath);
    return true;
  } catch {
    return false;
  }
}

function markdownTargets(markdown) {
  const targets = [];
  const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g;

  for (const match of markdown.matchAll(linkPattern)) {
    let target = match[1].trim();
    if (target.startsWith('<') && target.endsWith('>')) {
      target = target.slice(1, -1);
    }
    if (!target || /^(?:https?:|mailto:|data:|#)/i.test(target)) {
      continue;
    }

    target = target.split('#', 1)[0].split('?', 1)[0];
    if (target) {
      targets.push(target);
    }
  }

  return targets;
}

async function checkMarkdownLinks() {
  const candidates = [
    'README.md',
    'MAINTENANCE.md',
    ...await collectMarkdown('docs'),
    ...await collectMarkdown('specs'),
    ...await collectMarkdown(path.join('public', 'manual')),
  ];

  for (const relativeFile of candidates) {
    const markdown = await readText(relativeFile);
    for (const rawTarget of markdownTargets(markdown)) {
      let decodedTarget;
      try {
        decodedTarget = decodeURIComponent(rawTarget);
      } catch {
        failures.push(`${relativeFile}: invalid encoded link ${rawTarget}`);
        continue;
      }

      const targetPath = path.resolve(root, path.dirname(relativeFile), decodedTarget);
      if (!await pathExists(targetPath)) {
        failures.push(`${relativeFile}: missing link target ${rawTarget}`);
      }
    }
  }
}

async function checkManualSync() {
  const draftDirectory = path.join('docs', 'manual', 'draft');
  const publicDirectory = path.join('public', 'manual');
  const draftFiles = (await readdir(path.join(root, draftDirectory)))
    .filter((name) => name.endsWith('.md') && name !== 'README.md')
    .sort();
  const publicFiles = (await readdir(path.join(root, publicDirectory)))
    .filter((name) => name.endsWith('.md'))
    .sort();

  if (draftFiles.join('\n') !== publicFiles.join('\n')) {
    failures.push('manual: draft and public file lists differ');
  }

  for (const name of draftFiles) {
    const publicPath = path.join(publicDirectory, name);
    if (!await pathExists(path.join(root, publicPath))) {
      continue;
    }

    const [draftText, publicText] = await Promise.all([
      readText(path.join(draftDirectory, name)),
      readText(publicPath),
    ]);
    if (draftText !== publicText) {
      failures.push(`manual: ${name} differs between draft and public`);
    }
    if (/https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?|https?:\/\/\.\.\./i.test(publicText)) {
      failures.push(`manual: ${name} contains a development or placeholder URL`);
    }
  }
}

async function checkSpecs() {
  const requiredHeadings = [
    '目的',
    'スコープ',
    '非スコープ',
    'セキュリティに関する注記',
    '受け入れ条件',
    'テストシナリオ',
    'ロールバック時の注記',
  ];
  const specFiles = (await readdir(path.join(root, 'specs')))
    .filter((name) => /^M\d+_.+\.md$/.test(name))
    .sort((left, right) => Number(left.match(/^M(\d+)/)[1]) - Number(right.match(/^M(\d+)/)[1]));
  const [specIndex, roadmap, docsIndex] = await Promise.all([
    readText(path.join('specs', 'README.md')),
    readText(path.join('docs', 'ROADMAP.md')),
    readText(path.join('docs', 'INDEX.md')),
  ]);

  for (const name of specFiles) {
    const content = await readText(path.join('specs', name));
    const milestone = name.match(/^M(\d+)/)[1];

    for (const heading of requiredHeadings) {
      if (!content.includes(`## ${heading}\n`)) {
        failures.push(`specs/${name}: missing heading "${heading}"`);
      }
    }
    if (!specIndex.includes(`\`${name}\``)) {
      failures.push(`specs/README.md: missing ${name}`);
    }
    if (!new RegExp(`^## M${milestone}(?:\\s|$)`, 'm').test(roadmap)) {
      failures.push(`docs/ROADMAP.md: missing M${milestone}`);
    }
  }

  if (specFiles.length > 0) {
    const lastMilestone = specFiles.at(-1).match(/^M(\d+)/)[1];
    if (!docsIndex.includes(`M0-M${lastMilestone}`)) {
      failures.push(`docs/INDEX.md: expected milestone range M0-M${lastMilestone}`);
    }
  }
}

await Promise.all([
  checkMarkdownLinks(),
  checkManualSync(),
  checkSpecs(),
]);

if (failures.length > 0) {
  console.error('Documentation consistency check failed:');
  for (const failure of failures.sort()) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log('Documentation consistency check passed.');
}
