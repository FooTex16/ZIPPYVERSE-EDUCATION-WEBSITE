import { ISLANDS, DAILY_ISLAND, TRIAL_ISLAND } from "@/lib/gameData";

/**
 * Judul khusus untuk `/pulau/[slug]`.
 *
 * Rute ini bersifat dinamis sehingga judulnya tidak bisa ditulis tetap: tiap
 * pulau harus muncul dengan namanya sendiri di bilah judul. Karena
 * `page.jsx`-nya komponen klien (dan tidak boleh mengekspor `metadata`),
 * penetapannya dilakukan di sini lewat `generateMetadata`.
 *
 * Pemetaan slug -> pulau dibangun sekali dari data statis `lib/gameData.js`,
 * yang tidak menyentuh `window` maupun `localStorage` apa pun, sehingga aman
 * dijalankan di proses server saat build.
 */
const PULAU = {};
for (const p of [TRIAL_ISLAND, DAILY_ISLAND, ...ISLANDS]) {
  if (p && p.slug) PULAU[p.slug] = p;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = PULAU[slug];

  // Slug yang tidak dikenal. Judulnya harus sama dengan yang tertulis di
  // layar ("Pulau Tidak Ditemukan") supaya pengguna yang menyimpan alamat
  // salah tidak membuka tab berjudul nama pulau lain.
  if (!p) {
    return { title: "Pulau Tidak Ditemukan" };
  }

  return {
    title: `${p.name} · ${p.subject}`,
    description: `${p.tagline} ${p.desc} Selesaikan misi 3 menit di Planet Luminara bersama Zippy dan kumpulkan Bintang.`,
  };
}

export default function PulauLayout({ children }) {
  return children;
}
