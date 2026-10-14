// Berkas robots dihasilkan dari kode (bukan berkas statis di public/)
// supaya selalu ikut ter-deploy dan alamat situsnya ikut terbaca dari
// NEXT_PUBLIC_SITE_URL - sama seperti yang dipakai sitemap dan OpenGraph.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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
