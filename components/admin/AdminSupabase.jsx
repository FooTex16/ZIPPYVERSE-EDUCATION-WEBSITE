"use client";

/**
 * Panel Admin — Data Supabase (HANYA BACA)
 *
 * Keputusan desain yang sengaja dibatasi:
 *
 *   Panel ini TIDAK MENYEDIAKAN tombol tambah/ubah/hapus baris. Alasannya
 *   bukan kemalasan, tapi keamanan: klien memakai kunci anon yang sama untuk
 *   semua pengunjung. Kalau panel admin menulis memakai kunci itu, siapa pun
 *   yang membuka panel bisa mengubah data pemain lain. Perubahan data yang
 *   bersifat global harus dilakukan lewat dasbor Supabase dengan kunci
 *   service role, yang tidak boleh pernah dikirim ke browser.
 *
 *   Kunci anon juga TIDAK PERNAH ditampilkan di sini. Yang tampil hanya
 *   alamat proyek (sudah publik karena berprefix NEXT_PUBLIC) dan status
 *   koneksinya.
 *
 * Pemeriksaan RLS di sini bersifat PERILAKU (apakah kunci anon bisa membaca
 * atau tidak), bukan daftar kebijakan. Menampilkan daftar kebijakan
 * membutuhkan SQL mentah terhadap pg_policies, yang tidak bisa dijalankan
 * lewat supabase-js tanpa fungsi RPC khusus. Kueri siap salin disediakan di
 * bagian bawah untuk dijalankan di SQL Editor Supabase.
 */

import { useState } from "react";
import { Database, ShieldCheck, Play, Copy, AlertTriangle } from "lucide-react";
import { supabaseEnabled } from "@/lib/supabase";
import { bacaTabel } from "@/lib/adminApi";

const LIMIT = 200;

/** Kueri yang perlu dijalankan admin di SQL Editor Supabase. */
const KUERI_SQL = [
  {
    label: "Apakah RLS aktif di tabel pemain?",
    sql: "select relname, relrowsecurity from pg_class where relname in ('players','progress');",
    harap: "relrowsecurity = true untuk kedua tabel.",
  },
  {
    label: "Apakah kunci anon bisa membaca tabel pemain?",
    sql: "select id, nickname from public.players limit 1;",
    harap: "Mengembalikan baris, atau 0 baris bukan karena ditolak.",
  },
  {
    label: "Daftar kebijakan RLS yang berlaku",
    sql: "select schemaname, tablename, policyname, permissive, roles, cmd, qual from pg_policies where schemaname = 'public';",
    harap: "Kosong berarti tidak ada kebijakan -> tabel tertutup rapat bagi kunci anon.",
  },
  {
    label: "Tambah kolom skor + indeks (sekali jalan, aman)",
    sql: "alter table public.progress add column if not exists score integer not null default 0;\ncreate index if not exists progress_player_id_idx on public.progress (player_id);",
    harap: "Menyelesaikan kesalahan PGRST204 yang membuat riwayat dasbor kosong.",
  },
];

