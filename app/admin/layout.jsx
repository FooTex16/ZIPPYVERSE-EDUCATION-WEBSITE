/**
 * Judul khusus untuk `/admin`.
 *
 * Ruang kerja pengelola tidak boleh memakai judul yang sama dengan halaman
 * anak, sebab pengelola membuka banyak tab dan perlu membedakannya seketika.
 * Judulnya menetap di layout karena `page.jsx` segmen ini komponen klien.
 */
export const metadata = {
  title: "Panel Pengelola",
  description:
    "Ruang kerja pengelola ZippyVerse: kelola Akun Pendamping, profil anak, serta penyuntingan isi pulau dan misi.",
};

export default function AdminLayout({ children }) {
  return children;
}
