// ============================================================
// Pemutar rekaman suara Zippy
// ============================================================
//
// Semua soal dan petunjuk sudah direkam sekali menjadi berkas mp3 di
// /public/audio dengan suara Indonesia (id-ID-GadisNeural). Keunggulannya
// dibanding Web Speech API bawaan perangkat:
//   - logat Indonesia dijamin sama di HP apa pun
//   - jalan sepenuhnya luring tanpa internet
//   - tanpa biaya dan tanpa ketergantungan pada suara sistem
//
// Bila suatu teks belum direkaman, pemanggil diberi tahu lewat nilai false
// dan aplikasi jatuh ke suara bawaan perangkat (lihat lib/speech.js).

import manifestData from "./audioManifest.json";

const PETA = (manifestData && manifestData.peta) || {};

/** Samakan normalisasi teks dengan yang dipakai saat generate. */
function bersihkan(t) {
  return String(t || "")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}

/** Apakah teks ini sudah punya rekaman suara? */
export function adaAudio(teks) {
  return Boolean(PETA[bersihkan(teks)]);
}

/** Jumlah teks yang sudah terekam, dipakai untuk keterangan di menu. */
export function cakupanAudio() {
  return manifestData?.jumlah || 0;
}

let audio = null;

function perangkat() {
  if (typeof window === "undefined") return null;
  if (!audio) {
    audio = new window.Audio();
    // Jangan unduh apa pun sebelum diminta, supaya halaman tetap ringan.
    audio.preload = "none";
  }
  return audio;
}

/** Hentikan rekaman yang sedang berbunyi. */
export function stopAudio() {
  const a = perangkat();
  if (!a) return;
  try {
    a.pause();
    a.currentTime = 0;
  } catch (e) {
    // abaikan
  }
}

/**
 * Putar rekaman suara Zippy untuk satu teks.
 *
 * @param {string} teks soal atau petunjuk yang akan dibacakan
 * @returns {Promise<boolean>} true bila rekaman tersedia dan benar-benar
 *                             berbunyi, false bila tidak ada atau gagal.
 */
export function mainkanAudio(teks) {
  const kunci = PETA[bersihkan(teks)];
  const a = perangkat();
  if (!kunci || !a) return Promise.resolve(false);

  return new Promise((resolve) => {
    let selesai = false;
    let jaga = null;

    const beresikan = (hasil) => {
      if (selesai) return;
      selesai = true;
      if (jaga) clearTimeout(jaga);
      a.removeEventListener("playing", onPlaying);
      a.removeEventListener("error", onError);
      resolve(hasil);
    };

    const onPlaying = () => beresikan(true);
    const onError = () => beresikan(false);

    a.addEventListener("playing", onPlaying);
    a.addEventListener("error", onError);

    // Pengaman: jangan biarkan misi menunggu bila berkas tidak pernah
    // berbunyi maupun memberi galat.
    jaga = setTimeout(() => beresikan(!a.paused), 5000);

    try {
      a.pause();
      a.src = `/audio/${kunci}.mp3`;
      a.currentTime = 0;
      const p = a.play();
      if (p && typeof p.catch === "function") {
        // Ditolak biasanya berarti perangkat memblokir bunyi sebelum ada
        // ketukan pengguna; biarkan pemanggil jatuh ke suara bawaan.
        p.catch(() => beresikan(false));
      }
    } catch (e) {
      beresikan(false);
    }
  });
}
