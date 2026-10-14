// ============================================================
// Rute Masukan — penjaga batas untuk kolom masukan pengembang
// ============================================================
//
// MENGAPA BERKAS INI ADA
//
// Formulir masukan mengantarkan pesan lewat `mailto:`, sehingga SERVER tidak
// pernah terlibat dalam pengiriman dan beban yang harus ditanggung sangat
// kecil. Lalu kenapa masih perlu pintu server?
//
// Karena batas yang hanya disimpan di localStorage bisa dilewati siapa saja
// dengan membuka Alat Pengembang lalu menghapus satu kunci. Pesan yang
// dibatasi hanya oleh peramban pada dasarnya tidak dibatasi sama sekali -
// dan bila kelak pengiriman dipindah ke server, barulah spam-nya benar-benar
// mengenai server. Maka batasnya ditegakkan DI SINI, di tempat yang tidak
// bisa dihapus dari sisi pengunjung.
//
// YANG DIJAGA
//
//   - Maksimal 5 pesan per hari per alamat IP.
//   - Hari dihitung menurut WIB (UTC+7), bukan UTC, karena situs ini
//     ditujukan untuk pembaca Indonesia.
//   - Identitas disimpan sebagai sidik jari hasil hash, BUKAN alamat IP
//     polos. IP mentah tidak pernah ditulis ke memori maupun balasan.
//
// CATATAN JUJUR SOAL PENYIMPANAN
//
// Penghitungnya berada di memori proses, sama seperti pembatas laju pada
// `/api/zippy`. Artinya ia berlaku untuk satu proses `next start` dan akan
// kembali ke nol setiap kali server dimuat ulang. Cukup untuk deployment
// tunggal yang dipakai sekarang. Bila kelak berjalan di beberapa instance
// atau serverless, pemindahnya perlu dipindah ke penyimpanan bersama
// (Redis atau tabel Supabase) - seluruh logika di sini sudah terpusat dalam
// `cekBatas()` sehingga hanya fungsi itu yang perlu ditukar.

import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";

// Memerlukan Node (bukan Edge) karena memakai `node:crypto` dan header
// permintaan untuk membaca alamat IP.
export const runtime = "nodejs";
// Jawaban bergantung pada siapa yang bertanya, jadi jangan pernah di-cache.
export const dynamic = "force-dynamic";

/** Batas yang diminta: lima pesan per orang per hari. */
const BATAS_HARIAN = 5;

/** Satu hari dalam milidetik. */
const HARI_MS = 24 * 60 * 60 * 1000;

/** Zona waktu Indonesia Barat (UTC+7), tanpa daylight saving. */
const OFFSET_WIB = 7 * 60 * 60 * 1000;

/** Batas panjang kolom, sejajar dengan batas pada formulirnya. */
const MAKS_NAMA = 40;
const MAKS_PESAN = 1200;
const MAKS_ALAT = 64;

/** Kategori yang sah - disalin dari `components/FeedbackForm.jsx`. */
const KATEGORI_SAH = new Set(["saran", "bug", "pujian", "konten", "lainnya"]);

/**
 * Penghitung utama: sidik jari IP -> { hari, jumlah }.
 * @type {Map<string, {hari: number, jumlah: number}>}
 */
const hitung = new Map();

/**
 * Catatan pengiriman untuk keperluan penelusuran spam.
 * Tidak berisi IP polos - hanya hash, sidik jari peramban, dan sidik jari
 * perangkat, semuanya sudah dipangkas menjadi 16 karakter heksadesimal.
 * @type {Array<{id: string, sidik: string, alat: string|null, peramban: string, waktu: number}>}
 */
const riwayat = [];

/** Agar peta dan riwayat tidak tumbuh tanpa batas bila diserang. */
const MAKS_CATATAN = 500;

