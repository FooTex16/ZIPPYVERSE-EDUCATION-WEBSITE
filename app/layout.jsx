import "./globals.css";

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
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800&family=Fredoka:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}