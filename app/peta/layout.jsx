/**
 * Judul khusus untuk `/peta`.
 *
 * Berkas `page.jsx` di segmen ini bertanda "use client", dan komponen klien
 * TIDAK boleh mengekspor `metadata`. Tanpa layout ini, halaman peta memakai
 * judul bawaan layout root sehingga seluruh situs terbaca sama persis di bilah
 * judul, riwayat peramban, dan hasil pencarian. `layout` adalah tempat yang
 * sah untuk metadata pada rute yang halamannya berupa klien.
 *
 * Judul akhirnya menjadi "Peta Dunia | ZippyVerse" berkat pola `template`
 * yang sudah terpasang di `app/layout.jsx`.
 */
export const metadata = {
  title: "Peta Dunia",
  description:
    "Jelajahi sembilan pulau di Planet Luminara: Pulau Angka, Kata, Sains, Kreatif, dan Bumi. Pilih pulau, buka misi, dan kumpulkan Bintang bersama Zippy.",
};

export default function PetaLayout({ children }) {
  return children;
}
