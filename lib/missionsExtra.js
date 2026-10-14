// ============================================================
// Konten misi untuk Pulau Kata, Sains, Kreatif, dan Bumi.
// Dipisah dari gameData.js agar mudah dirawat.
// Format soal:
//   mcq      -> { q, a, o[], hint }
//   scramble -> { scrambled, answer, hint }
//   order    -> { items[], answer[], hint }
// ============================================================

import { seededShuffle } from "./shuffle.js";

// ---------- PULAU KATA (Bahasa Indonesia) ----------
const K1 = [
  { q: "Sinonim kata 'bergeser' adalah...", a: "berpindah", o: ["berpindah", "membeku", "bersuara", "berhenti"], hint: "Artinya pindah tempat." },
  { q: "Antonim kata 'tinggi' adalah...", a: "rendah", o: ["rendah", "jauh", "besar", "panjang"], hint: "Lawan dari tinggi." },
  { q: "Kata 'melonjak' berarti...", a: "naik", o: ["naik", "jatuh", "berkata", "menari"], hint: "Naik tinggi, kebalikan dari jatuh." },
  { q: "Kata 'melek' artinya...", a: "sadar", o: ["sadar", "lelah", "bingung", "malu"], hint: "Bangun dari tidur." },
  { q: "Sinonim kata 'membantu' adalah...", a: "menolong", o: ["menolong", "merusak", "menunggu", "menangis"], hint: "Membantu orang lain." },
  { q: "Lawan kata 'ramah' adalah...", a: "kasar", o: ["kasar", "lucu", "sabar", "baik"], hint: "Tidak sopan kepada orang lain." },
  { q: "Kalimat 'Datanglah ke sini!' termasuk kalimat...", a: "perintah", o: ["perintah", "pertanyaan", "pernyataan", "lirih"], hint: "Memberi suruhan." },
  { q: "Kata 'berkembang biak' berarti...", a: "membiak", o: ["membiak", "menyusut", "berhenti", "bergetar"], hint: "Beranak-pinak, jumlahnya makin banyak." },
];

const K2 = [
  { scrambled: "KOSEHAL", answer: "SEKOLAH", hint: "Tempat belajar" },
  { scrambled: "RAJELAB", answer: "BELAJAR", hint: "Kegiatan belajar" },
  { scrambled: "UKUB", answer: "BUKU", hint: "Untuk membaca" },
  { scrambled: "NITRAP", answer: "PINTAR", hint: "Cerdas" },
  { scrambled: "UGUR", answer: "GURU", hint: "Pengajar" },
  { scrambled: "SILUNEM", answer: "MENULIS", hint: "Menuangkan huruf" },
  { scrambled: "BACAMEM", answer: "MEMBACA", hint: "Membaca" },
  { scrambled: "SADREC", answer: "CERDAS", hint: "Berpikir tajam" },
];

// Misi 3 Pulau Kata: soal baru, bukan ulangan Misi 1.
// Tingkat sedikit lebih tinggi supaya bos benar-benar terasa sebagai puncak.
const K3 = [
  { q: "Kata 'bersinar' paling dekat artinya...", a: "bercahaya", o: ["bercahaya", "bersembunyi", "berlari", "berbicara"], hint: "Mengeluarkan cahaya." },
  { q: "Antonim kata 'senang' adalah...", a: "sedih", o: ["sedih", "gembira", "suka", "riang"], hint: "Perasaan tidak enak." },
  { q: "Kalimat 'Jangan membuang sampah sembarangan!' termasuk...", a: "larangan", o: ["larangan", "perintah", "pertanyaan", "penyampaian"], hint: "Ada kata 'jangan'." },
  { q: "Arti kata majemuk 'ibu kota' adalah...", a: "kota pusat pemerintahan", o: ["kota pusat pemerintahan", "kota pelabuhan", "ibu yang tinggal di kota", "kota wisata"], hint: "Tempat pemerintahan negara." },
  { q: "Suku kata pada kata 'sekolah' ada berapa?", a: "3", o: ["2", "3", "4", "5"], hint: "se - ko - lah." },
];

