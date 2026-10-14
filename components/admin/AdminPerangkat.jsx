"use client";

/**
 * Panel Admin — Data Perangkat
 *
 * Mengelola save yang tersimpan di localStorage browser INI. Tidak menyentuh
 * database, jadi tindakan di sini hanya berdampak pada pemain yang memakai
 * perangkat ini.
 *
 * Setiap perubahan ditulis lewat `update()` dari lib/store.js supaya
 * normalisasi dan pengisian ulang energi tetap berjalan, dan supaya halaman
 * lain yang sedang terbuka tidak menyimpan angka usang di kepalanya.
 */

import { useEffect, useState } from "react";
import { Save, RotateCcw, Unlock, Gift, Download, Upload, Trash2, RefreshCw } from "lucide-react";
import { load, update, emptySave, persist, MAX_STAMINA } from "@/lib/store";
import { ISLANDS, MISSIONS, daftarKostum } from "@/lib/gameData";
import { play } from "@/lib/sfx";

/** Kolom angka yang boleh disunting admin. */
const KOLOM_ANGKA = [
  { k: "coins", label: "Koin Bintang", min: 0, max: 999999 },
  { k: "xp", label: "XP", min: 0, max: 9999999 },
  { k: "stamina", label: "Energi", min: 0, max: 999 },
  { k: "streak", label: "Rangkaian Hari", min: 0, max: 9999 },
  { k: "totalCorrect", label: "Jawaban Benar", min: 0, max: 999999 },
  { k: "totalWrong", label: "Jawaban Salah", min: 0, max: 999999 },
  { k: "playSeconds", label: "Waktu Bermain (detik)", min: 0, max: 99999999 },
];

