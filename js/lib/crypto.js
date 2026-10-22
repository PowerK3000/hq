// Client-side decrypt for data/state.enc.json. The site is public; the data is not.
// Format (written by tools/build.mjs): {v, kdf:'PBKDF2-SHA256', iter, salt, iv, ct} with base64 fields,
// AES-256-GCM, additional data = AAD below. The passphrase never leaves the browser.
const AAD = new TextEncoder().encode('eta-hq:v1');

function b64(s) {
  const bin = atob(s); const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function decryptState(blob, passphrase) {
  if (blob.v !== 1 || blob.kdf !== 'PBKDF2-SHA256') throw new Error('Unsupported data format');
  // Refuse absurd iteration counts so a tampered file can't freeze the tab.
  if (!Number.isInteger(blob.iter) || blob.iter < 100000 || blob.iter > 5000000) throw new Error('Bad key settings');
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64(blob.salt), iterations: blob.iter, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(blob.iv), additionalData: AAD }, key, b64(blob.ct));
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    throw new Error('Wrong passphrase');
  }
}
