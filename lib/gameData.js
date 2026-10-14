// ============================================================
// ZIPPYVERSE - Data Game
// ============================================================

import { MISSIONS_EXTRA, DAILY_CHALLENGE, DAILY_SLUG } from "./missionsExtra.js";
import { TRIAL_MISSIONS, TRIAL_SLUG } from "./trialIsland.js";

// Re-ekspor supaya halaman bisa memakai `TRIAL_SLUG` dari satu pintu saja
// (`@/lib/gameData`), bukan mengimpor dua berkas untuk satu nilai yang sama.
export { TRIAL_SLUG };
import { bacaConfig } from "./adminConfig.js";
import { teksPerk } from "./costumePerks.js";

export const PALETTE = {
  teal: "#2AA5A0",
  mint: "#B2D8D5",
  yellow: "#FFC93C",
  cream: "#FFF6E5",
  navy: "#0F2C3D",
};

// Aset maskot Zippy (ekspresi + pose)
export const ZIPPY_IMG = {
  bahagia: "/zippy/bahagia.webp",
  berpikir: "/zippy/berpikir.webp",
  terkejut: "/zippy/terkejut.webp",
  sedih: "/zippy/sedih.webp",
  merayakan: "/zippy/merayakan.webp",
  melompat: "/zippy/melompat.webp",
  membaca: "/zippy/membaca.webp",
  menunjuk: "/zippy/menunjuk.webp",
  menyapa: "/zippy/menyapa.webp",
  berlari: "/zippy/berlari.webp",
  depan: "/zippy/depan.webp",
  belakang: "/zippy/belakang.webp",
  sampingKanan: "/zippy/samping-kanan.webp",
  sampingKiri: "/zippy/samping-kiri.webp",
};

/**
 * Peta Planet Luminara.
 *
 * Urutan array ini adalah rantai permainan: pulau ke-n hanya terbuka setelah
 * pulau ke-(n-1) selesai. Karena itu isi array tidak boleh diacak.
 *
 * Posisi disusun seperti ular (snake) supaya garis penghubungnya tidak
 * menyilang dan anak bisa melihat dengan jelas dari pulau mana ke mana:
 *
 *   layar lebar  (lg) - 2 baris : kiri->kanan, turun, lalu kanan->kiri
 *   layar sedang (md) - 3 baris : kiri->kanan, turun, kanan->kiri, turun, kiri->kanan
 *   layar sempit (sm) - 3 baris : sama seperti md, tapi kotaknya lebih kecil
 *
 * Pulau ber-`soon` adalah planet masa depan: selalu terkunci, belum punya
 * misi, dan cuma ditampilkan supaya peta terlihat penuh.
 *
 * Pulau `trial` (Pulau Perkenalan) kebalikannya: SELALU terbuka, tapi hanya
 * boleh dimainkan oleh tamu. Begitu tamu masuk ke akun Pendamping, pulau
 * trial tetap ada dan lima pulau asli ikut terbuka. Isi soalnya ada di
 * lib/trialIsland.js dan sengaja seluruhnya berbeda dari pulau asli.
 */
export const TRIAL_ISLAND = {
  slug: TRIAL_SLUG,
  name: "Pulau Perkenalan",
  subject: "Perkenalan",
  // Ikon berupa pose Zippy, bukan ikon pulau, supaya mata langsung tahu
  // ini berbeda dari lima pulau tujuan.
  icon: ZIPPY_IMG.melompat,
  // Mint adalah satu-satunya warna yang belum dipakai pulau manapun yang
  // bisa dimainkan, jadi pulau trial tidak pernah tertukar dengan aslinya.
  color: "#B2D8D5",
  tagline: "Coba dulu, gratis!",
  desc: "Tiga misi singkat untuk mengenal ZippyVerse sebelum menjelajah lima pulau lainnya.",
  available: true,
  trial: true,
  pos: { top: "56%", left: "10%" },
  positions: {
    sm: { top: "69%", left: "83.3%" },
    md: { top: "69%", left: "83.3%" },
    lg: { top: "56%", left: "10%" },
  },
};

