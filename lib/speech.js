// ============================================================
// Pengelola suara baca soal (Web Speech API)
// ============================================================
//
// Zippy membacakan soal dengan suara muda dan ceria supaya anak SD yang
// belum lancar membaca tetap bisa mengikuti kuis. Memakai suara bawaan
// browser sehingga tidak butuh kunci API dan tidak menambah biaya.
//
// Catatan penting: yang menentukan logat adalah suara yang dipakai, bukan
// teksnya. Kalau perangkat hanya punya suara Inggris, soal bahasa Indonesia
// akan terdengar berlogat Inggris. Karena itu pemilihan suara di sini
// mengutamakan suara Indonesia secara mutlak, lalu jatuh ke bahasa
// serumpun (Melayu, Jawa, Sunda) yang pelafalannya paling mirip.
// Bila tidak ada satupun, pengguna diberi tahu dan bisa memilih sendiri
// lewat menu suara di HUD.

import { useCallback, useEffect, useState } from "react";
import { mainkanAudio, stopAudio, siapkanAudio } from "./audioSoal";
import { keTeksBaca } from "./bacaTeks";

const KEY_ENABLED = "zippyverse_speech_v1";
const KEY_VOICE = "zippyverse_speech_voice_v1";

let enabled = true;
let voice = null;
let pinnedName = "";

function hasApi() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function bacaSimpanan(kunci) {
  try {
    return window.localStorage.getItem(kunci);
  } catch (e) {
    return null;
  }
}

function tulisSimpanan(kunci, nilai) {
  try {
    window.localStorage.setItem(kunci, nilai);
  } catch (e) {
    // abaikan bila penyimpanan diblokir
  }
}

// Bahasa serumpun dengan Indonesia. Pelafalan kata Indonesia oleh suara
// bahasa ini jauh lebih benar daripada oleh suara Inggris.
const SERUMPUN = ["ms", "jv", "su", "min", "mad", "bug"];

function bahasaDasar(v) {
  return String(v?.lang || "")
    .toLowerCase()
    .replace("_", "-")
    .split("-")[0];
}

/**
 * Nilai kelayakan sebuah suara untuk karakter Zippy.
 *
 * Urutan pertimbangan: Indonesia dulu (logat benar), baru nada muda.
 */
function scoreVoice(v) {
  let s = 0;
  const nama = String(v?.name || "").toLowerCase();
  const kode = bahasaDasar(v);

  // Logat Indonesia adalah syarat utama, jadi bobotnya jauh lebih besar
  // daripada seluruh pertimbangan lain digabung.
  if (kode === "id") s += 1000;
  else if (SERUMPUN.includes(kode)) s += 500;
  // Beberapa perangkat menandai suara Indonesia di nama, bukan di kode.
  else if (/bahasa indonesia|indonesian|indonesia/i.test(nama)) s += 800;

  // Suara bawaan perangkat biasanya lebih alami daripada suara jaringan.
  if (v?.localService) s += 6;

  // Zippy teman kecil yang ceria, jadi suara wanita atau nada muda unggul.
  if (/damayanti|gadis|siti|wanita|perempuan|female|nova|zira/i.test(nama)) {
    s += 20;
  }
  if (/andika|dedi|pria|male/i.test(nama)) s -= 15;

  return s;
}

/** Daftar suara perangkat, terurut dari yang paling layak untuk Zippy. */
export function listVoices() {
  if (!hasApi()) return [];
  const list = window.speechSynthesis.getVoices() || [];
  return [...list].sort((a, b) => scoreVoice(b) - scoreVoice(a));
}

/** Apakah perangkat menyediakan suara berbahasa Indonesia? */
export function hasIndonesianVoice() {
  return listVoices().some((v) => bahasaDasar(v) === "id");
}

/** Nama suara yang sedang aktif (baik dipilih sendiri maupun otomatis). */
export function getVoiceName() {
  if (pinnedName) return pinnedName;
  return voice ? voice.name : "";
}

