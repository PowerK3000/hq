// Validates data/state.plain.json and encrypts it to data/state.enc.json.
// Passphrase comes from ETA_HQ_PASSPHRASE (environment) or a gitignored .env file. Never hardcode it.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fail = (m) => { console.error(`build failed: ${m}`); process.exit(1); };

function loadPassphrase() {
  if (process.env.ETA_HQ_PASSPHRASE) return process.env.ETA_HQ_PASSPHRASE;
  const envFile = join(root, '.env');
  if (existsSync(envFile)) {
    const m = readFileSync(envFile, 'utf8').match(/^ETA_HQ_PASSPHRASE=(.+)$/m);
    if (m) return m[1].trim();
  }
  return null;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TASK_STATUS = new Set(['todo', 'doing', 'blocked', 'done']);
const READY_STATUS = new Set(['todo', 'progress', 'blocked', 'done']);
const OWNERS = new Set(['Kayden', 'Claude']);

function validate(s) {
  const errs = [];
  const need = ['meta', 'stages', 'milestones', 'tasks', 'deadlines', 'funnel', 'contactTargets', 'contacts', 'pipeline', 'pipelineStages', 'scorecard', 'buyBox', 'underwriting', 'capital', 'readiness', 'portfolio', 'journal', 'reference'];
  for (const k of need) if (!(k in s)) errs.push(`missing key: ${k}`);
  if (errs.length) return errs;
  const ids = new Set();
  const chk = (cond, msg) => { if (!cond) errs.push(msg); };
  chk(DATE.test(s.meta.updated), 'meta.updated must be YYYY-MM-DD');
  for (const t of s.tasks) {
    chk(!ids.has(t.id), `duplicate id ${t.id}`); ids.add(t.id);
    chk(TASK_STATUS.has(t.status), `task ${t.id}: bad status ${t.status}`);
    chk(OWNERS.has(t.owner), `task ${t.id}: bad owner ${t.owner}`);
    chk(!t.due || DATE.test(t.due), `task ${t.id}: bad due date`);
  }
  for (const g of s.readiness) for (const i of g.items) {
    chk(!ids.has(i.id), `duplicate id ${i.id}`); ids.add(i.id);
    chk(READY_STATUS.has(i.status), `readiness ${i.id}: bad status ${i.status}`);
    chk(!i.due || DATE.test(i.due), `readiness ${i.id}: bad due date`);
  }
  for (const d of [...s.deadlines, ...s.milestones]) chk(DATE.test(d.date), `bad date on "${d.title}"`);
  for (const w of s.funnel.weeks) chk(DATE.test(w.week) && new Date(w.week + 'T00:00:00').getDay() === 1, `funnel week ${w.week} must be a Monday`);
  for (const d of s.pipeline) chk(s.pipelineStages.includes(d.stage), `deal ${d.name}: unknown stage ${d.stage}`);
  const w = s.scorecard.criteria.reduce((t, c) => t + c.weight, 0);
  chk(w === 100, `scorecard weights add to ${w}, not 100`);
  for (const sc of s.underwriting.scenarios) {
    const i = sc.inputs; const st = i.seniorPct + i.equityPct + i.sellerPct;
    chk(Math.abs(st - 1) < 1e-6, `scenario "${sc.name}": capital stack adds to ${st}`);
  }
  return errs;
}

const src = join(root, 'data', 'state.plain.json');
if (!existsSync(src)) fail('data/state.plain.json not found');
let state;
try { state = JSON.parse(readFileSync(src, 'utf8')); } catch (e) { fail(`state.plain.json is not valid JSON: ${e.message}`); }
const errs = validate(state);
if (errs.length) fail(`validation:\n  - ${errs.join('\n  - ')}`);

const pass = loadPassphrase();
if (!pass) fail('no passphrase: set ETA_HQ_PASSPHRASE or create .env (run: node tools/init-passphrase.mjs)');
if (pass.length < 16) fail('passphrase must be at least 16 characters');

const ITER = 600000;
const b64 = (u8) => Buffer.from(u8).toString('base64');
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode('eta-hq:v1') }, key, new TextEncoder().encode(JSON.stringify(state)));
writeFileSync(join(root, 'data', 'state.enc.json'), JSON.stringify({ v: 1, kdf: 'PBKDF2-SHA256', iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(new Uint8Array(ct)) }) + '\n');
console.log(`ok: encrypted ${state.tasks.length} tasks, ${state.readiness.reduce((n, g) => n + g.items.length, 0)} readiness items, ${state.contacts.length} contacts, ${state.pipeline.length} deals -> data/state.enc.json`);
