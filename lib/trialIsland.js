// ============================================================
// Pulau Perkenalan (trial) - khusus pengunjung TAMU.
//
// Mengapa terpisah dan mengapa soalnya baru seluruhnya?
//
// Tamu hanya boleh memainkan SATU pulau. Setelah tamu mendaftar atau
// masuk ke akun Pendamping, lima pulau asli terbuka. Agar pendaftaran
// terasa bernilai, isi Pulau Perkenalan TIDAK boleh ada yang sama dengan
// lima pulau asli - kalau identik, anak yang sudah mencoba trial akan
// menghafal jawaban sebelum sempat mendaftar.
//
// Pemetaan topik supaya tidak tumpang tindih:
//   Pulau Angka    -> penjumlahan, pengurangan, hitung benda
//   Pulau Kata     -> sinonim, antonim, tata bahasa
//   Pulau Sains    -> fakta IPA (fotosintesis, planet, tubuh)
//   Pulau Kreatif  -> warna, bentuk, logika, angka romawi
//   Pulau Bumi     -> geografi Indonesia dan dunia
//   Pulau Perkenalan (ini) -> KEBIASAAN BAUK, WAKTU, PROFESI,
//                             TRANSPORTASI, BUAH-SAYUR, dan PERKALIAN
//
// Semua jawaban sudah diperiksa saat penulisan.
// ============================================================

/**
 * Slug Pulau Perkenalan. Dipakai sebagai sakelar "ini tamu atau anggota"
 * di lib/gameData.js, jadi namanya tidak boleh diubah sembarangan - slug
 * lama bisa saja sudah tersimpan di simpanan anak.
 */
export const TRIAL_SLUG = "coba";

// ---------- Misi 1: dragcount ----------
// Emoji berbeda dengan Pulau Angka (🍓 ⭐ 🐟 🎈 🍎 🐝 🍇 🌟).
const T1 = [
  { emoji: "🐙", count: 2, options: [1, 2, 3, 4] },
  { emoji: "🦋", count: 4, options: [3, 4, 5, 6] },
  { emoji: "🐢", count: 6, options: [5, 6, 7, 8] },
  { emoji: "🌻", count: 7, options: [6, 7, 8, 9] },
  { emoji: "🥕", count: 8, options: [7, 8, 9, 10] },
  { emoji: "🐚", count: 9, options: [8, 9, 10, 11] },
  { emoji: "🍑", count: 10, options: [9, 10, 11, 12] },
  { emoji: "🐘", count: 11, options: [10, 11, 12, 13] },
];

// ---------- Misi 2: pilihan ganda ----------
// Topik kebiasaan baik, waktu, profesi, dan transportasi. Tidak ada satu pun
// yang muncul di bank soal Pulau Kata, Sains, Kreatif, maupun Bumi.
const T2 = [
  {
    q: "Sebelum makan, sebaiknya kita...",
    a: "mencuci tangan",
    o: ["mencuci tangan", "berlari kencang", "menonton televisi", "membaringkan diri"],
    hint: "Supaya kuman tidak ikut masuk ke mulut.",
  },
  {
    q: "Alat yang dipakai untuk menyikat gigi adalah...",
    a: "sikat gigi",
    o: ["sikat gigi", "sisir", "handuk", "sikat pakaian"],
    hint: "Dipakai bersama odol.",
  },
  {
    q: "Satu minggu terdiri atas berapa hari?",
    a: "7 hari",
    o: ["7 hari", "5 hari", "6 hari", "8 hari"],
    hint: "Senin sampai Minggu.",
  },
  {
    q: "Orang yang mengobati pasien adalah...",
    a: "dokter",
    o: ["dokter", "guru", "petani", "sopir"],
    hint: "Bekerja di rumah sakit atau klinik.",
  },
  {
    q: "Buah berwarna kuning dan berbentuk panjang adalah...",
    a: "pisang",
    o: ["pisang", "apel", "anggur", "semangka"],
    hint: "Monyet sangat menyukainya.",
  },
  {
    q: "Alat angkutan yang bisa terbang adalah...",
    a: "pesawat",
    o: ["pesawat", "kapal", "sepeda", "bis"],
    hint: "Bertemu di bandara.",
  },
  {
    q: "Kita memakai payung ketika...",
    a: "hujan turun",
    o: ["hujan turun", "matahari bersinar", "malam hari", "langit cerah"],
    hint: "Air dari langit jatuh ke bumi.",
  },
  {
    q: "Ibu memasak nasi di...",
    a: "dapur",
    o: ["dapur", "kamar mandi", "taman", "garasi"],
    hint: "Di sana ada kompor.",
  },
];

