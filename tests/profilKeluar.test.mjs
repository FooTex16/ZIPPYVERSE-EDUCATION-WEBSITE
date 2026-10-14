// ============================================================
// Uji akun Pendamping: keluar, masuk, dan pindah akun
// (lib/profil.js)
// ============================================================
//
// Lahir dari tiga laporan bug nyata, berurutan waktu:
//
//   1. "Saya sudah log out, lalu coba Mulai Bermain, tiba-tiba ke-login
//       akunnya lagi."
//      lepasProfil() tidak pernah menghapus sakelar `pendamping`.
//
//   2. "Saya sudah membuat akun anak, log out, lalu login lagi - kok anaknya
//       malah ke-reset?"
//      Perbaikan untuk (1) kelewatan: seluruh simpanan ikut dibuang.
//
//   3. "Di akun 1 saya buat anak ungkas dan ddd, lalu saya pindah ke akun
//       Pendamping lain - kenapa anaknya masih nyangkut?"
//      Perbaikan untuk (2) kelewatan: anak dipertahankan di POSISI TERATAS,
//      tetapi tidak pernah dicatat pemiliknya. Akibatnya anak akun pertama
//      mewarisi akun kedua.
//
// Jadi ketiganya saling menahan. Desain sekarang memenuhi ketiganya sekaligus
// dengan satu gagasan: posisi teratas hanya boleh diisi milik SATU akun, dan
// sisanya disimpan di "laci" `akun[pendampingId]`.
//
//   - keluar   -> anak dititipkan ke laci, posisi teratas dikosongkan
//   - masuk     -> anak milik akun itu diambil dari lacinya
//   - pindah    -> milik akun lama dititipkan DULU, baru milik akun baru diambil
//   - tamu      -> laci tidak pernah disentuh
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
const { lepasProfil, pasangProfil, mulaiTamu } = await import(
  "../lib/profil.js"
);

const KEY = "zippyverse_save_v1";

/** Pengguna Supabase untuk akun u-1. */
const U1 = { id: "u-1", email: "bunda@contoh.com" };
/** Akun Pendamping kedua, sengaja berbeda pemilik. */
const U2 = { id: "u-2", email: "ayah@contoh.com" };

const ANAK1 = [
  { id: "a1", nama: "Deka" },
  { id: "a2", nama: "Nara" },
];

/**
 * Tanam keadaan: akun u-1 menempel dengan DUA anak, satu di antaranya sedang
 * bermain, satu lagi sudah punya kemajuan di gudang.
 */
