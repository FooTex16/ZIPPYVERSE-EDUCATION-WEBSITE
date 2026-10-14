// ============================================================
// Uji jalur KELUAR AKUN (lib/profil.js -> lepasProfil)
// ============================================================
//
// Lahir dari laporan bug nyata:
//
//   "Saya sudah log out dari Akun Pendamping, lalu saya coba Mulai
//    Bermain, kenapa tiba-tiba ke-login akunnya lagi?"
//
// Penyebabnya ada dua, dan keduanya dikunci oleh berkas ini supaya tidak
// muncul lagi:
//
//   1. lepasProfil() dulu hanya mengosongkan anak/anakAktif/simpanan,
//      tetapi SAKELAR `pendamping` tidak pernah dihapus. localStorage
//      masih menyimpan akun, sehingga begitu halaman dimuat ulang akunnya
//      hidup lagi sendiri.
//   2. Simpanan AKTIF dibiarkan utuh. Blob aktif saat keluar adalah milik
//      anak yang terakhir bermain, jadi tamu berikutnya mewarisi koin,
//      pulau, dan kostumnya - padahal tamu harus memulai dari nol.
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
const { lepasProfil } = await import("../lib/profil.js");

const KEY = "zippyverse_save_v1";

/** Tanam keadaan: akun aktif dengan satu anak yang sedang bermain. */
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
      simpanan: { a2: { nickname: "Nara", coins: 777, xp: 400 } },
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

describe("lepasProfil (keluar dari Akun Pendamping)", () => {
  it("MENGHAPUS sakelar pendamping - inilah inti bug 'akun hidup lagi'", () => {
    tanamAkun();
    assert.ok(load().pendamping, "prasyarat: akun masih tertaut");

    const hasil = lepasProfil();

    assert.equal(
      hasil.pendamping,
      null,
      "pendamping harus ikut dihapus, bukan hanya disembunyikan dari layar"
    );
    assert.equal(
      load().pendamping,
      null,
      "hasilnya juga harus tertulis ke localStorage, bukan cuma di memori"
    );
  });

  it("melepas seluruh kunci akun sekaligus", () => {
    tanamAkun();
    const hasil = lepasProfil();

    assert.deepEqual(hasil.anak, [], "daftar anak harus kosong");
    assert.equal(hasil.anakAktif, null, "anak aktif harus lepas");
    assert.deepEqual(hasil.simpanan, {}, "gudang simpanan anak harus kosong");

    const tersimpan = load();
    assert.deepEqual(tersimpan.anak, []);
    assert.equal(tersimpan.anakAktif, null);
    assert.deepEqual(tersimpan.simpanan, {});
  });

  it("MENGHAPUS simpanan aktif milik anak - tamu tidak boleh mewarisi", () => {
    tanamAkun();
    const sebelum = load();
    assert.equal(sebelum.coins, 999, "prasyarat: anak masih memegang 999 koin");

    const hasil = lepasProfil();

    assert.equal(hasil.coins, 0, "koin anak tidak boleh bocor ke tamu");
    assert.equal(hasil.xp, 0, "xp anak tidak boleh bocor ke tamu");
    assert.equal(hasil.playerId, null, "baris pemain lama harus dilepas");
    assert.deepEqual(hasil.islands, {}, "kemajuan pulau harus dikosongkan");
    assert.equal(hasil.nickname, "", "nama anak tidak boleh tertinggal");
    assert.deepEqual(hasil.equipped, emptySave().equipped, "kostum kembali awal");
  });

  it("mengembalikan simpanan persis seperti keadaan instalasi baru", () => {
    tanamAkun();
    const hasil = lepasProfil();
    assert.deepEqual(hasil, emptySave(), "harus sama dengan emptySave()");
  });

  it("aman dipanggil berkali-kali (idempoten)", () => {
    tanamAkun();
    lepasProfil();
    const kedua = lepasProfil();
    assert.deepEqual(kedua, emptySave());
    assert.equal(load().pendamping, null);
  });
});
