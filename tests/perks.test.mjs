// ============================================================
// Uji keistimewaan kostum + pengaturan konten Panel Admin
// ============================================================
//
// Dua hal yang dijaga berkas ini:
//
//  1. KONTRAK NOL. Kostum `default` (Penjelajah) tidak boleh mengubah angka
//     apa pun. Ini syarat supaya seluruh uji di tests/store.test.mjs — yang
//     memakai save tanpa `equipped` sehingga jatuh ke "default" — tetap lulus,
//     dan supaya anak baru tidak langsung dapat bonus.
//
//  2. Keistimewaan tiap kostum benar-benar mengubah angka yang diklaimnya,
//     dan tidak pernah bisa dipakai untuk menambang koin dari pulau yang
//     sudah tamat.

import { describe, it, beforeEach } from "node:test";
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
  load,
  completeMission,
  spendStamina,
  staminaInfo,
  claimDailyReward,
  rewardInfo,
  MAX_STAMINA,
  STAMINA_PER_MISSION,
  DAILY_REWARDS,
} = await import("../lib/store.js");

const { teksPerk, perkOf } = await import("../lib/costumePerks.js");
const {
  bacaConfig,
  tulisConfig,
  resetConfig,
  cocokDenganBawaan,
  CONFIG_BAWAAN,
} = await import("../lib/adminConfig.js");

const SIMPANAN = "zippyverse_save_v1";
const KONFIG = "zippyverse_admin_config_v1";

function simpan(raw) {
  mem.set(SIMPANAN, JSON.stringify(raw));
}
function baca() {
  return JSON.parse(mem.get(SIMPANAN));
}

beforeEach(() => {
  // Tiap uji mulai bersih: tidak ada save dan tidak ada pengaturan admin.
  mem.clear();
});

// ============================================================
// 1. Kontrak nol — kostum default tidak mengubah apa pun
// ============================================================
describe("Kontrak: kostum default tanpa efek", () => {
  it("koin misi tetap tepat 50", () => {
    simpan({ coins: 0, islands: {}, equipped: "default" });
    assert.equal(completeMission("angka", "a1", 50, 35, 6, {}).coins, 50);
  });

  it("XP misi tetap tepat 35", () => {
    simpan({ coins: 0, xp: 0, islands: {}, equipped: "default" });
    completeMission("angka", "a1", 50, 35, 6, {});
    assert.equal(baca().xp, 35);
  });

  it("energi per misi tetap 2", () => {
    simpan({ stamina: 20, staminaAt: Date.now(), equipped: "default" });
    assert.equal(spendStamina().value, 20 - STAMINA_PER_MISSION);
  });

  it("batas energi tetap 20", () => {
    simpan({ stamina: 0, staminaAt: Date.now(), equipped: "default" });
    assert.equal(staminaInfo().max, MAX_STAMINA);
    assert.equal(staminaInfo().max, 20);
  });

  it("hadiah harian hari ke-1 tetap tepat 50", () => {
    simpan({ coins: 0, rewardDate: null, rewardDay: 0, equipped: "default" });
    assert.equal(claimDailyReward().coins, 50);
  });

  it("daftar hadiah tidak berubah", () => {
    assert.deepEqual(bacaConfig().dailyRewards, [50, 75, 100, 125, 150, 200, 300]);
    assert.deepEqual(DAILY_REWARDS, [50, 75, 100, 125, 150, 200, 300]);
  });

  it("pengaturan awal dianggap sama dengan bawaan", () => {
    assert.equal(cocokDenganBawaan(), true);
  });
});

