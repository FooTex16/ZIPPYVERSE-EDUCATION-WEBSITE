/**
 * Alamat situs absolut.
 *
 * Dipakai di tiga tempat: `openGraph.url` (pratinjau tautan di WhatsApp dan
 * Twitter), `<loc>` sitemap.xml, dan baris `Sitemap:` di robots.txt. Ketiganya
 * membutuhkan alamat penuh - nama host saja tidak cukup.
 *
 * Urutan pembacaan:
 *
 *   1. `NEXT_PUBLIC_SITE_URL`  - penegasan manual, misalnya bila kelak situs
 *                                dipindah ke nama domain sendiri. Diisi lewat
 *                                berkas `.env.local` atau pengaturan lingkungan
 *                                host.
 *   2. `VERCEL_PROJECT_PRODUCTION_URL` - alamat produksi yang dicatat Vercel
 *                                untuk proyek ini. Nilainya ikut berubah bila
 *                                nama domain berganti, dan tersedia saat proses
 *                                build, jadi berkas statis ikut memakainya.
 *   3. `VERCEL_URL`            - alamat pratinjau untuk cabang tertentu.
 *   4. `http://localhost:3000` - cadangan terakhir untuk pengembangan di mesin
 *                                sendiri.
 *
 * Tanpa langkah 2 dan 3, situs yang di-host akan membanggakan diri sebagai
 * `http://localhost:3000`: pratinjau tautan di media sosial mati, sitemap
 * menunjuk ke alamat yang tidak ada di internet, dan Lighthouse menandai
 * robots.txt sebagai tidak valid karena peta situsnya tidak terjangkau.
 */
export function alamatSitus() {
  const manual = process.env.NEXT_PUBLIC_SITE_URL;
  if (manual) return manual.replace(/\/+$/, "");

  const produksi = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (produksi) return `https://${produksi}`;

  const pratinjau = process.env.VERCEL_URL;
  if (pratinjau) return `https://${pratinjau}`;

  return "http://localhost:3000";
}
