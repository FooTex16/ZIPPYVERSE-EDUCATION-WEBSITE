import Link from "next/link";
import SpaceBackdrop from "@/components/SpaceBackdrop";
import Zippy from "@/components/Zippy";

/**
 * Halaman "tidak ditemukan".
 *
 * Sebelum berkas ini ada, Next.js memakai halaman bawaannya yang berbahasa
 * Inggris ("This page could not be found.") - padahal seluruh situs ini
 * ditujukan untuk anak sekolah dasar Indonesia. Anak yang salah mengetik
 * alamat akan melihat kalimat asing tanpa penjelasan dan tanpa jalan pulang,
 * maka halaman ini sengaja dibuat sepenuhnya berbahasa Indonesia dan selalu
 * menyediakan tombol kembali.
 */
export default function NotFound() {
  return (
    <main className="space-bg relative grid min-h-screen place-items-center overflow-hidden">
      <SpaceBackdrop />

      <div className="relative z-10 flex flex-col items-center gap-4 px-5 text-center">
        <Zippy size={130} mood="terkejut" speech="Halaman ini tidak ada!" />

        <p className="font-display text-6xl font-black text-zippy-yellow">
          404
        </p>

        <h1 className="font-display text-3xl font-bold text-white">
          Halaman Ini Tidak Ada
        </h1>

        <p className="max-w-sm text-sm font-semibold text-white/70">
          Sepertinya Zippy salah menulis alamatnya. Jangan khawatir - tidak ada
          yang hilang. Pilih salah satu tombol di bawah untuk kembali
          berpetualang.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="btn-pop rounded-2xl bg-zippy-yellow px-6 py-3 font-black text-zippy-navy"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/peta"
            className="rounded-2xl border-4 border-white/30 px-6 py-2.5 font-black text-white transition hover:bg-white/10"
          >
            Buka Peta
          </Link>
        </div>
      </div>
    </main>
  );
}
