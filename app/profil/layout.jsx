/**
 * Judul khusus untuk `/profil`.
 *
 * Sama seperti layout rute lain: `page.jsx`-nya komponen klien sehingga
 * `metadata` harus didefinisikan di segmen layout miliknya sendiri.
 */
export const metadata = {
  title: "Profil Penjelajah",
  description:
    "Lihat identitas penjelajah, kostum yang sedang dipakai, keistimewaan kostum, dan daftar perangkat yang menempel pada Akun Pendamping.",
};

export default function ProfilLayout({ children }) {
  return children;
}