// ---------- Misi 3: Tantangan Kilat ----------
// SELURUHNYA perkalian, berbeda dengan Pulau Angka yang didominasi
// penjumlahan/pengurangan. Angkanya juga tidak ada yang sama dengan
// "3 x 4" maupun "2 x 5" di Pulau Angka.
const T3 = [
  { q: "6 x 7 = ?", a: 42, o: [42, 36, 48, 40] },
  { q: "9 x 4 = ?", a: 36, o: [36, 32, 40, 45] },
  { q: "5 x 8 = ?", a: 40, o: [40, 35, 45, 48] },
  { q: "7 x 7 = ?", a: 49, o: [49, 42, 56, 48] },
  { q: "8 x 3 = ?", a: 24, o: [24, 21, 27, 32] },
  { q: "12 x 2 = ?", a: 24, o: [24, 22, 26, 28] },
  { q: "9 x 6 = ?", a: 54, o: [54, 48, 56, 63] },
  { q: "4 x 9 = ?", a: 36, o: [36, 32, 40, 45] },
  { q: "10 x 8 = ?", a: 80, o: [80, 70, 90, 88] },
  { q: "11 x 5 = ?", a: 55, o: [55, 50, 60, 65] },
  { q: "6 x 6 = ?", a: 36, o: [36, 30, 42, 40] },
  { q: "15 x 3 = ?", a: 45, o: [45, 40, 50, 55] },
  { q: "8 x 8 = ?", a: 64, o: [64, 56, 72, 60] },
  { q: "7 x 9 = ?", a: 63, o: [63, 54, 72, 60] },
  { q: "14 x 2 = ?", a: 28, o: [28, 26, 30, 32] },
  { q: "3 x 9 = ?", a: 27, o: [27, 24, 30, 33] },
  { q: "16 x 4 = ?", a: 64, o: [64, 60, 68, 72] },
  { q: "20 x 5 = ?", a: 100, o: [100, 90, 110, 105] },
  { q: "9 x 9 = ?", a: 81, o: [81, 72, 90, 84] },
  { q: "13 x 3 = ?", a: 39, o: [39, 36, 42, 45] },
];

/**
 * Tiga misi Pulau Perkenalan.
 *
 * Hadiah sengaja lebih kecil dari pulau asli: ini memang cuma rasa-rasanya,
 * dan koin seharusnya didapat dari lima pulau sesudah pendaftaran.
 */
export const TRIAL_MISSIONS = [
  {
    id: "t1",
    type: "dragcount",
    name: "Misi 1",
    title: "Harta Karun Zippy",
    subtitle: "Hitung bendanya, lalu seret angka yang tepat!",
    rounds: T1,
    reward: 20,
    xp: 15,
  },
  {
    id: "t2",
    type: "mcq",
    name: "Misi 2",
    title: "Kebiasaan Penjelajah",
    subtitle: "Pilih jawaban yang paling tepat!",
    rounds: T2,
    reward: 30,
    xp: 25,
  },
  {
    id: "t3",
    type: "blitz",
    name: "Misi 3",
    title: "Latihan Kilat Perkalian",
    subtitle: "Jawab sebanyak mungkin dalam 30 detik!",
    rounds: T3,
    duration: 30,
    reward: 45,
    xp: 35,
  },
];
