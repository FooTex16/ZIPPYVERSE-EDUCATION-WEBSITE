// ============================================================
// Pengaturan konten yang bisa diubah lewat Panel Admin
// ============================================================
//
// Semua angka di proyek ini dulu ditulis mati sebagai konstanta di
// `lib/store.js` (batas energi, waktu pulih, hadiah harian) dan
// `lib/gameData.js` (harga kostum). Mengubahnya berarti menyunting kode dan
// membangun ulang. Panel Admin menyimpan nilai gantinya di localStorage,
// lalu berkas ini membacanya kembali saat permainan berjalan.
//
// KEPUTUSAN PENTING: konstanta asli di store.js TIDAK dihapus dan tetap
// diekspor apa adanya, karena `tests/store.test.mjs` mengimpornya dan
// membandingkan nilai persis. Yang berubah hanya cara fungsi-fungsi runtime
// membaca angkanya: lewat `bacaConfig()` yang jatuh ke nilai bawaan bila
// tidak ada pengaturan tersimpan. Karena itu uji tetap lulus, dan permainan
// tetap berjalan sama persis selama admin belum mengubah apa pun.

const KEY = "zippyverse_admin_config_v1";

/**
 * Nilai bawaan proyek. Harus selalu sama dengan konstanta di store.js dan
 * harga di gameData.js — lihat `cocokDenganBawaan()` untuk pemeriksaannya.
 */
export const CONFIG_BAWAAN = Object.freeze({
  dailyRewards: [50, 75, 100, 125, 150, 200, 300],
  maxStamina: 20,
  staminaPerMission: 2,
  staminaRegenMenit: 8,
  hargaKostum: {
    default: 0,
    melompat: 60,
    merayakan: 60,
    menunjuk: 90,
    membaca: 90,
    berlari: 120,
    berpikir: 120,
    samping: 150,
  },
});

/** Batas wajar supaya panel tidak bisa merusak permainan. */
const BATAS = {
  dailyRewards: { min: 0, max: 9999 },
  maxStamina: { min: 1, max: 999 },
  staminaPerMission: { min: 0, max: 99 },
  staminaRegenMenit: { min: 1, max: 999 },
  hargaKostum: { min: 0, max: 99999 },
};

function angka(v, { min, max }, cadangan) {
  const n = Number(v);
  if (!Number.isFinite(n)) return cadangan;
  return Math.max(min, Math.min(max, Math.round(n)));
}

/**
 * Baca pengaturan konten yang sedang berlaku.
 *
 * Tidak pernah melempar galat: nilai yang tidak terbaca, salah tipe, atau
 * tidak masuk akal langsung diganti nilai bawaan. Ini penting karena berkas
 * ini dipanggil dari setiap `load()` — satu galat di sini akan membuat seluruh
 * permainan tidak bisa dibuka sama sekali.
 */
export function bacaConfig() {
  const b = CONFIG_BAWAAN;
  let simpanan = null;
  try {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(KEY);
      if (raw) simpanan = JSON.parse(raw);
    }
  } catch {
    simpanan = null;
  }
  if (!simpanan || typeof simpanan !== "object") {
    return { ...b, dailyRewards: [...b.dailyRewards], hargaKostum: { ...b.hargaKostum } };
  }

  const harian = Array.isArray(simpanan.dailyRewards) ? simpanan.dailyRewards : [];
  const dailyRewards = b.dailyRewards.map((d, i) =>
    angka(harian[i], BATAS.dailyRewards, d)
  );

  const harga = simpanan.hargaKostum && typeof simpanan.hargaKostum === "object" ? simpanan.hargaKostum : {};
  const hargaKostum = Object.fromEntries(
    Object.entries(b.hargaKostum).map(([id, p]) => [
      id,
      angka(harga[id], BATAS.hargaKostum, p),
    ])
  );

  return {
    dailyRewards,
    maxStamina: angka(simpanan.maxStamina, BATAS.maxStamina, b.maxStamina),
    staminaPerMission: angka(simpanan.staminaPerMission, BATAS.staminaPerMission, b.staminaPerMission),
    staminaRegenMenit: angka(simpanan.staminaRegenMenit, BATAS.staminaRegenMenit, b.staminaRegenMenit),
    hargaKostum,
  };
}

/** Tulis sebagian pengaturan; sisanya dipertahankan lalu dibaca ulang. */
export function tulisConfig(cacah) {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(KEY, JSON.stringify(cacah || {}));
    }
  } catch {}
  return bacaConfig();
}

/** Hapus pengaturan tersimpan dan kembali ke nilai bawaan. */
export function resetConfig() {
  try {
    if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
  } catch {}
  return bacaConfig();
}

/** Benarkah pengaturan yang berlaku sama dengan bawaan? */
export function cocokDenganBawaan(c = bacaConfig()) {
  return JSON.stringify(c) === JSON.stringify(CONFIG_BAWAAN);
}