/**
 * Kunci pemakaian satu suara tertentu. Dipakai menu suara di HUD supaya
 * orang tua bisa memastikan logatnya Indonesia.
 */
export function setVoiceName(nama) {
  pinnedName = String(nama || "");
  tulisSimpanan(KEY_VOICE, pinnedName);
  voice = pickVoice();
}

function pickVoice() {
  if (!hasApi()) return null;
  const list = listVoices();
  if (!list.length) return null;

  if (pinnedName) {
    const cocok = list.find((v) => v.name === pinnedName);
    if (cocok) {
      voice = cocok;
      return voice;
    }
  }
  voice = list[0];
  return voice;
}

// Daftar suara dimuat tidak langsung oleh browser, jadi tunggu dulu.
if (typeof window !== "undefined" && hasApi()) {
  const warm = () => pickVoice();
  window.speechSynthesis.addEventListener?.("voiceschanged", warm);
  warm();
}

// Baca dari penyimpanan saat modul dimuat pertama kali.
if (typeof window !== "undefined") {
  const sEnabled = bacaSimpanan(KEY_ENABLED);
  if (sEnabled !== null) enabled = sEnabled === "1";
  pinnedName = bacaSimpanan(KEY_VOICE) || "";
}

export function isSpeechEnabled() {
  return enabled;
}

export function setSpeechEnabled(v) {
  enabled = Boolean(v);
  tulisSimpanan(KEY_ENABLED, enabled ? "1" : "0");
  if (!enabled) stopSpeaking();
}

export function stopSpeaking() {
  if (!hasApi()) return;
  try {
    window.speechSynthesis.cancel();
  } catch (e) {
    // abaikan
  }
}

/**
 * Bacakan satu kalimat dengan gaya Zippy.
 * @param {string} teks
 * @param {{ pitch?: number, rate?: number, paksa?: boolean }} gaya
 */
export function speak(teks, gaya = {}) {
  // `paksa` dipakai menu suara untuk mendengar contoh suara walau fitur
  // baca soal sedang mati.
  if ((!enabled && !gaya.paksa) || !hasApi()) return;
  // Simbol diubah dulu supaya "10 - 5 = ?" terdengar "sepuluh kurang lima
  // sama dengan berapa?", bukan "sepuluh ... lima". Normalisasi idempoten,
  // jadi aman dipanggil walau teks sudah dinormalisasi pemanggil.
  const kalimat = keTeksBaca(teks);
  if (!kalimat) return;

  try {
    if (!voice) pickVoice();

    // Selalu hentikan bacaan sebelumnya supaya tidak tumpang tindih
    // ketika anak berpindah soal dengan cepat.
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(kalimat);
    if (voice) u.voice = voice;
    // Kalau suaranya memang Indonesia, serahkan kode bahasanya apa adanya
    // supaya pelafalan nama dan soal tepat.
    u.lang = voice?.lang || "id-ID";
    // Nada agak tinggi dan tempo sedikit santai terdengar seperti
    // teman kecil yang ceria, bukan pembaca berita.
    u.pitch = gaya.pitch ?? 1.4;
    u.rate = gaya.rate ?? 0.98;
    u.volume = 1;

    window.speechSynthesis.speak(u);
  } catch (e) {
    // abaikan bila API tidak tersedia
  }
}

/**
 * Bacakan soal setiap kali isinya berganti.
 *
 * Utamakan rekaman suara Zippy (berkas Indonesia, luring). Bila suatu teks
 * belum terekam, otomatis jatuh ke suara bawaan perangkat.
 *
 * Pakai di dalam komponen misi:
 *   useBacakanSoal(`${round.q}. ${round.hint || ""}`);
 *
 * @param {string} teks
 * @param {number} jeda    jeda mulai dalam milidetik agar UI sempat tampil dulu
 * @param {string|number} kunci  nilai tambahan yang ikut memicu pembacaan
 *                               ulang, misalnya nomor soal, untuk kasus
 *                               teksnya tetapi soalnya berganti.
 * @param {string} berikutnya    teks soal yang menyusul. Rekamannya diunduh
 *                               lebih dulu selagi anak masih membaca dan
 *                               menjawab, supaya begitu ia berpindah suaranya
 *                               sudah siap - bukan menunggu jaringan.
 */