export default function AdminSupabase() {
  const [tabel, setTabel] = useState(null);
  const [baris, setBaris] = useState([]);
  const [jumlah, setJumlah] = useState(null);
  const [status, setStatus] = useState("siap");
  const [galat, setGalat] = useState(null);
  const [disalin, setDisalin] = useState(null);

  async function muat(namaTabel) {
    setTabel(namaTabel);
    setGalat(null);
    setBaris([]);
    setJumlah(null);
    setStatus("memuat");
    try {
      // Seluruh pembacaan kini lewat /api/admin, bukan langsung dari peramban.
      // Peramban tidak lagi memegang kunci istimewa apa pun untuk tabel ini —
      // ia hanya mengirim token sesi miliknya sendiri, lalu SERVER yang
      // memutuskan boleh atau tidak, setelah memeriksa peran pengelolanya.
      const r = await bacaTabel(namaTabel, LIMIT);
      if (!r.ok) {
        setGalat(r.galat || "Gagal membaca tabel.");
        setStatus("gagal");
        return;
      }
      setJumlah(r.jumlah);
      setBaris(r.baris || []);
      setStatus("selesai");
    } catch (e) {
      setGalat(e.message || String(e));
      setStatus("gagal");
    }
  }

  function salin(sql, label) {
    try {
      navigator.clipboard.writeText(sql);
      setDisalin(label);
      setTimeout(() => setDisalin(null), 2000);
    } catch {
      setDisalin(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Status koneksi */}
      <section className="rounded-3xl border-2 border-zippy-navy/10 bg-cream p-4 shadow-pop">
        <h3 className="mb-2 flex items-center gap-2 font-display text-base font-bold text-zippy-navy sm:text-lg">
          <Database className="h-5 w-5 text-zippy-teal" strokeWidth={2.8} /> Status Koneksi
        </h3>
        <ul className="space-y-1.5 text-xs font-bold text-zippy-navy/80">
          <li>
            Supabase:{" "}
            {supabaseEnabled ? (
              <span className="text-emerald-600">terhubung</span>
            ) : (
              <span className="text-red-600">tidak dikonfigurasi</span>
            )}
          </li>
          <li className="break-all">
            Alamat proyek:{" "}
            <span className="font-mono">{supabaseEnabled ? hostDari(process.env.NEXT_PUBLIC_SUPABASE_URL) : "—"}</span>
          </li>
          <li>
            Kunci akses: <span className="text-emerald-600">terpasang</span>{" "}
            <span className="text-zippy-navy/50">(nilainya tidak pernah ditampilkan di sini)</span>
          </li>
        </ul>

        <div className="mt-3 rounded-2xl bg-amber-100 p-3">
          <p className="flex items-start gap-2 text-[11px] font-bold leading-relaxed text-amber-900">
            <AlertTriangle className="mt-px h-4 w-4 shrink-0" strokeWidth={3} />
            Pembacaan berjalan lewat <code className="rounded bg-amber-200/70 px-1">/api/admin</code>{" "}
            di server, setelah peran Anda diperiksa. Tombol tambah/ubah/hapus sengaja
            tidak disediakan: panel ini memang dibuat <b>baca-saja</b>, dan perubahan
            data sebaiknya dilakukan dari dasbor Supabase supaya tercatat siapa
            pelakunya.
          </p>
        </div>
      </section>

      {/* Telusuri tabel */}
      <section className="rounded-3xl border-2 border-zippy-navy/10 bg-cream p-4 shadow-pop">
        <h3 className="mb-3 font-display text-base font-bold text-zippy-navy sm:text-lg">
          Telusuri Tabel
        </h3>
        <div className="flex flex-wrap gap-2">
          {["players", "progress"].map((t) => (
            <button
              key={t}
              onClick={() => muat(t)}
              disabled={status === "memuat" && tabel === t}
              className="flex items-center gap-2 rounded-2xl bg-zippy-teal px-4 py-2.5 text-sm font-black text-white transition active:scale-95 disabled:opacity-50"
            >
              <Play className="h-4 w-4" strokeWidth={3} />
              {tabel === t && status === "memuat" ? "Memuat..." : `Baca ${t}`}
            </button>
          ))}
        </div>

        {galat && (
          <div className="mt-3 rounded-2xl bg-red-100 p-3 text-xs font-bold leading-relaxed text-red-800">
            <p className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={3} />
              Gagal membaca <b>{tabel}</b>
            </p>
            <p className="mt-1">{galat}</p>
          </div>
        )}

        {status === "selesai" && (
          <div className="mt-3">
            <p className="mb-2 text-xs font-bold text-zippy-navy/70">
              <b>{jumlah ?? baris.length}</b> baris total{jumlah > LIMIT ? `, menampilkan ${baris.length} pertama` : ""}.
            </p>
            {baris.length === 0 ? (
              <p className="rounded-2xl bg-white p-3 text-xs font-bold text-zippy-navy/60">
                Tabel terbaca tapi kosong — bukan diblokir. Artinya kunci anon diizinkan
                membaca, dan memang belum ada data.
              </p>
            ) : (
              <div className="no-scrollbar overflow-x-auto rounded-2xl border-2 border-zippy-navy/10 bg-white">
                <table className="w-full text-left text-xs">
                  <TabelKepala kolom={Object.keys(baris[0])} />
                  <tbody>
                    {baris.slice(0, 50).map((b, i) => (
                      <tr key={b.id || i} className="border-t border-zippy-navy/8">
                        {Object.keys(baris[0]).map((k) => (
                          <td key={k} className="max-w-[220px] truncate px-3 py-2 font-mono text-zippy-navy">
                            {formatSel(b[k])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Kueri untuk SQL Editor */}
      <section className="rounded-3xl border-2 border-zippy-navy/10 bg-cream p-4 shadow-pop">
        <h3 className="mb-1 font-display text-base font-bold text-zippy-navy sm:text-lg">
          Kueri untuk SQL Editor Supabase
        </h3>
        <p className="mb-3 text-[11px] font-bold leading-relaxed text-zippy-navy/60">
          supabase-js tidak bisa menjalankan SQL mentah, jadi kebijakan RLS tidak bisa
          dibaca dari sini. Salin kueri di bawah lalu tempel di SQL Editor dasbor
          Supabase.
        </p>
        <div className="space-y-3">
          {KUERI_SQL.map((q) => (
            <div key={q.label} className="rounded-2xl border-2 border-zippy-navy/10 bg-white p-3">
              <p className="text-xs font-black text-zippy-navy">{q.label}</p>
              <pre className="no-scrollbar mt-2 overflow-x-auto rounded-xl bg-zippy-navy p-2.5 font-mono text-[11px] leading-relaxed text-zippy-mint">
                {q.sql}
              </pre>
              <p className="mt-1.5 text-[11px] font-bold text-zippy-navy/60">
                Yang diharapkan: {q.harap}
              </p>
              <button
                onClick={() => salin(q.sql, q.label)}
                className="mt-2 flex items-center gap-1.5 rounded-xl bg-zippy-teal/15 px-3 py-1.5 text-[11px] font-black text-zippy-teal transition hover:bg-zippy-teal/25"
              >
                <Copy className="h-3.5 w-3.5" strokeWidth={3} />
                {disalin === q.label ? "Tersalin!" : "Salin kueri"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <p className="flex items-start gap-2 rounded-2xl bg-white/85 p-3 text-[11px] font-bold leading-relaxed text-zippy-navy/70">
        <ShieldCheck className="mt-px h-4 w-4 shrink-0 text-emerald-600" strokeWidth={3} />
        Panel ini tidak pernah mengirim, menyimpan, atau menampilkan kunci akses.
      </p>
    </div>
  );
}

function TabelKepala({ kolom }) {
  return (
    <thead className="bg-zippy-navy/5">
      <tr>
        {kolom.map((k) => (
          <th key={k} className="whitespace-nowrap px-3 py-2 font-black text-zippy-navy">
            {k}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function formatSel(v) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** Tampilkan hanya host proyek, bukan seluruh URL lengkap. */
function hostDari(url) {
  try {
    return new URL(url).host;
  } catch {
    return "(alamat tidak terbaca)";
  }
}