export const ISLANDS = [
  TRIAL_ISLAND,
  {
    slug: "angka",
    name: "Pulau Angka",
    subject: "Matematika",
    icon: "/islands/angka.webp",
    color: "#FFC93C",
    tagline: "Nyalakan Mesin Perhitungan!",
    desc: "Bantu Zippy menghitung, menebak, dan mengalahkan Gerhana Zahra.",
    available: true,
    pos: { top: "8%", left: "10%" },
    positions: {
      sm: { top: "3%", left: "16.7%" },
      md: { top: "3%", left: "16.7%" },
      lg: { top: "8%", left: "10%" },
    },
  },
  {
    slug: "kata",
    name: "Pulau Kata",
    subject: "Bahasa Indonesia",
    icon: "/islands/kata.webp",
    color: "#2AA5A0",
    tagline: "Kumpulkan Kata-Kata Emas",
    desc: "Bantu Zippy mengumpulkan kata-kata emas yang tersebar di pulau ini.",
    available: false,
    pos: { top: "8%", left: "30%" },
    positions: {
      sm: { top: "3%", left: "50%" },
      md: { top: "3%", left: "50%" },
      lg: { top: "8%", left: "30%" },
    },
  },
  {
    slug: "sains",
    name: "Pulau Sains",
    subject: "IPA",
    icon: "/islands/sains.webp",
    color: "#4FB3AE",
    tagline: "Cari Ramuan Ajaib!",
    desc: "Campurkan bahan sampai kamu menemukan formula baru.",
    available: false,
    pos: { top: "8%", left: "50%" },
    positions: {
      sm: { top: "3%", left: "83.3%" },
      md: { top: "3%", left: "83.3%" },
      lg: { top: "8%", left: "50%" },
    },
  },
  {
    slug: "kreatif",
    name: "Pulau Kreatif",
    subject: "Seni & Logika",
    icon: "/islands/kreatif.webp",
    color: "#FFC93C",
    tagline: "Rancang Karya Agungmu!",
    desc: "Bantu Zippy menyelesaikan teka-teki dan merancang mahkota.",
    available: false,
    pos: { top: "8%", left: "70%" },
    positions: {
      sm: { top: "36%", left: "83.3%" },
      md: { top: "36%", left: "83.3%" },
      lg: { top: "8%", left: "70%" },
    },
  },
  {
    slug: "bumi",
    name: "Pulau Bumi",
    subject: "IPS",
    icon: "/islands/bumi.webp",
    color: "#7FC5C1",
    tagline: "Jelajahi Planet Luminara!",
    desc: "Temukan benua, fauna, dan alam dari planet asal Zippy.",
    available: false,
    pos: { top: "8%", left: "90%" },
    positions: {
      sm: { top: "36%", left: "50%" },
      md: { top: "36%", left: "50%" },
      lg: { top: "8%", left: "90%" },
    },
  },
  {
    slug: "inggris",
    name: "Pulau Inggris",
    subject: "Bahasa Inggris",
    icon: "/islands/inggris.svg",
    color: "#4FB3AE",
    tagline: "Segera Hadir!",
    desc: "Pulau ini sedang disiapkan Zippy. Nantikan ya, Sahabat!",
    available: false,
    soon: true,
    pos: { top: "56%", left: "90%" },
    positions: {
      sm: { top: "36%", left: "16.7%" },
      md: { top: "36%", left: "16.7%" },
      lg: { top: "56%", left: "90%" },
    },
  },
  {
    slug: "musik",
    name: "Pulau Musik",
    subject: "Seni Musik",
    icon: "/islands/musik.svg",
    color: "#FFC93C",
    tagline: "Segera Hadir!",
    desc: "Pulau ini sedang disiapkan Zippy. Nantikan ya, Sahabat!",
    available: false,
    soon: true,
    pos: { top: "56%", left: "70%" },
    positions: {
      sm: { top: "69%", left: "16.7%" },
      md: { top: "69%", left: "16.7%" },
      lg: { top: "56%", left: "70%" },
    },
  },
  {
    slug: "digital",
    name: "Pulau Digital",
    subject: "Teknologi",
    icon: "/islands/digital.svg",
    color: "#B2D8D5",
    tagline: "Segera Hadir!",
    desc: "Pulau ini sedang disiapkan Zippy. Nantikan ya, Sahabat!",
    available: false,
    soon: true,
    pos: { top: "56%", left: "50%" },
    positions: {
      sm: { top: "69%", left: "50%" },
      md: { top: "69%", left: "50%" },
      lg: { top: "56%", left: "50%" },
    },
  },
];

