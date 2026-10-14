"use client";

/**
 * Panel Admin ZippyVerse
 * ======================
 *
 * Halaman khusus untuk mengelola seluruh data permainan: kemajuan pemain di
 * perangkat ini, isi tabel Supabase, dan angka-angka konten (harga kostum,
 * hadiah harian, batas energi).
 *
 * TIGA HAL YANG HARUS DIPAHAMI SIAPA PUN YANG MEMBAKA BERKAS INI:
 *
 *  1. PIN di sini bukan keamanan. Kode halaman ini dikirim ke browser seperti
 *     kode lainnya, sehingga siapa pun yang membuka Alat Pengembang bisa
 *     membaca dan melewati PIN. PIN hanya untuk menghalangi anak iseng.
 *     Peringatan ini juga ditampilkan di dalam halaman, bukan cuma di sini.
 *
 *  2. Bagian Supabase HANYA BISA MEMBACA. Halaman ini memakai kunci anon yang
 *     sama dengan yang dipakai seluruh pengunjung, dan kunci itu tidak
 *     seharusnya dipakai untuk mengubah data pemain lain. Menambah, mengubah,
 *     atau menghapus baris harus dilakukan lewat dasbor Supabase dengan kunci
 *     service role yang tidak pernah boleh masuk ke berkas klien.
 *
 *  3. Pengaturan konten disimpan di localStorage perangkat ini saja. Ini
 *     bukan pengaturan server — tiap perangkat punya nilai sendiri-sendiri.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, ShieldCheck, ArrowLeft, KeyRound } from "lucide-react";
import { pinSudahAda, pinSah, buatPin, cekPin } from "@/lib/adminAuth";
import AdminPerangkat from "@/components/admin/AdminPerangkat";
import AdminSupabase from "@/components/admin/AdminSupabase";
import AdminKonten from "@/components/admin/AdminKonten";

const TAB = [
  { id: "perangkat", label: "Perangkat", desc: "Kemajuan pemain di browser ini" },
  { id: "supabase", label: "Supabase", desc: "Telusuri tabel (baca saja)" },
  { id: "konten", label: "Konten", desc: "Harga, hadiah, batas energi" },
];

export default function AdminPage() {
  const [terbuka, setTerbuka] = useState(false);
  const [tab, setTab] = useState("perangkat");
  const [perluBuat, setPerluBuat] = useState(false);
  const [sudahCek, setSudahCek] = useState(false);

  // localStorage tidak bisa dibaca saat server merender. Karena itu gerbang
  // PIN baru diputuskan setelah halaman hidrasi, dan sebelum itu hanya
  // menampilkan layar memuat — supaya tidak ada perbedaan server/klien.
  useEffect(() => {
    setPerluBuat(!pinSudahAda());
    setSudahCek(true);
  }, []);

  if (!sudahCek) {
    return (
      <main className="space-bg relative grid min-h-screen place-items-center">
        <p className="font-display text-lg font-bold text-white/80">Membuka panel...</p>
      </main>
    );
  }

  return (
    <main className="space-bg relative min-h-screen overflow-x-clip pb-14">
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              aria-label="Kembali ke dasbor orang tua"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-zippy-navy shadow-pop transition hover:bg-white active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.8} />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold text-white drop-shadow-[0_2px_8px_rgba(15,44,61,0.9)] sm:text-3xl">
                Panel Admin
              </h1>
              <p className="text-xs font-bold text-white/70 drop-shadow-[0_2px_6px_rgba(15,44,61,0.9)]">
                Pengelolaan seluruh data ZippyVerse
              </p>
            </div>
          </div>
          {terbuka && <KunciBadge />}
        </header>

        {!terbuka ? (
          <GerbangPIN perluBuat={perluBuat} onBuka={() => setTerbuka(true)} />
        ) : (
          <>
            <PeringatanJujur />

            <nav className="mb-4 flex flex-wrap gap-2">
              {TAB.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`rounded-2xl px-4 py-2 text-left transition ${
                    tab === t.id
                      ? "bg-zippy-yellow text-zippy-navy shadow-pop"
                      : "bg-white/85 text-zippy-navy/70 hover:bg-white"
                  }`}
                >
                  <span className="block text-sm font-black">{t.label}</span>
                  <span className="block text-[10px] font-bold opacity-70">{t.desc}</span>
                </button>
              ))}
            </nav>

            {tab === "perangkat" && <AdminPerangkat />}
            {tab === "supabase" && <AdminSupabase />}
            {tab === "konten" && <AdminKonten />}
          </>
        )}
      </div>
    </main>
  );
}

function KunciBadge() {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-black text-white">
      <ShieldCheck className="h-4 w-4" strokeWidth={3} />
      Panel terbuka
    </span>
  );
}

/**
 * Peringatan yang ditampilkan di dalam halaman.
 *
 * Ditulis langsung, bukan disembunyikan di tooltip: orang tua yang memakai
 * panel ini berhak tahu seberapa jauh PIN ini bisa diandalkan.
 */
