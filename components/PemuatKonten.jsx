"use client";

/**
 * PemuatKonten — menyalakan isi peta hasil suntingan developer.
 *
 * MASALAH YANG DIPECAHKAN BERKAS INI
 *
 * Isi pulau dan misi datang dari dua tempat: isi bawaan yang ikut dikirim
 * bersama halaman, dan isi di awan yang ditulis lewat tombol "Terapkan
 * Update". Keduanya hidup di dalam objek `ISLANDS` dan `MISSIONS` yang sama,
 * dan tujuh berkas membacanya — beberapa di antaranya menghitung nilai di
 * luar komponen React.
 *
 * Tiga urutan berikut sengaja, dan urutannya tidak boleh ditukar:
 *
 *   1. SAAT MERENDER PERTAMA KALI — memakai isi bawaan. Ini yang membuat
 *      HTML dari server dan render pertama peramban PERSIS SAMA, sehingga
 *      hidrasi tidak pernah mengeluh. Bila isi awan dipasang lebih dulu,
 *      keduanya akan berbeda dan React melempar galat hidrasi.
 *
 *   2. SETELAH HIDRASI — pasang isi tersimpan, lalu tarik yang terbaru.
 *      Keduanya menyalakan objek yang sama di tempat, sehingga halaman mana
 *      pun yang sedang terbuka ikut melihat isinya pada render berikutnya.
 *
 *   3. HANYA BILA BENAR-BENAR BERUBAH — `key` pada pembungkus diganti, yang
 *      merestart pohon di bawahnya. Tanpa langkah ini, halaman yang sudah
 *      ter-mount tetap memegang nilai lama (misalnya hasil `useMemo`).
 *      Dan karena sidik jari isi ikut diperiksa, halaman TIDAK pernah
 *      direstart ketika isinya tidak berubah — jadi tidak ada anak yang
 *      terlempar dari tengah misi karena pemuatan biasa.
 *
 * Bila Supabase tidak terjangkau, tidak ada yang terjadi: isi bawaan tetap
 * dipakai dan permainan berjalan seperti biasa. Kegagalan jaringan sekecil
 * apa pun tidak pernah mengosongkan peta.
 */

import { useEffect, useState } from "react";
import { muatKontenAwan, terapkanTersimpan, jariKonten } from "@/lib/konten";
import { muatPengaturanAwan } from "@/lib/adminConfig";

export default function PemuatKonten({ children }) {
  const [versi, setVersi] = useState(0);

  useEffect(() => {
    let hidup = true;

    (async () => {
      // Sidik jari SEBELUM segala sesuatu dijalankan. Bila setelah kedua
      // langkah berikut sidik jarinya masih sama, berarti isi di layar tidak
      // berubah dan tidak ada alasan untuk merestart apa pun.
      const sebelum = jariKonten();

      // --- 2a. Pasang isi yang sudah tersimpan di perangkat ini (tanpa
      //         jaringan). Perangkat yang sudah pernah memuat halaman tidak
      //         perlu menunggu apa pun.
      try {
        terapkanTersimpan();
      } catch {
        /* isi tersimpan gagal dipasang -> biarkan isi bawaan */
      }

      // --- 2a'. Tarik pengaturan global (harga kostum, batas energi, dll)
      //          dari Supabase. Bila belum pernah diterbitkan, fungsi ini
      //          diam-diam membiarkan nilai bawaan — tidak ada yang rusak.
      //          Sengaja ditunggu supaya harga toko tampil benar sejak
      //          render pertama, bukan berkedip dari bawaan ke nilai admin.
      try {
        await muatPengaturanAwan();
      } catch {
        /* tabel belum dibuat atau jaringan gagal -> tetap pakai nilai lokal */
      }

      // --- 2b. Tarik versi terbaru di latar belakang. Tidak pernah ditunggu:
      //         bila gagal, halaman tetap memakai apa yang sudah ada.
      try {
        await muatKontenAwan();
      } catch {
        /* biarkan memakai isi yang ada */
      }

      // --- 3. Naikkan versi hanya bila isi di layar memang berbeda.
      if (hidup && jariKonten() !== sebelum) setVersi((v) => v + 1);
    })();

    return () => {
      hidup = false;
    };
  }, []);

  // `display: contents` membuat pembungkus ini tidak menghasilkan simpul DOM
  // baru, sehingga tata letak halaman tidak berubah sedikit pun — yang ada
  // hanya `key`, dan `key` itulah yang melakukan tugasnya.
  return (
    <div key={versi} className="contents">
      {children}
    </div>
  );
}
