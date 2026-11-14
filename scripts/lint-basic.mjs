import fs from 'fs';
import path from 'path';

const root = process.cwd();
let fail = false;
function err(msg){ console.error('LINT:', msg); fail = true; }

function walk(dir, out=[]) {
  for (const e of fs.readdirSync(dir, {withFileTypes:true})) {
    if (e.name === '.git' || e.name === 'node_modules' || e.name.startsWith('.aider')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p,out); else out.push(p);
  }
  return out;
}

const files = walk(root);
const textFiles = files.filter(f => /\.(js|mjs|css|html|json|md|yml|yaml)$/.test(f) && !f.includes('/evidencias/'));
// checks
for (const f of textFiles) {
  const rel = path.relative(root,f).replace(/\\/g,'/');
  let s;
  try { s = fs.readFileSync(f,'utf8'); } catch { continue; }
  const isEncargo = rel === 'docs/ENCARGO.md';
  const isScript = rel.startsWith('scripts/');
  const isLintSelf = rel === 'scripts/lint-basic.mjs';
  if (!isEncargo && !isLintSelf) {
    if (/\bTODO\b/.test(s) || /\bFIXME\b/.test(s)) err(`${rel}: contiene TODO/FIXME`);
    if (/\blorem\b/i.test(s)) err(`${rel}: contiene lorem`);
    if (/\bdebugger\b/.test(s)) err(`${rel}: contiene debugger`);
  }
  if (/\.only\s*\(/.test(s)) err(`${rel}: contiene .only`);
  if (!isScript && /console\.(log|info|warn|error|debug)\s*\(/.test(s)) err(`${rel}: contiene console.*`);
  if (/https?:\/\//.test(s) && !/xmlns|http:\/\/www\.w3\.org|https:\/\/www\.w3\.org|http:\/\/127\.0\.0\.1|https:\/\/127\.0\.0\.1|http:\/\/localhost/.test(s)) err(`${rel}: contiene URL externa`);
}
// basic JS syntax
const { spawnSync } = await import('child_process');
const jsFiles = files.filter(f => f.endsWith('.js') && f.includes('/js/') || f.endsWith('/sw.js'));
for (const f of jsFiles) {
  const r = spawnSync(process.execPath, ['--check', f], {encoding:'utf8'});
  if (r.status !== 0) err(`Syntax error en ${path.relative(root,f)}: ${r.stderr||r.stdout}`);
}

if (fail) process.exit(1);
console.log('lint-basic OK');
