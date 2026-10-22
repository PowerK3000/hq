// Creates a strong random passphrase in .env (gitignored) if none exists. It prints only the file path, never the value.
import { existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const file = join(dirname(fileURLToPath(import.meta.url)), '..', '.env');
if (existsSync(file)) { console.log(`.env already exists at ${file}; left unchanged.`); process.exit(0); }
const words = randomBytes(24).toString('base64url');
writeFileSync(file, `ETA_HQ_PASSPHRASE=${words}\n`, { mode: 0o600 });
console.log(`Created ${file}. Open it to read your passphrase; change it any time by editing the line.`);
