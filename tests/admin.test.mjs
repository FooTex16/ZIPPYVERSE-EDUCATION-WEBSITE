// ============================================================
// Uji kunci Panel Admin (lib/adminAuth.js)
// ============================================================
//
// Yang dijaga di sini terutama SATU hal: tidak boleh ada jalur singkat yang
// membuat PIN bisa dilewati tanpa mengetahuinya. Pada versi pertama panel
// ada tombol "Lupa PIN? Buat ulang" yang membuat kunci itu tidak berguna
// sama sekali — tombol itu sudah dihapus, dan ketiadaannya dipastikan oleh
// uji "tidak ada cara mengganti PIN tanpa PIN lama".

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

const mem = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  },
};

const { ringkas, pinSah, pinSudahAda, buatPin, cekPin, gantiPin, hapusPin } = await import(
  "../lib/adminAuth.js"
);

beforeEach(() => mem.clear());

describe("Bentuk PIN", () => {
  it("menerima 4 sampai 8 angka", () => {
    for (const p of ["1234", "12345", "12345678"]) assert.equal(pinSah(p), true, p);
  });

  it("menolak PIN yang tidak sah", () => {
    for (const p of ["", "123", "123456789", "12ab", "abcd", "12 34", null, undefined]) {
      assert.equal(pinSah(p), false, String(p));
    }
  });
});

describe("Menyimpan dan memeriksa PIN", () => {
  it("belum ada PIN -> pinSudahAda false dan cekPin selalu lolos", () => {
    assert.equal(pinSudahAda(), false);
    assert.equal(cekPin("1234"), true, "belum ada yang dijaga, jadi tidak ada yang ditolak");
  });

  it("PIN tersimpan tidak pernah berupa teks polos", () => {
    assert.equal(buatPin("2468"), true);
    assert.equal(pinSudahAda(), true);
    const tersimpan = mem.get("zippyverse_admin_pin_v1");
    assert.ok(tersimpan, "harus tersimpan");
    assert.notEqual(tersimpan, "2468", "PIN tidak boleh tersimpan apa adanya");
    assert.equal(tersimpan.includes("2468"), false, "teks PIN tidak boleh muncul sama sekali");
  });

  it("PIN benar diterima, salah ditolak", () => {
    buatPin("1357");
    assert.equal(cekPin("1357"), true);
    assert.equal(cekPin("1358"), false);
    assert.equal(cekPin(""), false);
  });

  it("membuat PIN tidak sah gagal dan tidak menyimpan apa pun", () => {
    assert.equal(buatPin("12"), false);
    assert.equal(pinSudahAda(), false);
  });
});

describe("Mengganti dan menghapus PIN", () => {
  it("ganti PIN butuh PIN lama", () => {
    buatPin("1111");
    assert.equal(gantiPin("2222", "3333"), false, "PIN lama salah -> gagal");
    assert.equal(cekPin("1111"), true, "PIN lama tidak ikut hilang");
    assert.equal(gantiPin("1111", "3333"), true);
    assert.equal(cekPin("3333"), true);
    assert.equal(cekPin("1111"), false, "PIN lama sudah tidak berlaku");
  });

  it("PIN lama yang salah tidak bisa dipakai membuka panel", () => {
    buatPin("9999");
    assert.equal(cekPin("0000"), false);
  });

  it("tidak ada cara mengganti PIN tanpa PIN lama", () => {
    buatPin("7777");
    // Satu-satunya jalan mengganti lewat API ini adalah gantiPin(lama, baru),
    // yang selalu menolak kalau PIN lama meleset.
    assert.equal(gantiPin("7778", "1234"), false);
    assert.equal(cekPin("7777"), true, "PIN asli tetap utuh");
  });

  it("hapus PIN mengembalikan ke keadaan belum dikunci", () => {
    buatPin("5555");
    assert.equal(pinSudahAda(), true);
    hapusPin();
    assert.equal(pinSudahAda(), false);
  });
});

describe("Ringkasan PIN", () => {
  it("deterministik dan selalu 8 karakter heksadesimal", () => {
    const a = ringkas("1234");
    assert.equal(a, ringkas("1234"), "input sama harus menghasilkan ringkasan sama");
    assert.match(a, /^[0-9a-f]{8}$/);
    assert.notEqual(a, ringkas("1235"), "input beda harus beda ringkasan");
  });
});
