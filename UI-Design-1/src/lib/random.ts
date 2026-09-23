/** Deterministic pseudo-randomness so every render/session shows identical data. */

export function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngFor(key: string) {
  return mulberry32(hashSeed(key));
}

/** Standard normal via Box–Muller. */
export function gauss(rand: () => number) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Stable pseudo-random float in [min,max] derived from a string key. */
export function seeded(key: string, min = 0, max = 1) {
  return min + rngFor(key)() * (max - min);
}

export function seededInt(key: string, min: number, max: number) {
  return Math.round(seeded(key, min, max));
}
