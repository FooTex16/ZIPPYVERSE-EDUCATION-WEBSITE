import "./globals.css";
import { Fredoka, Baloo_2 } from "next/font/google";
import PemuatKonten from "@/components/PemuatKonten";

/**
 * Font diunduh SEKALI saat build lalu disajikan dari asal yang sama dengan
 * halaman.
 *
 * Sebelumnya keduanya diminta dari fonts.googleapis.com lewat
 * `<link rel="stylesheet">`. Itu berarti:
 *   - dua permintaan tambahan ke server luar negeri sebelum teks tampil
 *     rapi - dan di Indonesia jaraknya jauh, jadi "lag" terasa di kunjungan
 *     pertama;
 *   - permintaannya MEMBLOCKIR RENDER, sehingga seluruh halaman menunggu
 *     stylesheet asing itu;
 *   - setiap halaman menariknya lagi dari awal (hanya dipantulkan DNS/TLS,
 *     bukan benar-benar gratis).
 *
 * next/font mengunduh berkasnya saat build, mengimpornya sebagai
 * `@font-face` biasa di CSS milik sendiri, lalu menyusutkan subset sesuai
 * huruf yang benar-benar dipakai. Hasilnya: nol permintaan ke domain lain,
 * teks tidak menunggu, dan `font-display: swap` aktif otomatis supaya teks
 * tetap terbaca memakai huruf sistem selagi berkasnya tiba.
 *
 * Kedua berkasnya huruf variabel, jadi satu berkas melayani seluruh
 * ketebalan - bukan satu berkas per berat.
 */
const fredoka = Fredoka({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-display",
  display: "swap",
});

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-body",
  display: "swap",
});

// Alamat situs dipakai untuk tautan absolut pada OpenGraph dan sitemap.
// Saat di-host, atur NEXT_PUBLIC_SITE_URL pada berkas .env.local atau pada
// pengaturan lingkungan host, misalnya https://zippyverse.vercel.app
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const DESKRIPSI =
  "Game edukasi web untuk anak SD bersama Zippy. Lima pulau petualangan, misi 3 menit, koin, dan kostum. Belajar sambil bermain di Planet Luminara!";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ZippyVerse - Petualangan di Planet Luminara",
    template: "%s | ZippyVerse",
  },
  description: DESKRIPSI,
  applicationName: "ZippyVerse",
  category: "education",
  keywords: [
    "game edukasi anak",
    "belajar anak SD",
    "web education for kids",
    "edukasi anak sekolah dasar",
    "belajar matematika anak",
    "belajar bahasa Indonesia anak",
    "alternatif sehat gadget anak",
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "ZippyVerse",
    title: "ZippyVerse - Petualangan di Planet Luminara",
    description: DESKRIPSI,
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
    title: "ZippyVerse - Petualangan di Planet Luminara",
    description: DESKRIPSI,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: "#0F2C3D",
  width: "device-width",
  initialScale: 1,
  // `maximumScale: 1` sengaja TIDAK dipakai. Memperbesar layar adalah cara
  // satu-satunya bagi pengguna berpenglihatan lemah untuk membaca, dan
  // memblokirnya akan mengunci sebagian orang tua dan guru di luar halaman.
  //
  // Kekhawatiran "anak salah cubit lalu layar membesar" sudah ditangani di
  // tempat yang lebih tepat: `.drag-tile` memakai `touch-action: none`
  // (lihat globals.css), sehingga daerah permainan tidak pernah memicu zoom.
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${fredoka.variable} ${baloo.variable}`}>
      <body className="antialiased">
        {/* Seluruh isi peta dan misi melewati pemuat ini: ia memasang suntingan
            developer setelah hidrasi, dan hanya merestart halaman bila isi
            yang terpasang benar-benar berbeda dari yang sedang tampil. */}
        <PemuatKonten>{children}</PemuatKonten>
      </body>
    </html>
  );
}