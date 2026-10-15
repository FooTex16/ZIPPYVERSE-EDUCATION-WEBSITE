import { alamatSitus } from "@/lib/situsUrl";

// Berkas robots dihasilkan dari kode (bukan berkas statis di public/)
// supaya selalu ikut ter-deploy dan alamat situsnya ikut terbaca dari
// NEXT_PUBLIC_SITE_URL - sama seperti yang dipakai sitemap dan OpenGraph.
// Tanpa cadangan dari lib/situsUrl.js, baris `Sitemap:` di bawah akan
// menunjuk ke localhost dan Lighthouse menandai robots.txt sebagai tidak
// valid karena peta situs itu tidak terjangkau.

const SITE_URL = alamatSitus();

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Tiga area ini bukan konten bacaan: satu panel pengelolaan, satu
        // arena bermain, dan satu berisi soal. Menampilkannya di hasil
        // pencarian hanya membingungkan, dan untuk /admin malah tidak
        // diinginkan sama sekali.
        disallow: ["/admin", "/peta", "/pulau/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
