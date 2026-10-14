"use client";

/**
 * Layar memuat: satu meteor besar yang jatuh dari kanan-atas.
 *
 * Sebelumnya anak hanya melihat teks polos "Memuat ...", yang terasa mati dan
 * bikin anak bosan menunggu. Sekarang layarnya dihiasi satu meteor besar yang
 * meluncur melintasi layar dari kanan-atas ke kiri-bawah.
 *
 * Keputusan desain:
 * - **Hanya satu meteor.** Lima meteor kecil terasa ramai dan berebut
 *   perhatian dengan teks. Satu meteor besar terasa lebih tenang dan lebih
 *   mudah dipahami anak sebagai "tunggu sebentar, ada yang melintas".
 * - **Wajah Zippy dihapus dari layar ini.** Meteor sudah punya wajahnya
 *   sendiri; menampilkan dua karakter sekaligus justru membingungkan.
 * - **Meteor dipakai utuh, tanpa diputar.** Gambar `meteor 2.png` sudah
 *   menghadap kiri-bawah (kepala di kiri-bawah, ekor di kanan-atas), jadi
 *   selaras dengan arah jatuhnya. Gambar sebelumnya (`meteor.png`) menghadap
 *   kanan-bawah dan perlu diputar 90 derajat.
 *
 * Berkas: `/loading/meteor2.webp` (42 KB, 512×512), dihasilkan dari sumber
 * `public/loading/meteor 2.png` (1.008 KB) memakai sharp:
 *
 *   sharp("public/loading/meteor 2.png")
 *     .resize(512, 512)
 *     .webp({ quality: 84, alphaQuality: 90 })
 *
 * Latar sudah transparan di berkas asli (sudut `alpha: 0`, badan `alpha: 253`),
 * jadi tidak perlu penghapusan latar. Berkas sengaja diberi nama tanpa spasi
 * supaya URL-nya tidak perlu di-escape.
 *
 * Semua animasinya memakai transform + opacity saja (GPU-friendly) dan sudah
 * dihormati oleh `prefers-reduced-motion` di globals.css, jadi tetap ringan
 * untuk HP kelas bawah.
 *
 * @param text  pesan utama, mis. "Memuat Planet Luminara..."
 * @param sub   pesan tambahan (opsional), ditampilkan lebih kecil di bawah
 */

export default function LoadingMeteors({ text = "Memuat ...", sub }) {
  return (
    <>
      {/* Meteor. Dipasang `fixed` supaya tidak bergantung pada posisi elemen
          induk yang bisa berbeda-beda tiap halaman. Ukuran dan jalurnya diatur
          di globals.css memakai satuan vw/vh supaya otomatis mengikuti layar. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <span className="meteor">
          <img
            src="/loading/meteor2.webp"
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </span>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="relative z-10 flex flex-col items-center px-5 text-center"
      >
        {/* Teks diberi latar gelap ber-blur. Tanpa ini, meteor melintas tepat
            di belakang teks dan kata "Memuat ..." jadi sulit dibaca pada
            saat-saat tertentu siklusnya. */}
        <div className="rounded-[28px] border border-white/10 bg-zippy-navy/50 px-6 py-4 backdrop-blur-sm">
          <p className="font-display text-lg font-bold text-white sm:text-xl">{text}</p>

          {/* Tiga titik yang menyala bergantian: tanda proses masih jalan. */}
          <span
            className="animate-meteor-pulse mt-3 flex items-center justify-center gap-1.5"
            aria-hidden="true"
          >
            {[0, 1, 2].map((d) => (
              <span
                key={d}
                className="h-2.5 w-2.5 rounded-full bg-zippy-yellow"
                style={{ animationDelay: `${d * 0.22}s` }}
              />
            ))}
          </span>

          {sub && (
            <p className="mt-3 max-w-xs text-xs font-bold text-white/70 sm:text-sm">{sub}</p>
          )}
        </div>
      </div>
    </>
  );
}