export default function AdminPerangkat() {
  const [save, setSave] = useState(null);
  const [draf, setDraf] = useState({});
  const [pesan, setPesan] = useState("");
  const [impor, setImpor] = useState("");

  function muat() {
    const s = load();
    setSave(s);
    setDraf({
      nickname: s.nickname || "",
      ...Object.fromEntries(KOLOM_ANGKA.map(({ k }) => [k, s[k] ?? 0])),
    });
  }

  useEffect(() => {
    muat();
  }, []);

  function umumkan(t) {
    setPesan(t);
    // Pesan dibersihkan otomatis supaya panel tidak menumpuk notifikasi lama.
    setTimeout(() => setPesan(""), 3200);
  }

  /** Terapkan perubahan kolom teks/angka. */
  function simpan() {
    update((s) => {
      const next = { ...s, nickname: String(draf.nickname || "").slice(0, 24) };
      for (const { k, min, max } of KOLOM_ANGKA) {
        const n = Number(draf[k]);
        next[k] = Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : (s[k] ?? 0);
      }
      return next;
    });
    play("pop");
    muat();
    umumkan("Perubahan tersimpan.");
  }

  function berikanSemuaKostum() {
    update((s) => ({ ...s, costumes: daftarKostum().map((c) => c.id) }));
    play("yeay");
    muat();
    umumkan("Semua kostum diberikan.");
  }

  function bukaSemuaPulau() {
    update((s) => {
      const islands = { ...s.islands };
      for (const isl of ISLANDS) {
        const misi = MISSIONS[isl.slug];
        // Skor sengaja kecil (1) supaya "pulau tamat" terbuka tapi angka
        // kemampuan anak tidak dipalsukan menjadi sempurna.
        islands[isl.slug] = {
          done: true,
          missions: Object.fromEntries((misi || []).map((m) => [m.id, 1])),
        };
      }
      return { ...s, islands };
    });
    play("levelup");
    muat();
    umumkan("Semua pulau dibuka.");
  }

  function kunciUlangPulau() {
    update((s) => ({ ...s, islands: {} }));
    play("pop");
    muat();
    umumkan("Semua pulau dikunci ulang.");
  }

  function resetTotal() {
    if (!window.confirm("Hapus SEMUA kemajuan pemain di perangkat ini? Tindakan ini tidak bisa dibatalkan.")) return;
    persist(emptySave());
    play("wrong");
    muat();
    umumkan("Semua data pemain dihapus.");
  }

  function ekspor() {
    const isi = JSON.stringify(load(), null, 2);
    const blob = new Blob([isi], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zippyverse-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    umumkan("Berkas cadangan diunduh.");
  }

  function imporJson() {
    try {
      const obj = JSON.parse(impor);
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) throw new Error("bentuk tidak cocok");
      persist({ ...emptySave(), ...obj });
      setImpor("");
      play("yeay");
      muat();
      umumkan("Data cadangan dimuat ulang.");
    } catch (e) {
      umumkan(`Gagal memuat: ${e.message}`);
    }
  }

  if (!save) return <Kotak>Memuat data...</Kotak>;

  const level = Math.floor((save.xp || 0) / 100) + 1;
  const tamat = Object.values(save.islands || {}).filter((i) => i.done).length;
  const punya = (save.costumes || ["default"]).length;

  return (
    <div className="space-y-4">
      {pesan && (
        <div className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-black text-emerald-800">
          {pesan}
        </div>
      )}

      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Ringkas label="Pemain" nilai={save.nickname || "(belum ada)"} />
        <Ringkas label="Level" nilai={level} />
        <Ringkas label="Pulau Tamat" nilai={`${tamat}/${ISLANDS.length}`} />
        <Ringkas label="Kostum" nilai={`${punya}/${daftarKostum().length}`} />
      </div>

      {/* Penyunting kolom */}
      <Kotak judul="Ubah Nilai Pemain">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-black text-zippy-navy">Nama</span>
            <input
              value={draf.nickname ?? ""}
              onChange={(e) => setDraf({ ...draf, nickname: e.target.value })}
              className="w-full rounded-xl border-2 border-zippy-navy/15 bg-white px-3 py-2 text-sm font-bold text-zippy-navy outline-none focus:border-zippy-teal"
              maxLength={24}
            />
          </label>
          {KOLOM_ANGKA.map(({ k, label, min, max }) => (
            <label key={k} className="block">
              <span className="mb-1 block text-xs font-black text-zippy-navy">{label}</span>
              <input
                type="number"
                inputMode="numeric"
                min={min}
                max={max}
                value={draf[k] ?? 0}
                onChange={(e) => setDraf({ ...draf, [k]: e.target.value })}
                className="w-full rounded-xl border-2 border-zippy-navy/15 bg-white px-3 py-2 text-sm font-bold text-zippy-navy outline-none focus:border-zippy-teal"
              />
            </label>
          ))}
        </div>
        <button
          onClick={simpan}
          className="btn-pop mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-zippy-teal px-4 py-3 font-black text-white sm:w-auto"
        >
          <Save className="h-5 w-5" strokeWidth={2.8} /> Simpan Perubahan
        </button>
      </Kotak>

      {/* Kostum */}
      <Kotak judul="Kostum">
        <label className="block">
          <span className="mb-1 block text-xs font-black text-zippy-navy">Kostum yang sedang dipakai</span>
          <select
            value={save.equipped || "default"}
            onChange={(e) => {
              update((s) => ({ ...s, equipped: e.target.value }));
              muat();
            }}
            className="w-full rounded-xl border-2 border-zippy-navy/15 bg-white px-3 py-2 text-sm font-bold text-zippy-navy outline-none focus:border-zippy-teal"
          >
            {daftarKostum().map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.perk ? ` — ${c.perk}` : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <TombolKecil onClick={berikanSemuaKostum} ikon={Gift}>
            Berikan Semua Kostum
          </TombolKecil>
        </div>
      </Kotak>

      {/* Pulau */}
      <Kotak judul="Pulau">
        <div className="flex flex-wrap gap-2">
          <TombolKecil onClick={bukaSemuaPulau} ikon={Unlock}>
            Buka Semua Pulau
          </TombolKecil>
          <TombolKecil onClick={kunciUlangPulau} ikon={RefreshCw}>
            Kunci Ulang Semua
          </TombolKecil>
        </div>
        <p className="mt-2 text-[11px] font-bold leading-relaxed text-zippy-navy/60">
          &quot;Buka Semua&quot; menandai tiap pulau tamat dengan skor 1, bukan skor
          sempurna — supaya catatan kemampuan anak tetap jujur.
        </p>
      </Kotak>

      {/* Cadangan */}
      <Kotak judul="Cadangan & Pemulihan">
        <div className="flex flex-wrap gap-2">
          <TombolKecil onClick={ekspor} ikon={Download}>
            Unduh Cadangan (JSON)
          </TombolKecil>
          <TombolKecil onClick={resetTotal} ikon={Trash2} bahaya>
            Hapus Semua Data
          </TombolKecil>
        </div>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-black text-zippy-navy">
            atau tempel isi berkas cadangan di sini
          </span>
          <textarea
            value={impor}
            onChange={(e) => setImpor(e.target.value)}
            rows={4}
            placeholder='{"nickname":"Zippy","coins":120,...}'
            className="w-full rounded-xl border-2 border-zippy-navy/15 bg-white px-3 py-2 font-mono text-xs text-zippy-navy outline-none focus:border-zippy-teal"
          />
        </label>
        <button
          onClick={imporJson}
          disabled={!impor.trim()}
          className="btn-pop mt-2 flex items-center gap-2 rounded-2xl bg-zippy-navy px-4 py-2.5 text-sm font-black text-white disabled:opacity-40"
        >
          <Upload className="h-4 w-4" strokeWidth={3} /> Muat Cadangan
        </button>
      </Kotak>

      {/* Data mentah */}
      <Kotak judul="Isi Penyimpanan Perangkat (mentah)">
        <pre className="no-scrollbar max-h-72 overflow-auto rounded-xl bg-zippy-navy p-3 font-mono text-[11px] leading-relaxed text-zippy-mint">
          {JSON.stringify(save, null, 2)}
        </pre>
        <p className="mt-2 text-[11px] font-bold text-zippy-navy/60">
          Batas energi yang sedang berlaku: <b>{save.stamina ?? MAX_STAMINA}</b> dari{" "}
          <b>{MAX_STAMINA}</b> bawaan (bisa berbeda bila kostum atau pengaturan konten
          mengubahnya).
        </p>
      </Kotak>
    </div>
  );
}

function Ringkas({ label, nilai }) {
  return (
    <div className="rounded-2xl bg-white/90 p-3 text-center shadow-pop">
      <p className="text-[10px] font-black uppercase tracking-wide text-zippy-navy/50">{label}</p>
      <p className="truncate font-display text-lg font-bold text-zippy-navy">{nilai}</p>
    </div>
  );
}

function Kotak({ judul, children }) {
  return (
    <section className="rounded-3xl border-2 border-zippy-navy/10 bg-cream p-4 shadow-pop">
      {judul && (
        <h3 className="mb-3 font-display text-base font-bold text-zippy-navy sm:text-lg">{judul}</h3>
      )}
      {children}
    </section>
  );
}

function TombolKecil({ onClick, ikon: Ikon, children, bahaya = false }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black text-white transition active:scale-95 ${
        bahaya ? "bg-red-500 hover:bg-red-600" : "bg-zippy-teal hover:bg-zippy-teal/85"
      }`}
    >
      <Ikon className="h-4 w-4" strokeWidth={3} />
      {children}
    </button>
  );
}
