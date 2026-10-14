// ============================================================
// Uji unit logika permainan murni di lib/store.js
// ============================================================
//
// Dijalankan dengan `npm test` memakai test runner bawaan Node,
// jadi tidak ada dependensi tambahan sama sekali.
//
// lib/store.js dibaca langsung sebagai ES module. Karena berkasnya menyentuh
// `window.localStorage`, dipasang tiruan lebih dulu sebelum fungnya dipanggil.

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

const {
  MAX_STAMINA,
  STAMINA_PER_MISSION,
  STAMINA_REGEN_MS,
  DAILY_REWARDS,
  load,
  today,
  completeMission,
  spendStamina,
  staminaInfo,
  rewardInfo,
  claimDailyReward,
} = await import("../lib/store.js");

// ---- Peralatan bantu ----
function simpan(raw) {
  mem.set("zippyverse_save_v1", JSON.stringify(raw));
}
function baca() {
  return JSON.parse(mem.get("zippyverse_save_v1"));
}
/** Tanggal n hari yang lalu, format YYYY-MM-DD (sama seperti `today()`). */
function tanggalLalu(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// ============================================================
// Aturan koin
// ============================================================
describe("Aturan koin", () => {
  it("misi pertama memberi koin penuh", () => {
    simpan({ coins: 0, islands: {} });
    const r = completeMission("angka", "a1", 50, 35, 6, {});
    assert.equal(r.coins, 50);
    assert.equal(baca().coins, 50);
  });

  it("misi diulang hanya memberi 30 persen", () => {
    simpan({ coins: 0, islands: { sains: { done: false, missions: { s1: 6 } } } });
    const r = completeMission("sains", "s1", 50, 35, 7, {});
    assert.equal(r.coins, 15);
    assert.equal(baca().coins, 15);
  });

  it("pulau yang sudah tamat tidak memberi koin lagi", () => {
    simpan({
      coins: 0,
      islands: { sains: { done: true, missions: { s1: 6, s2: 6, s3: 6 } } },
    });
    const r = completeMission("sains", "s1", 50, 35, 9, {});
    assert.equal(r.coins, 0);
    assert.equal(baca().coins, 0);
  });

  it("Tantangan Harian penuh sekali lalu nol untuk hari yang sama", () => {
    simpan({ coins: 0, islands: {} });
    const pertama = completeMission("harian", "daily", 60, 45, 5, { daily: true });
    assert.equal(pertama.coins, 60);
    const kedua = completeMission("harian", "daily", 60, 45, 5, { daily: true });
    assert.equal(kedua.coins, 0);
    assert.equal(baca().coins, 60);
  });

  it("XP tetap bertambah walau koin nol", () => {
    simpan({
      coins: 0,
      xp: 0,
      islands: { sains: { done: true, missions: { s1: 6, s2: 6, s3: 6 } } },
    });
    completeMission("sains", "s1", 50, 35, 9, {});
    assert.equal(baca().coins, 0);
    assert.equal(baca().xp, 35);
  });
});

// ============================================================
// Status pulau "tamat"  (temuan F-02)
// ============================================================
describe("Status pulau tamat (F-02)", () => {
  it("tiga misi dengan skor 0 TIDAK membuat pulau tamat", () => {
    simpan({ islands: {} });
    [0, 0, 0].forEach((s, i) => completeMission("angka", `m${i + 1}`, 30, 20, s, {}));
    const isl = baca().islands.angka;
    assert.equal(isl.done, false, "pulau tidak boleh terkunci saat skor 0");
    assert.equal(Object.keys(isl.missions).length, 3, "ketiga kunci tetap tercatat");
  });

  it("skor 0 bercampur skor positif tetap belum tamat", () => {
    simpan({ islands: {} });
    [5, 0, 3].forEach((s, i) => completeMission("angka", `m${i + 1}`, 30, 20, s, {}));
    assert.equal(baca().islands.angka.done, false);
  });

  it("tiga misi dengan skor positif membuat pulau tamat", () => {
    simpan({ islands: {} });
    [5, 3, 8].forEach((s, i) => completeMission("angka", `m${i + 1}`, 30, 20, s, {}));
    assert.equal(baca().islands.angka.done, true);
  });

  it("baru dua misi selesai belum tamat", () => {
    simpan({ islands: {} });
    [8, 8].forEach((s, i) => completeMission("angka", `m${i + 1}`, 30, 20, s, {}));
    assert.equal(baca().islands.angka.done, false);
  });

  it("skor 1 tiap misi sudah cukup dianggap selesai", () => {
    simpan({ islands: {} });
    [1, 1, 1].forEach((s, i) => completeMission("angka", `m${i + 1}`, 30, 20, s, {}));
    assert.equal(baca().islands.angka.done, true);
  });

  it("save lama yang sudah done tetap done (kemajuan tidak hilang)", () => {
    simpan({
      coins: 120,
      islands: { angka: { done: true, missions: { a1: 0, a2: 0, a3: 0 } } },
    });
    const r = completeMission("angka", "a1", 50, 35, 9, {});
    assert.equal(baca().islands.angka.done, true, "done tidak pernah diturunkan");
    assert.equal(r.coins, 0, "pulau lama yang tamat tetap tanpa koin");
    assert.equal(baca().coins, 120);
  });
});

// ============================================================
// Stamina
// ============================================================
describe("Stamina", () => {
  it("awal penuh dan diperbolehkan bermain", () => {
    simpan({ stamina: MAX_STAMINA, staminaAt: Date.now() });
    const info = staminaInfo();
    assert.equal(info.value, MAX_STAMINA);
    assert.equal(info.canPlay, true);
    assert.equal(info.nextMs, 0, "stamina penuh tidak perlu menunggu");
  });

  it("memulai satu misi mengurangi stamina sebesar 2", () => {
    simpan({ stamina: 20, staminaAt: Date.now() });
    const r = spendStamina();
    assert.equal(r.ok, true);
    assert.equal(r.value, 20 - STAMINA_PER_MISSION);
    assert.equal(baca().stamina, 18);
  });

  it("stamina habis menolak dengan alasan habis", () => {
    simpan({ stamina: 0, staminaAt: Date.now() });
    const r = spendStamina();
    assert.equal(r.ok, false);
    assert.equal(r.reason, "habis");
    assert.equal(baca().stamina, 0, "stamina tidak jadi negatif");
  });

  it("canPlay false bila stamina kurang dari biaya misi", () => {
    const info = staminaInfo({ stamina: 1, staminaAt: Date.now() });
    assert.equal(info.canPlay, false);
  });

  it("stamina pulih 1 poin setelah satu masa regenerasi", () => {
    simpan({ stamina: 10, staminaAt: Date.now() - STAMINA_REGEN_MS });
    assert.equal(load().stamina, 11);
  });

  it("stamina tidak melebihi batas maksimum", () => {
    simpan({ stamina: 19, staminaAt: Date.now() - STAMINA_REGEN_MS * 5 });
    assert.equal(load().stamina, MAX_STAMINA);
  });
});

// ============================================================
// Hadiah harian
// ============================================================
describe("Hadiah harian", () => {
  it("urutan hadiah sesuai kontrak 7 hari", () => {
    assert.deepEqual(DAILY_REWARDS, [50, 75, 100, 125, 150, 200, 300]);
    assert.equal(DAILY_REWARDS.length, 7);
  });

  it("belum pernah klaim -> bisa diklaim hari ke-1 senilai 50", () => {
    simpan({ coins: 0, rewardDate: null, rewardDay: 0 });
    const info = rewardInfo();
    assert.equal(info.claimable, true);
    assert.equal(info.day, 1);
    assert.equal(info.amount, 50);
  });

  it("klaim benar-benar menambah koin dan mencatat tanggal", () => {
    simpan({ coins: 120, rewardDate: null, rewardDay: 0 });
    const r = claimDailyReward();
    assert.equal(r.coins, 50);
    assert.equal(r.already, false);
    assert.equal(baca().coins, 170);
    assert.equal(baca().rewardDate, today());
    assert.equal(baca().rewardDay, 1);
  });

  it("klaim kedua pada hari yang sama memberi nol", () => {
    simpan({ coins: 0, rewardDate: null, rewardDay: 0 });
    claimDailyReward();
    const koinSetelahPertama = baca().coins;
    const r = claimDailyReward();
    assert.equal(r.coins, 0);
    assert.equal(r.already, true);
    assert.equal(baca().coins, koinSetelahPertama, "koin tidak bertambah dua kali");
    assert.equal(rewardInfo().claimable, false);
  });

  it("hari berikutnya naik ke hari ke-2 senilai 75", () => {
    simpan({ rewardDate: tanggalLalu(1), rewardDay: 1 });
    const info = rewardInfo();
    assert.equal(info.claimable, true);
    assert.equal(info.day, 2);
    assert.equal(info.amount, 75);
  });

  it("bolong lebih dari sehari mereset rangkaian ke hari ke-1", () => {
    simpan({ rewardDate: tanggalLalu(3), rewardDay: 5 });
    const info = rewardInfo();
    assert.equal(info.day, 1);
    assert.equal(info.amount, 50);
    assert.equal(info.progress, 0);
  });

  it("rangkaian berputar kembali setelah hari ke-7", () => {
    simpan({ rewardDate: tanggalLalu(1), rewardDay: 7 });
    const info = rewardInfo();
    assert.equal(info.day, 1);
    assert.equal(info.amount, 50);
  });
});
