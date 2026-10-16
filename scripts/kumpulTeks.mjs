// ============================================================
// Kumpulkan semua teks yang harus dibacakan Zippy
// ============================================================
//
// Jalankan:  node scripts/kumpulTeks.mjs
//
// Hasilnya ditulis ke scripts/.teksSoal.json sebagai daftar teks unik.
// Tahap berikutnya (generateAudio) mengubah tiap teks menjadi file audio
// berbahasa Indonesia dan membuat manifest.
//
// Modul di lib/ memakai ESM sementara package.json tidak menyetel
// "type": "module", jadi berkasnya disalin dulu ke .mjs sebelum diimpor.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const akar = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = join(akar, "scripts", ".tmp");
mkdirSync(tmp, { recursive: true });

// Dua modul ini tidak punya impor lokal, jadi cukup disalin apa adanya lalu
// diimpor secara dinamis. HARUS dinamis: impor statis dievaluasi sebelum badan
// berkas dijalankan, sehingga berkas .tmp belum sempat ditulis dan impornya
// akan gagal pada kali pertama skrip dijalankan.
for (const nama of ["bacaTeks", "petunjukHitung"]) {
  writeFileSync(
    join(tmp, `${nama}.mjs`),
    readFileSync(join(akar, "lib", `${nama}.js`), "utf8"),
    "utf8"
  );
}
const { keTeksBaca } = await import(pathToFileURL(join(tmp, "bacaTeks.mjs")).href);
const { PETUNJUK_HITUNG } = await import(pathToFileURL(join(tmp, "petunjukHitung.mjs")).href);

const tersalin = new Set();

/**
 * Salin satu modul dari lib/ ke .tmp dengan akhiran .mjs.
 *
 * package.json tidak menyetel "type": "module", jadi Node membaca .js sebagai
 * CommonJS dan akan menolak kata kunci `export`. Dengan akhiran .mjs Node
 * membacanya sebagai ES module tanpa mengubah struktur proyek.
 *
 * SEMUA impor lokal ikut ditulis ulang ke .mjs dan berkasnya ikut disalin,
 * secara rekursif. Sebelumnya hanya satu pasang impor yang diganti secara
 * manual (gameData -> missionsExtra), sehingga menambah satu pun impor baru ke
 * lib/gameData.js membuat skrip ini gagal dengan galat "Cannot find module"
 * yang membingungkan. Cara ini menghapus seluruh kelas kesalahan itu.
 *
 * @param nama      nama berkas di lib/ tanpa akhiran
 * @param gantian   pasang ganti eksplisit, masih didukung untuk kasus khusus
 * @returns {string} URL file:// menuju berkas .mjs hasil salinan
 */
