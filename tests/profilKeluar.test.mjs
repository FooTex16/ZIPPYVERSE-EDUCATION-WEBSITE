// ============================================================
// Uji jalur KELUAR AKUN dan MASUK SEBAGAI TAMU (lib/profil.js)
// ============================================================
//
// Lahir dari dua laporan bug nyata:
//
//   1. "Saya sudah log out, lalu coba Mulai Bermain, tiba-tiba ke-login
//       akunnya lagi."
//      Penyebab: lepasProfil() tidak pernah menghapus sakelar `pendamping`
//      dan halaman utama tidak memutus sesi Supabase.
//
//   2. "Saya sudah membuat akun anak, log out, lalu login lagi - kok anaknya
//       malah ke-reset? Seharusnya tampil halaman awal dan anak masih ada."
//      Penyebab: perbaikan untuk bug (1) kelewatan - seluruh simpanan ikut
//      dibuang, sehingga daftar anak ikut hilang.
//
// Jadi ada dua tuntutan yang saling menahan dan keduanya harus dipenuhi
// sekaligus:
//
//   A. Saat KELUAR, `pendamping` harus hilang (tamu tidak boleh dihitung
//      masuk), TETAPI daftar anak beserta kemajuannya harus SELAMAT.
//   B. Saat bermain sebagai TAMU, kemajuan anak tidak boleh diwarisi,
//      tetapi daftar anak tetap tidak boleh disentuh.
//
// Dijalankan dengan `npm test` memakai test runner bawaan Node.

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ---- Tiruan localStorage, dipasang sebelum modul dipakai ----
const mem = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  },
};

const { load, emptySave } = await import("../lib/store.js");
const { lepasProfil, mulaiTamu } = await import("../lib/profil.js");

const KEY = "zippyverse_save_v1";

/** Tanam keadaan: akun aktif dengan DUA anak, satu di antaranya sedang bermain. */
function tanamAkun() {
  mem.set(
    KEY,
    JSON.stringify({
      pendamping: { id: "u-1", email: "bunda@contoh.com" },
      anak: [
        { id: "a1", nama: "Deka" },
        { id: "a2", nama: "Nara" },
      ],
      anakAktif: "a1",
      // Nara (a2) sudah punya kemajuan di gudang
      simpanan: { a2: { nickname: "Nara", coins: 777, xp: 400, islands: { kata: { done: true, missions: {} } } } },
      // Blob aktif = milik Deka (a1), sedang bermain
      nickname: "Deka",
      playerId: "pid-lama",
      coins: 999,
      xp: 500,
      islands: { angka: { done: true, missions: { m1: 90 } } },
      costumes: ["default", "topi"],
      equipped: "topi",
    })
  );
}

// ============================================================
// A. KELUAR DARI AKUN
// ============================================================
describe("lepasProfil (keluar dari Akun Pendamping)", () => {
  it("MENGHAPUS sakelar pendamping - inilah inti bug 'akun hidup lagi'", () => {
    tanamAkun();
    assert.ok(load().pendamping, "prasyarat: akun masih tertaut");

    const hasil = lepasProfil();

    assert.equal(hasil.pendamping, null, "pendamping harus ikut dihapus");
    assert.equal(
      load().pendamping,
      null,
      "hasilnya juga harus tertulis ke localStorage, bukan cuma di memori"
    );
  });

  it("MEMPERTAHANKAN daftar anak - inilah inti bug 'anaknya ke-reset'", () => {
    tanamAkun();
    const hasil = lepasProfil();

    assert.deepEqual(
      hasil.anak,
      [
        { id: "a1", nama: "Deka" },
        { id: "a2", nama: "Nara" },
      ],
      "daftar anak harus utuh supaya kembali begitu orang tua masuk lagi"
    );
    assert.deepEqual(
      load().anak,
      [{ id: "a1", nama: "Deka" }, { id: "a2", nama: "Nara" }],
      "daftar anak harus ikut tertulis ke localStorage"
    );
  });

  it("MENGANGKAT kemajuan anak yang sedang aktif ke gudang sebelum lepas", () => {
    tanamAkun();
    const hasil = lepasProfil();

    // Deka (a1) tadinya ada di blob teratas; kalau tidak dipindah dulu,
    // kemajuannya hilang begitu blob dibuang.
    const gudangDeka = hasil.simpanan.a1;
    assert.ok(gudangDeka, "kemajuan Deka harus pindah ke simpanan.a1");
    assert.equal(gudangDeka.coins, 999, "koin Deka harus terselamatkan");
    assert.equal(gudangDeka.nickname, "Deka");
    assert.ok(gudangDeka.islands.angka, "kemajuan pulau Deka harus ikut");

    // Nara yang memang sudah di gudang tidak boleh rusak.
    assert.equal(hasil.simpanan.a2.coins, 777, "kemajuan Nara harus utuh");
    assert.equal(hasil.simpanan.a2.nickname, "Nara");
  });

  it("MENGOSONGKAN blob aktif - tamu tidak boleh mewarisi kemajuan anak", () => {
    tanamAkun();
    const hasil = lepasProfil();

    assert.equal(hasil.coins, 0, "koin anak tidak boleh bocor ke tamu");
    assert.equal(hasil.xp, 0, "xp anak tidak boleh bocor ke tamu");
    assert.equal(hasil.playerId, null, "baris pemain lama harus dilepas");
    assert.deepEqual(hasil.islands, {}, "kemajuan pulau harus dikosongkan");
    assert.equal(hasil.nickname, "", "nama anak tidak boleh tertinggal");
    assert.equal(hasil.anakAktif, null, "tidak boleh ada anak yang aktif");
    assert.deepEqual(hasil.equipped, emptySave().equipped, "kostum kembali awal");
  });

  it("aman dipanggil berkali-kali (idempoten)", () => {
    tanamAkun();
    const pertama = lepasProfil();
    const kedua = lepasProfil();

    assert.equal(kedua.pendamping, null);
    assert.deepEqual(kedua.anak, pertama.anak, "daftar anak tidak boleh berkurang");
    assert.deepEqual(kedua.simpanan, pertama.simpanan, "gudang tidak boleh berkurang");
  });
});

