// ============================================================
// Kunci Panel Admin
// ============================================================
//
// BACA INI SEBELUM MENGANDALKAN BERKAS INI:
//
//   Ini BUKAN keamanan. Kode panel admin dikirim ke browser pengunjung
//   seperti kode lainnya, jadi siapa pun yang membuka Alat Pengembang bisa
//   membaca fungsi ini, melihat PIN tersimpan, dan menggantinya. Kunci ini
//   hanya berguna untuk satu hal yang nyata: menghalangi anak iseng yang
//   menekan-nekan tombol agar tidak merusak catatan belajarnya sendiri.
//
//   PIN disimpan sebagai ringkasan (bukan teks polos) supaya tidak terbaca
//   sekilas di localStorage. Tapi karena jumlah kombinasi PIN 4 digit cuma
//   10.000, ringkasan ini tetap bisa ditebak cepat. Jangan pernah menyimpan
//   rahasia nyata di sini.
//
// Berkas ini tanpa impor apa pun supaya bisa diuji sendiri di Node.

const KEY = "zippyverse_admin_pin_v1";

/**
 * Ringkas PIN memakai FNV-1a.
 *
 * Bukan kriptografi — hanya penghalang supaya PIN tidak tampil sebagai teks
 * biasa di penyimpanan peramban.
 */
export function ringkas(teks) {
  let h = 0x811c9dc5;
  const s = String(teks);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Benarkah bentuk PIN yang diizinkan? 4 sampai 8 angka. */
export function pinSah(pin) {
  return /^\d{4,8}$/.test(String(pin || "").trim());
}

/** Sudah pernah dibuat PIN-nya di perangkat ini? */
export function pinSudahAda() {
  try {
    if (typeof window !== "undefined") return Boolean(window.localStorage.getItem(KEY));
  } catch {}
  return false;
}

/** Buat PIN baru. @returns {boolean} berhasil atau tidak. */
export function buatPin(pin) {
  if (!pinSah(pin)) return false;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(KEY, ringkas(pin));
    }
    return true;
  } catch {
    return false;
  }
}

/** Cocokkan PIN yang dimasukkan. */
export function cekPin(pin) {
  try {
    if (typeof window === "undefined") return false;
    const tersimpan = window.localStorage.getItem(KEY);
    if (!tersimpan) return true; // belum ada PIN -> tidak ada yang dijaga
    return tersimpan === ringkas(pin);
  } catch {
    return false;
  }
}

/** Ganti PIN. @returns {boolean} berhasil atau tidak. */
export function gantiPin(lama, baru) {
  if (!cekPin(lama)) return false;
  return buatPin(baru);
}

/** Lupakan PIN (mis. admin lupa dan memulai dari awal). */
export function hapusPin() {
  try {
    if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
  } catch {}
}
