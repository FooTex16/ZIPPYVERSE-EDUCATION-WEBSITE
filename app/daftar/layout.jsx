/**
 * Judul khusus untuk `/daftar`.
 *
 * Alasan sama seperti `app/peta/layout.jsx`: `page.jsx` di segmen ini adalah
 * komponen klien dan tidak boleh mengekspor `metadata`, maka judulnya
 * ditetapkan di layout yang berdiri di atasnya.
 */
export const metadata = {
  title: "Daftar atau Masuk",
  description:
    "Buat Akun Pendamping untuk keluarga: satu akun, banyak profil anak. Kemajuan bermain tersimpan rapi dan tidak tercampur antar anak.",
};

export default function DaftarLayout({ children }) {
  return children;
}
