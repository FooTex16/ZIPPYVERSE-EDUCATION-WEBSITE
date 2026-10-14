// ============================================================
// Otak Cadangan Zippy
// Dipakai saat Gemini tidak tersedia (mis. demo tanpa internet).
// ============================================================

export const FAQ = [
  // ---------- Perkenalan ----------
  { t: ["halo", "hai", "hi", "hei", "hello", "pagi", "siang", "sore"], a: "Hai! Aku Zippy. Mau ngobrol atau main misi dulu?" },
  { t: ["nama kamu", "siapa kamu", "kamu siapa", "namamu"], a: "Aku Zippy, Si Penjelajah Ilmu dari Planet Luminara. Aku suka matematika dan petualangan!" },
  { t: ["luminara", "planet", "asal kamu"], a: "Planet Luminara adalah tempat asal aku. Semua pulau belajar ada di sana, dan sekarang kamu menjelajahnya!" },
  { t: ["terima kasih", "thanks", "makasih"], a: "Sama-sama! Kamu hebat banget hari ini." },

  // ---------- Matematika ----------
  { t: ["apa itu matematika", "matematika itu apa"], a: "Matematika adalah cara berpikir dengan angka. Dari situ kita bisa hitung, bandingkan, lalu memutuskan." },
  { t: ["perkalian", "kali", "mengali"], a: "Perkalian adalah penjumlahan berulang. Contohnya 3 x 4 berarti 4 dijumlahkan 3 kali, hasilnya 12." },
  { t: ["penjumlahan", "tambah"], a: "Penjumlahan menggabungkan dua kelompok. Contohnya 3 + 4 = 7." },
  { t: ["pengurangan", "kurang", "dikurangi"], a: "Pengurangan mengambil bagian dari kelompok. Contohnya 9 - 3 = 6." },
  { t: ["bilangan prima", "prima"], a: "Bilangan prima hanya punya dua pembagi, yaitu 1 dan dirinya sendiri. Contohnya 2, 3, 5, 7, dan 11." },
  { t: ["ganjil", "genap"], a: "Bilangan ganjil berakhir dengan 1, 3, 5, 7, atau 9. Bilangan genap berakhir dengan 0, 2, 4, 6, atau 8." },

  // ---------- Sains ----------
  { t: ["langit biru", "kenapa langit biru", "mengapa langit biru"], a: "Cahaya matahari punya banyak warna. Saat masuk ke udara, warna biru paling mudah bertebaran ke semua arah, jadi langit tampak biru." },
  { t: ["hujan", "kenapa hujan"], a: "Uap air naik ke langit lalu mendingin dan berubah menjadi tetesan air. Ketika sudah cukup berat, tetesan itu jatuh sebagai hujan." },
  { t: ["pelangi", "kenapa pelangi"], a: "Pelangi muncul saat cahaya matahari melewati tetesan air dan warnanya menjadi terpisah." },
  { t: ["bulan", "kenapa bulan"], a: "Bulan tidak punya cahaya sendiri. Ia terlihat terang karena memantulkan cahaya matahari." },
  { t: ["matahari", "kenapa matahari"], a: "Matahari adalah bintang terdekat dari bumi. Cahayanya membuat siang terang dan menghangatkan permukaan bumi." },
  { t: ["bintang", "kenapa bintang"], a: "Bintang adalah bola gas besar yang menyala sendiri. Jauh di luar angkasa sampai kelihatan diam dari bumi." },
  { t: ["awan", "kenapa awan"], a: "Awan adalah tetesan air dan kristal es yang melayang tinggi di langit." },
  { t: ["air", "kenapa air penting"], a: "Semua makhluk hidup butuh air. Air juga membuat tanah subur dan membantu tumbuhan tumbuh." },
  { t: ["tumbuhan", "daun hijau", "fotosintesis"], a: "Daun hijau memakai cahaya matahari, air, dan udara untuk membuat makanan. Prosesnya disebut fotosintesis." },
  { t: ["hewan", "binatang"], a: "Hewan punya kelebihan masing-masing. Kucing bisa melihat dalam gelap, dan kelelawar bisa mendengar suara sangat jauh." },
  { t: ["gunung", "kenapa gunung"], a: "Gunung terbentuk ketika bumi terdorong dari bagian dalam. Puncaknya sering ditutupi salju yang dingin." },
  { t: ["laut", "kenapa laut asin"], a: "Air hujan membawa mineral dari daratan ke laut. Mineral yang terkumpul bertahun-tahun membuat air laut terasa asin." },
  { t: ["tanah", "kenapa tanah subur"], a: "Tanah subur banyak mengandung bahan organik dari daun dan hewan yang membusuk di dalamnya." },
  { t: ["eksperimen", "sains", "ipa"], a: "Sains berarti mencari tahu kenapa sesuatu terjadi. Kamu bisa mulai dari mengamati, lalu menebak, lalu menguji." },
  { t: ["jantung", "denyut jantung"], a: "Jantungmu berdenyut sekitar 100.000 kali setiap hari. denyutnya tetap berjalan bahkan saat kamu tidur." },

  // ---------- Tentang ZippyVerse ----------
  { t: ["misi", "main apa", "bantuan", "help", "bantu"], a: "Di ZippyVerse ada 5 pulau. Coba mulai dari Pulau Angka, lalu selesaikan tiga misi di dalamnya!" },
  { t: ["koin", "koin bintang"], a: "Koin didapat setiap kali misi selesai. Tukar di Toko Kostum untuk tampilan Zippy yang baru." },
  { t: ["streak", "beruntun"], a: "Bermain setiap hari tanpa putus membuat streak naik. Makin panjang, makin besar hadiahnya!" },
  { t: ["kostum", "toko"], a: "Buka menu Toko di pojok kanan atas peta, lalu tukar koin dengan kostum Zippy favoritmu." },
  { t: ["bos", "gerhana zahra", "boss"], a: "Gerhana Zahra adalah bos di Pulau Angka. Kalah dia dengan lima jawaban benar!" },
  { t: ["level", "xp"], a: "Setiap misi memberi XP. Makin banyak XP, makin tinggi level penjelajahmu." },
  { t: ["orang tua", "mama", "papa", "ayah", "ibu", "ortu"], a: "Orang tua bisa melihat grafik belajar di menu Dasbor Orang Tua, termasuk waktu belajar dan ketepatan jawaban." },
  { t: ["iklan", "dilarang", "aman"], a: "ZippyVerse aman untuk anak. Tidak ada iklan, tidak ada percakapan random, dan tidak ada yang meminta data pribadimu." },

  // ---------- Emosi ----------
  { t: ["sedih", "galau", "kesal"], a: "Kalau sedih, boleh menarik napas dalam-dalam dulu. Istirahat sebentar, lalu coba misi ringan lagi ya." },
  { t: ["takut", "takutan", "cemas"], a: "Rasa takut itu wajar. Aku selalu di sini. Kita bisa mulai dari misi ringan supaya rasa percaya dirinya tumbuh lagi." },
  { t: ["senang", "bahagia"], a: "Aku juga senang! Setiap misi yang kamu selesaikan membuat planet Luminara makin terang." },
  { t: ["lelah", "capek", "bosan"], a: "Kalau bosan, istirahat 10 menit lalu kembali. Ingat, 10 menit fokus sama nilainya dengan 2 jam belajar sambil bosan." },
  { t: ["nilai", "ujian", "jujur", "bohong"], a: "Di ZippyVerse tidak ada nilai dan tidak ada ujian. Semua untuk belajar, jadi kamu bebas salah dan mencoba lagi." },
];