// ============================================================
// B. BERMAIN SEBAGAI TAMU
// ============================================================
describe("mulaiTamu (Mulai Bermain tanpa akun)", () => {
  it("MEMPERTAHANKAN daftar anak walaupun mode tamu dipakai", () => {
    tanamAkun();
    const hasil = mulaiTamu("Penjelajah Baru");

    assert.deepEqual(
      hasil.anak,
      [{ id: "a1", nama: "Deka" }, { id: "a2", nama: "Nara" }],
      "daftar anak TIDAK boleh dihapus oleh mode tamu"
    );
    assert.deepEqual(hasil.simpanan.a2, {
      nickname: "Nara",
      coins: 777,
      xp: 400,
      islands: { kata: { done: true, missions: {} } },
    }, "gudang kemajuan anak harus utuh");
  });

  it("melepas identitas akun supaya pemain benar-benar dihitung tamu", () => {
    tanamAkun();
    const hasil = mulaiTamu("Tamu Baru");

    assert.equal(hasil.pendamping, null, "sakelar akun harus null");
    assert.equal(hasil.anakAktif, null, "tidak boleh ada anak aktif");
    assert.equal(hasil.nickname, "Tamu Baru");
  });

  it("MENGOSONGKAN blob aktif - kemajuan anak tidak diwarisi tamu", () => {
    tanamAkun();
    const hasil = mulaiTamu("Tamu");

    assert.equal(hasil.coins, 0, "koin Deka tidak boleh dibawa tamu");
    assert.deepEqual(hasil.islands, {}, "pulau Deka tidak boleh dibawa tamu");
    // ...tetapi kemajuannya sudah tersimpan aman di gudang.
    assert.equal(hasil.simpanan.a1.coins, 999);
  });

  it("MEMPERTAHANKAN kemajuan tamu murni yang kembali bermain", () => {
    // Tamu yang belum pernah masuk akun: blob aktifnya miliknya sendiri.
    tanamAkun();
    lepasProfil(); // keluar dulu -> blob aktif bersih, anak-anak selamat

    const pertama = mulaiTamu("Budi");
    assert.equal(pertama.coins, 0);

    // Tamu bermain lalu mengumpulkan koin.
    mem.set(
      KEY,
      JSON.stringify({ ...pertama, coins: 120, islands: { coba: { done: true, missions: {} } } })
    );

    const kedua = mulaiTamu("Budi");
    assert.equal(kedua.coins, 120, "kemajuan tamu sendiri harus dipertahankan");
    assert.ok(kedua.islands.coba, "pulau tamu sendiri harus dipertahankan");
    assert.deepEqual(kedua.anak, pertama.anak, "daftar anak tetap utuh");
  });

  it("memberi nama bawaan bila nama kosong", () => {
    tanamAkun();
    assert.equal(mulaiTamu("").nickname, "Penjelajah");
    assert.equal(mulaiTamu("   ").nickname, "Penjelajah");
  });
});