function salinModul(nama, gantian = []) {
  const tujuan = join(tmp, `${nama}.mjs`);
  if (tersalin.has(nama)) return pathToFileURL(tujuan).href;

  let isi = readFileSync(join(akar, "lib", `${nama}.js`), "utf8");

  const lokal = new Set();
  const salin = (tanda) => (m, n) => {
    lokal.add(n);
    return `${tanda} "./${n}.mjs"`;
  };
  isi = isi.replace(/from\s+["']\.\/([\w-]+)\.js["']/g, salin("from"));
  isi = isi.replace(/import\s+["']\.\/([\w-]+)\.js["']/g, salin("import"));

  for (const [dari, ke] of gantian) isi = isi.split(dari).join(ke);

  writeFileSync(tujuan, isi, "utf8");
  tersalin.add(nama);

  for (const n of lokal) {
    // Berkas data (mis. .json) tidak disentuh karena tidak cocok pola di atas,
    // tapi tetap dijaga di sini kalau suatu saat ada impor lokal yang aneh.
    if (!tersalin.has(n) && existsSync(join(akar, "lib", `${n}.js`))) {
      salinModul(n);
    }
  }

  return pathToFileURL(tujuan).href;
}

salinModul("missionsExtra");
const { SOAL_HARIAN } = await import(salinModul("missionsExtra"));
const { MISSIONS } = await import(
  salinModul("gameData", [['"./missionsExtra.js"', '"./missionsExtra.mjs"']])
);
const { FAQ, JAWABAN_KOSONG, JAWABAN_TIDAK_TAHU } = await import(salinModul("zippyBrain"));
const { TEKS_CHAT } = await import(salinModul("chatTeks"));

// Instruksi untuk misi Hitung & Seret. Isinya berupa gambar sehingga tidak
// bisa diucapkan, jadi yang dibacakan adalah instruksinya saja.
//
// SELURUH varian dikumpulkan, bukan hanya yang pertama. Kalau cuma yang pertama
// yang terekam, tujuh kalimat sisanya akan jatuh ke suara bawaan perangkat dan
// kedengaran berbeda logatnya — persis masalah yang sedang diperbaiki.
const TEKS_TETAP = PETUNJUK_HITUNG;

function bersihkan(t) {
  return String(t || "")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}

// Kunci berkas audio. Perhitungannya hanya dilakukan di sini (saat generate),
// bukan di browser, supaya aplikasi tidak perlu menghitung hash saat jalan dan
// tetap bekerja walau diakses lewat http:// biasa dari hp.
function kunciTeks(teks) {
  return createHash("sha256").update(bersihkan(teks), "utf8").digest("hex").slice(0, 16);
}

const teksKeTipe = new Map();

function catat(teks, tipe) {
  // Dinormalisasi SEBELUM dihitung kuncinya: "10 - 5 = ?" menjadi
  // "10 kurang 5 sama dengan berapa?". Kunci manifest harus persis sama
  // dengan yang dihitung browser (lihat lib/audioSoal.js -> bersihkan), dan
  // di browser teks sudah dinormalisasi lebih dulu oleh useBacakanSoal.
  const t = bersihkan(keTeksBaca(teks));
  if (!t) return;
  if (!teksKeTipe.has(t)) teksKeTipe.set(t, new Set());
  teksKeTipe.get(t).add(tipe);
}

let jumlahSoal = 0;
for (const [slug, daftar] of Object.entries(MISSIONS)) {
  for (const misi of daftar) {
    const rounds = misi.rounds || [];
    jumlahSoal += rounds.length;
    for (const r of rounds) {
      switch (misi.type) {
        case "mcq":
        case "boss":
        case "blitz":
          catat(r.q, "q");
          catat(r.hint, "hint");
          break;
        case "scramble":
        case "order":
          // Yang dibacakan petunjuknya, bukan jawabannya, supaya anak tetap
          // harus berpikir sendiri.
          catat(r.hint, "hint");
          break;
        case "dragcount":
          // Tidak ada teks per soal; memakai instruksi tetap.
          break;
        default:
          break;
      }
    }
  }
}

for (const t of TEKS_TETAP) catat(t, "instruksi");

// SELURUH bank Tantangan Harian, bukan hanya lima soal yang dipilih untuk
// hari ini. Penyusunan `MISSIONS` di atas sudah menyentuh DAILY_CHALLENGE,
// tetapi isinya hanya hasil seededShuffle tanggal berjalan (5 dari 38) -
// lihat komentar SOAL_HARIAN di lib/missionsExtra.js. Tanpa blok ini,
// 33 soal sisanya tidak pernah punya rekaman dan besok anak mendengar
// suara perangkat, bukan suara Zippy.
for (const r of SOAL_HARIAN) {
  catat(r.q, "q");
  if (r.hint) catat(r.hint, "hint");
}

// Balasan ngobrol Zippy: sapaan, balasan tetap, dan seluruh isi FAQ otak
// lokal. Bagian ini yang membuat jawaban chat tetap berlogat Indonesia,
// sebab jawaban Gemini berbentuk bebas sehingga tidak bisa direkam lebih dulu.
for (const item of FAQ) catat(item.a, "faq");
catat(JAWABAN_KOSONG, "faq");
catat(JAWABAN_TIDAK_TAHU, "faq");
for (const t of TEKS_CHAT) catat(t, "chat");

const daftar = [...teksKeTipe.entries()]
  .map(([teks, tipe]) => ({ kunci: kunciTeks(teks), teks, tipe: [...tipe].sort() }))
  .sort((a, b) => a.kunci.localeCompare(b.kunci));

// Manifest: pemetaan teks -> kunci berkas. Aplikasi mengimpornya dari lib/
// supaya bisa tahu secara seketika apakah tersedia audio rekaman untuk sebuah
// soal, tanpa perlu permintaan jaringan atau penghitungan hash di browser.
const manifest = {};
for (const d of daftar) manifest[d.teks] = d.kunci;

writeFileSync(join(akar, "scripts", ".teksSoal.json"), JSON.stringify(daftar, null, 2), "utf8");
writeFileSync(
  join(akar, "lib", "audioManifest.json"),
  // Harus JSON murni tanpa komentar, karena webpack mengimpornya sebagai
  // modul JSON dan akan gagal memuat bila ada baris komentar.
  JSON.stringify({ versi: 1, jumlah: daftar.length, peta: manifest }, null, 0) + "\n",
  "utf8"
);

console.log(`Jumlah pulau/kunci: ${Object.keys(MISSIONS).length}`);
console.log(`Jumlah soal: ${jumlahSoal}`);
console.log(`Teks unik yang perlu dibacakan: ${daftar.length}`);
console.log(
  `  di antaranya: ${daftar.filter((d) => d.tipe.includes("faq")).length} jawaban chat, ` +
    `${daftar.filter((d) => d.tipe.includes("instruksi")).length} instruksi`
);
console.log(`Manifest ditulis ke lib/audioManifest.json`);
console.log(`Contoh:`, daftar.slice(0, 2).map((d) => d.teks));
