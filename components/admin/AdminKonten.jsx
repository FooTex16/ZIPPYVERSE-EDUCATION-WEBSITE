"use client";

/**
 * Panel Admin — Pengaturan Konten
 *
 * Menyimpan angka-angka yang dulu ditulis mati di kode: harga kostum, hadiah
 * harian 7 hari, dan tiga nilai energi. Nilai gantinya disimpan di localStorage
 * perangkat ini lalu dibaca ulang oleh lib/store.js dan lib/gameData.js pada
 * setiap permainan berjalan.
 *
 * Catatan penting untuk admin:
 *   - Perubahan berlaku untuk PERANGKAT INI SAJA, bukan untuk semua pemain.
 *     Menyebarkannya ke semua pemain berarti mengubah nilai bawaan di
 *     lib/store.js dan membangun ulang aplikasi.
 *   - Semua nilai dibatasi rentang wajar oleh lib/adminConfig.js. Angka di
 *     luar batas dipangkas, bukan dipakai apa adanya, supaya panel tidak bisa
 *     membuat permainan tidak bisa dimainkan.
 *   - Uji di tests/perks.test.mjs mengunci perilaku ini.
 */

import { useEffect, useState } from "react";
import { Save, RotateCcw, Coins, Zap, ListOrdered } from "lucide-react";
import {
  bacaConfig,
  tulisConfig,
  resetConfig,
  cocokDenganBawaan,
  CONFIG_BAWAAN,
} from "@/lib/adminConfig";
import { daftarKostum } from "@/lib/gameData";
import { play } from "@/lib/sfx";

const HARI = ["Senin ke-1", "Hari 2", "Hari 3", "Hari 4", "Hari 5", "Hari 6", "Puncak"];

