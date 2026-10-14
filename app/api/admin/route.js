// ============================================================
// Rute Admin — satu-satunya pintu yang memegang kunci istimewa
// ============================================================
//
// MENGAPA BERKAS INI ADA
//
// Sebelumnya panel admin membaca tabel Supabase langsung dari browser
// memakai kunci anon. Kunci anon adalah milik SEMUA pengunjung, sehingga
// panel admin pada dasarnya tidak punya hak istimewa apa pun - dan karena
// itu juga tidak bisa menulis apa pun.
//
// Sekarang seluruh urusan dengan Supabase dilakukan di sini, di sisi server.
// Kunci service role (`SUPABASE_SERVICE_ROLE_KEY`) hanya pernah hidup di
// proses Node ini dan TIDAK PERNAH dikirim ke peramban. Peramban hanya
// mengirim token sesi miliknya sendiri.
//
// PEMERIKSAAN PERAN
//
// Peran dibaca dari `app_metadata.role`. Metadata ini ditulis oleh Supabase
// dari sisi server dan DISERANGKAN oleh klien, sehingga tidak ada pengunjung
// yang bisa menaikkan derajatnya sendiri dengan membuka Alat Pengembang.
// Berbeda dengan `user_metadata`, yang memang boleh diubah pemilik akun.
//
// DEGRADASI BAIK
//
// Bila `SUPABASE_SERVICE_ROLE_KEY` belum diisi, rute ini menolak dengan
// pesan jelas dan halaman admin menampilkan petunjuk pengaturan - bukan
// error 500 yang membingungkan.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Rute ini memakai autentikasi dan klien basis data yang membutuhkan Node.
export const runtime = "nodejs";
// Jangan pernah disimpan dalam cache: jawabannya bergantung pada siapa yang
// bertanya.
export const dynamic = "force-dynamic";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const adminTersedia = Boolean(url && serviceKey);

/**
 * Tabel yang boleh ditelusuri lewat rute ini.
 *
 * Dibatasi secara eksplisit, bukan "semua tabel". Daftar ini adalah perisai
 * terakhir: kalau suatu saat ada tabel berisi data sensitif yang tidak
 * sengaja dibuat, ia tidak akan bisa dibaca lewat pintu ini hanya karena
 * ada yang menebak namanya.
 */
const TABEL_DIIZINKAN = new Set(["players", "progress"]);

const BATAS_BARIS = 500;

/**
 * Bangun klien Supabase berstatus pengelola.
 * `persistSession` dimatikan karena setiap permintaan adalah proses baru.
 */
function klienPengelola() {
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Pastikan pengirim adalah pengelola.
 *
 * @param {Request} req
 * @returns {Promise<{admin?:object, klien?:object, galat?:string, status?:number}>}
 */
async function verifikasiPengelola(req) {
  if (!adminTersedia) {
    return {
      galat:
        "Layanan pengelola belum dikonfigurasi. Isi SUPABASE_SERVICE_ROLE_KEY di berkas .env.local.",
      status: 503,
    };
  }

  const pembawa = req.headers.get("authorization") || "";
  const token = pembawa.replace(/^bearer\s+/i, "").trim();
  if (!token) {
    return { galat: "Sesi belum ada. Silakan masuk terlebih dahulu.", status: 401 };
  }

  const klien = klienPengelola();
  // `getUser(token)` memverifikasi tanda tangan token di server Supabase,
  // bukan sekadar membaca isinya. Token palsu akan ditolak di sini.
  const { data, error } = await klien.auth.getUser(token).catch(() => ({ data: null, error: new Error("gagal") }));
  if (error || !data?.user) {
    return { galat: "Sesi tidak sah atau sudah kedaluwarsa. Silakan masuk lagi.", status: 401 };
  }

  if (data.user.app_metadata?.role !== "admin") {
    return {
      galat: "Akun ini bukan akun pengelola.",
      status: 403,
    };
  }

  return { admin: data.user, klien };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const aksi = searchParams.get("aksi") || "cek";

    const hasil = await verifikasiPengelola(req);
    if (hasil.galat) {
      return NextResponse.json({ ok: false, galat: hasil.galat }, { status: hasil.status });
    }
    const { admin, klien } = hasil;

    // --- Aksi: verifikasi status. Dipakai halaman admin untuk membuka panel.
    if (aksi === "cek") {
      return NextResponse.json({
        ok: true,
        peran: admin.app_metadata?.role || null,
        email: admin.email || null,
        id: admin.id,
      });
    }

    // --- Aksi: telusuri tabel.
    if (aksi === "baca") {
      const tabel = searchParams.get("tabel") || "";
      if (!TABEL_DIIZINKAN.has(tabel)) {
        return NextResponse.json(
          {
            ok: false,
            galat: `Tabel "${tabel || "(kosong)"}" tidak ada dalam daftar yang boleh ditelusuri.`,
          },
          { status: 400 }
        );
      }

      const limit = Math.min(
        Math.max(parseInt(searchParams.get("limit") || "200", 10) || 200, 1),
        BATAS_BARIS
      );

      const { data, error, count } = await klien
        .from(tabel)
        .select("*", { count: "exact" })
        .limit(limit);

      if (error) {
        return NextResponse.json(
          { ok: false, galat: terjemahGalat(error), kode: error.code || null },
          { status: 400 }
        );
      }

      return NextResponse.json({
        ok: true,
        tabel,
        jumlah: count ?? (data ? data.length : 0),
        dikembalikan: data ? data.length : 0,
        baris: data || [],
      });
    }

    return NextResponse.json({ ok: false, galat: `Aksi "${aksi}" tidak dikenal.` }, { status: 400 });
  } catch (err) {
    // Pesan galat asli sengaja tidak dibawa ke klien: bisa memuat potongan
    // koneksi atau berkas. Yang dicatat di log server, yang dikirim hanya
    // ringkasannya.
    console.error("[admin] galat tak terduga:", err?.message || err);
    return NextResponse.json(
      { ok: false, galat: "Terjadi kesalahan di server. Coba lagi." },
      { status: 500 }
    );
  }
}

/** Terjemahkan kode galat Supabase ke kalimat yang bisa ditindaklanjuti. */
function terjemahGalat(error) {
  const code = error?.code;
  const message = error?.message || "";
  if (code === "42501")
    return "Ditolak: kebijakan RLS memblokir akses. Periksa kebijakan tabel di dasbor Supabase.";
  if (code === "PGRST205" || /could not find the table/i.test(message))
    return "Tabel belum ada di database.";
  if (code === "PGRST204")
    return "Kolom yang diminta tidak ada. Perlu migrasi schema (lihat kueri ke-4 di tab Supabase).";
  if (/failed to fetch|network/i.test(message)) return "Jaringan gagal. Periksa koneksi internet.";
  return message || "Galat tidak dikenal.";
}