// ---------------------------------------------------------
// KONTEN: Pulau Angka
// ---------------------------------------------------------

// Misi 1 - seret angka yang sesuai jumlah benda
const M1_ROUNDS = [
  { emoji: "🍓", count: 3, options: [2, 3, 5, 7] },
  { emoji: "⭐", count: 7, options: [5, 6, 7, 9] },
  { emoji: "🐟", count: 5, options: [4, 5, 8, 2] },
  { emoji: "🎈", count: 4, options: [3, 6, 4, 9] },
  { emoji: "🍎", count: 6, options: [6, 2, 5, 8] },
  { emoji: "🐝", count: 8, options: [7, 9, 8, 4] },
  { emoji: "🍇", count: 9, options: [8, 7, 6, 9] },
  { emoji: "🌟", count: 10, options: [10, 9, 12, 11] },
];

// Misi 2 - Tantangan Kilat 30 detik
const M2_ROUNDS = [
  { q: "3 + 4 = ?", a: 7, o: [6, 7, 8, 9] },
  { q: "10 - 5 = ?", a: 5, o: [4, 5, 6, 3] },
  { q: "6 + 6 = ?", a: 12, o: [11, 12, 13, 14] },
  { q: "9 - 3 = ?", a: 6, o: [5, 6, 7, 4] },
  { q: "2 + 7 = ?", a: 9, o: [8, 9, 7, 10] },
  { q: "15 - 10 = ?", a: 5, o: [3, 5, 6, 4] },
  { q: "4 + 4 = ?", a: 8, o: [7, 8, 9, 6] },
  { q: "12 - 4 = ?", a: 8, o: [7, 8, 9, 6] },
  { q: "5 + 8 = ?", a: 13, o: [12, 13, 14, 11] },
  { q: "20 - 5 = ?", a: 15, o: [14, 15, 16, 13] },
  { q: "3 x 4 = ?", a: 12, o: [11, 12, 7, 14] },
  { q: "7 + 6 = ?", a: 13, o: [12, 13, 14, 11] },
  { q: "18 - 8 = ?", a: 10, o: [9, 10, 11, 8] },
  { q: "9 + 9 = ?", a: 18, o: [17, 18, 19, 16] },
  { q: "14 - 6 = ?", a: 8, o: [7, 8, 9, 6] },
  { q: "6 + 8 = ?", a: 14, o: [13, 14, 15, 12] },
  { q: "2 x 5 = ?", a: 10, o: [8, 10, 12, 7] },
  { q: "16 - 9 = ?", a: 7, o: [6, 7, 8, 5] },
  { q: "8 + 6 = ?", a: 14, o: [13, 14, 12, 15] },
  { q: "11 - 5 = ?", a: 6, o: [5, 6, 7, 4] },
];

// Misi 3 - Boss Battle
const M3_ROUNDS = [
  { q: "Kisi gerhana ini menyala dengan:", a: 7, o: [6, 7, 8, 9], hint: "5 + 2 = ?" },
  { q: "Gerhana masih gelap. Nyalakan dengan:", a: 14, o: [12, 13, 14, 15], hint: "7 x 2 = ?" },
  { q: "Perhatikan baik-baik. Serangan terakhir Zippy:", a: 9, o: [8, 9, 10, 7], hint: "5 + 4 = ?" },
  { q: "Zahra makin lemah! Strike final Zippy:", a: 20, o: [18, 19, 20, 21], hint: "10 + 10 = ?" },
  { q: "GERBANG PEMERTAHANAN! Berapa 25 - 13?", a: 12, o: [11, 12, 13, 14], hint: "Kurangi saja!" },
];

export const MISSIONS = {
  angka: [
    {
      id: "a1",
      type: "dragcount",
      name: "Misi 1",
      title: "Jembatan Berry",
      subtitle: "Hitung bendanya, lalu seret angka yang tepat ke jembatan Zippy!",
      rounds: M1_ROUNDS,
      reward: 30,
      xp: 20,
    },
    {
      id: "a2",
      type: "blitz",
      name: "Misi 2",
      title: "Tantangan Kilat",
      subtitle: "Jawab sebanyak mungkin dalam 30 detik!",
      rounds: M2_ROUNDS,
      duration: 30,
      reward: 50,
      xp: 35,
    },
    {
      id: "a3",
      type: "boss",
      name: "Misi 3",
      title: "Boss Battle: Gerhana Zahra",
      subtitle: "Kalahkan Gerhana Zahra dengan 5 jawaban benar!",
      rounds: M3_ROUNDS,
      reward: 100,
      xp: 70,
    },
  ],
};

