// ============================================================
// Pengacak menentukan (deterministik)
// ============================================================
//
// Semua permainan memakai pengacakan ini supaya tampilan tidak berubah
// tiap render, tapi tetap berbeda antar anak dan antar sesi.
//
// Benih (seed) dibuat dari kunci teks, jadi soal yang sama selalu
// menghasilkan susunan yang sama selama satu kali permainan.

/**
 * Pembuat angka acak dari benih, memakai algoritma mulberry32.
 * @param {number} seed
 * @returns {() => number} fungsi penghasil angka 0..1
 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Ubah teks menjadi angka benih.
 * @param {string} teks
 * @returns {number}
 */
export function hashSeed(teks) {
  let h = 2166136261;
  for (let i = 0; i < teks.length; i++) {
    h ^= teks.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Salinan acak dari sebuah larik.
 * @template T
 * @param {T[]} arr
 * @param {number|string} seed
 * @returns {T[]}
 */
export function seededShuffle(arr, seed) {
  const next = mulberry32(typeof seed === "string" ? hashSeed(seed) : seed >>> 0);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Acak daftar jawaban pilihan ganda.
 *
 * Bagian pentingnya: jawaban yang benar TIDAK boleh jatuh di urutan
 * pertama. Kalau tidak, anak cukup menghafal posisi "kiri atas" dan lulus
 * semua soal tanpa membaca. Jika hasil pengacakan kebetulan menaruh
 * jawaban di posisi pertama, ia dipindahkan ke posisi lain secara menentukan.
 *
 * @param {{ o: any[], a: any }} round  soal dan jawabannya
 * @param {number|string} seed
 * @returns {any[]} opsi siap tampil
 */
export function shuffleOptions(round, seed) {
  const opts = [...(round?.o || [])];
  if (opts.length < 2) return opts;

  const out = seededShuffle(opts, seed);
  const posisi = out.indexOf(round.a);
  if (posisi === 0) {
    // Pindahkan ke posisi lain yang tetap menentukan (bukan acak runtime)
    const j = 1 + (hashSeed(String(seed) + "geser") % (out.length - 1));
    [out[0], out[j]] = [out[j], out[0]];
  }
  return out;
}
