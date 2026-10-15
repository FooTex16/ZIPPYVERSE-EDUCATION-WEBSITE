/**
 * Judul khusus untuk `/dashboard`.
 *
 * Dasbor ini baca-saja untuk orang tua; judul yang berbeda membuatnya mudah
 * dikenali di riwayat peramban ketika orang tua membuka banyak tab sekaligus.
 * Penetapan judul ada di layout sebab `page.jsx`-nya komponen klien.
 */
export const metadata = {
  title: "Dasbor Orang Tua",
  description:
    "Ringkasan perkembangan anak: pulau yang sudah tamat, butir soal yang dikuasai, koin, dan waktu bermain. Baca-saja.",
};

export default function DashboardLayout({ children }) {
  return children;
}
