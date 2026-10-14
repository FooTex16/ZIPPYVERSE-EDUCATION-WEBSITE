// ============================================================
// Pemanggil API panel admin dari sisi peramban
// ============================================================
//
// Berkas ini sengaja TERPISAH dari lib/adminAuth.js. Berkas adminAuth harus
// tetap tanpa impor apa pun supaya bisa diuji langsung di Node tanpa
// peramban; menambahkan impor Supabase ke sana akan meruntuhkan seluruh
// ujiannya.
//
// Yang dilakukan di sini hanya satu: mengirim token sesi milik pengguna ke
// /api/admin, lalu menerima hasilnya. Tidak ada kunci istimewa yang pernah
// sampai ke peramban — kunci service role hidup sepenuhnya di server.

import { supabase, supabaseEnabled } from "./supabase.js";

/** Ambil token akses dari sesi Supabase yang sedang berjalan. */
async function tokenSesi() {
  if (!supabaseEnabled) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Panggil /api/admin dengan token sesi.
 *
 * @param {string} kueri  string kueri, mis. "aksi=cek" atau "aksi=baca&tabel=players"
 * @returns {Promise<{ok:boolean, galat?:string, [k:string]:any}>}
 */
export async function panggilAdmin(kueri) {
  const token = await tokenSesi();
  if (!token) {
    return { ok: false, galat: "Belum masuk ke akun pengelola." };
  }

  try {
    const res = await fetch(`/api/admin?${kueri}`, {
      headers: { Authorization: `Bearer ${token}` },
      // Jawaban berbeda tiap pengguna, jadi jangan pernah ikut disimpan cache.
      cache: "no-store",
    });
    const teks = await res.text();
    let data = null;
    try {
      data = JSON.parse(teks);
    } catch {
      data = null;
    }
    if (!data) {
      return { ok: false, galat: `Server membalas bukan JSON (status ${res.status}).` };
    }
    return data;
  } catch {
    return { ok: false, galat: "Gagal menghubungi server. Periksa koneksi internet." };
  }
}

/** Pastikan akun yang sedang masuk benar-benar berperan pengelola. */
export function periksaStatusAdmin() {
  return panggilAdmin("aksi=cek");
}

/** Telusuri isi sebuah tabel. */
export function bacaTabel(namaTabel, limit = 200) {
  const q = new URLSearchParams({ aksi: "baca", tabel: String(namaTabel), limit: String(limit) });
  return panggilAdmin(q.toString());
}

/**
 * Kirim aksi TULIS ke /api/admin.
 *
 * Sengaja fungsi terpisah dari `panggilAdmin` (yang GET): perubahan data
 * tidak boleh ikut terkirim lewat URL karena alamat bisa tercatat di
 * riwayat peramban, di log server, dan di laporan kesalahan pihak ketiga.
 *
 * Validasi sesungguhnya ada di server — fungsi ini hanya pembungkus, bukan
 * pengaman.
 *
 * @param {string} aksi     nama aksi, mis. "anak.simpan"
 * @param {object} [isi]    badan permintaan
 * @returns {Promise<{ok:boolean, galat?:string, [k:string]:any}>}
 */
export async function tulisAdmin(aksi, isi = {}) {
  const token = await tokenSesi();
  if (!token) {
    return { ok: false, galat: "Belum masuk ke akun pengelola." };
  }

  try {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ aksi, ...isi }),
      cache: "no-store",
    });
    const teks = await res.text();
    let data = null;
    try {
      data = JSON.parse(teks);
    } catch {
      data = null;
    }
    if (!data) {
      return { ok: false, galat: `Server membalas bukan JSON (status ${res.status}).` };
    }
    return data;
  } catch {
    return { ok: false, galat: "Gagal menghubungi server. Periksa koneksi internet." };
  }
}
