// ============================================================
// Uji normalisasi teks siap ucap + pemilihan petunjuk Hitung & Seret
// ============================================================
//
// Dua hal yang dijaga berkas ini:
//
//  1. Soal matematika harus terbaca dengan KATA yang benar. Ini bug asli yang
//     dilaporkan: "10 - 5 = ?" terdengar "sepuluh ... lima" tanpa kata
//     "kurang", dan "10 + 5 = ?" terdengar "sepuluh oh lima" tanpa kata
//     "tambah". Kunci manifest juga harus cocok dengan yang dihitung browser,
//     kalau tidak rekaman tidak ketemu dan suara jatuh ke pembaca bawaan
//     perangkat yang berlogat asing.
//
//  2. Tanda hubung di dalam KATA BIASA tidak boleh tersentuh. Tanpa syarat
//     "harus ada angka di kedua sisi", kalimat seperti "paru-paru" bisa
//     berubah menjadi "paru kurang paru".

import { describe, it } from "node:test";
import assert from "node:assert/strict";

const { keTeksBaca, perluDibaca } = await import("../lib/bacaTeks.js");
const { PETUNJUK_HITUNG, petunjukUntuk, jedaHash } = await import(
  "../lib/petunjukHitung.js"
);

// ============================================================
// 1. Operator aritmetika
// ============================================================
describe("keTeksBaca: operator aritmetika", () => {
  it("tanda tambah menjadi kata 'tambah'", () => {
    // Bug yang dilaporkan: terdengar "sepuluh oh lima".
    assert.equal(keTeksBaca("10 + 5 = ?"), "10 tambah 5 sama dengan berapa?");
    assert.equal(keTeksBaca("3 + 4 = ?"), "3 tambah 4 sama dengan berapa?");
    assert.equal(keTeksBaca("10 + 10 = ?"), "10 tambah 10 sama dengan berapa?");
  });

  it("tanda kurang menjadi kata 'kurang'", () => {
    // Bug yang dilaporkan: terdengar "sepuluh ... lima" tanpa 'kurang'.
    assert.equal(keTeksBaca("10 - 5 = ?"), "10 kurang 5 sama dengan berapa?");
    assert.equal(keTeksBaca("15 - 10 = ?"), "15 kurang 10 sama dengan berapa?");
    assert.equal(keTeksBaca("20 - 8 = ?"), "20 kurang 8 sama dengan berapa?");
  });

  it("kali dan bagi menjadi kata", () => {
    assert.equal(keTeksBaca("3 x 4 = ?"), "3 kali 4 sama dengan berapa?");
    assert.equal(keTeksBaca("2 x 5 = ?"), "2 kali 5 sama dengan berapa?");
    assert.equal(keTeksBaca("7 x 2 = ?"), "7 kali 2 sama dengan berapa?");
    assert.equal(keTeksBaca("Luas 3 x 4 meter"), "Luas 3 kali 4 meter");
    assert.equal(keTeksBaca("12 ÷ 4 = ?"), "12 dibagi 4 sama dengan berapa?");
  });

  it("pertanyaan bos tanpa '=' tetap mendapat kata 'kurang'", () => {
    assert.equal(
      keTeksBaca("GERBANG PEMERTAHANAN! Berapa 25 - 13?"),
      "GERBANG PEMERTAHANAN! Berapa 25 kurang 13?"
    );
  });

  it("('= ?' menjadi pertanyaan sungguhan, bukan diam di ujung)", () => {
    // Tanpa ini anak mendengar "... sama dengan" lalu hening, tanpa diminta
    // menyebut hasilnya.
    const hasil = keTeksBaca("5 + 8 = ?");
    assert.ok(hasil.endsWith("berapa?"), `harus berakhir 'berapa?': ${hasil}`);
    assert.equal(hasil.includes("="), false, "sisa tanda '=' tidak boleh tersisa");
    assert.equal(hasil.includes("?"), true);
  });
});

// ============================================================
// 2. Tidak merusak teks biasa
// ============================================================
describe("keTeksBaca: teks biasa tidak tersentuh", () => {
  const utuh = [
    "Hewan bernapas menggunakan paru-paru.",
    "Suku kata pada kata 'sekolah' ada berapa?",
    "se - ko - lah.",
    "Kami beranak-pinak.",
    "Ibu kota Indonesia adalah...",
    "Antonim kata 'tinggi' adalah...",
    "Indonesia terdiri dari beribu-ribu...",
    "Hitung bendanya di kotak, lalu seret angka yang benar ke jembatan.",
    "Tunggu, ini contoh teks yang mengandung tanda hubung saja.",
  ];

  for (const t of utuh) {
    it(`tidak berubah: ${t.slice(0, 40)}`, () => {
      assert.equal(keTeksBaca(t), t);
      assert.equal(perluDibaca(t), false);
    });
  }

  it("kata biasa yang diapit angka pun tidak tersentuh", () => {
    // "ke-3" tidak punya angka di sisi kiri tanda hubung.
    assert.equal(keTeksBaca("Langkah ke-3 selesai"), "Langkah ke-3 selesai");
  });

  it("nilai kosong tidak membuat galat", () => {
    assert.equal(keTeksBaca(""), "");
    assert.equal(keTeksBaca(null), "");
    assert.equal(keTeksBaca(undefined), "");
  });
});

