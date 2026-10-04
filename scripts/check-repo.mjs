import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const skip = new Set(['.git', 'node_modules', 'local', '.publication']);
async function walk(dir) {
  for (const name of await readdir(dir)) {
    if (skip.has(name) || name === '.env' || name.startsWith('.env.') && name !== '.env.example') continue;
    const file = path.join(dir, name);
    if ((await stat(file)).isDirectory()) { await walk(file); continue; }
    const relative = path.relative(root, file);
    const text = await readFile(file, 'utf8');
    if (/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{24,})\b/.test(text)) failures.push(`${relative}: possible secret`);
    if (/[A-Z]:[\\/](?:Users|10_PROJECTS|30_MEDIA)/i.test(text)) failures.push(`${relative}: author's private absolute path`);
    if (file.endsWith('.json')) { try { JSON.parse(text); } catch { failures.push(`${relative}: invalid JSON`); } }
    if (file.endsWith('.md')) {
      for (const match of text.matchAll(/(?<!!)\[[^\]]*\]\(([^)]+)\)/g)) {
        const target = match[1].split('#')[0];
        if (!target || /^[a-z]+:/i.test(target)) continue;
        try { await stat(path.resolve(path.dirname(file), target)); }
        catch { failures.push(`${relative}: broken local link ${target}`); }
      }
    }
  }
}
await walk(root);
const skill = await readFile(path.join(root, 'skills/dev-to-publish/SKILL.md'), 'utf8');
if (!/^---\r?\nname: dev-to-publish\r?\ndescription: .+\r?\n---/.test(skill)) failures.push('Missing portable Skill frontmatter');
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log('Package checks passed: JSON, local links, Skill frontmatter and public-file scan');