export default function AdminKonten() {
  const [cfg, setCfg] = useState(null);
  const [pesan, setPesan] = useState("");

  useEffect(() => {
    setCfg(bacaConfig());
  }, []);

  function umumkan(t) {
    setPesan(t);
    setTimeout(() => setPesan(""), 3200);
  }

  function ubah(patch) {
    setCfg((c) => ({ ...c, ...patch }));
  }

  function simpan() {
    const baru = tulisConfig(cfg);
    setCfg(baru);
    play("pop");
    umumkan("Pengaturan konten tersimpan dan langsung berlaku.");
  }

  function kembalikan() {
    if (!window.confirm("Kembalikan semua pengaturan konten ke nilai bawaan?")) return;
    resetConfig();
    setCfg(bacaConfig());
    play("pop");
    umumkan("Semua dikembalikan ke nilai bawaan.");
  }

  if (!cfg) return <p className="rounded-3xl bg-cream p-4 text-sm font-bold text-zippy-navy/70">Memuat pengaturan...</p>;

  const bersih = cocokDenganBawaan(cfg);
  const daftar = daftarKostum();

  return (
    <div className="space-y-4">
      {pesan && (
        <div className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-black text-emerald-800">
          {pesan}
        </div>
      )}

      <div
        className={`rounded-2xl px-4 py-3 text-xs font-bold leading-relaxed ${
          bersih ? "bg-white/85 text-zippy-navy/70" : "bg-amber-100 text-amber-900"
        }`}
      >
        {bersih
          ? "Semua pengaturan masih memakai nilai bawaan proyek."
          : "Sebagian pengaturan sudah berubah dari nilai bawaan. Perubahan hanya berlaku di perangkat ini."}
      </div>

      {/* Harga kostum */}
      <section className="rounded-3xl border-2 border-zippy-navy/10 bg-cream p-4 shadow-pop">
        <h3 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-zippy-navy sm:text-lg">
          <Coins className="h-5 w-5 text-zippy-yellow" strokeWidth={2.8} /> Harga Kostum
        </h3>
        <p className="mb-3 text-[11px] font-bold leading-relaxed text-zippy-navy/60">
          Harga 0 membuat kostum gratis. Keistimewaan tiap kostum tidak bisa diubah di
          sini — itu tertulis di lib/costumePerks.js.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {daftar.map((c) => (
            // `min-w-0` wajib ada. Tanpa itu item grid memakai `min-width:auto`
            // sehingga selnya membesar mengikuti teks terpanjang dan barisnya
            // terpotong keluar layar di HP 320 px.
            <label key={c.id} className="flex min-w-0 items-center gap-2 rounded-2xl bg-white p-2">
              <img src={c.img} alt="" className="h-10 w-10 shrink-0 object-contain" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-black text-zippy-navy">{c.name}</span>
                {c.perk && (
                  <span className="block truncate text-[10px] font-bold text-zippy-teal">{c.perk}</span>
                )}
              </span>
              <input
                type="number"
                min={0}
                max={99999}
                value={cfg.hargaKostum[c.id] ?? 0}
                onChange={(e) =>
                  ubah({ hargaKostum: { ...cfg.hargaKostum, [c.id]: e.target.value } })
                }
                className="w-16 shrink-0 rounded-xl border-2 border-zippy-navy/15 px-1.5 py-1.5 text-center text-sm font-black text-zippy-navy outline-none focus:border-zippy-teal sm:w-20"
              />
            </label>
          ))}
        </div>
      </section>

      {/* Hadiah harian */}
      <section className="rounded-3xl border-2 border-zippy-navy/10 bg-cream p-4 shadow-pop">
        <h3 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-zippy-navy sm:text-lg">
          <ListOrdered className="h-5 w-5 text-zippy-teal" strokeWidth={2.8} /> Hadiah Login Harian
        </h3>
        <p className="mb-3 text-[11px] font-bold leading-relaxed text-zippy-navy/60">
          Rangkaian 7 hari. Anak yang bolong sehari mulai lagi dari hari ke-1.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {cfg.dailyRewards.map((v, i) => (
            <label key={i} className="block rounded-2xl bg-white p-2">
              <span className="mb-1 block text-[10px] font-black text-zippy-navy/55">{HARI[i]}</span>
              <input
                type="number"
                min={0}
                max={9999}
                value={v}
                onChange={(e) => {
                  const next = [...cfg.dailyRewards];
                  next[i] = e.target.value;
                  ubah({ dailyRewards: next });
                }}
                className="w-full rounded-xl border-2 border-zippy-navy/15 px-2 py-1.5 text-center text-sm font-black text-zippy-navy outline-none focus:border-zippy-teal"
              />
            </label>
          ))}
        </div>
      </section>

      {/* Energi */}
      <section className="rounded-3xl border-2 border-zippy-navy/10 bg-cream p-4 shadow-pop">
        <h3 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-zippy-navy sm:text-lg">
          <Zap className="h-5 w-5 text-emerald-500" strokeWidth={2.8} /> Energi Bermain
        </h3>
        <p className="mb-3 text-[11px] font-bold leading-relaxed text-zippy-navy/60">
          Energi membatasi berapa lama anak bermain dalam satu sesi dan memaksa
          istirahat. Menurunkan batas membuat anak lebih cepat diminta berhenti.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <Isi label="Energi maksimal" nilai={cfg.maxStamina} min={1} max={999}
            ubah={(v) => ubah({ maxStamina: v })} />
          <Isi label="Energi per misi" nilai={cfg.staminaPerMission} min={0} max={99}
            ubah={(v) => ubah({ staminaPerMission: v })} />
          <Isi label="Menit per poin pulih" nilai={cfg.staminaRegenMenit} min={1} max={999}
            ubah={(v) => ubah({ staminaRegenMenit: v })} />
        </div>
      </section>

      {/* Aksi */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={simpan}
          className="btn-pop flex items-center gap-2 rounded-2xl bg-zippy-teal px-5 py-3 font-black text-white transition active:scale-95"
        >
          <Save className="h-5 w-5" strokeWidth={2.8} /> Simpan Pengaturan
        </button>
        <button
          onClick={kembalikan}
          className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-zippy-navy shadow-pop transition active:scale-95"
        >
          <RotateCcw className="h-5 w-5" strokeWidth={2.8} /> Kembalikan Bawaan
        </button>
      </div>

      <p className="rounded-2xl bg-white/85 p-3 text-[11px] font-bold leading-relaxed text-zippy-navy/65">
        Nilai bawaan proyek: energi maksimal <b>{CONFIG_BAWAAN.maxStamina}</b>, per misi{" "}
        <b>{CONFIG_BAWAAN.staminaPerMission}</b>, pulih tiap{" "}
        <b>{CONFIG_BAWAAN.staminaRegenMenit}</b> menit, hadiah harian{" "}
        <b>{CONFIG_BAWAAN.dailyRewards.join(" → ")}</b> koin.
      </p>
    </div>
  );
}

function Isi({ label, nilai, min, max, ubah }) {
  return (
    <label className="block rounded-2xl bg-white p-2">
      <span className="mb-1 block text-[10px] font-black text-zippy-navy/55">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={nilai}
        onChange={(e) => ubah(e.target.value)}
        className="w-full rounded-xl border-2 border-zippy-navy/15 px-2 py-1.5 text-center text-sm font-black text-zippy-navy outline-none focus:border-zippy-teal"
      />
    </label>
  );
}