/**
 * Hari menurut kalender WIB.
 *
 * `Date.now() / HARI_MS` akan memberi hari menurut UTC, yang bergeser pada
 * pukul 07.00 WIB. Dengan menambahkan offset WIB lebih dulu, batas hari
 * jatuh tepat pukul 00.00 waktu setempat.
 *
 * @returns {number} nomor hari, misalnya 20744
 */
function hariWib() {
  return Math.floor((Date.now() + OFFSET_WIB) / HARI_MS);
}

/**
 * Pukul berapa hitungan harian berikutnya direset (WIB).
 * @returns {number} stempel waktu milidetik
 */
function resetBerikutnya() {
  return (hariWib() + 1) * HARI_MS - OFFSET_WIB;
}

/**
 * Ubah sesuatu menjadi sidik jari 12 karakter.
 *
 * Hash dipakai supaya alamat IP milik pengunjung tidak pernah tersimpan
 * apa adanya. Enam belas karakter pertama sudah lebih dari cukup untuk
 * membedakan pengirim tanpa membuka ruang tebakan balik yang berarti.
 *
 * @param {string} teks
 * @returns {string}
 */
function sidikJari(teks) {
  return createHash("sha256").update(teks).digest("hex").slice(0, 16);
}

/**
 * Baca alamat IP dari permintaan.
 *
 * `x-forwarded-for` hanya boleh dipercaya bila ada di depan proxy yang
 * memang dipasang (Vercel, nginx). Dalam pengembangan lokal header itu bisa
 * dipalsukan, tetapi di sini ia hanya dipakai untuk MENGHITUNG, bukan untuk
 * memberi hak - jadi pemalsuannya paling banter memperoleh kuota miliknya
 * sendiri, bukan kuota milik orang lain.
 *
 * @param {Request} req
 * @returns {string}
 */
function ambilIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Buang catatan hari-hari lampau supaya peta tidak membengkak.
 * @param {number} hari
 */
function bersihkan(hari) {
  for (const [k, v] of hitung) {
    if (v.hari < hari) hitung.delete(k);
  }
  // Cadangan bila serangan memakai ribuan IP berbeda dalam satu hari.
  if (hitung.size > MAKS_CATATAN) {
    const lewat = hitung.size - MAKS_CATATAN;
    let n = 0;
    for (const k of hitung.keys()) {
      if (n++ >= lewat) break;
      hitung.delete(k);
    }
  }
  while (riwayat.length > MAKS_CATATAN) riwayat.shift();
}

/**
 * Periksa dan catat satu percobaan pengiriman.
 *
 * Fungsi INI satu-satunya tempat keputusan batas diambil. Bila kelak
 * penghitungnya dipindah ke penyimpanan bersama, cukup ganti isinya.
 *
 * @param {string} kunci sidik jari IP - SATU-SATUNYA dasar penghitungan
 * @param {string|null} alat sidik jari perangkat pengunjung
 * @param {string} peramban sidik jari peramban, untuk catatan saja
 * @returns {{boleh: boolean, sisa: number, resetPada: number}}
 */
function cekBatas(kunci, alat, peramban) {
  const hari = hariWib();
  bersihkan(hari);

  let v = hitung.get(kunci);
  if (!v || v.hari !== hari) {
    v = { hari, jumlah: 0 };
    hitung.set(kunci, v);
  }

  if (v.jumlah >= BATAS_HARIAN) {
    return { boleh: false, sisa: 0, resetPada: resetBerikutnya() };
  }

  v.jumlah += 1;
  riwayat.push({
    id: randomUUID(),
    sidik: kunci,
    alat,
    peramban,
    waktu: Date.now(),
  });

  return { boleh: true, sisa: BATAS_HARIAN - v.jumlah, resetPada: resetBerikutnya() };
}

/**
 * @param {Request} req
 * @returns {Promise<NextResponse>}
 */
