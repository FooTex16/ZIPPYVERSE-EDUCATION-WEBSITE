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
const TABEL_DIIZINKAN = new Set([
  "players",
  "progress",
  // Kelola data akun: anak beraut pendamping, dan profil pendampingnya.
  "children",
  "profiles",
  // Materi "Lihat Planet" - hanya admin yang boleh menulisnya.
  "planets",
  "missions",
]);

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

// ============================================================
// Tulis - satu-satunya tempat panel admin boleh mengubah data
// ============================================================
//
// Seluruh aksi di bawah melewati `verifikasiPengelola()` lebih dulu, jadi
// pengunjung biasa yang menebak-nebak endpoint ini berhenti di 403 sebelum
// satu byte pun dibaca. Kunci service role tidak pernah meninggalkan proses
// ini.
//
// Validasi dilakukan di SERVER, bukan di formulirnya: formulir bisa dilewati
// dengan mengirim permintaan langsung memakai Alat Pengembang.

/** Batas anak per pendamping - sejajar dengan MAKS_ANAK di lib/profil.js. */
const MAKS_ANAK = 6;

/** Panjang maksimum nama anak - sejajar dengan potongan di tambahAnak(). */
const MAKS_NAMA_ANAK = 18;

/** Aksi tulis yang dikenal. Tak ada yang lain akan ditolak. */
const AKSI_TULIS = new Set([
  "pendamping.daftar",
  "pendamping.buat",
  "pendamping.hapus",
  "anak.simpan",
  "anak.hapus",
]);

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** @param {string} s @returns {boolean} */
const isUuid = (s) => typeof s === "string" && RE_UUID.test(s);

