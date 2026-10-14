// ============================================================
// Rute Anak — tempat sebuah akun Pendamping menyinkronkan anaknya
// ============================================================
//
// MENGAPA TERPISAH DARI /api/admin
//
// Perangkat keluarga BUKAN pengelola. Ia tidak boleh memakai pintu admin
// (itu ditolak 403 sejak awal), dan ia juga tidak memegang kunci service
// role - kunci itu tidak pernah meninggalkan server.
//
// Jadi permintaan di sini dijalankan memakai TOKEN PENGGUNA SENDIRI.
// Klien Supabase dibuat dengan Authorization berisi token itu, sehingga
// baris yang terbaca dan tertulis melewati Row Level Security persis seperti
// kebijakan `children` yang sudah ada:
//
//     using (auth.uid() = pendamping_id)
//
// Artinya pengguna yang masuk HANYA bisa menyentuh anaknya SENDIRI. Bukan
// lewat pemeriksaan buatan sendiri di sini (yang bisa lupa), melainkan
// lewat kebijakan di basis data yang tidak bisa dilewati permintaan apa pun.
//
// KEKOSONGAN TIDAK PERNAH DIARTIKAN SEBAGAI "HAPUS SEMUA"
//
// Sinkronisasi mengambil daftar dari awan lalu menerapkannya ke perangkat.
// Bila ambil daftar ternyata kosong dan itu langsung menerapkan penghapusan,
// satu gangguan jaringan akan menghapus seluruh anak keluarga - persis bug
// yang pernah terjadi. Karena itu aturannya ditulis eksplisit di sisi klien
// (lihat lib/syncAnak.js): daftar kosong TIDAK PERNAH menghapus apa pun.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Batas anak per pendamping - sejajar dengan MAKS_ANAK di lib/profil.js. */
const MAKS_ANAK = 6;

/** Panjang maksimum nama anak - sejajar dengan potongan di tambahAnak(). */
const MAKS_NAMA_ANAK = 18;

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Klien Supabase yang berjalan SEBAGAI pengguna pemegang token ini.
 *
 * Bukan klien admin: tidak ada kunci istimewa di sini sama sekali. RLS-lah
 * yang menjadi penjaganya.
 *
 * @param {string} token token akses sesi Supabase
 */
function klienPengguna(token) {
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Ambil token dari header Authorization dan verifikasi ke Supabase.
 *
 * `getUser(token)` memverifikasi tanda tangan token di server Supabase,
 * sehingga header yang diubah sendiri oleh pengirim tidak ada gunanya.
 *
 * @returns {Promise<{user?:object, galat?:string, status?:number}>}
 */
async function penggunaDari(req) {
  if (!url || !anonKey) {
    return { galat: "Supabase belum dikonfigurasi di server ini.", status: 503 };
  }

  const pembawa = req.headers.get("authorization") || "";
  const token = pembawa.replace(/^bearer\s+/i, "").trim();
  if (!token) {
    return { galat: "Belum masuk ke akun Pendamping.", status: 401 };
  }

  const klien = klienPengguna(token);
  const { data, error } = await klien.auth.getUser(token).catch(() => ({ data: null, error: new Error("gagal") }));

  if (error || !data?.user) {
    return { galat: "Sesi sudah berakhir. Masuk kembali.", status: 401 };
  }

  return { user: data.user, klien };
}

/** Susun balikan galat menjadi jawaban JSON yang konsisten. */
function tolak(galat, status) {
  return NextResponse.json({ ok: false, galat }, { status });
}

// ============================================================
// Ambil daftar anak milik akun ini
// ============================================================
export async function GET(req) {
  try {
    const hasil = await penggunaDari(req);
    if (hasil.galat) return tolak(hasil.galat, hasil.status);
    const { user, klien } = hasil;

    const { data, error } = await klien
      .from("children")
      .select("id, nama, created_at")
      .eq("pendamping_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[anak] galat baca:", error.message, error.code || "");
      // PostgREST tidak memakai kode SQL standar untuk tabel yang hilang:
      // ia membalas PGRST205 dengan "could not find ... in the schema cache".
      // Kode 42P01 (SQL: undefined_table) tetap dicek untuk jaga-jaga bila
      // ada perubahan perilaku di versi mendatang.
      const tabelHilang =
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        /schema cache|does not exist/i.test(error.message || "");

      return tolak(
        tabelHilang
          ? "Tabel anak belum dibuat. Jalankan MIGRASI.sql di Supabase SQL Editor."
          : "Gagal membaca daftar anak.",
        400
      );
    }

    return NextResponse.json({ ok: true, anak: data || [] });
  } catch (err) {
    console.error("[anak] galat tak terduga (GET):", err?.message || err);
    return tolak("Terjadi kesalahan di server. Coba lagi.", 500);
  }
}

