import { useSyncExternalStore } from 'react';

/**
 * Leaked-password check, free, using Have I Been Pwned's "Pwned Passwords" list (the same list Supabase's paid check uses).
 * The password never leaves the phone: the app sends only the first 5 characters of its SHA-1 fingerprint, gets back
 * every leaked fingerprint that starts the same way (padded with dummy rows, so even the reply's size says nothing) and
 * compares them on the phone. https://haveibeenpwned.com/API/v3#PwnedPasswords
 */

/** UTF-8 bytes of a string (written out so it works the same on every phone). */
function utf8(text: string): Uint8Array {
  const out: number[] = [];
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return Uint8Array.from(out);
}

/** SHA-1 of a string, as 40 upper-case hex characters. */
export function sha1Hex(text: string): string {
  const bytes = utf8(text);
  const total = Math.ceil((bytes.length + 9) / 64) * 64;
  const msg = new Uint8Array(total);
  msg.set(bytes);
  msg[bytes.length] = 0x80;
  const view = new DataView(msg.buffer);
  const bits = bytes.length * 8;
  view.setUint32(total - 8, Math.floor(bits / 0x100000000));
  view.setUint32(total - 4, bits >>> 0);
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
  const w = new Uint32Array(80);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4);
    for (let i = 16; i < 80; i++) {
      const x = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
      w[i] = (x << 1) | (x >>> 31);
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let i = 0; i < 80; i++) {
      const [f, k] =
        i < 20 ? [(b & c) | (~b & d), 0x5a827999] : i < 40 ? [b ^ c ^ d, 0x6ed9eba1] : i < 60 ? [(b & c) | (b & d) | (c & d), 0x8f1bbcdc] : [b ^ c ^ d, 0xca62c1d6];
      const next = (((a << 5) | (a >>> 27)) + f + e + k + w[i]) >>> 0;
      e = d;
      d = c;
      c = ((b << 30) | (b >>> 2)) >>> 0;
      b = a;
      a = next;
    }
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }
  return [h0, h1, h2, h3, h4].map((h) => h.toString(16).padStart(8, '0')).join('').toUpperCase();
}

/**
 * How many times this password has been seen in data breaches: 0 if never, null if the check couldn't run
 * (no internet, or the list didn't answer in time). Callers let people carry on when it's null.
 */
export async function breachCount(password: string, timeoutMs = 6000): Promise<number | null> {
  if (!password) return 0;
  const hash = sha1Hex(password);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`, { headers: { 'Add-Padding': 'true' }, signal: ctrl.signal });
    if (!res.ok) return null;
    const suffix = hash.slice(5);
    for (const line of (await res.text()).split('\n')) {
      const [s, n] = line.trim().split(':');
      if (s === suffix) return parseInt(n, 10) || 0; // padding rows carry a count of 0
    }
    return 0;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const times = (n: number) => (n === 1 ? 'once' : `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} times`);

/** The message when someone picks a leaked password. */
export const leakedMessage = (n: number) =>
  `This password has been seen ${times(n)} in data breaches, so others could guess it. Please choose a different one.`;

/** The warning after signing in with a leaked password. */
export const leakedSignInMessage = (n: number) =>
  `Your password has been seen ${times(n)} in data breaches on other websites, so others could guess it. Please change it.`;

// Set when someone signs in with a leaked password, so their account screen can ask them to change it.
let signInLeak = 0;
const listeners = new Set<() => void>();
export function setSignInLeak(n: number) {
  signInLeak = n;
  listeners.forEach((l) => l());
}
export function useSignInLeak() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => signInLeak,
    () => signInLeak,
  );
}