export async function POST(req) {
  // Bentuk penolakan paling awal: body bukan JSON atau terlalu besar.
  const tipe = req.headers.get("content-type") || "";
  if (!tipe.includes("application/json")) {
    return NextResponse.json(
      { ok: false, pesan: "Permintaan harus berupa JSON." },
      { status: 415 }
    );
  }

  let isi;
  try {
    const teks = await req.text();
    // Dipotong SEBELUM diparse supaya badan raksasa tidak sempat masuk memori.
    if (teks.length > 8000) {
      return NextResponse.json(
        { ok: false, pesan: "Pesan terlalu panjang." },
        { status: 413 }
      );
    }
    isi = JSON.parse(teks);
  } catch {
    return NextResponse.json(
      { ok: false, pesan: "Badan permintaan tidak terbaca." },
      { status: 400 }
    );
  }

  const pesan = typeof isi?.pesan === "string" ? isi.pesan.trim() : "";
  const nama = typeof isi?.nama === "string" ? isi.nama.trim() : "";
  const kategori = typeof isi?.kategori === "string" ? isi.kategori : "";
  const alat =
    typeof isi?.deviceId === "string" && isi.deviceId
      ? sidikJari(isi.deviceId.slice(0, MAKS_ALAT))
      : null;

  // Validasi isi - sama longgarnya dengan aturan di formulir.
  if (pesan.length < 10 || pesan.length > MAKS_PESAN) {
    return NextResponse.json(
      {
        ok: false,
        pesan: `Pesan harus 10 sampai ${MAKS_PESAN} huruf.`,
      },
      { status: 422 }
    );
  }
  if (nama.length > MAKS_NAMA) {
    return NextResponse.json(
      { ok: false, pesan: `Nama maksimal ${MAKS_NAMA} huruf.` },
      { status: 422 }
    );
  }
  if (!KATEGORI_SAH.has(kategori)) {
    return NextResponse.json(
      { ok: false, pesan: "Jenis masukan tidak dikenal." },
      { status: 422 }
    );
  }

  // Batas harian berdasarkan IP adalah penjaga yang sesungguhnya: tidak bisa
  // dihapus dari sisi pengunjung karena penghitungnya hidup di sini.
  //
  // KUNCI HARUS IP SAJA. Percobaan pertama memakai `ip|user-agent` dan itu
  // salah besar: satu orang memakai Chrome lalu Firefox sudah langsung
  // memperoleh kuota baru, dan penulis bot bisa mengganti user-agent setiap
  // permintaan sehingga batas lima pesan praktis tidak pernah tercapai.
  // User-agent TETAP disimpan, tetapi hanya sebagai catatan pengenalan,
  // bukan sebagai bagian dari penghitung.
  const ip = ambilIp(req);
  const sidik = sidikJari(ip);
  const peramban = sidikJari(req.headers.get("user-agent") || "-");
  const hasil = cekBatas(sidik, alat, peramban);

  if (!hasil.boleh) {
    const jam = new Date(hasil.resetPada).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });
    return NextResponse.json(
      {
        ok: false,
        sisa: 0,
        batas: BATAS_HARIAN,
        resetPada: hasil.resetPada,
        pesan: `Batas ${BATAS_HARIAN} pesan per hari sudah tercapai. Silakan kirim lagi setelah pukul ${jam} WIB.`,
      },
      { status: 429 }
    );
  }

  return NextResponse.json({
    ok: true,
    sisa: hasil.sisa,
    batas: BATAS_HARIAN,
    resetPada: hasil.resetPada,
  });
}

/**
 * Ringkasan penggunaan (untuk pengembang, tanpa data mentah).
 *
 * Sengaja dibuka tanpa autentikasi karena isinya hanya hitungan dan sidik
 * jari hasil hash - tidak ada alamat IP, isi pesan, maupun nama yang bisa
 * dipakai untuk mengenali seseorang.
 */
export async function GET() {
  const hari = hariWib();
  return NextResponse.json({
    batas: BATAS_HARIAN,
    hariWib: hari,
    aktif: hitung.size,
    tercatat: riwayat.length,
    terpakai: riwayat.filter((r) => new Date(r.waktu) > new Date(Date.now() - HARI_MS)).length,
  });
}