// Gabungkan misi Pulau Kata, Sains, Kreatif, dan Bumi dari file terpisah.
// Tujuannya membuat gameData.js tetap ringkas dan mudah dirawat.
Object.assign(MISSIONS, MISSIONS_EXTRA);

// Pulau Perkenalan (trial) untuk tamu. Didaftarkan terpisah supaya
// berkasnya tetap ringkas seperti pola MISSIONS_EXTRA.
MISSIONS[TRIAL_SLUG] = TRIAL_MISSIONS;

// Tantangan Harian disimpan dengan slug khusus supaya bisa dipakai
// di halaman pulau yang sama, tanpa membuat rute baru.
MISSIONS[DAILY_SLUG] = [DAILY_CHALLENGE];

// Pulau palsu untuk Tantangan Harian. Tidak muncul di peta sebagai pulau,
// hanya dipakai untuk halaman permainannya.
export const DAILY_ISLAND = {
  slug: DAILY_SLUG,
  name: "Tantangan Harian",
  subject: "Semua Pulau",
  icon: ZIPPY_IMG.merayakan,
  color: "#FFC93C",
  tagline: "Lima soal campuran dari seluruh Planet Luminara!",
  desc: "Tantangan baru setiap hari. Selesaikan hari ini untuk koin penuh!",
  available: true,
  daily: true,
  pos: { top: "50%", left: "50%" },
  positions: { sm: { top: "50%", left: "50%" }, md: { top: "50%", left: "50%" }, lg: { top: "50%", left: "50%" } },
};

/**
 * Apakah pengunjung ini masih TAMU?
 *
 * Tamu adalah anak yang bermain tanpa masuk ke akun Pendamping: progresnya
 * hanya tersimpan di perangkatnya sendiri. Penandanya adalah tidak adanya
 * `save.pendamping`, yang baru ditulis setelah berhasil daftar/masuk.
 *
 * @param {object|null} save data simpanan dari store
 * @returns {boolean}
 */
export function isTamu(save) {
  return !save?.pendamping;
}

/**
 * Apakah sebuah pulau sudah bisa dimainkan?
 *
 * Pulau Perkenalan (trial) selalu terbuka dan hanya itu yang boleh dimainkan
 * tamu. Begitu tamu masuk ke akun Pendamping, lima pulau asli mengikuti
 * rantai biasanya: pulau pertama terbuka, pulau berikutnya terbuka setelah
 * pulau sebelumnya selesai - supaya anak punya tujuan jelas.
 *
 * @param {string} slug    slug pulau
 * @param {object|null} save data simpanan dari store
 */
export function isIslandOpen(slug, save) {
  const idx = ISLANDS.findIndex((i) => i.slug === slug);
  if (idx < 0) return true; // slug di luar rantai (misalnya Tantangan Harian)
  const isl = ISLANDS[idx];
  if (isl.soon) return false; // pulau masa depan selalu terkunci
  if (isl.trial) return true; // pulau trial selalu terbuka

  // TAMU: selain pulau trial, semuanya menunggu pendaftaran atau pemasukan.
  if (isTamu(save)) return false;

  // Cari pendahulu yang non-trial. Pulau trial sengaja dilewati supaya tidak
  // ikut mengunci Pulau Angka bagi anak yang sudah mendaftar.
  for (let j = idx - 1; j >= 0; j--) {
    const prev = ISLANDS[j];
    if (prev.soon) return false; // rantai tidak boleh melewati pulau kosong
    if (prev.trial) continue;
    return Boolean(save?.islands?.[prev.slug]?.done);
  }
  return true; // tidak ada pendahulu non-trial -> pulau pertama, terbuka
}

/**
 * Pulau mana yang menjadi berikutnya untuk dibuka, atau null kalau semua selesai.
 * Pulau `soon` dilewati karena belum bisa dimainkan.
 * Tamu selalu diarahkan ke Pulau Perkenalan.
 */
