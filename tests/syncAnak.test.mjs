// ============================================================
// Uji sinkronisasi daftar anak dengan awan (lib/syncAnak.js)
// ============================================================
//
// Yang dijaga di sini bukan kebahagiaan, melainkan satu-satunya cara
// fitur ini bisa merusak data pengguna: KEKOSONGAN TIDAK PERNAH BOLEH
// DIARTIKAN SEBAGAI "HAPUS SEMUA ANAK".
//
// Sinkronisasi menarik daftar dari awan lalu menerapkannya ke perangkat.
// Kalau daftar kosong diartikan sebagai "perangkat ini seharusnya kosong",
// maka satu kali Supabase tidak terjangkau, satu kali respons terpotong,
// atau satu kali tabel belum dibuat akan langsung menghapus seluruh anak
// keluarga - persis kerusakan yang sudah pernah terjadi pada akun ini.
//
// Karena itu uji pertama dan terpanjang ada pada aturan itu, dan uji-uji
// sisanya memastikan aturan lain tidak membelinya dengan mengorbankan
// keamanan akun (anak akun lain tidak boleh pernah tersentuh).
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

const { emptySave } = await import("../lib/store.js");
const { terapkanDaftarAwan } = await import("../lib/syncAnak.js");

/** Simpanan berisi dua anak beserta gudangnya, dipakai kebanyakan uji. */
function dasar() {
  return {
    ...emptySave(),
    pendamping: { id: "u-1", email: "bunda@contoh.com" },
    anakPemilik: "u-1",
    anak: [
      { id: "a1", nama: "Deka" },
      { id: "a2", nama: "Nara" },
    ],
    anakAktif: "a1",
    simpanan: {
      a1: { nickname: "Deka", coins: 999, islands: { angka: { done: true, missions: {} } } },
      a2: { nickname: "Nara", coins: 777 },
    },
    coins: 120,
    akun: { "u-9": { anak: [{ id: "x", nama: "AnakLain" }], simpanan: {} } },
  };
}

// ============================================================
// A. ATURAN UTAMA: kekosongan tidak pernah mengikis
// ============================================================
describe("terapkanDaftarAwan - kekosongan aman", () => {
  it("DAFTAR KOSONG tidak menghapus anak apa pun", () => {
    const s = dasar();

    const hasil = terapkanDaftarAwan(s, []);

    assert.equal(hasil, s, "harus mengembalikan simpanan yang sama, bukan yang baru");
    assert.equal(hasil.anak.length, 2, "kedua anak harus masih ada");
    assert.equal(hasil.simpanan.a1.coins, 999, "gudang kemajuan harus utuh");
  });

  it("daftar KOSONG tidak membuang anak walaupun waktunya tepat setelah ada perubahan", () => {
    const s = dasar();
    s.anak.push({ id: "a3", nama: "Rara" });

    const hasil = terapkanDaftarAwan(s, []);

    assert.equal(hasil.anak.length, 3, "anak baru yang belum sempat terkirim ikut aman");
  });

  it("bukan daftar (null / undefined / teks) dianggap 'tidak ada keputusan'", () => {
    const s = dasar();

    for (const jelek of [null, undefined, "kosong", 0, { nama: "Deka" }]) {
      const hasil = terapkanDaftarAwan(s, jelek);
      assert.equal(hasil.anak.length, 2, `input ${String(jelek)} tidak boleh menghapus`);
    }
  });

  it("anak AKTIF tidak pernah terhapus oleh daftar kosong", () => {
    const s = dasar();
    const hasil = terapkanDaftarAwan(s, []);

    assert.equal(hasil.anakAktif, "a1", "anak yang sedang bermain harus tetap aktif");
    assert.equal(hasil.coins, 120, "blob aktif tidak tersentuh");
  });
});

// ============================================================
// B. Menyerap anak yang ditambahkan pengelola
// ============================================================
describe("terapkanDaftarAwan - anak baru dari panel admin", () => {
  it("perangkat BERSIH langsung menerima seluruh anak awan", () => {
    const s = { ...emptySave(), pendamping: { id: "u-1", email: "x@y.z" } };

    const hasil = terapkanDaftarAwan(s, [
      { id: "uuid-1", nama: "Deka" },
      { id: "uuid-2", nama: "Nara" },
    ]);

    assert.equal(hasil.anak.length, 2);
    assert.deepEqual(hasil.anak[0], { id: "uuid-1", nama: "Deka" });
  });

  it("anak baru disisipkan, anak lama tidak dilepas", () => {
    const s = dasar();

    const hasil = terapkanDaftarAwan(s, [
      { id: "a1", nama: "Deka" },
      { id: "a2", nama: "Nara" },
      { id: "uuid-3", nama: "Rara" },
    ]);

    assert.equal(hasil.anak.length, 3, "anak baru harus masuk");
    assert.ok(
      hasil.anak.some((a) => a.id === "a1"),
      "anak lama tidak boleh terlempar keluar"
    );
    assert.equal(hasil.anak[2].nama, "Rara");
  });
});