function score(msg, item) {
  let s = 0;
  for (const phrase of item.t) {
    if (msg.includes(phrase)) s += phrase.length;
  }
  return s;
}

// Balasan tetap di bawah diekspor supaya bisa ikut direkam jadi audio
// suara Indonesia oleh scripts/kumpulTeks.mjs.

/** Dipakai ketika pesan anak kosong. */
export const JAWABAN_KOSONG = "Kamu mau nanya apa, Sahabat?";

/** Dipakai ketika tidak ada FAQ yang cocok. */
export const JAWABAN_TIDAK_TAHU =
  "Hmm, aku belum tahu yang itu. Tapi aku tetap di sini! Coba tanya soal hitung, matematika, atau sains yang kamu suka.";

/**
 * Jawab pertanyaan anak memakai pengetahuan lokal.
 * Urutan: hitungan matematika, lalu pencocokan FAQ.
 *
 * @param {string} raw    pesan terbaru
 * @param {Array}  history riwayat percakapan sebelumnya [{from,text}]
 */
export function askZippy(raw, history = []) {
  const m = String(raw || "").toLowerCase().trim();
  if (!m) return JAWABAN_KOSONG;

  // Kata penunjuk waktu: pakai jawaban Zippy sebelumnya supaya tetap nyambung.
  const REFERRING = ["itu", "tadi", "yang tadi", "itu apa", "kenapa itu", "jelaskan itu", "terus"];
  if (history.length >= 2 && REFERRING.some((k) => m.includes(k))) {
    const lastZippy = [...history].reverse().find((x) => x?.from === "zippy" && x.text);
    if (lastZippy) {
      return `Tadi aku bilang begini ya: ${lastZippy.text} Mau tahu lebih lanjut?`;
    }
  }

  // Hitung matematika sederhana, contoh: "7 + 5"
  const calc = m.match(/(-?\d+)\s*(tambah|plus|\+|kurang|minus|-|kali|x|times)\s*(-?\d+)/);
  if (calc) {
    const x = parseInt(calc[1], 10);
    const y = parseInt(calc[3], 10);
    const op = calc[2];
    let res = null;
    if (["tambah", "plus", "+"].includes(op)) res = x + y;
    else if (["kurang", "minus", "-"].includes(op)) res = x - y;
    else if (["kali", "x", "times"].includes(op)) res = x * y;
    if (res !== null) {
      return `${x} ${op} ${y} = ${res}. Bagus sekali, kamu cepat! Coba soal berikutnya juga yuk?`;
    }
  }

  let best = null;
  let bestScore = 0;
  for (const item of FAQ) {
    const s = score(m, item);
    if (s > bestScore) {
      bestScore = s;
      best = item;
    }
  }
  if (best) return best.a;

  return JAWABAN_TIDAK_TAHU;
}