// ============================================================
// 2. Keistimewaan tiap kostum benar-benar mengubah angka
// ============================================================
describe("Keistimewaan kostum", () => {
  it("Mode Pintar (membaca): koin misi +10%", () => {
    simpan({ coins: 0, islands: {}, equipped: "membaca" });
    // 50 x 1.10 = 55
    assert.equal(completeMission("angka", "a1", 50, 35, 6, {}).coins, 55);
  });

  it("Mode Jelajah (samping): koin +30% dan XP +20%", () => {
    simpan({ coins: 0, xp: 0, islands: {}, equipped: "samping" });
    completeMission("angka", "a1", 50, 35, 6, {});
    assert.equal(baca().coins, 65, "50 x 1.30 = 65");
    assert.equal(baca().xp, 42, "35 x 1.20 = 42");
  });

  it("Mode Guru (menunjuk): XP misi +20%", () => {
    simpan({ coins: 0, xp: 0, islands: {}, equipped: "menunjuk" });
    completeMission("angka", "a1", 50, 35, 6, {});
    assert.equal(baca().coins, 50, "koin tidak ikut naik");
    assert.equal(baca().xp, 42);
  });

  it("Mode Party (merayakan): hadiah login +25 koin", () => {
    simpan({ coins: 0, rewardDate: null, rewardDay: 0, equipped: "merayakan" });
    assert.equal(claimDailyReward().coins, 75, "50 + 25");
    assert.equal(baca().coins, 75);
  });

  it("Mode Pemikir (berpikir): energi per misi cuma 1", () => {
    simpan({ stamina: 20, staminaAt: Date.now(), equipped: "berpikir" });
    assert.equal(spendStamina().value, 19);
  });

  it("Mode Turbo (berlari): batas energi naik ke 24", () => {
    // 22 tidak boleh dipangkas ke 20 lagi karena batas barunya 24.
    simpan({ stamina: 22, staminaAt: Date.now(), equipped: "berlari" });
    assert.equal(load().stamina, 22);
    assert.equal(staminaInfo({ stamina: 22, staminaAt: Date.now(), equipped: "berlari" }).max, 24);
  });

  it("Mode Melompat (melompat): energi pulih tiap 6 menit", () => {
    simpan({
      stamina: 10,
      staminaAt: Date.now() - 6 * 60 * 1000,
      equipped: "melompat",
    });
    assert.equal(load().stamina, 11, "6 menit sudah cukup untuk 1 poin");
  });

  it("Mode Melompat tetap butuh 8 menit bila memakai kostum biasa", () => {
    simpan({ stamina: 10, staminaAt: Date.now() - 6 * 60 * 1000, equipped: "default" });
    assert.equal(load().stamina, 10, "belum cukup waktu untuk kostum biasa");
  });

  it("setiap kostum punya kalimat keistimewaan, kecuali Penjelajah", () => {
    assert.equal(teksPerk("default"), null, "kostum awal tidak berbonus");
    for (const id of ["melompat", "merayakan", "menunjuk", "membaca", "berlari", "berpikir", "samping"]) {
      const t = teksPerk(id);
      assert.equal(typeof t, "string", `${id} harus punya teks`);
      assert.ok(t.length > 5, `${id} teksnya terlalu pendek`);
    }
  });

  it("id kostum yang tidak dikenal aman (tidak melempar galat)", () => {
    simpan({ coins: 0, islands: {}, equipped: "tidak-ada" });
    assert.equal(completeMission("angka", "a1", 50, 35, 6, {}).coins, 50);
    assert.deepEqual(perkOf("tidak-ada"), {});
  });
});