function tanamAkun() {
  mem.set(
    KEY,
    JSON.stringify({
      pendamping: { id: U1.id, email: U1.email },
      anakPemilik: U1.id,
      anak: ANAK1,
      anakAktif: "a1",
      // Nara (a2) sudah punya kemajuan di gudang
      simpanan: {
        a2: {
          nickname: "Nara",
          coins: 777,
          xp: 400,
          islands: { kata: { done: true, missions: {} } },
        },
      },
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
  it("MENGHAPUS sakelar pendamping - inti bug 'akun hidup lagi'", () => {
    tanamAkun();
    assert.ok(load().pendamping, "prasyarat: akun masih tertaut");

    const hasil = lepasProfil();

    assert.equal(hasil.pendamping, null, "pendamping harus ikut dihapus");
    assert.equal(
      load().pendamping,
      null,
      "harus tertulis ke localStorage, bukan cuma di memori"
    );
  });

  it("MENITIPKAN daftar anak ke laci milik akun - inti bug 'anaknya ke-reset'", () => {
    tanamAkun();
    const hasil = lepasProfil();

    assert.deepEqual(
      hasil.akun["u-1"].anak,
      ANAK1,
      "anak harus masuk laci supaya kembali begitu akun yang sama masuk lagi"
    );
    assert.deepEqual(
      load().akun["u-1"].anak,
      ANAK1,
      "lacinya juga harus tertulis ke localStorage"
    );
  });

  it("MENGANGKUT kemajuan anak yang sedang aktif ke laci sebelum lepas", () => {
    tanamAkun();
    const hasil = lepasProfil();
    const laci = hasil.akun["u-1"];

    // Deka (a1) tadinya ada di blob teratas; kalau tidak dipindah dulu,
    // kemajuannya hilang begitu blob dibuang.
    assert.ok(laci.simpanan.a1, "kemajuan Deka harus pindah ke simpanan.a1");
    assert.equal(laci.simpanan.a1.coins, 999, "koin Deka harus terselamatkan");
    assert.equal(laci.simpanan.a1.nickname, "Deka");
    assert.ok(laci.simpanan.a1.islands.angka, "kemajuan pulau Deka ikut");

    // Nara yang memang sudah di gudang tidak boleh rusak.
    assert.equal(laci.simpanan.a2.coins, 777, "kemajuan Nara harus utuh");
    assert.equal(laci.simpanan.a2.nickname, "Nara");
  });

  it("MENGOSONGKAN posisi teratas - tamu tidak mewarisi anak siapa pun", () => {
    tanamAkun();
    const hasil = lepasProfil();

    assert.deepEqual(hasil.anak, [], "posisi teratas harus kosong");
    assert.deepEqual(hasil.simpanan, {}, "gudang teratas harus kosong");
    assert.equal(hasil.anakAktif, null, "tidak boleh ada anak yang aktif");
    assert.equal(hasil.anakPemilik, null, "tidak ada pemilik yang menempel");
    assert.equal(hasil.coins, 0, "koin anak tidak boleh bocor ke tamu");
    assert.equal(hasil.xp, 0, "xp anak tidak boleh bocor ke tamu");
    assert.equal(hasil.playerId, null, "baris pemain lama harus dilepas");
    assert.deepEqual(hasil.islands, {}, "kemajuan pulau harus dikosongkan");
    assert.equal(hasil.nickname, "", "nama anak tidak boleh tertinggal");
    assert.deepEqual(
      hasil.equipped,
      emptySave().equipped,
      "kostum kembali awal"
    );
  });

  it("MASUK LAGI mengembalikan anak beserta seluruh kemajuannya", () => {
    tanamAkun();
    lepasProfil();

    const hasil = pasangProfil(U1);

    assert.deepEqual(hasil.anak, ANAK1, "anak harus kembali utuh");
    assert.equal(hasil.pendamping.id, U1.id);
    assert.equal(hasil.anakPemilik, U1.id);
    assert.equal(
      hasil.simpanan.a2.coins,
      777,
      "gudang kemajuan Nara harus ikut kembali"
    );
    assert.equal(hasil.simpanan.a1.coins, 999, "kemajuan Deka juga");
  });

  it("aman dipanggil berkali-kali (idempoten)", () => {
    tanamAkun();
    lepasProfil();
    lepasProfil();

    const hasil = pasangProfil(U1);
    assert.deepEqual(hasil.anak, ANAK1, "keluar dua kali tidak boleh mengurangi laci");
  });
});

// ============================================================
// B. MASUK DAN PINDAH AKUN  <- bug laporan ketiga
// ============================================================
describe("pasangProfil (masuk dan pindah akun)", () => {
  it("akun SAMA dipanggil ulang TIDAK menghapus anak yang baru ditambahkan", () => {
    // Pemanggilan terjadi setiap kali /daftar dibuka (pemulihan sesi).
    tanamAkun();
    pasangProfil(U1);

    // Keluarga baru saja menambah anak ketiga.
    const s = load();
    mem.set(
      KEY,
      JSON.stringify({ ...s, anak: [...ANAK1, { id: "a3", nama: "Rara" }] })
    );

    const hasil = pasangProfil(U1);
    assert.equal(hasil.anak.length, 3, "anak yang baru ditambah tidak boleh hilang");
    assert.equal(hasil.anak[2].nama, "Rara");
  });

  it("PINDAH ke akun lain: anak akun lama tidak ikut ke akun baru", () => {
    tanamAkun(); // u-1 dengan Deka + Nara

    const hasil = pasangProfil(U2);

    assert.deepEqual(hasil.anak, [], "akun u-2 tidak boleh melihat anak u-1");
    assert.deepEqual(hasil.simpanan, {}, "gudang u-1 juga tidak boleh bocor");
    assert.equal(hasil.pendamping.id, U2.id);
    assert.equal(hasil.anakPemilik, U2.id);
    // ...tetapi milik u-1 tetap aman di lacinya.
    assert.deepEqual(hasil.akun["u-1"].anak, ANAK1, "anak u-1 harus selamat");
    assert.equal(hasil.akun["u-1"].simpanan.a2.coins, 777);
  });

  it("PINDAH ke akun lain: kemajuan anak tidak ikut terbawa", () => {
    tanamAkun();

    const hasil = pasangProfil(U2);

    assert.equal(hasil.coins, 0, "koin Deka tidak boleh jadi milik u-2");
    assert.deepEqual(hasil.islands, {}, "pulau Deka tidak boleh jadi milik u-2");
    assert.equal(hasil.anakAktif, null, "tidak ada anak yang masih aktif");
  });

  it("KEMBALI ke akun pertama: anak-anaknya pulih seperti sediakala", () => {
    tanamAkun();
    pasangProfil(U2); // pindah ke u-2
    const hasil = pasangProfil(U1); // pindah balik

    assert.deepEqual(hasil.anak, ANAK1, "anak u-1 harus kembali");
    assert.equal(hasil.pendamping.id, U1.id);
    assert.equal(hasil.anakPemilik, U1.id);
    assert.equal(hasil.simpanan.a2.coins, 777, "gudang u-1 juga kembali");
    // Dan anak u-2 (kosong) tidak meninggalkan sampah di u-1.
    assert.equal(hasil.anak.some((a) => a.id === "u-2"), false);
  });

  it("tanpa akun yang menempel: langsung mengambil isi laci sendiri", () => {
    // Perangkat bersih (mis. sesi Supabase hidup tapi localStorage pernah
    // dibersihkan), lalu u-1 masuk - isinya masih tersimpan di laci.
    mem.set(
      KEY,
      JSON.stringify({
        ...emptySave(),
        akun: { "u-1": { anak: ANAK1, simpanan: { a2: { coins: 777 } } } },
      })
    );

    const hasil = pasangProfil(U1);
    assert.deepEqual(hasil.anak, ANAK1, "harus mengambil dari laci");
    assert.equal(hasil.simpanan.a2.coins, 777, "gudangnya juga harus terangkat");
  });

  it("laci akun LAIN tetap utuh setelah akun ini masuk", () => {
    tanamAkun();
    pasangProfil(U2);
    const hasil = pasangProfil(U1);

    assert.ok(hasil.akun["u-2"], "laci u-2 tidak boleh hilang");
    assert.deepEqual(hasil.akun["u-1"].anak, ANAK1, "laci u-1 juga");
  });

  it("menolak pengguna tanpa surel", () => {
    tanamAkun();
    const hasil = pasangProfil({ id: "x" });
    assert.deepEqual(
      hasil.anak,
      ANAK1,
      "tanpa surel tidak ada yang boleh berubah"
    );
  });

  it("menangani save lama yang belum punya anakPemilik", () => {
    // Save sebelum ada laci: `pendamping` ada, `anakPemilik` belum.
    const s = { ...emptySave(), pendamping: { id: U1.id, email: U1.email }, anak: ANAK1, simpanan: {} };
    mem.set(KEY, JSON.stringify(s));

    const hasil = pasangProfil(U1);
    assert.deepEqual(hasil.anak, ANAK1, "harus jatuh ke pendamping.id sebagai pemilik");
  });
});

// ============================================================
// C. BERMAIN SEBAGAI TAMU
// ============================================================
describe("mulaiTamu (Mulai Bermain tanpa akun)", () => {
  it("TIDAK MENYENTUH laci milik akun Pendamping", () => {
    tanamAkun();
    lepasProfil(); // anak-anak sudah berada di laci

    const hasil = mulaiTamu("Penjelajah Baru");

    assert.deepEqual(
      hasil.akun["u-1"].anak,
      ANAK1,
      "laci tidak boleh terbuang oleh mode tamu"
    );
    assert.equal(
      hasil.akun["u-1"].simpanan.a2.coins,
      777,
      "kemajuan anak di laci juga harus utuh"
    );
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
    // Kemajuannya tidak hilang: diangkat ke gudang teratas lebih dulu.
    // (Di sini belum ada laci karena lepasProfil() belum pernah dipanggil.)
    assert.equal(hasil.simpanan.a1.coins, 999, "kemajuan Deka harus terselamatkan");
    assert.deepEqual(hasil.anak, ANAK1, "daftar anak tetap utuh");
  });

  it("MEMPERTAHANKAN kemajuan tamu murni yang kembali bermain", () => {
    tanamAkun();
    lepasProfil(); // keluar dulu -> blob aktif bersih, anak-anak di laci

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
    assert.deepEqual(kedua.akun, pertama.akun, "laci tetap sama");
  });

  it("memberi nama bawaan bila nama kosong", () => {
    tanamAkun();
    assert.equal(mulaiTamu("").nickname, "Penjelajah");
    assert.equal(mulaiTamu("   ").nickname, "Penjelajah");
  });
});