// ============================================================
// Tulis ulang daftar anak milik akun ini
// ============================================================
//
// TANGGUNG JAWAB KALI INI: perangkat yang bertanya adalah SATU-SATUNYA
// sumber kebenaran untuk daftarnya sendiri. Karena itu langkahnya:
//
//   1. anak di daftar kiriman yang belum ada  -> disisipkan
//   2. anak di daftar kiriman yang sudah ada  -> dibiarkan (namanya bisa
//      berubah, jadi cocokkan dulu namanya lalu perbarui)
//   3. baris di basis data yang tidak ikut dikirim -> dihapus
//
// Langkah 3 adalah cara satu-satunya agar penghapusan yang dilakukan anak di
// perangkat ikut sampai ke basis data. Tanpanya, anak yang dihapus keluarga
// akan muncul lagi setiap kali panel admin membacanya.
export async function POST(req) {
  try {
    const hasil = await penggunaDari(req);
    if (hasil.galat) return tolak(hasil.galat, hasil.status);
    const { user, klien } = hasil;

    const tipe = req.headers.get("content-type") || "";
    if (!tipe.includes("application/json")) {
      return tolak("Permintaan harus berupa JSON.", 415);
    }

    let body;
    try {
      const teks = await req.text();
      if (teks.length > 8000) {
        return tolak("Permintaan terlalu besar.", 413);
      }
      body = JSON.parse(teks);
    } catch {
      return tolak("Badan permintaan tidak terbaca.", 400);
    }

    const daftarMentah = Array.isArray(body?.anak) ? body.anak : null;
    if (!daftarMentah) {
      return tolak("Daftar anak tidak terbaca.", 422);
    }
    if (daftarMentah.length > MAKS_ANAK) {
      return tolak(`Satu pendamping maksimal ${MAKS_ANAK} anak.`, 422);
    }

    // Normalisasi: buang yang kosong, rapikan spasi ganda, potong panjang.
    const daftar = [];
    const namaTerlihat = new Set();
    for (const entri of daftarMentah) {
      const nama = String(entri?.nama || "").trim().replace(/\s+/g, " ").slice(0, MAKS_NAMA_ANAK);
      if (!nama || namaTerlihat.has(nama)) continue;
      namaTerlihat.add(nama);
      daftar.push(nama);
    }

    // --- Baris yang sudah ada.
    const { data: lama, error: galatLama } = await klien
      .from("children")
      .select("id, nama")
      .eq("pendamping_id", user.id);

    if (galatLama) {
      console.error("[anak] galat baca saat menulis:", galatLama.message);
      return tolak("Gagal membaca daftar anak yang lama.", 400);
    }

    const sudahAda = new Set((lama || []).map((b) => b.nama));

    // 1 - sisipkan anak yang belum punya baris.
    //
    // Kecocokan memakai NAMA, bukan id. Id anak di perangkat berupa nanoid
    // pendek sementara kolom `children.id` menuntut uuid, jadi keduanya tidak
    // pernah bisa dibandingkan langsung. Nama juga satu-satunya yang memang
    // dijamin unik per pendamping lewat batas `children_nama_unik`.
    const perluSisip = daftar.filter((n) => !sudahAda.has(n));

    if (perluSisip.length) {
      const { error: galatSisip } = await klien.from("children").insert(
        perluSisip.map((nama) => ({ pendamping_id: user.id, nama }))
      );
      if (galatSisip) {
        if (galatSisip.code === "23505") {
          return tolak("Ada nama anak kembar untuk pendamping ini.", 409);
        }
        console.error("[anak] galat sisip:", galatSisip.message);
        return tolak("Gagal menyimpan daftar anak.", 400);
      }
    }

    // 2 - baca ulang: setelah penyisipan, daftar ini adalah keadaan jujur
    //     yang bisa dipakai untuk memutuskan apa yang harus dibuang.
    const { data: kini, error: galatKini } = await klien
      .from("children")
      .select("id, nama")
      .eq("pendamping_id", user.id);

    if (galatKini) {
      console.error("[anak] galat baca ulang:", galatKini.message);
      return tolak("Gagal membaca daftar anak.", 400);
    }

    // 3 - buang baris yang tidak ikut dikirim. Inilah satu-satunya jalan agar
    //     penghapusan yang dilakukan anak di perangkat ikut sampai ke basis
    //     data; tanpanya anak yang dihapus keluarga akan muncul lagi begitu
    //     panel admin membacanya.
    const bolehDipakai = new Set(daftar);
    const idBuang = (kini || [])
      .filter((b) => !bolehDipakai.has(b.nama))
      .map((b) => b.id);

    if (idBuang.length) {
      const { error: galatHapus } = await klien
        .from("children")
        .delete()
        .in("id", idBuang);
      if (galatHapus) {
        console.error("[anak] galat hapus:", galatHapus.message);
        return tolak("Gagal menghapus anak lama.", 400);
      }
    }

    const akhir = (kini || []).filter((b) => bolehDipakai.has(b.nama));

    return NextResponse.json({ ok: true, anak: akhir });
  } catch (err) {
    console.error("[anak] galat tak terduga (POST):", err?.message || err);
    return tolak("Terjadi kesalahan di server. Coba lagi.", 500);
  }
}
