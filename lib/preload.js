// ============================================================
// Pemasukan gambar lebih dulu (preload)
// ============================================================
//
// Masalah yang dipecahkan: ekspresi Zippy diganti memakai `key={mood}`
// pada <img>. Artinya setiap kali mood berubah, gambar LAMA dilepas dan
// gambar BARU dipasang - bukan sekadar src-nya ditukar. Ketika berkasnya
// belum tersimpan di peramban, anak melihat kotak kosong sejenak lalu
// maskotnya muncul. Inilah yang terasa sebagai "fotonya belum terload".
//
// 14 ekspresi berarti 14 berkas terpisah (masing-masing 17-31 KB). Bila
// diunduh serempak saat halaman dibuka, mereka justru berebut pita lebar
// dengan halaman yang sedang dibuka - dan masalahnya bertukar tempat.
//
// Karena itu unduhannya diatur dua hal:
//   - ditunda sampai perangkat benar-benar menganggur (requestIdleCallback);
//   - satu per satu, dengan jeda, supaya tidak pernah menyaingi pemuatan
//     halaman maupun suara soal yang sedang dibutuhkan.
//
// Anak butuh beberapa detik untuk membaca petunjuk sebelum soal pertama
// dijawab, jadi dengan cara ini seluruh ekspresi sudah lengkap jauh sebelum
// ia menekan tombol mana pun.

import { ZIPPY_IMG } from "./gameData";

/** Supaya hanya berjalan sekali per pemuatan halaman. */
let sudahMulai = false;

/** Beri tahu peramban bahwa berkas ini akan dipakai, tanpa memaksa prioritas. */
function tarik(url) {
  try {
    const img = new window.Image();
    img.decoding = "async";
    img.src = url;
    return img;
  } catch (e) {
    return null;
  }
}

/** Jalankan `fn` ketika perangkat sedang menganggur, dengan cadangan lama. */
function saatMenganggur(fn, timeout) {
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(fn, { timeout });
  } else {
    // Peramban lama (misal Safari versi sebelum 2023) tidak memilikinya.
    setTimeout(fn, 400);
  }
}

export function siapkanGambarMaskot() {
  if (sudahMulai || typeof window === "undefined") return;
  sudahMulai = true;

  const daftar = Object.values(ZIPPY_IMG);
  let i = 0;

  const berikutnya = () => {
    if (i >= daftar.length) return;
    tarik(daftar[i++]);
    saatMenganggur(berikutnya, 2000);
  };

  saatMenganggur(berikutnya, 3000);
}
