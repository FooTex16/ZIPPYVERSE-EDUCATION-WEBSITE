// ============================================================
// Uji unit pengacakan di lib/shuffle.js
// ============================================================
//
// Fungsi yang diuji paling penting untuk nilai edukasi situs ini:
// `shuffleOptions` menjamin jawaban benar TIDAK PERNAH berada di urutan
// pertama. Tanpa itu, anak cukup menghafal posisi "kiri atas" dan lulus
// semua soal tanpa membaca.

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { hashSeed, seededShuffle, shuffleOptions } from "../lib/shuffle.js";

const BENIH_ANGKA = [0, 1, 7, 42, 999, 123456789];
const BENIH_TEKS = ["a", "zippy", "2026-10-13", "Pulau Angka", ""];

// Beberapa bentuk opsi: 2, 3, 4, dan 5 pilihan.
const CONTOH_SOAL = [
  { o: ["benar", "salah"], a: "benar" },
  { o: ["salah1", "benar", "salah2", "salah3"], a: "benar" },
  { o: ["x", "y", "z"], a: "y" },
  { o: [1, 2, 3, 4, 5], a: 3 },
  { o: ["a", "b", "c", "d"], a: "d" },
];

describe("shuffleOptions — anti-tebak posisi", () => {
  it("jawaban benar TIDAK PERNAH berada di urutan pertama", () => {
    let uji = 0;
    for (const soal of CONTOH_SOAL) {
      for (const benih of [...BENIH_ANGKA, ...BENIH_TEKS]) {
        for (let i = 0; i < 10; i++) {
          const hasil = shuffleOptions(soal, `${benih}#${i}`);
          assert.notEqual(
            hasil[0],
            soal.a,
            `soal ${JSON.stringify(soal)} benih ${benih}#${i} -> ${JSON.stringify(hasil)}`
          );
          uji++;
        }
      }
    }
    // Jangan menebak angka: jumlahnya dihitung dari kombinasi yang benar-benar
    // diperiksa supaya tes ini tetap valid bila daftar soal/benih ditambah.
    const seharusnya =
      CONTOH_SOAL.length * (BENIH_ANGKA.length + BENIH_TEKS.length) * 10;
    assert.ok(
      uji >= seharusnya,
      `jumlah kombinasi diuji ${uji}, seharusnya minimal ${seharusnya}`
    );
  });

  it("semua opsi tetap utuh, tidak ada yang hilang atau ganda", () => {
    for (const soal of CONTOH_SOAL) {
      for (const benih of BENIH_TEKS) {
        const hasil = shuffleOptions(soal, benih);
        assert.equal(hasil.length, soal.o.length);
        assert.deepEqual([...hasil].sort(), [...soal.o].sort());
      }
    }
  });

  it("deterministik: benih sama selalu menghasilkan urutan sama", () => {
    const soal = CONTOH_SOAL[3];
    const pertama = shuffleOptions(soal, "tetap");
    for (let i = 0; i < 5; i++) {
      assert.deepEqual(shuffleOptions(soal, "tetap"), pertama);
    }
  });

  it("benih berbeda menghasilkan urutan berbeda", () => {
    const soal = { o: ["A", "B", "C", "D", "E", "F"], a: "A" };
    const kumpulan = new Set();
    for (let i = 0; i < 30; i++) kumpulan.add(JSON.stringify(shuffleOptions(soal, i)));
    assert.ok(kumpulan.size > 1, "harus ada variasi urutan antar benih");
  });

  it("larik opsi asli tidak ikut berubah", () => {
    const asli = ["A", "B", "C", "D"];
    const soal = { o: asli, a: "B" };
    shuffleOptions(soal, 5);
    assert.deepEqual(asli, ["A", "B", "C", "D"]);
    assert.equal(soal.o, asli, "properti o tetap menunjuk larik yang sama");
  });

  it("opsi berjumlah kurang dari 2 dikembalikan apa adanya", () => {
    assert.deepEqual(shuffleOptions({ o: ["satu"], a: "satu" }, 1), ["satu"]);
    assert.deepEqual(shuffleOptions({ o: [], a: "x" }, 1), []);
    assert.deepEqual(shuffleOptions({ o: undefined, a: undefined }, 1), []);
  });
});

describe("seededShuffle", () => {
  it("menghasilkan larik berisi elemen yang sama persis", () => {
    const asli = [1, 2, 3, 4, 5, 6, 7, 8];
    const hasil = seededShuffle(asli, "uji");
    assert.equal(hasil.length, asli.length);
    assert.deepEqual([...hasil].sort((a, b) => a - b), asli);
  });

  it("tidak mengubah larik yang diberikan", () => {
    const asli = [1, 2, 3, 4, 5];
    const salinan = [...asli];
    seededShuffle(asli, "apa pun");
    assert.deepEqual(asli, salinan);
  });

  it("benih berupa teks dan angka sama-sama bekerja", () => {
    assert.doesNotThrow(() => seededShuffle([1, 2, 3], "teks"));
    assert.doesNotThrow(() => seededShuffle([1, 2, 3], 99));
  });
});

describe("hashSeed", () => {
  it("konsisten untuk teks yang sama", () => {
    assert.equal(hashSeed("zippy"), hashSeed("zippy"));
  });

  it("berbeda untuk teks berbeda", () => {
    assert.notEqual(hashSeed("zippy"), hashSeed("verse"));
  });

  it("mengembalikan bilangan bulat tak negatif", () => {
    const h = hashSeed("Pulau Luminara");
    assert.ok(Number.isInteger(h));
    assert.ok(h >= 0);
  });
});
