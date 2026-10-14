// ============================================================
// Varian petunjuk misi Hitung & Seret
// ============================================================
//
// Latar belakang: sebelumnya ada SATU kalimat tetap —
//   "Hitung benda di kotak, lalu seret angka yang benar ke jembatan."
// yang dibacakan ulang pada tiap ronde tiap kali anak membuka misi ini.
// Anak yang bermain berulang kali mendengar kalimat yang persis sama sampai
// bosan, dan Zippy terdengar seperti perekaman yang rusak, bukan teman.
//
// Sekarang ada beberapa kalimat yang berganti bergantung pada judul misi dan
// nomor ronde, jadi kalimatnya berubah-ubah tapi tetap berarti sama dan tidak
// pernah menyesatkan anak.
//
// Perancangan:
//   - PEMILIHAN DETERMINISTIK, bukan acak. Kalau acak, teks berganti pada tiap
//     render dan pada hydration server/klien bisa berbeda sehingga React
//     memunculkan peringatan; suara juga bisa terbacakan dua kali.
//   - Berdasarkan judul misi + nomor ronde, supaya tiap misi membuka dengan
//     kalimat berbeda dan tiap ronde di dalamnya ikut berganti.
//   - Semua kalimat berakhir dengan perintah yang sama secara substantif
//     (hitung, lalu seret angka) — tidak ada yang memberi tahu jawaban.
//
// Berkas ini diimpor dari DUA tempat dan harus tetap sinkron:
//   1. components/missions/MissionDragCount.jsx  -> dipakai saat bermain
//   2. scripts/kumpulTeks.mjs                    -> supaya semua varian terekam
//      sebagai mp3 dan tidak jatuh ke suara bawaan perangkat
// Tanpa poin 2, varian baru tidak ada rekamannya dan kualitas suaranya turun.

/** Seluruh pilihan kalimat petunjuk. */
export const PETUNJUK_HITUNG = [
  "Hitung bendanya di kotak, lalu seret angka yang benar ke jembatan.",
  "Ada berapa bendanya? Seret angka itu ke kotak tanda tanya.",
  "Coba hitung satu per satu, ya. Setelah itu seret angkanya ke jembatan.",
  "Berapa jumlah bendanya? Angka yang tepat tinggal diseret ke kotak tanda tanya.",
  "Ayo hitung! Lalu seret angka yang kamu dapat ke jembatan.",
  "Dihitung yuk, satu dua tiga. Setelah itu seret angkanya ke jembatan.",
  "Seberapa banyak bendanya? Seret angka itu ke jembatan, ya.",
  "Cari angka yang benar, lalu seret ke kotak tanda tanya di jembatan.",
];

/**
 * Jadikan sebuah teks menjadi angka bulat kecil yang stabil.
 *
 * Dipakai untuk mengacak PEMILIHAN berdasarkan judul misi tanpa memakai
 * Math.random(), sehingga judul yang sama selalu membuka kalimat yang sama.
 */
export function jedaHash(teks) {
  const s = String(teks ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Pilih kalimat petunjuk untuk satu ronde.
 *
 * @param {string} judul  judul misi, mis. "Jembatan Berry"
 * @param {number} ronde  nomor ronde (mulai dari 0)
 * @returns {string} satu kalimat dari PETUNJUK_HITUNG
 */
export function petunjukUntuk(judul, ronde = 0) {
  const panjang = PETUNJUK_HITUNG.length;
  // Dibersihkan lebih dulu: nilai NaN, undefined, atau negatif akan membuat
  // penomoran meleset dan mengembalikan undefined, yang di React menghasilkan
  // gelembung bicara kosong.
  const n = Number(ronde);
  const r = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  const mulai = jedaHash(judul) % panjang;
  return PETUNJUK_HITUNG[(mulai + r) % panjang];
}