// ---------- PULAU SAINS (IPA) ----------
const S1 = [
  { q: "Proses tumbuhan membuat makanan dengan bantuan cahaya disebut...", a: "fotosintesis", o: ["fotosintesis", "respirasi", "penguapan", "penyerapan"], hint: "Kata 'foto' berarti cahaya." },
  { q: "Planet yang paling dekat dengan matahari adalah...", a: "Merkurius", o: ["Merkurius", "Venus", "Bumi", "Mars"], hint: "Planet paling pertama." },
  { q: "Gas yang kita hirup untuk bernapas adalah...", a: "oksigen", o: ["oksigen", "karbon dioksida", "nitrogen", "helium"], hint: "Ada di udara." },
  { q: "Alat yang bisa menarik paku logam adalah...", a: "magnet", o: ["magnet", "kaca", "kayu", "plastik"], hint: "Memiliki huruf M." },
  { q: "Air yang menguap lalu turun kembali menjadi air disebut...", a: "siklus air", o: ["siklus air", "siklus batu", "siklus magma", "siklus darah"], hint: "Air berputar." },
  { q: "Hewan yang menghasilkan madu adalah...", a: "lebah", o: ["lebah", "ikan", "burung", "kucing"], hint: "Membuat madu." },
  { q: "Zat warna hijau pada daun disebut...", a: "klorofil", o: ["klorofil", "klorin", "karbon", "kalsium"], hint: "Bikin daun hijau." },
  { q: "Satuan untuk suhu adalah...", a: "Celsius", o: ["Celsius", "meter", "gram", "liter"], hint: "Simbolnya derajat C." },
];

const S2 = [
  { items: ["Kertas dipegang dengan pinset", "Bakar bagian kertas di atas lilin", "Amati bagian yang hangus", "Catat kesimpulannya"], answer: ["Kertas dipegang dengan pinset", "Bakar bagian kertas di atas lilin", "Amati bagian yang hangus", "Catat kesimpulannya"], hint: "Mulai dari memegang." },
  { items: ["Tanam biji di dalam tanah", "Pastikan terkena cahaya matahari", "Siram dengan air", "Tunggu sampai tumbuh tunas"], answer: ["Tanam biji di dalam tanah", "Pastikan terkena cahaya matahari", "Siram dengan air", "Tunggu sampai tumbuh tunas"], hint: "Mulai dari menanam." },
  { items: ["Siapkan es batu", "Masukkan segelas air hangat", "Campurkan keduanya", "Amati perubahan yang terjadi"], answer: ["Siapkan es batu", "Masukkan segelas air hangat", "Campurkan keduanya", "Amati perubahan yang terjadi"], hint: "Siapkan bahannya dulu." },
];

// Misi 3 Pulau Sains: soal baru, bukan ulangan Misi 1.
const S3 = [
  { q: "Tumbuhan menyerap air melalui...", a: "akar", o: ["akar", "daun", "bunga", "kulit batang"], hint: "Bagian yang ada di bawah tanah." },
  { q: "Kita bernapas menggunakan...", a: "paru-paru", o: ["paru-paru", "lambung", "jantung", "otak"], hint: "Ada di dalam dada." },
  { q: "Perubahan air menjadi uap disebut...", a: "penguapan", o: ["penguapan", "pengembunan", "penyubliman", "pembekuan"], hint: "Air hilang menjadi uap." },
  { q: "Hewan yang makan daging disebut...", a: "karnivora", o: ["karnivora", "herbivora", "omnivora", "detritivora"], hint: "Lawan dari pemakan tumbuhan." },
  { q: "Alat untuk mengukur suhu adalah...", a: "termometer", o: ["termometer", "mistar", "timbangan", "penggaris"], hint: "Isinya bisa merkuri atau alkohol." },
];