export function useBacakanSoal(teks, jeda = 350, kunci = "", berikutnya = "") {
  // Penghangat soal berikutnya. Sengaja berjalan SEGERA, tanpa jeda:
  // unduhannya justru harus selesai selagi anak masih sibuk dengan soal
  // sekarang. Dinormalisasi dengan cara yang sama seperti pembacaannya,
  // sebab kunci di manifest disimpan dalam bentuk siap ucap.
  //
  // `enabled` sengaja TIDAK dimasukkan ke daftar dependensi: ia variabel
  // tingkat modul, bukan keadaan, jadi mengubahnya tidak memicu render
  // ulang dan karenanya bukan dependensi yang sah. Ia tetap dibaca saat
  // efek ini berjalan - dan efek ini memang berjalan tepat ketika teksnya
  // berganti, yaitu saat nilainya relevan.
  useEffect(() => {
    if (!berikutnya || !enabled) return;
    const n = keTeksBaca(berikutnya);
    if (n) siapkanAudio(n);
  }, [berikutnya]);

  useEffect(() => {
    if (!teks || !enabled) return;
    // Dinormalisasi SEBELUM pencarian rekaman, karena kunci di manifest kini
    // disimpan dalam bentuk siap ucap ("10 kurang 5 sama dengan berapa?").
    // Kalau dinormalisasi belakangan, kuncinya meleset, rekaman tidak ketemu,
    // dan suara jatuh ke pembaca bawaan perangkat yang berlogat asing.
    const dibaca = keTeksBaca(teks);
    const t = setTimeout(() => {
      mainkanAudio(dibaca).then((main) => {
        if (!main) speak(dibaca);
      });
    }, jeda);
    return () => {
      clearTimeout(t);
      stopAudio();
      stopSpeaking();
    };
  }, [teks, jeda, kunci]);
}

/**
 * Daftar suara untuk ditampilkan di menu, ikut berubah saat browser
 * selesai memuat suaranya.
 */
export function useDaftarSuara() {
  const [suara, setSuara] = useState([]);
  const muat = useCallback(() => setSuara(listVoices()), []);

  useEffect(() => {
    muat();
    if (!hasApi()) return;

    window.speechSynthesis.addEventListener?.("voiceschanged", muat);

    // iOS dan Android memuat daftar suara secara menunda, kadang baru muncul
    // 1-3 detik setelah halaman tampil. Coba beberapa kali supaya suara
    // Indonesia yang baru diunduh tetap ketemu.
    const timers = [300, 900, 1800, 3200].map((ms) => setTimeout(muat, ms));

    // Sebagian perangkat hanya mengisi daftar suara setelah ketukan pertama
    // pengguna, jadi pasang pendengar juga.
    const diKetuk = () => muat();
    window.addEventListener("pointerdown", diKetuk, { once: true });
    window.addEventListener("touchend", diKetuk, { once: true });

    return () => {
      timers.forEach(clearTimeout);
      window.speechSynthesis.removeEventListener?.("voiceschanged", muat);
      window.removeEventListener("pointerdown", diKetuk);
      window.removeEventListener("touchend", diKetuk);
    };
  }, [muat]);

  return suara;
}

/**
 * Deteksi jenis perangkat, dipakai untuk menyesuaikan teks petunjuk
 * pemasangan suara Indonesia (langkah menunya berbeda tiap perangkat).
 */
export function jenisPerangkat() {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  return "desktop";
}