// ============================================================
// 3. Idempoten — syarat supaya kunci manifest tetap cocok
// ============================================================
describe("keTeksBaca: idempoten", () => {
  const kasus = [
    "10 - 5 = ?",
    "3 + 4 = ?",
    "3 x 4 = ?",
    "GERBANG PEMERTAHANAN! Berapa 25 - 13?",
    "paru-paru",
    "Biasa saja",
  ];

  for (const t of kasus) {
    it(`sekali dan dua kali hasilnya sama: ${t}`, () => {
      const sekali = keTeksBaca(t);
      assert.equal(keTeksBaca(sekali), sekali, "harus idempoten");
    });
  }

  it("perluDibaca menandai hanya teks yang benar-benar berubah", () => {
    assert.equal(perluDibaca("10 - 5 = ?"), true);
    assert.equal(perluDibaca("10 kurang 5 sama dengan berapa?"), false);
    assert.equal(perluDibaca("paru-paru"), false);
  });
});

// ============================================================
// 4. Varian petunjuk Hitung & Seret
// ============================================================
describe("petunjukHitung", () => {
  it("ada lebih dari satu pilihan (bukan kalimat tetap lagi)", () => {
    assert.ok(
      PETUNJUK_HITUNG.length >= 5,
      `hanya ${PETUNJUK_HITUNG.length} varian`
    );
  });

  it("semua varian tidak kosong dan tidak sama satu sama lain", () => {
    for (const t of PETUNJUK_HITUNG) {
      assert.equal(typeof t, "string");
      assert.ok(t.trim().length > 20, `terlalu pendek: ${t}`);
    }
    assert.equal(
      new Set(PETUNJUK_HITUNG).size,
      PETUNJUK_HITUNG.length,
      "ada varian kembar"
    );
  });

  it("tidak ada varian yang membocorkan jawaban", () => {
    // Instruksi hanya boleh menyuruh menghitung dan menyeret.
    for (const t of PETUNJUK_HITUNG) {
      assert.equal(/\bjawaban(ya)? (adalah|itu) \d/i.test(t), false, t);
    }
  });

  it("deterministik: judul dan ronde sama selalu menghasilkan kalimat sama", () => {
    const a = petunjukUntuk("Jembatan Berry", 0);
    const b = petunjukUntuk("Jembatan Berry", 0);
    assert.equal(a, b, "harus stabil antar render/hydration");
  });

  it("berganti pada tiap ronde", () => {
    const dipakai = new Set();
    for (let r = 0; r < PETUNJUK_HITUNG.length; r++) {
      dipakai.add(petunjukUntuk("Jembatan Berry", r));
    }
    assert.ok(
      dipakai.size > 1,
      "ronde berbeda seharusnya mendapat kalimat berbeda"
    );
  });

  it("judul berbeda membuka dengan kalimat berbeda", () => {
    const judul = [
      "Jembatan Berry",
      "Tantangan Kilat",
      "Menara Kata",
      "Bos Gerhana Zahra",
      "Ruang Seni",
    ];
    const dibuka = new Set(judul.map((j) => petunjukUntuk(j, 0)));
    assert.ok(
      dibuka.size > 1,
      "seharusnya tidak semua misi membuka dengan kalimat yang sama"
    );
  });

  it("selalu mengembalikan teks dari daftar resmi", () => {
    for (const j of ["Jembatan Berry", "abc", ""]) {
      for (let r = 0; r < 12; r++) {
        assert.ok(PETUNJUK_HITUNG.includes(petunjukUntuk(j, r)));
      }
    }
  });

  it("ronde negatif atau bukan angka tidak membuat galat", () => {
    const t = petunjukUntuk("Jembatan Berry", -3);
    assert.ok(PETUNJUK_HITUNG.includes(t));
    assert.ok(PETUNJUK_HITUNG.includes(petunjukUntuk("X", NaN)));
  });

  it("jedaHash memberi nilai stabil dan terbatas", () => {
    assert.equal(jedaHash("abc"), jedaHash("abc"));
    assert.notEqual(jedaHash("abc"), jedaHash("abd"));
    assert.ok(jedaHash("Jembatan Berry") >= 0);
  });
});