// ---------- PULAU KREATIF (Seni & Logika) ----------
const C1 = [
  { q: "Warna yang terbentuk dari merah dan kuning adalah...", a: "jingga", o: ["jingga", "hijau", "biru", "ungu"], hint: "Warna di antara keduanya." },
  { q: "Segitiga punya berapa sisi?", a: "3", o: ["3", "4", "5", "6"], hint: "Sebut namanya." },
  { q: "Bentuk dengan empat sudut siku-siku disebut...", a: "persegi", o: ["persegi", "segitiga", "lingkaran", "oval"], hint: "Empat sudut." },
  { q: "Campuran merah dan biru menghasilkan warna...", a: "ungu", o: ["ungu", "hijau", "jingga", "kuning"], hint: "Warna pelangi." },
  { q: "Aku punya sayap dan bisa terbang, tapi aku bukan makhluk hidup. Aku adalah...", a: "helikopter", o: ["helikopter", "burung", "kucing", "ikan"], hint: "Ada baling-baling di atasnya." },
  { q: "Lingkaran tidak punya sudut, tetapi punya...", a: "titik pusat", o: ["titik pusat", "tiga sudut", "empat sisi", "dua diagonal"], hint: "Ada di tengah." },
  { q: "Lawan dari kata 'kecil' adalah...", a: "besar", o: ["besar", "panjang", "tinggi", "lebar"], hint: "Kebalikannya." },
  { q: "Bentuk seperti telur disebut...", a: "oval", o: ["oval", "persegi", "segitiga", "garis"], hint: "Bulat memanjang." },
];

const C2 = [
  { items: ["Lipat kertas jadi setengah", "Gunting kertas", "Tulis bentuk pada kertas", "Warnai kertas"], answer: ["Lipat kertas jadi setengah", "Gunting kertas", "Tulis bentuk pada kertas", "Warnai kertas"], hint: "Lipat dulu." },
  { items: ["Kumpulkan ide", "Tentukan bahan yang dipakai", "Buat sketsa", "Pilih warna yang cocok"], answer: ["Kumpulkan ide", "Tentukan bahan yang dipakai", "Buat sketsa", "Pilih warna yang cocok"], hint: "Ide selalu lebih dulu." },
  { items: ["Siapkan kanvas", "Buat blok warna dasar", "Tambahkan detail halus", "Bingkai hasil karya"], answer: ["Siapkan kanvas", "Buat blok warna dasar", "Tambahkan detail halus", "Bingkai hasil karya"], hint: "Kanvas lebih dulu." },
];

// Misi 3 Pulau Kreatif: soal baru, bukan ulangan Misi 1.
const C3 = [
  { q: "Campuran warna biru dan kuning menghasilkan...", a: "hijau", o: ["hijau", "jingga", "ungu", "merah muda"], hint: "Warna daun." },
  { q: "Jumlah sudut pada persegi panjang adalah...", a: "4", o: ["3", "4", "5", "6"], hint: "Semua sudutnya siku-siku." },
  { q: "Bentuk yang menyerupai lambang bintang disebut...", a: "bintang", o: ["bintang", "lingkaran", "persegi", "trapesium"], hint: "Benda langit di malam hari." },
  { q: "Lambang angka romawi untuk angka 5 adalah...", a: "V", o: ["V", "X", "I", "L"], hint: "Bentuknya seperti tangan terbuka." },
  { q: "Urutan warna pelangi yang benar adalah...", a: "merah, jingga, kuning, hijau, biru, nila, ungu", o: ["merah, jingga, kuning, hijau, biru, nila, ungu", "ungu, biru, hijau, kuning, jingga, merah", "kuning, merah, hijau, biru, ungu, jingga", "biru, hijau, kuning, jingga, merah, ungu"], hint: "Mulai dari warna merah." },
];

// ---------- PULAU BUMI (IPS) ----------
const B1 = [
  { q: "Ibu kota Indonesia adalah...", a: "Jakarta", o: ["Jakarta", "Bandung", "Surabaya", "Medan"], hint: "Pusat pemerintahan." },
  { q: "Samudra terbesar di dunia adalah...", a: "Samudra Pasifik", o: ["Samudra Pasifik", "Samudra Hindia", "Samudra Atlantik", "Samudra Arktik"], hint: "Paling luas." },
  { q: "Benua tempat Indonesia berada adalah...", a: "Asia", o: ["Asia", "Afrika", "Eropa", "Australia"], hint: "Benua terbesar." },
  { q: "Warna bendera Indonesia adalah...", a: "merah putih", o: ["merah putih", "biru putih", "putih hijau", "merah biru"], hint: "Cinta dan suci." },
  { q: "Sungai terpanjang di Indonesia adalah...", a: "Kapuas", o: ["Kapuas", "Barito", "Musi", "Brantas"], hint: "Berada di Kalimantan." },
  { q: "Negara di sebelah utara Indonesia adalah...", a: "Malaysia", o: ["Malaysia", "Australia", "India", "Jepang"], hint: "Sebelah atas peta." },
  { q: "Puncak tertinggi di Indonesia adalah...", a: "Puncak Jaya", o: ["Puncak Jaya", "Gunung Semeru", "Gunung Rinjani", "Gunung Merapi"], hint: "Di Papua." },
  { q: "Benua yang sangat dingin di kutub selatan adalah...", a: "Antarktika", o: ["Antarktika", "Arktik", "Eropa", "Afrika"], hint: "Paling dingin." },
];