// ============================================================
// C. Penghapusan dari panel admin ikut sampai ke perangkat
// ============================================================
describe("terapkanDaftarAwan - anak yang dihapus pengelola", () => {
  it("anak yang tidak ada di awan ikut terhapus", () => {
    const s = dasar();

    const hasil = terapkanDaftarAwan(s, [{ id: "a1", nama: "Deka" }]);

    assert.equal(hasil.anak.length, 1, "Nara sudah dihapus pengelola");
    assert.equal(hasil.anak[0].nama, "Deka");
  });

  it("gudang kemajuan anak terhapus ikut dibuang - tidak jadi sampah", () => {
    const s = dasar();

    // Nara (a2) dihapus pengelola, Deka (a1) tetap ada.
    const hasil = terapkanDaftarAwan(s, [{ id: "a1", nama: "Deka" }]);

    assert.ok(hasil.simpanan.a1, "gudang Deka yang selamat harus utuh");
    assert.equal(hasil.simpanan.a2, undefined, "gudang Nara harus ikut terhapus");
    assert.deepEqual(
      Object.keys(hasil.simpanan),
      ["a1"],
      "tidak boleh menyisakan kunci gudang yang sudah tak berpunya"
    );
  });

  it("anak AKTIF yang terhapus dilepas supaya tidak jadi bayangan", () => {
    const s = dasar(); // a1 (Deka) sedang aktif

    const hasil = terapkanDaftarAwan(s, [{ id: "a2", nama: "Nara" }]);

    assert.equal(hasil.anak.length, 1);
    assert.equal(hasil.anakAktif, null, "anak aktif sudah tidak ada di daftar");
  });

  it("anak aktif yang SELAMAT tetap dianggap aktif", () => {
    const s = dasar();

    const hasil = terapkanDaftarAwan(s, [{ id: "a1", nama: "Deka" }]);

    assert.equal(hasil.anakAktif, "a1", "Deka masih ada, jadi tetap aktif");
  });
});

// ============================================================
// D. Jembatan kecocokan: NAMA, bukan id
// ============================================================
describe("terapkanDaftarAwan - kecocokan berbasis nama", () => {
  it("id awan yang berbeda tidak membuat anak kembar", () => {
    // Id perangkat nanoid, id awan uuid - keduanya tidak pernah sama.
    const s = dasar();

    const hasil = terapkanDaftarAwan(s, [
      { id: "0f9c2a11-1111-4444-8888-111111111111", nama: "Deka" },
      { id: "0f9c2a11-2222-4444-8888-222222222222", nama: "Nara" },
    ]);

    assert.equal(hasil.anak.length, 2, "harus 2, bukan 4");
    assert.deepEqual(
      hasil.anak.map((a) => a.id),
      ["a1", "a2"],
      "id PERANGKAT yang dipertahankan, supaya gudang kemajuannya tidak terputus"
    );
  });

  it("gudang kemajuan anak yang cocok berdasarkan nama tetap terbaca", () => {
    const s = dasar();

    const hasil = terapkanDaftarAwan(s, [
      { id: "uuid-1", nama: "Deka" },
      { id: "uuid-2", nama: "Nara" },
    ]);

    assert.equal(hasil.simpanan.a1.coins, 999, "koin Deka tidak boleh terputus");
    assert.equal(hasil.simpanan.a2.coins, 777, "koin Nara juga");
    assert.equal(hasil.anakAktif, "a1", "anak yang sedang bermain juga");
  });
});

// ============================================================
// E. Akun lain tidak pernah tersentuh
// ============================================================
describe("terapkanDaftarAwan - tidak pernah melewati batas akun", () => {
  it("laci milik akun LAIN tidak ikut diubah", () => {
    const s = dasar();

    const hasil = terapkanDaftarAwan(s, [{ id: "a1", nama: "Deka" }]);

    assert.deepEqual(
      hasil.akun["u-9"].anak,
      [{ id: "x", nama: "AnakLain" }],
      "laci akun u-9 harus utuh walau daftar u-1 berkurang"
    );
  });

  it("sakelar `pendamping` tidak pernah berubah", () => {
    const s = dasar();

    const hasil = terapkanDaftarAwan(s, [{ id: "a1", nama: "Deka" }]);
    const kosong = terapkanDaftarAwan(s, []);

    assert.deepEqual(hasil.pendamping, s.pendamping, "akun harus tetap tertaut");
    assert.deepEqual(kosong.pendamping, s.pendamping, "baik penuh maupun kosong");
    assert.equal(hasil.anakPemilik, "u-1", "pemilik daftar juga tidak berubah");
  });

  it("mengembalikan referensi YANG SAMA bila tidak ada yang berubah", () => {
    const s = dasar();

    const hasil = terapkanDaftarAwan(s, [
      { id: "a1", nama: "Deka" },
      { id: "a2", nama: "Nara" },
    ]);

    assert.equal(
      hasil,
      s,
      "penulisan ulang localStorage tidak boleh terjadi tanpa perubahan nyata"
    );
  });

  it("simpanan anak yang SELAMAT tidak tercampur anak lain", () => {
    const s = dasar();

    const hasil = terapkanDaftarAwan(s, [{ id: "a2", nama: "Nara" }]);

    assert.equal(hasil.simpanan.a2.coins, 777, "milik Nara utuh");
    assert.equal(hasil.simpanan.a1, undefined, "milik Deka hilang menyusul penghapusannya");
  });
});