// ============================================================
// 3. Kostum tidak bisa dipakai menambang pulau yang sudah tamat
// ============================================================
describe("Kostum tidak menembus aturan koin", () => {
  it("pulau tamat tetap memberi 0 koin walau kostum berbonus", () => {
    simpan({
      coins: 100,
      equipped: "samping", // koin +30%
      islands: { sains: { done: true, missions: { s1: 6, s2: 6, s3: 6 } } },
    });
    const r = completeMission("sains", "s1", 50, 35, 9, {});
    assert.equal(r.coins, 0, "bonus tidak boleh mengubah aturan dasar");
    assert.equal(baca().coins, 100);
  });

  it("misi diulang tetap 30% sebelum dikalikan bonus", () => {
    simpan({
      coins: 0,
      equipped: "membaca", // koin +10%
      islands: { sains: { done: false, missions: { s1: 6 } } },
    });
    // 50 x 30% = 15, lalu x 1.10 = 16.5 -> dibulatkan 17 (bukan 55)
    const r = completeMission("sains", "s1", 50, 35, 7, {});
    assert.equal(r.coins, 17);
  });

  it("energi tidak pernah negatif walau biaya diubah admin", () => {
    tulisConfig({ staminaPerMission: 1 });
    simpan({ stamina: 0, staminaAt: Date.now(), equipped: "default" });
    const r = spendStamina();
    assert.equal(r.ok, false);
    assert.equal(r.reason, "habis");
    assert.equal(baca().stamina, 0, "stamina tidak jadi negatif");
    resetConfig();
  });
});

// ============================================================
// 4. Pengaturan konten lewat Panel Admin
// ============================================================
describe("Pengaturan konten", () => {
  it("mengubah hadiah harian langsung terbaca rewardInfo", () => {
    tulisConfig({ dailyRewards: [10, 20, 30, 40, 50, 60, 70] });
    simpan({ coins: 0, rewardDate: null, rewardDay: 0 });
    assert.equal(rewardInfo().amount, 10);
    assert.equal(claimDailyReward().coins, 10);
    assert.equal(bacaConfig().dailyRewards[6], 70);
  });

  it("mengubah batas energi langsung terbaca staminaInfo", () => {
    tulisConfig({ maxStamina: 50 });
    simpan({ stamina: 40, staminaAt: Date.now() });
    assert.equal(staminaInfo().max, 50);
    assert.equal(load().stamina, 40, "40 tidak dipangkas lagi ke 20");
  });

  it("mengubah waktu pulih langsung terbaca", () => {
    tulisConfig({ staminaRegenMenit: 1 });
    simpan({ stamina: 5, staminaAt: Date.now() - 60 * 1000 });
    assert.equal(load().stamina, 6);
  });

  it("nilai di luar batas dipangkas, bukan dipakai apa adanya", () => {
    // Negatif tidak boleh membuat energi tak terbatas atau tak berarti.
    tulisConfig({ maxStamina: -999 });
    assert.equal(bacaConfig().maxStamina, 1, "dipangkas ke batas bawah");
    tulisConfig({ maxStamina: 99999 });
    assert.equal(bacaConfig().maxStamina, 999, "dipangkas ke batas atas");
    // Harga kostum tidak boleh negatif (anak bisa dibayar untuk membeli).
    tulisConfig({ hargaKostum: { melompat: -500 } });
    assert.equal(bacaConfig().hargaKostum.melompat, 0);
  });

  it("konfigurasi rusak tidak merusak permainan", () => {
    mem.set(KONFIG, "ini bukan json {");
    assert.deepEqual(bacaConfig().dailyRewards, CONFIG_BAWAAN.dailyRewards);
    assert.equal(bacaConfig().maxStamina, CONFIG_BAWAAN.maxStamina);
  });

  it("konfigurasi salah tipe jatuh ke nilai bawaan", () => {
    tulisConfig({ maxStamina: "dua puluh", dailyRewards: "bukan-array" });
    assert.equal(bacaConfig().maxStamina, CONFIG_BAWAAN.maxStamina);
    assert.deepEqual(bacaConfig().dailyRewards, CONFIG_BAWAAN.dailyRewards);
  });

  it("reset mengembalikan persis ke bawaan", () => {
    tulisConfig({ maxStamina: 50, dailyRewards: [1, 2, 3, 4, 5, 6, 7] });
    assert.equal(cocokDenganBawaan(), false);
    resetConfig();
    assert.equal(cocokDenganBawaan(), true);
  });
});
