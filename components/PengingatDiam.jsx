"use client";

// ============================================================
// Pengingat saat anak diam tidak menjawab
// ============================================================
//
// MASALAH YANG DISELESAIKAN KOMPONEN INI:
//
// Anak bisa berhenti di tengah soal — tertuju, lupa harus menekan apa, atau
// hanya menatap layar. Dulu tidak ada yang bergerak sama sekali: layar diam,
// suara diam, dan anak pergi bermain hal lain. Maskot kini bicara sendiri
// setelah 10 detik tanpa tindakan untuk mengajaknya menjawab.
//
// PERANCANGAN PENTING:
//
//  1. Dipasang SATU KALI di halaman pulau ketika misi sedang berjalan, bukan
//     di dalam tiap komponen misi. Ada 6 jenis misi; memasang di masing-masing
//     berarti enam penyalinan logika yang bisa berbeda-beda dan lupa diperbarui.
//
//  2. Interaksi yang dihitung adalah tindakan SADAR (ketuk, tombol, gulir),
//     bukan gerakan kursor. Bila gerakan kursor dihitung, anak yang hanya
//     menggoyang-goyangkan mouse tidak akan pernah diingatkan, padahal ia
//     memang tidak menjawab.
//
//  3. Pengingat berhenti bicara saat halaman disembunyikan, dan penghitung
//     direset ketika halaman ditampilkan kembali. Tanpa ini, anak yang membuka
//     tab lain selama dua menit langsung disambut pengingat begitu kembali —
//     terdengar seperti dimarahi padahal ia baru saja kembali.
//
//  4. Suara hanya dibunyikan bila fitur baca-aktif menyala, sehingga anak yang
//     mematikan suara tidak mendapat pengingat berisik.

import { useEffect, useRef, useState } from "react";
import Zippy from "./Zippy";
import { speak, stopSpeaking, isSpeechEnabled } from "@/lib/speech";

/** Kalimat ajakan, diputar supaya pengingat berulang tidak terasa mengulang. */
const AJAKAN = [
  "Ayo cepat, jawabannya menunggu kamu!",
  "Masih mikir? Pilih satu saja ya, aku bantu!",
  "Zippy tunggu di sini. Coba seret angkanya!",
  "Jawabannya sudah kelihatan belum? Ayo semangat!",
  "Satu langkah lagi. Kamu pasti bisa!",
  "Ayo pilih angkanya, kita lanjut bersama!",
];

/**
 * @param {boolean} aktif     pasang pengingat hanya selama misi berjalan
 * @param {number}  detik     detik diam sebelum pengingat muncul (baku: 10)
 * @param {number}  jedaUlang detik diam berikutnya sebelum pengingat kedua
 * @param {number}  lamaTampil milidetik gelembung tampil sebelum disembunyikan
 */
export default function PengingatDiam({
  aktif = true,
  detik = 10,
  jedaUlang = 18,
  lamaTampil = 6000,
}) {
  const [tampil, setTampil] = useState(false);
  const [ajakan, setAjakan] = useState(AJAKAN[0]);

  // Ref menampung status yang dibaca oleh interval. Kalau memakai state biasa,
  // penutup interval akan membaca nilai lama karena penutup efek dibuat sekali.
  const diamSejak = useRef(0);
  const terakhirBicara = useRef(0);
  const sedangTampil = useRef(false);
  const urutan = useRef(-1);

  const tutup = () => {
    sedangTampil.current = false;
    setTampil(false);
  };

  useEffect(() => {
    if (!aktif) {
      tutup();
      return;
    }

    diamSejak.current = Date.now();
    terakhirBicara.current = 0;

    const sentuh = () => {
      diamSejak.current = Date.now();
      // Anak sudah bertindak; gelembung yang masih terlanjur muncul segera
      // hilang supaya tidak menutupi jawaban yang sedang dipilihnya.
      if (sedangTampil.current) tutup();
    };

    const jadi = () => {
      if (document.visibilityState === "hidden") return;
      if (document.visibilityState === "visible") {
        // Kembali dari tab lain: anggap anak baru datang, jadi mulai hitung
        // dari nol alih-alih langsung menegur.
        diamSejak.current = Date.now();
      }
    };

    const peristiwa = ["pointerdown", "keydown", "wheel", "touchstart"];
    peristiwa.forEach((p) => window.addEventListener(p, sentuh, { passive: true }));
    document.addEventListener("visibilitychange", jadi);

    const jam = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      const now = Date.now();

      if (sedangTampil.current) {
        if (now - terakhirBicara.current >= lamaTampil) tutup();
        return;
      }

      if (now - diamSejak.current < detik * 1000) return;
      if (terakhirBicara.current && now - terakhirBicara.current < jedaUlang * 1000) return;

      // Giliran berikutnya supaya ajakan tidak mengulang kalimat yang sama.
      urutan.current = (urutan.current + 1) % AJAKAN.length;
      const teks = AJAKAN[urutan.current];
      terakhirBicara.current = now;
      setAjakan(teks);
      sedangTampil.current = true;
      setTampil(true);
      if (isSpeechEnabled()) speak(teks);
    }, 500);

    return () => {
      peristiwa.forEach((p) => window.removeEventListener(p, sentuh));
      document.removeEventListener("visibilitychange", jadi);
      clearInterval(jam);
      if (sedangTampil.current) {
        sedangTampil.current = false;
        setTampil(false);
        stopSpeaking();
      }
    };
  }, [aktif, detik, jedaUlang, lamaTampil]);

  if (!aktif || !tampil) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 left-4 z-50 max-w-[min(300px,calc(100vw-6rem))]"
    >
      <Zippy size={96} mood="menyapa" anim="hop" speech={ajakan} eager />
    </div>
  );
}
