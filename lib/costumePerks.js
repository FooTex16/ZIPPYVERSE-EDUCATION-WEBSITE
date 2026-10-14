// ============================================================
// Keistimewaan kostum - supaya barang di Toko benar-benar terasa gunanya
// ============================================================
//
// Latar belakang: sebelum ada berkas ini, membeli kostum hanya mengganti
// SATU gambar pada avatar HUD dan pratinjau profil. Maskot besar di beranda,
// peta, dan pulau tetap memakai pose yang ditulis mati di tiap halaman, jadi
// anak membayar 60-150 koin dan praktis tidak melihat apa-apa berubah.
// Sekarang tiap kostum punya satu keistimewaan kecil yang nyata.
//
// ATURAN YANG TIDAK BOLEH dilanggar:
//   Keistimewaan kostum `default` (Penjelajah) HARUS kosong, sehingga semua
//   fungsi di bawah mengembalikan nilai yang persis sama dengan parameter
//   cadangannya. Uji unit di `tests/store.test.mjs` menyetel save tanpa
//   `equipped`, sehingga `load()` mengisinya dengan "default". Kalau kostum
//   default memberi bonus apa pun, uji berikut akan gagal:
//     - "misi pertama memberi koin penuh"        (coins harus tepat 50)
//     - "urutan hadiah sesuai kontrak 7 hari"    (DAILY_REWARDS persis [50,...])
//     - "memulai satu misi mengurangi stamina sebesar 2"
//     - "stamina tidak melebihi batas maksimum"  (tepat MAX_STAMINA)
//   Anggap berkas ini bagian dari kontrak tersebut.
//
// Berkas ini sengaja TIDAK mengimpor apa pun supaya aman dipakai dari
// `lib/store.js` tanpa memicu siklus impor, dan supaya bisa diuji sendiri.

/**
 * Seluruh keistimewaan, dipetakan per id kostum.
 *
 * Nilainya sengaja berupa angka bulat atau persentase tunggal supaya mudah
 * dijelaskan ke anak dalam satu kalimat dan mudah diperiksa kebenarannya.
 *
 * | id         | keistimewaan                         |
 * |------------|--------------------------------------|
 * | default    | — (kostum awal)                      |
 * | melompat   | energi pulih 6 menit per poin        |
 * | merayakan  | hadiah login +25 koin                |
 * | menunjuk   | XP misi +20%                         |
 * | membaca    | koin misi +10%                       |
 * | berlari    | energi maksimal 24 (bukan 20)        |
 * | berpikir   | energi tiap misi cuma 1 (bukan 2)    |
 * | samping    | koin misi +30% dan XP +20%           |
 */
export const COSTUME_PERKS = {
  default: {},
  melompat: { regenMs: 6 * 60 * 1000 },
  merayakan: { dailyBonus: 25 },
  menunjuk: { xpBonus: 0.2 },
  membaca: { coinBonus: 0.1 },
  berlari: { maxStamina: 24 },
  berpikir: { staminaCost: 1 },
  samping: { coinBonus: 0.3, xpBonus: 0.2 },
};

/**
 * Ambil keistimewaan satu kostum. Id yang tidak dikenal diperlakukan seperti
 * kostum tanpa keistimewaan, supaya save rusak tidak pernah melempar galat.
 */
export function perkOf(id) {
  return COSTUME_PERKS[id] || {};
}

/** Koin misi setelah bonus kostum. Kostum default -> nilai asli. */
export function koinMisi(koinDasar, equipped) {
  const p = perkOf(equipped);
  return Math.round(koinDasar * (1 + (p.coinBonus || 0)));
}

/** XP misi setelah bonus kostum. Kostum default -> nilai asli. */
export function xpMisi(xpDasar, equipped) {
  const p = perkOf(equipped);
  return Math.round(xpDasar * (1 + (p.xpBonus || 0)));
}

/** Hadiah login harian setelah bonus kostum. Kostum default -> nilai asli. */
export function hadiahHarian(hadirDasar, equipped) {
  return hadirDasar + (perkOf(equipped).dailyBonus || 0);
}

/** Batas energi efektif. `cadangan` = nilai bawaan proyek. */
export function energiMaks(equipped, cadangan) {
  return perkOf(equipped).maxStamina ?? cadangan;
}

/** Lama pulih satu poin energi, dalam milidetik. */
export function regenMs(equipped, cadangan) {
  return perkOf(equipped).regenMs ?? cadangan;
}

/** Biaya energi untuk satu misi. */
export function biayaEnergi(equipped, cadangan) {
  return perkOf(equipped).staminaCost ?? cadangan;
}

/**
 * Kalimat keistimewaan untuk ditampilkan di Toko dan Profil.
 * @returns {string|null} null bila kostum tidak punya keistimewaan
 */
export function teksPerk(id) {
  const p = perkOf(id);
  const bagian = [];
  if (p.regenMs) bagian.push(`Energi pulih ${Math.round(p.regenMs / 60000)} menit per poin`);
  if (p.dailyBonus) bagian.push(`Hadiah login +${p.dailyBonus} koin`);
  if (p.coinBonus) bagian.push(`Koin misi +${Math.round(p.coinBonus * 100)}%`);
  if (p.xpBonus) bagian.push(`XP misi +${Math.round(p.xpBonus * 100)}%`);
  if (p.maxStamina) bagian.push(`Energi maksimal ${p.maxStamina}`);
  if (p.staminaCost) bagian.push(`Energi per misi cuma ${p.staminaCost}`);
  return bagian.length ? bagian.join(" dan ") : null;
}
