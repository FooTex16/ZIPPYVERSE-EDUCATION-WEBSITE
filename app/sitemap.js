import { alamatSitus } from "@/lib/situsUrl";

// Sitemap dihasilkan dari kode supaya alamat situsnya ikut terbaca dari
// NEXT_PUBLIC_SITE_URL dan tidak perlu dirawat dua kali. Bila variabel itu
// tidak diisi, lib/situsUrl.js memakai alamat produksi yang dicatat Vercel -
// tanpanya seluruh <loc> di berkas ini akan menunjuk ke localhost dan mesin
// pencari tidak bisa mengindeks halaman mana pun.

// Daftar slug sengaja ditulis sebagai teks biasa, bukan diimpor dari
// lib/gameData.js. Berkas sitemap ini dijalankan Node saat proses build,
// sementara lib/gameData.js ikut menarik adminConfig yang dirancang untuk
// peramban. Menyalin enam slug jauh lebih murah daripada membuat build
// gagal karena satu berkas yang tersentuh angin.
const RUTE_PULAU = ["coba", "angka", "kata", "sains", "kreatif", "bumi"];

const SITE_URL = alamatSitus();

/** @returns {Array<{url:string,lastModified:Date,changeFrequency:string,priority:string}>} */
export default function sitemap() {
  const statis = [
    { path: "/", freq: "weekly", priority: "1.0" },
    { path: "/daftar", freq: "monthly", priority: "0.8" },
    { path: "/dashboard", freq: "monthly", priority: "0.5" },
  ].map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.freq,
    priority: r.priority,
  }));

  const pulau = RUTE_PULAU.map((slug) => ({
    url: `${SITE_URL}/pulau/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: "0.6",
  }));

  return [...statis, ...pulau];
}