const B2 = [
  { scrambled: "NDOSAINIE", answer: "INDONESIA", hint: "Nama negara kita" },
  { scrambled: "AJRAKTA", answer: "JAKARTA", hint: "Ibu kota" },
  { scrambled: "MARATAM", answer: "MATARAM", hint: "Ibu kota NTB" },
  { scrambled: "GNUDNAB", answer: "BANDUNG", hint: "Kota Kembang" },
  { scrambled: "AYABARUS", answer: "SURABAYA", hint: "Kota kesatria" },
  { scrambled: "GNARAMES", answer: "SEMARANG", hint: "Kota di Jawa Tengah" },
  { scrambled: "ILAB", answer: "BALI", hint: "Pulau dewata" },
  { scrambled: "NAMED", answer: "MEDAN", hint: "Ibu kota Sumatera Utara" },
];

// Misi 3 Pulau Bumi: soal baru, bukan ulangan Misi 1.
const B3 = [
  { q: "Indonesia terdiri dari beribu-ribu...", a: "pulau", o: ["pulau", "benua", "samudra", "gurun"], hint: "Nusantara berarti kepulauan." },
  { q: "Pulau terbesar di Indonesia adalah...", a: "Kalimantan", o: ["Kalimantan", "Sumatera", "Jawa", "Sulawesi"], hint: "Pulau di seberang Jawa." },
  { q: "Laut yang berada di utara Kalimantan adalah...", a: "Laut Natuna", o: ["Laut Natuna", "Laut Tengah", "Samudra Hindia", "Laut Kaspia"], hint: "Di sana banyak terumbu karang." },
  { q: "Provinsi dengan ibu kota Medan adalah...", a: "Sumatera Utara", o: ["Sumatera Utara", "Sumatera Barat", "Riau", "Jambi"], hint: "Di pesisir barat Sumatera." },
  { q: "Bendera Merah Putih dikibarkan setiap...", a: "Hari Kemerdekaan", o: ["Hari Kemerdekaan", "Hari Raya", "Hari Tahun Baru", "Hari Pendidikan"], hint: "Tanggal 17 Agustus." },
];

export const MISSIONS_EXTRA = {
  kata: [
    { id: "k1", type: "mcq", name: "Misi 1", title: "Teka-Teka Kosakata", subtitle: "Pilih sinonim, antonim, atau makna yang tepat!", rounds: K1, reward: 35, xp: 25 },
    { id: "k2", type: "scramble", name: "Misi 2", title: "Susun Kata", subtitle: "Klik huruf sesuai urutan untuk membentuk kata!", rounds: K2, reward: 45, xp: 30 },
    { id: "k3", type: "boss", name: "Misi 3", title: "Boss Battle: Raja Huruf", subtitle: "Kalahkan Raja Huruf dengan 5 jawaban benar!", rounds: K3, reward: 100, xp: 70 },
  ],
  sains: [
    { id: "s1", type: "mcq", name: "Misi 1", title: "Lab Ajaib", subtitle: "Jawab pertanyaan sains yang seru!", rounds: S1, reward: 35, xp: 25 },
    { id: "s2", type: "order", name: "Misi 2", title: "Urutan Percobaan", subtitle: "Klik langkah-langkah sesuai urutan yang benar!", rounds: S2, reward: 45, xp: 30 },
    { id: "s3", type: "boss", name: "Misi 3", title: "Boss Battle: Reaktor Ajaib", subtitle: "Kalahkan Reaktor dengan 5 jawaban benar!", rounds: S3, reward: 100, xp: 70 },
  ],
  kreatif: [
    { id: "c1", type: "mcq", name: "Misi 1", title: "Galeri Warna", subtitle: "Kenal warna, bentuk, dan teka-teki logika!", rounds: C1, reward: 35, xp: 25 },
    { id: "c2", type: "order", name: "Misi 2", title: "Urutan Logika", subtitle: "Urutkan langkah dari yang paling awal!", rounds: C2, reward: 45, xp: 30 },
    { id: "c3", type: "boss", name: "Misi 3", title: "Boss Battle: Kuas Penyihir", subtitle: "Kalahkan Kuas Penyihir dengan 5 jawaban benar!", rounds: C3, reward: 100, xp: 70 },
  ],
  bumi: [
    { id: "b1", type: "mcq", name: "Misi 1", title: "Peta Nusantara", subtitle: "Kenali Indonesia dan dunia!", rounds: B1, reward: 35, xp: 25 },
    { id: "b2", type: "scramble", name: "Misi 2", title: "Susun Nama Tempat", subtitle: "Susun huruf untuk nama kota dan negara!", rounds: B2, reward: 45, xp: 30 },
    { id: "b3", type: "boss", name: "Misi 3", title: "Boss Battle: Gempa Besar", subtitle: "Kalahkan Gempa Besar dengan 5 jawaban benar!", rounds: B3, reward: 100, xp: 70 },
  ],
};