export async function POST(req) {
  try {
    const hasil = await verifikasiPengelola(req);
    if (hasil.galat) {
      return NextResponse.json({ ok: false, galat: hasil.galat }, { status: hasil.status });
    }
    const { admin, klien } = hasil;

    const tipe = req.headers.get("content-type") || "";
    if (!tipe.includes("application/json")) {
      return NextResponse.json(
        { ok: false, galat: "Permintaan harus berupa JSON." },
        { status: 415 }
      );
    }

    let body;
    try {
      const teks = await req.text();
      // Dipotong SEBELUM diparse supaya badan raksasa tidak sempat masuk memori.
      if (teks.length > 8000) {
        return NextResponse.json({ ok: false, galat: "Permintaan terlalu besar." }, { status: 413 });
      }
      body = JSON.parse(teks);
    } catch {
      return NextResponse.json({ ok: false, galat: "Badan permintaan tidak terbaca." }, { status: 400 });
    }

    const aksi = typeof body?.aksi === "string" ? body.aksi : "";
    if (!AKSI_TULIS.has(aksi)) {
      return NextResponse.json(
        { ok: false, galat: `Aksi "${aksi || "(kosong)"}" tidak dikenal.` },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Daftar pendamping beserta anak-anaknya
    // ---------------------------------------------------------
    if (aksi === "pendamping.daftar") {
      const { data, error } = await klien.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (error) {
        return NextResponse.json({ ok: false, galat: terjemahGalat(error) }, { status: 400 });
      }

      const { data: anak, error: galatAnak } = await klien
        .from("children")
        .select("*")
        .order("created_at", { ascending: true });

      if (galatAnak) {
        return NextResponse.json(
          { ok: false, galat: terjemahGalat(galatAnak) },
          { status: 400 }
        );
      }

      // Kelompokkan anak per pemilik dalam satu lintasan.
      const perPemilik = new Map();
      for (const a of anak || []) {
        const k = a.pendamping_id;
        if (!perPemilik.has(k)) perPemilik.set(k, []);
        perPemilik.get(k).push(a);
      }

      return NextResponse.json({
        ok: true,
        pendamping: (data?.users || []).map((u) => ({
          id: u.id,
          email: u.email,
          dibuat: u.created_at,
          // Ditandai supaya panel bisa memperingatkan sebelum menghapus
          // akun yang sedang dipakai untuk masuk ke panel ini.
          iniPengelola: u.id === admin.id,
          anak: perPemilik.get(u.id) || [],
        })),
      });
    }

    // ---------------------------------------------------------
    // Buat akun Pendamping baru
    // ---------------------------------------------------------
    if (aksi === "pendamping.buat") {
      const email = String(body?.email || "").trim().toLowerCase();
      const sandi = String(body?.sandi || "");

      if (!RE_EMAIL.test(email)) {
        return NextResponse.json({ ok: false, galat: "Alamat surel tidak sah." }, { status: 422 });
      }
      // Supabase menetapkan sandi minimal 6. Kita minta 8 supaya akun yang
      // dibuat pengelola tidak lemah sejak awal.
      if (sandi.length < 8) {
        return NextResponse.json(
          { ok: false, galat: "Kata sandi minimal 8 karakter." },
          { status: 422 }
        );
      }

      const { data, error } = await klien.auth.admin.createUser({
        email,
        password: sandi,
        // Konfirmasi otomatis: akun ini dibuat oleh pengelola yang sudah
        // berada di belakang gerbang admin, jadi menunggu surel hanya
        // menambah langkah yang tidak perlu.
        email_confirm: true,
      });

      if (error) {
        return NextResponse.json({ ok: false, galat: terjemahAuth(error) }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        pendamping: { id: data.user?.id, email: data.user?.email },
        anak: [],
      });
    }

    // ---------------------------------------------------------
    // Hapus akun Pendamping
    // ---------------------------------------------------------
    if (aksi === "pendamping.hapus") {
      const id = String(body?.id || "");
      if (!isUuid(id)) {
        return NextResponse.json({ ok: false, galat: "Id pengguna tidak sah." }, { status: 422 });
      }
      if (id === admin.id) {
        return NextResponse.json(
          { ok: false, galat: "Tidak bisa menghapus akun yang sedang dipakai untuk masuk." },
          { status: 400 }
        );
      }

      const { error } = await klien.auth.admin.deleteUser(id);
      if (error) {
        return NextResponse.json({ ok: false, galat: terjemahAuth(error) }, { status: 400 });
      }

      // Anak ikut terhapus oleh `on delete cascade` di tabel children, dan
      // baris players yang tertaut hanya kehilangan tautannya (set null) -
      // riwayat kemajuan sengaja tidak dibuang diam-diam.
      return NextResponse.json({ ok: true });
    }

    // ---------------------------------------------------------
    // Tambah atau ubah satu anak
    // ---------------------------------------------------------
    if (aksi === "anak.simpan") {
      const id = body?.id ? String(body.id) : null;
      const pemilik = String(body?.pendamping_id || "");
      const nama = String(body?.nama || "").trim().replace(/\s+/g, " ");

      if (!isUuid(pemilik)) {
        return NextResponse.json(
          { ok: false, galat: "Pemilik anak tidak sah." },
          { status: 422 }
        );
      }
      if (!nama || nama.length > MAKS_NAMA_ANAK) {
        return NextResponse.json(
          { ok: false, galat: `Nama anak harus 1 sampai ${MAKS_NAMA_ANAK} huruf.` },
          { status: 422 }
        );
      }

      if (id) {
        // Ubah nama saja - id dan pemilik tidak pernah berubah lewat sini.
        if (!isUuid(id)) {
          return NextResponse.json({ ok: false, galat: "Id anak tidak sah." }, { status: 422 });
        }
        const { data, error } = await klien
          .from("children")
          .update({ nama })
          .eq("id", id)
          .select()
          .maybeSingle();
        if (error) {
          return NextResponse.json({ ok: false, galat: terjemahGalat(error) }, { status: 400 });
        }
        if (!data) {
          return NextResponse.json(
            { ok: false, galat: "Anak itu tidak ditemukan." },
            { status: 404 }
          );
        }
        return NextResponse.json({ ok: true, anak: data });
      }

      // Baru - periksa batas dan nama kembar dulu.
      const { count, error: galatHitung } = await klien
        .from("children")
        .select("id", { count: "exact", head: true })
        .eq("pendamping_id", pemilik);
      if (galatHitung) {
        return NextResponse.json({ ok: false, galat: terjemahGalat(galatHitung) }, { status: 400 });
      }
      if ((count ?? 0) >= MAKS_ANAK) {
        return NextResponse.json(
          { ok: false, galat: `Satu pendamping maksimal ${MAKS_ANAK} anak.` },
          { status: 422 }
        );
      }

      const { data, error } = await klien
        .from("children")
        .insert({ pendamping_id: pemilik, nama })
        .select()
        .single();

      if (error) {
        // 23505 = pelanggaran unik: nama kembar untuk pendamping yang sama.
        if (error.code === "23505") {
          return NextResponse.json(
            { ok: false, galat: `Pendamping ini sudah punya anak bernama ${nama}.` },
            { status: 409 }
          );
        }
        return NextResponse.json({ ok: false, galat: terjemahGalat(error) }, { status: 400 });
      }

      return NextResponse.json({ ok: true, anak: data }, { status: 201 });
    }

    // ---------------------------------------------------------
    // Hapus satu anak
    // ---------------------------------------------------------
    if (aksi === "anak.hapus") {
      const id = String(body?.id || "");
      if (!isUuid(id)) {
        return NextResponse.json({ ok: false, galat: "Id anak tidak sah." }, { status: 422 });
      }

      const { data, error } = await klien
        .from("children")
        .delete()
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) {
        return NextResponse.json({ ok: false, galat: terjemahGalat(error) }, { status: 400 });
      }
      if (!data) {
        return NextResponse.json(
          { ok: false, galat: "Anak itu tidak ditemukan." },
          { status: 404 }
        );
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, galat: "Aksi tidak dikenal." }, { status: 400 });
  } catch (err) {
    console.error("[admin] galat tak terduga (POST):", err?.message || err);
    return NextResponse.json(
      { ok: false, galat: "Terjadi kesalahan di server. Coba lagi." },
      { status: 500 }
    );
  }
}

/** Terjemahkan pesan galat autentikasi Supabase ke bahasa yang jelas. */
function terjemahAuth(error) {
  const m = (error?.message || "").toLowerCase();
  if (m.includes("already registered") || m.includes("already exists"))
    return "Alamat surel ini sudah terdaftar.";
  if (m.includes("password")) return "Kata sandi tidak memenuhi syarat Supabase.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Terlalu banyak permintaan. Coba lagi sebentar.";
  if (m.includes("user not found")) return "Pengguna tidak ditemukan.";
  return error?.message || "Gagal memproses permintaan.";
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