export function nextIslandSlug(save) {
  if (isTamu(save)) return TRIAL_SLUG;
  for (const isl of ISLANDS) {
    if (isl.soon || isl.trial) continue;
    if (!save?.islands?.[isl.slug]?.done) return isl.slug;
  }
  return null;
}

export const COSTUMES = [
  { id: "default", name: "Penjelajah", img: ZIPPY_IMG.depan, mood: "depan", price: 0 },
  { id: "melompat", name: "Mode Melompat", img: ZIPPY_IMG.melompat, mood: "melompat", price: 60 },
  { id: "merayakan", name: "Mode Party", img: ZIPPY_IMG.merayakan, mood: "merayakan", price: 60 },
  { id: "menunjuk", name: "Mode Guru", img: ZIPPY_IMG.menunjuk, mood: "menunjuk", price: 90 },
  { id: "membaca", name: "Mode Pintar", img: ZIPPY_IMG.membaca, mood: "membaca", price: 90 },
  { id: "berlari", name: "Mode Turbo", img: ZIPPY_IMG.berlari, mood: "berlari", price: 120 },
  { id: "berpikir", name: "Mode Pemikir", img: ZIPPY_IMG.berpikir, mood: "berpikir", price: 120 },
  { id: "samping", name: "Mode Jelajah", img: ZIPPY_IMG.sampingKanan, mood: "sampingKanan", price: 150 },
];

/**
 * Daftar kostum dengan harga yang sedang berlaku, lengkap dengan kalimat
 * keistimewaannya.
 *
 * `COSTUMES` tetap memuat harga bawaan sebagai cadangan, tapi harga yang
 * dipakai dibaca dari pengaturan Panel Admin (`lib/adminConfig.js`) supaya
 * admin bisa menyesuaikan ekonomi permainan tanpa menyunting kode.
 *
 * @returns {Array<{id:string,name:string,img:string,mood:string,
 *                  price:number,perk:string|null}>}
 */
export function daftarKostum() {
  const harga = bacaConfig().hargaKostum;
  return COSTUMES.map((c) => ({
    ...c,
    price: harga[c.id] ?? c.price,
    perk: teksPerk(c.id),
  }));
}

/**
 * Pose Zippy yang sesuai dengan kostum yang sedang dikenakan.
 *
 * Dipakai di beranda, peta, dan halaman pulau supaya kostum yang dibeli anak
 * benar-benar terlihat pada maskot besar — bukan hanya pada avatar HUD kecil.
 * Pose naratif (mis. "merayakan" di layar kemenangan) tidak lewat fungsi ini
 * supaya momen cerita tetap utuh.
 *
 * @param equipped id kostum yang sedang dipakai
 * @param cadangan  pose bila id tidak dikenal
 */
export function moodKostum(equipped, cadangan = "bahagia") {
  const c = COSTUMES.find((x) => x.id === equipped);
  return (c && c.mood) || cadangan;
}

// Bank pengetahuan cadangan untuk Zippy AI
export const ZIPPY_FALLBACK = [
  { k: ["halo", "hai", "hi", "hello", "hei"], a: "Hai! Aku Zippy! Mau menjelajah pulau mana hari ini?" },
  { k: ["nama", "siapa kamu", "kamu siapa"], a: "Aku Zippy, Si Penjelajah Ilmu dari Planet Luminara! Aku suka matematika dan petualangan." },
  { k: ["matematika", "angka", "hitung"], a: "Di Pulau Angka kita hitung bareng! Zippy siap menemani. Ayo ke sana!" },
  { k: ["berapa", "hitung"], a: "Sebut angka yang mau dihitung, misalnya tujuh tambah lima. Zippy bantu!" },
  { k: ["sains", "ipa"], a: "Pulau Sains masih terkunci, tapi aku siap cerita soal planet dan bintang!" },
  { k: ["bantu", "help", "bantuan"], a: "Bisa! Hitung angka, tebak jawaban, atau sekadar ngobrol. Aku siap!" },
  { k: ["terima kasih", "thanks", "makasih"], a: "Sama-sama! Kamu hebat banget hari ini!" },
  { k: ["orang tua", "mama", "papa", "daddy"], a: "Orang tua bisa melihat grafik belajar kamu di Dasbor Orang Tua." },
  { k: ["senang", "bahagia", "happy"], a: "Aku juga senang! Setiap misi yang kamu selesaikan bikin planet Luminara makin terang." },
];