/**
 * Tantangan Harian: lima soal acak dari berbagai pulau.
 * Hadiah penuh sekali sehari, setelah itu boleh diulang dengan 30%.
 */
export const DAILY_SLUG = "harian";

/**
 * Bank soal Tantangan Harian.
 *
 * Dulu tantangan harian memakai lima soal tetap, sehingga anak yang bermain
 * setiap hari akan menghafalnya dan menyelesaikannya dalam hitungan detik.
 * Bank ini dibuat supaya pemilihan soal benar-benar berubah tiap hari.
 *
 * Semua jawaban sudah diperiksa saat penulisan.
 */
const SOAL_HARIAN = [
  // Matematika
  { q: "4 + 5 = ?", a: "9", o: ["8", "9", "10", "7"] },
  { q: "12 - 7 = ?", a: "5", o: ["4", "5", "6", "3"] },
  { q: "6 x 3 = ?", a: "18", o: ["16", "18", "21", "12"] },
  { q: "20 - 8 = ?", a: "12", o: ["11", "12", "13", "10"] },
  { q: "7 + 8 = ?", a: "15", o: ["14", "15", "16", "13"] },
  { q: "24 : 4 = ?", a: "6", o: ["5", "6", "8", "4"] },
  { q: "Setengah dari 16 adalah...", a: "8", o: ["6", "8", "9", "4"] },
  { q: "9 + 6 = ?", a: "15", o: ["14", "15", "16", "12"] },

  // Bahasa Indonesia
  { q: "Sinonim kata 'ceria' adalah...", a: "gembira", o: ["gembira", "sedih", "marah", "letih"] },
  { q: "Antonim kata 'kaya' adalah...", a: "miskin", o: ["miskin", "kaya", "rajin", "baik"] },
  { q: "Huruf vokal adalah...", a: "a, i, u, e, o", o: ["a, i, u, e, o", "b, c, d, f, g", "j, k, l, m, n", "p, q, r, s, t"] },
  { q: "Imbuhan 'me-' pada kata 'memakan' menunjukkan...", a: "perbuatan", o: ["perbuatan", "tempat", "alat", "benda"] },
  { q: "Kata 'ramah' berarti...", a: "sopan dan baik", o: ["sopan dan baik", "keras dan galak", "cepat dan gesit", "besar dan kuat"] },
  { q: "Kalimat 'Wah, indah sekali!' termasuk kalimat...", a: "seru", o: ["seru", "perintah", "pertanyaan", "negasi"] },
  { q: "Antonim kata 'datang' adalah...", a: "pergi", o: ["pergi", "datang", "tiba", "mampir"] },

  // IPA
  { q: "Hewan yang bertelur adalah...", a: "ayam", o: ["ayam", "sapi", "kambing", "kelinci"] },
  { q: "Bagian tumbuhan yang menyerap air dari tanah adalah...", a: "akar", o: ["akar", "daun", "bunga", "buah"] },
  { q: "Alat pernapasan manusia adalah...", a: "paru-paru", o: ["paru-paru", "jantung", "lambung", "hati"] },
  { q: "Matahari terbit dari arah...", a: "timur", o: ["timur", "barat", "utara", "selatan"] },
  { q: "Padat, cair, dan gas adalah tiga...", a: "wujud zat", o: ["wujud zat", "zat adidaya", "sumber energi", "macam gaya"] },
  { q: "Hewan pemakan tumbuhan disebut...", a: "herbivora", o: ["herbivora", "karnivora", "omnivora", "detritivora"] },
  { q: "Planet tempat kita tinggal adalah...", a: "Bumi", o: ["Bumi", "Mars", "Venus", "Jupiter"] },
  { q: "Fungsi daun pada tumbuhan adalah...", a: "tempat fotosintesis", o: ["tempat fotosintesis", "penyerap air", "pengikat tanah", "penyimpan biji"] },

  // IPS
  { q: "Lambang negara Indonesia adalah...", a: "Garuda Pancasila", o: ["Garuda Pancasila", "Bhinneka Tunggal Ika", "Monumen Nasional", "Komodo"] },
  { q: "Bendera Indonesia berupa...", a: "merah putih", o: ["merah putih", "biru kuning", "hijau putih", "merah hitam"] },
  { q: "Benua tempat Indonesia berada adalah...", a: "Asia", o: ["Asia", "Eropa", "Afrika", "Australia"] },
  { q: "Puncak tertinggi di Indonesia adalah...", a: "Puncak Jaya", o: ["Puncak Jaya", "Gunung Semeru", "Gunung Rinjani", "Gunung Merapi"] },
  { q: "Ibu kota Provinsi Bali adalah...", a: "Denpasar", o: ["Denpasar", "Bandung", "Medan", "Makassar"] },
  { q: "Negara tetangga Indonesia di sebelah utara adalah...", a: "Malaysia", o: ["Malaysia", "Australia", "India", "Jepang"] },
  { q: "Hari kemerdekaan Indonesia jatuh pada tanggal...", a: "17 Agustus", o: ["17 Agustus", "1 Juni", "28 Oktober", "25 Desember"] },

  // Seni, logika, dan pengukuran
  { q: "Campuran warna kuning dan biru menghasilkan...", a: "hijau", o: ["hijau", "ungu", "jingga", "merah"] },
  { q: "Bentuk yang bulat dan tidak punya sudut adalah...", a: "lingkaran", o: ["lingkaran", "segitiga", "persegi", "jajar genjang"] },
  { q: "Alat musik yang dipetik contohnya...", a: "gitar", o: ["gitar", "drum", "biola", "suling"] },
  { q: "Jumlah sisi persegi panjang adalah...", a: "4", o: ["3", "4", "5", "6"] },
  { q: "Urutan hari setelah Rabu adalah...", a: "Kamis", o: ["Kamis", "Selasa", "Jumat", "Sabtu"] },
  { q: "1 liter sama dengan...", a: "1000 mililiter", o: ["100 mililiter", "1000 mililiter", "10000 mililiter", "10 mililiter"] },
  { q: "Satuan untuk mengukur berat benda adalah...", a: "kilogram", o: ["kilogram", "meter", "liter", "derajat"] },
  { q: "Setelah Merkurius dan Venus, planet berikutnya adalah...", a: "Bumi", o: ["Bumi", "Mars", "Jupiter", "Saturnus"] },
];

/** Kunci tanggal (YYYY-MM-DD) dipakai sebagai benih pengacakan harian. */
function kunciTanggal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Pilih lima soal untuk hari ini.
 *
 * Benihnya diambil dari tanggal, jadi:
 *  - semua anak pada hari yang sama menerima soal yang sama (adil),
 *  - tetapi besok soalnya sudah berbeda.
 */
function soalHarianHariIni() {
  const benih = kunciTanggal();
  return seededShuffle(SOAL_HARIAN, benih).slice(0, 5);
}

export const DAILY_CHALLENGE = {
  id: "daily",
  type: "mcq",
  name: "Misi Hari Ini",
  title: "Tantangan Harian",
  subtitle: "Lima soal dari semua pulau. Koin penuh setiap hari!",
  reward: 60,
  xp: 45,
  rounds: soalHarianHariIni(),
};
