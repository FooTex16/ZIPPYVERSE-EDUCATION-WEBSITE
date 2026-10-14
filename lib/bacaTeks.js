// ============================================================
// Normalisasi teks sebelum dibacakan
// ============================================================
//
// MASALAH YANG DISELESAIKAN BERKAS INI:
//
// Soal matematika disimpan sebagai simbol, misalnya "10 - 5 = ?". Ketika teks
// itu langsung dibacakan, pembaca suara mengabaikan tanda hubung dan malah
// membaca "=" sebagai jeda, sehingga anak mendengar:
//
//     "sepuluh ... lima"        (harusnya "sepuluh kurang lima")
//     "sepuluh oh lima"         (harusnya "sepuluh tambah lima")
//
// Penyebabnya bukan hanya TTS perangkat. Rekaman mp3 di /public/audio juga
// dibuat dari teks mentah yang sama, jadi kesalahan itu tercatat permanen di
// dalam berkas audio. Karena itu normalisasi dipasang SEBELUM pencarian rekaman
// maupun sebelum TTS, lalu audio dihasilkan ulang dari teks yang sudah benar.
//
// Aturan paling penting: tiap penggantian mensyaratkan ADA ANGKA di kedua
// sisi. Tanpa syarat itu, tanda hubung di dalam kata biasa ikut tersentuh —
// "paru-paru", "se - ko - lah", "Beranak-pinak", "ibu-kota" — dan kalimat itu
// jadi kacau. Uji di tests/bacaTeks.test.mjs mengunci hal ini.
//
// Berkas ini sengaja TIDAK mengimpor apa pun supaya bisa dipakai dari
// scripts/kumpulTeks.mjs (yang menyalin modul lib/ ke berkas .mjs sementara)
// tanpa perlu menangani impor bertingkat.

/**
 * Ubah teks soal menjadi bentuk yang layak diucapkan.
 *
 * Bersifat IDEMPOTEN: memanggilnya dua kali menghasilkan teks yang sama.
 * Ini penting karena teks bisa melewati normalisasi lebih dari sekali
 * (useBacakanSoal lalu speak), dan teks yang sudah terekam tidak boleh
 * berubah lagi sehingga kunci manifest tetap cocok.
 *
 * @param {string} teks soal, petunjuk, atau pertanyaan apa pun
 * @returns {string} teks siap diucapkan; teks tanpa simbol dikembalikan apa adanya
 *
 * @example
 *   keTeksBaca("10 - 5 = ?")                     // "10 kurang 5 sama dengan berapa?"
 *   keTeksBaca("3 x 4 = ?")                      // "3 kali 4 sama dengan berapa?"
 *   keTeksBaca("Berapa 25 - 13?")                // "Berapa 25 kurang 13?"
 *   keTeksBaca("Hewan bernapas dengan paru-paru") // tidak berubah
 */
export function keTeksBaca(teks) {
  let s = String(teks ?? "");
  if (!s) return s;

  s = s.normalize("NFC");

  // Operator aritmetika — hanya di antara dua angka.
  s = s.replace(/(\d)\s*[×xX]\s*(\d)/g, "$1 kali $2");
  s = s.replace(/(\d)\s*÷\s*(\d)/g, "$1 dibagi $2");
  s = s.replace(/(\d)\s*\+\s*(\d)/g, "$1 tambah $2");
  s = s.replace(/(\d)\s*-\s*(\d)/g, "$1 kurang $2");

  // "== ?" maupun "= ?" di ujung pertanyaan menjadi pertanyaan sungguhan.
  // Tanpa bagian ini anak mendengar "... sama dengan" lalu diam, tanpa kata
  // "berapa" yang menandakan ia diminta menjawab.
  s = s.replace(/=\s*\?\s*$/u, " sama dengan berapa?");

  // "=" yang tersisa di tempat lain (mis. "hasil = ...").
  s = s.replace(/=/g, " sama dengan ");

  // Rapikan spasi ganda yang bisa muncul dari penggantian di atas.
  s = s.replace(/\s{2,}/g, " ").trim();

  return s;
}

/**
 * Teks ini perlu dinormalisasi atau tidak?
 *
 * Dipakai skrip generator supaya hanya berkas audio yang benar-benar berubah
 * yang dibuat ulang, bukan seluruh 197 rekaman.
 */
export function perluDibaca(teks) {
  return keTeksBaca(teks) !== String(teks ?? "").normalize("NFC");
}
