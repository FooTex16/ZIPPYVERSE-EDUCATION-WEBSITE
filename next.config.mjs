/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * Hasil build berdiri sendiri tanpa perlu seluruh node_modules.
   *
   * Dibutuhkan oleh Dockerfile: tanpa ini, image harus membawa seluruh
   * node_modules (ratusan MB) karena `next start` membutuhkannya. Dengan
   * `standalone`, .next/standalone sudah memuat hanya modul yang benar-benar
   * dipakai, ditambah berkas server.js -- image akhir jauh lebih kecil dan
   * kontainer mulai lebih cepat.
   *
   * `next start` biasa tetap berfungsi untuk pengembangan lokal, jadi tidak
   * ada perilaku yang berubah di mesin pengembang.
   */
  output: "standalone",

  /**
   * Masa simpan berkas statis di /public.
   *
   * Vercel (dan kebanyakan host statis) menganggap isi /public selalu bisa
   * berubah, sehingga setiap kunjungan memicu permintaan validasi ulang.
   * Dengan 217 berkas suara dan 20 gambar, itu berarti puluhan permintaan
   * tambahan tiap kali anak membuka halaman - walau jawabannya cuma "tidak
   * berubah" (304), tetap ada bolak-baliknya.
   *
   * Sengaja TIDAK memakai `immutable`, karena nama berkasnya tidak
   * di-hash: `/zippy/bahagia.webp` tetap bernama sama walau isinya
   * berganti sewaktu-waktu lewat pemasangan baru. `stale-while-revalidate`
   * menutup celah itu - berkas lama tetap ditampilkan sementara peramban
   * mengambil yang baru di belakang layar, jadi layar tidak pernah kosong
   * dan pemasangan baru pun terbawa pada kunjungan berikutnya.
   */
  async headers() {
    return [
      {
        source: "/:path*.(webp|png|svg|mp3|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