function PeringatanJujur() {
  return (
    <div className="mb-5 rounded-3xl border-2 border-amber-400/60 bg-amber-100/90 p-4">
      <p className="flex items-center gap-2 text-sm font-black text-amber-900">
        <ShieldAlert className="h-5 w-5 shrink-0" strokeWidth={2.8} />
        Baca dulu: PIN ini bukan keamanan sungguhan
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs font-bold leading-relaxed text-amber-900/85">
        <li>
          Kode halaman ini dikirim ke browser. Siapa pun yang membuka Alat Pengembang
          bisa membaca PIN dan melewatinya. PIN hanya menghalangi anak iseng
          menekan-nekan tombol.
        </li>
        <li>
          Bagian Supabase <b>hanya bisa membaca</b>. Mengubah data pemain lain harus
          lewat dasbor Supabase dengan kunci service role — kunci itu tidak boleh
          pernah disimpan di berkas klien.
        </li>
        <li>
          Pengaturan konten berlaku untuk <b>perangkat ini saja</b>, bukan untuk semua
          pemain.
        </li>
      </ul>
    </div>
  );
}

/** Gerbang PIN: membuat PIN baru, atau memasukkan PIN yang sudah ada. */
function GerbangPIN({ perluBuat, onBuka }) {
  const [mode, setMode] = useState(perluBuat ? "buat" : "masuk");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [pesan, setPesan] = useState("");

  function submit(e) {
    e.preventDefault();
    if (mode === "masuk") {
      if (cekPin(a)) {
        onBuka();
      } else {
        setPesan("PIN salah. Coba lagi.");
        setA("");
      }
      return;
    }
    if (!pinSah(a)) {
      setPesan("PIN harus 4 sampai 8 angka.");
      return;
    }
    if (a !== b) {
      setPesan("Ketikan PIN-nya belum sama.");
      return;
    }
    if (buatPin(a)) {
      onBuka();
    } else {
      setPesan("PIN gagal disimpan. Coba lagi.");
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-[30px] border-4 border-zippy-teal bg-cream p-6 shadow-pop-lg">
      <div className="mb-4 grid place-items-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-zippy-teal/15 text-zippy-teal">
          <KeyRound className="h-7 w-7" strokeWidth={2.8} />
        </span>
      </div>
      <h2 className="text-center font-display text-xl font-bold text-zippy-navy">
        {mode === "buat" ? "Buat PIN Panel Admin" : "Masukkan PIN"}
      </h2>
      <p className="mt-1 text-center text-xs font-bold text-zippy-navy/60">
        {mode === "buat"
          ? "PIN ini dipakai untuk membuka panel di perangkat ini."
          : "Panel ini dikunci. Masukkan PIN orang tua."}
      </p>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-black text-zippy-navy">
            {mode === "buat" ? "PIN baru" : "PIN"}
          </span>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={a}
            onChange={(e) => {
              setA(e.target.value.replace(/\D/g, "").slice(0, 8));
              setPesan("");
            }}
            className="w-full rounded-2xl border-2 border-zippy-navy/15 bg-white px-4 py-3 text-center font-display text-2xl tracking-[0.4em] text-zippy-navy outline-none focus:border-zippy-teal"
            placeholder="••••"
          />
        </label>

        {mode === "buat" && (
          <label className="block">
            <span className="mb-1 block text-xs font-black text-zippy-navy">
              Ketik ulang PIN
            </span>
            <input
              type="password"
              inputMode="numeric"
              value={b}
              onChange={(e) => {
                setB(e.target.value.replace(/\D/g, "").slice(0, 8));
                setPesan("");
              }}
              className="w-full rounded-2xl border-2 border-zippy-navy/15 bg-white px-4 py-3 text-center font-display text-2xl tracking-[0.4em] text-zippy-navy outline-none focus:border-zippy-teal"
              placeholder="••••"
            />
          </label>
        )}

        {pesan && (
          <p className="rounded-2xl bg-red-100 px-3 py-2 text-center text-xs font-black text-red-700">
            {pesan}
          </p>
        )}

        <button
          type="submit"
          className="btn-pop w-full rounded-2xl bg-zippy-teal px-4 py-3 font-black text-white"
        >
          {mode === "buat" ? "Buat dan Buka Panel" : "Buka Panel"}
        </button>
      </form>

      {/* Jalur "lupa PIN" sengaja TIDAK disediakan. Kalau ada, anak cukup
          menekan "Lupa PIN" lalu membuat PIN baru — kuncinya jadi tidak
          berguna sama sekali. Admin yang benar-benar lupa PIN bisa membersihkan
          data peramban, yang memang cara aslinya mengatur ulang panel ini. */}
      <p className="mt-4 rounded-2xl bg-zippy-navy/6 px-3 py-2 text-center text-[11px] font-bold leading-relaxed text-zippy-navy/65">
        Ingat: PIN ini hanya penghalang, bukan kunci. Kode panel tetap bisa dibaca
        siapa pun lewat Alat Pengembang peramban.
      </p>
    </div>
  );
}
