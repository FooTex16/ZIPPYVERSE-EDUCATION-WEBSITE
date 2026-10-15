"use client";

/**
 * Panel Penyunting Misi — tempat mengubah teks soal dan jawabannya.
 *
 * Dibuka lewat: peta -> ketuk pulau -> "Masuk". Sengaja TIDAK memakai
 * /pulau/[slug] (halaman permainan) sama sekali, sehingga halaman yang
 * dimainkan anak tidak memuat satu pun cabang khusus pengelola yang bisa
 * salah berjalan.
 *
 * ENAM TIPE MISO DAN BENTUK PUTARANNYA
 *
 *   mcq / blitz / boss  { q, a, o[], hint? }    a harus ada di dalam o
 *   scramble            { scrambled, answer, hint }
 *   order               { items[], answer[], hint }
 *   dragcount           { emoji, count, options[] }   count harus ada di options
 *
 * SEMUA SUNTINGAN LANGSUNG MENULIS NASKAH, BUKAN AWAN.
 * Naskah belum pernah dipakai permainan - jadi meski isinya sementara belum
 * lengkap (misal pilihan masih kosong), anak tidak akan pernah melihatnya.
 * Pemeriksaan penuh hanya dijalankan saat "Terapkan Update" ditekan.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Puzzle,
  Dices,
  ListOrdered,
  Timer,
  Zap,
  Crown,
  Globe,
  GripVertical,
} from "lucide-react";
import { TIPE_MISI } from "@/lib/konten";

const TIPE_INFO = {
  mcq: { label: "Pilihan Ganda", ikon: Puzzle, warna: "bg-zippy-teal" },
  scramble: { label: "Susun Huruf", ikon: Dices, warna: "bg-indigo-500" },
  order: { label: "Urutkan", ikon: ListOrdered, warna: "bg-emerald-500" },
  dragcount: { label: "Hitung Benda", ikon: GripVertical, warna: "bg-orange-500" },
  blitz: { label: "Kilat", ikon: Zap, warna: "bg-amber-500" },
  boss: { label: "Bos", ikon: Crown, warna: "bg-fuchsia-600" },
};

const KELAS_INPUT =
  "w-full rounded-2xl border-2 border-zippy-navy/15 px-3 py-2.5 text-sm font-bold text-zippy-navy outline-none focus:border-zippy-teal";
const KELAS_LABEL =
  "mb-1 block text-[11px] font-black uppercase tracking-wide text-zippy-navy/60";

function acakHuruf(kata) {
  const h = String(kata).split("");
  for (let i = h.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [h[i], h[j]] = [h[j], h[i]];
  }
  const hasil = h.join("");
  return hasil === String(kata) && h.length > 1 ? acakHuruf(kata) : hasil;
}

function putaranBaru(tipe) {
  switch (tipe) {
    case "scramble":
      return { scrambled: "", answer: "", hint: "" };
    case "order":
      return { items: ["", ""], answer: ["", ""], hint: "" };
    case "dragcount":
      return { emoji: "⭐", count: 3, options: [2, 3, 4] };
    case "mcq":
      return { q: "", a: "", o: ["", "", "", ""], hint: "" };
    default:
      return { q: "", a: "", o: ["", "", "", ""] };
  }
}

function misiBaru(tipe) {
  return {
    id: `m${Date.now(36)}${Math.floor(Math.random() * 1296).toString(36)}`,
    type: tipe,
    name: "Misi Baru",
    title: "",
    subtitle: "",
    rounds: [putaranBaru(tipe)],
    reward: 40,
    xp: 30,
    ...(tipe === "blitz" || tipe === "boss" ? { duration: 12 } : {}),
  };
}

/** Acak pilihan jawaban supaya jawaban benar tidak selalu di urutan pertama. */
function campurTeks(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

// ---------------------------------------------------------------------
// Editor satu putaran
// ---------------------------------------------------------------------

function PenyuntingPutaran({ tipe, r, ubah }) {
  const [buka, setBuka] = useState(false);

  const judul =
    tipe === "scramble"
      ? `Kata: ${r.answer || "(belum diisi)"}`
      : tipe === "order"
        ? `${r.items?.length || 0} langkah`
        : tipe === "dragcount"
          ? `${r.emoji} × ${r.count}`
          : (r.q || "(soal belum diisi)").slice(0, 46);

  const bukaPilihan = (idx) => ubah(campurTeks(r.o), idx);

  return (
    <div className="rounded-2xl border-2 border-zippy-navy/12 bg-zippy-navy/[0.03]">
      {/* Tombol ini membuka/tutup isi butir soal yang terlipat di bawahnya,
          sehingga `aria-expanded` meniru keadaan yang sebenarnya. */}
      <button
        onClick={() => setBuka((b) => !b)}
        aria-expanded={buka}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-zippy-navy text-[11px] font-black text-zippy-yellow">
          {r._n}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-black text-zippy-navy sm:text-sm">
          {judul}
        </span>
        {buka ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-zippy-navy/50" strokeWidth={3} />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-zippy-navy/50" strokeWidth={3} />
        )}
      </button>

      {buka && (
        <div className="space-y-3 border-t-2 border-zippy-navy/10 px-3 py-3">
          {/* ---------- Pilihan ganda / kilat / bos ---------- */}
          {(tipe === "mcq" || tipe === "blitz" || tipe === "boss") && (
            <>
              <label className="block">
                <span className={KELAS_LABEL}>Pertanyaan</span>
                <textarea
                  value={r.q}
                  onChange={(e) => ubah({ ...r, q: e.target.value })}
                  rows={2}
                  className={`${KELAS_INPUT} resize-none`}
                  placeholder="Misal: 2 + 3 = ?"
                />
              </label>

              <div>
                <span className={KELAS_LABEL}>Pilihan jawaban</span>
                <div className="space-y-2">
                  {r.o.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`benar-${r._k}`}
                        checked={r.o[r.o.indexOf(r.a)] === v && v !== "" && r.a === v}
                        onChange={() => ubah({ ...r, a: v })}
                        disabled={!v}
                        aria-label={`Tandai pilihan ${i + 1} sebagai jawaban benar`}
                        className="h-5 w-5 shrink-0 accent-zippy-teal"
                      />
                      <input
                        value={v}
                        onChange={(e) => {
                          const nilai = e.target.value;
                          const o = r.o.slice();
                          const lama = o[i];
                          o[i] = nilai;
                          ubah({ ...r, o, a: r.a === lama ? nilai : r.a });
                        }}
                        className={KELAS_INPUT}
                        placeholder={`Pilihan ${i + 1}`}
                      />
                      <button
                        onClick={() => {
                          const o = r.o.filter((_, j) => j !== i);
                          ubah({ ...r, o, a: o.includes(r.a) ? r.a : o[0] || "" });
                        }}
                        disabled={r.o.length <= 2}
                        aria-label="Hapus pilihan"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-500/15 text-red-600 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => ubah({ ...r, o: [...r.o, ""], a: r.a || "" })}
                    className="flex items-center gap-1.5 rounded-xl bg-zippy-teal/15 px-2.5 py-1.5 text-[11px] font-black text-zippy-teal"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={3} /> Tambah pilihan
                  </button>
                  <button
                    onClick={() => ubah({ ...r, o: campurTeks(r.o), a: r.a })}
                    className="flex items-center gap-1.5 rounded-xl bg-zippy-navy/10 px-2.5 py-1.5 text-[11px] font-black text-zippy-navy"
                  >
                    <Dices className="h-3.5 w-3.5" strokeWidth={3} /> Acak urutan
                  </button>
                </div>
                <p className="mt-2 text-[10px] font-bold leading-relaxed text-zippy-navy/55">
                  Lingkaran di kiri menandai <b>jawaban benar</b>. Anak akan melihat
                  pilihan dalam urutan yang diacak saat main, jadi jawaban benar tidak
                  selalu berada di atas.
                </p>
              </div>

              {"hint" in r && (
                <label className="block">
                  <span className={KELAS_LABEL}>Petunjuk (opsional)</span>
                  <input
                    value={r.hint || ""}
                    onChange={(e) => ubah({ ...r, hint: e.target.value })}
                    className={KELAS_INPUT}
                    placeholder="Misal: jumlahkan dulu angkanya."
                  />
                </label>
              )}
            </>
          )}

          {/* ---------- Susun huruf ---------- */}
          {tipe === "scramble" && (
            <>
              <label className="block">
                <span className={KELAS_LABEL}>Kata yang benar</span>
                <input
                  value={r.answer}
                  onChange={(e) => {
                    const answer = e.target.value.toUpperCase();
                    ubah({ ...r, answer, scrambled: acakHuruf(answer) });
                  }}
                  className={KELAS_INPUT}
                  placeholder="Misal: SEKOLAH"
                />
              </label>
              <label className="block">
                <span className={KELAS_LABEL}>Huruf yang ditampilkan (acak)</span>
                <div className="flex gap-2">
                  <input
                    value={r.scrambled}
                    onChange={(e) => ubah({ ...r, scrambled: e.target.value.toUpperCase() })}
                    className={KELAS_INPUT}
                  />
                  <button
                    onClick={() => ubah({ ...r, scrambled: acakHuruf(r.answer) })}
                    className="btn-pop shrink-0 rounded-2xl bg-zippy-navy/10 px-3 text-xs font-black text-zippy-navy"
                    title="Acak ulang"
                  >
                    <Dices className="h-4 w-4" strokeWidth={3} />
                  </button>
                </div>
              </label>
              <label className="block">
                <span className={KELAS_LABEL}>Petunjuk (opsional)</span>
                <input
                  value={r.hint || ""}
                  onChange={(e) => ubah({ ...r, hint: e.target.value })}
                  className={KELAS_INPUT}
                  placeholder="Misal: Tempat belajar."
                />
              </label>
            </>
          )}

          {/* ---------- Urutkan ---------- */}
          {tipe === "order" && (
            <div>
              <span className={KELAS_LABEL}>Langkah dari awal sampai akhir</span>
              <div className="space-y-2">
                {(r.items || []).map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-zippy-teal text-[11px] font-black text-white">
                      {i + 1}
                    </span>
                    <input
                      value={v}
                      onChange={(e) => {
                        const items = r.items.slice();
                        items[i] = e.target.value;
                        ubah({ ...r, items, answer: items });
                      }}
                      className={KELAS_INPUT}
                      placeholder={`Langkah ${i + 1}`}
                    />
                    <button
                      onClick={() => {
                        const items = r.items.filter((_, j) => j !== i);
                        ubah({ ...r, items, answer: items });
                      }}
                      disabled={r.items.length <= 2}
                      aria-label="Hapus langkah"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-500/15 text-red-600 disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const items = [...r.items, ""];
                  ubah({ ...r, items, answer: items });
                }}
                className="mt-2 flex items-center gap-1.5 rounded-xl bg-zippy-teal/15 px-2.5 py-1.5 text-[11px] font-black text-zippy-teal"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={3} /> Tambah langkah
              </button>
              <p className="mt-2 text-[10px] font-bold leading-relaxed text-zippy-navy/55">
                Anak akan melihat langkah-langkah ini dalam keadaan teracak, lalu
                menyusunnya kembali sesuai urutan di atas.
              </p>
              <label className="mt-3 block">
                <span className={KELAS_LABEL}>Petunjuk (opsional)</span>
                <input
                  value={r.hint || ""}
                  onChange={(e) => ubah({ ...r, hint: e.target.value })}
                  className={KELAS_INPUT}
                  placeholder="Misal: Mulai dari memegang."
                />
              </label>
            </div>
          )}

          {/* ---------- Hitung benda ---------- */}
          {tipe === "dragcount" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={KELAS_LABEL}>Benda yang dihitung</span>
                <input
                  value={r.emoji}
                  onChange={(e) => ubah({ ...r, emoji: e.target.value.slice(0, 4) })}
                  className={`${KELAS_INPUT} text-center text-2xl`}
                  placeholder="⭐"
                />
                <span className="mt-1 block text-[10px] font-bold text-zippy-navy/50">
                  Cukup satu emoji atau satu huruf.
                </span>
              </label>
              <label className="block">
                <span className={KELAS_LABEL}>Jumlah yang benar</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={r.count}
                  onChange={(e) => {
                    const count = Math.max(1, Number(e.target.value) || 1);
                    const options = r.options.includes(count) ? r.options : [...r.options, count];
                    ubah({ ...r, count, options });
                  }}
                  className={KELAS_INPUT}
                />
              </label>

              <div className="sm:col-span-2">
                <span className={KELAS_LABEL}>Pilihan jawaban</span>
                <div className="flex flex-wrap items-center gap-2">
                  {r.options.map((n, i) => (
                    <span key={i} className="flex items-center gap-1 rounded-xl bg-zippy-navy/10 px-2 py-1.5">
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={n}
                        onChange={(e) => {
                          const nilai = Math.max(1, Number(e.target.value) || 1);
                          const old = r.options[i];
                          const options = r.options.slice();
                          options[i] = nilai;
                          ubah({ ...r, options, count: r.count === old ? nilai : r.count });
                        }}
                        aria-label={`Pilihan ${i + 1}`}
                        className="w-14 bg-transparent text-center text-sm font-black text-zippy-navy outline-none"
                      />
                      <button
                        onClick={() => {
                          const options = r.options.filter((_, j) => j !== i);
                          ubah({
                            ...r,
                            options: options.length ? options : [r.count],
                            count: options.includes(r.count) ? r.count : r.count,
                          });
                        }}
                        disabled={r.options.length <= 2}
                        aria-label="Hapus pilihan"
                        className="grid h-6 w-6 place-items-center rounded-lg bg-red-500/20 text-red-600 disabled:opacity-30"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={3} />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => ubah({ ...r, options: [...r.options, (r.options.at(-1) || 0) + 1] })}
                    className="flex items-center gap-1 rounded-xl bg-zippy-teal/15 px-2.5 py-1.5 text-[11px] font-black text-zippy-teal"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={3} /> Tambah
                  </button>
                </div>
                <p className="mt-2 text-[10px] font-bold leading-relaxed text-zippy-navy/55">
                  Jumlah yang benar wajib ada di daftar ini, kalau tidak anak tidak akan
                  pernah bisa menjawab benar.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Editor satu misi
// ---------------------------------------------------------------------

function FormMisi({ m, simpan, batal, hapusMisi }) {
  const [umpan, setUmpan] = useState("");
  const info = TIPE_INFO[m.type];

  function ubahPutaran(idx, nilai) {
    const rounds = m.rounds.map((r, i) => (i === idx ? nilai : r));
    simpan({ ...m, rounds });
  }

  function simpanMisi() {
    if (!String(m.title).trim()) {
      setUmpan("Judul misi masih kosong.");
      return;
    }
    const kosong = m.rounds.findIndex((r) =>
      m.type === "order"
        ? !(r.items || []).some((x) => String(x).trim())
        : m.type === "scramble"
          ? !String(r.answer || "").trim()
          : m.type === "dragcount"
            ? false
            : !String(r.q || "").trim()
    );
    if (kosong >= 0) {
      setUmpan(`Putaran ${kosong + 1} masih kosong - lengkapi dulu atau hapus.`);
      return;
    }
    if (m.type !== "dragcount" && m.type !== "order" && m.type !== "scramble") {
      const tanpaJawaban = m.rounds.findIndex((r) => !r.a || !String(r.a).trim());
      if (tanpaJawaban >= 0) {
        setUmpan(`Putaran ${tanpaJawaban + 1} belum menandai jawaban benar (lingkaran di kiri).`);
        return;
      }
    }
    if (m.type === "dragcount") {
      const rusak = m.rounds.findIndex((r) => !(r.options || []).includes(r.count));
      if (rusak >= 0) {
        setUmpan(`Putaran ${rusak + 1}: jumlah yang benar tidak ada di daftar pilihan.`);
        return;
      }
    }
    simpan({ ...m, title: String(m.title).trim(), name: m.name || "Misi" });
    batal();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border-4 border-zippy-teal bg-white p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className={`grid h-8 w-8 place-items-center rounded-xl text-white ${info.warna}`}>
          <info.ikon className="h-4 w-4" strokeWidth={3} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-black uppercase tracking-wide text-zippy-navy/55">
            {info.label} · tipe tidak bisa diubah
          </span>
          <span className="block text-[10px] font-bold text-zippy-navy/50">
            Tipe dipilih saat misi dibuat; tiap tipe punya bentuk soal berbeda.
          </span>
        </span>
        <button
          onClick={() => {
            if (confirm(`Hapus misi "${m.title || "tanpa judul"}" beserta isinya?`)) hapusMisi();
          }}
          aria-label="Hapus misi"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-red-500/15 text-red-600"
        >
          <Trash2 className="h-4 w-4" strokeWidth={3} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={KELAS_LABEL}>Judul misi</span>
          <input
            value={m.title}
            onChange={(e) => simpan({ ...m, title: e.target.value })}
            className={KELAS_INPUT}
            maxLength={80}
            placeholder="Misal: Hitung Jari-jari"
          />
        </label>
        <label className="block">
          <span className={KELAS_LABEL}>Kalimat pembuka</span>
          <input
            value={m.subtitle || ""}
            onChange={(e) => simpan({ ...m, subtitle: e.target.value })}
            className={KELAS_INPUT}
            maxLength={120}
            placeholder="Misal: Selesaikan 3 putaran ini!"
          />
        </label>

        <label className="block">
          <span className={KELAS_LABEL}>Hadiah koin</span>
          <input
            type="number"
            min={0}
            max={9999}
            value={m.reward}
            onChange={(e) => simpan({ ...m, reward: Math.max(0, Number(e.target.value) || 0) })}
            className={KELAS_INPUT}
          />
        </label>
        <label className="block">
          <span className={KELAS_LABEL}>Pengalaman (XP)</span>
          <input
            type="number"
            min={0}
            max={9999}
            value={m.xp}
            onChange={(e) => simpan({ ...m, xp: Math.max(0, Number(e.target.value) || 0) })}
            className={KELAS_INPUT}
          />
        </label>
      </div>

      {/* Putaran soal */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className={KELAS_LABEL}>Putaran soal ({m.rounds.length})</span>
          <button
            onClick={() => simpan({ ...m, rounds: [...m.rounds, putaranBaru(m.type)] })}
            className="flex items-center gap-1.5 rounded-xl bg-zippy-teal px-2.5 py-1.5 text-[11px] font-black text-white"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={3} /> Tambah putaran
          </button>
        </div>

        <div className="space-y-2">
          {m.rounds.map((r, i) => (
            <PenyuntingPutaran
              key={i}
              tipe={m.type}
              r={{ ...r, _n: i + 1, _k: `${m.id}-${i}` }}
              ubah={(nilai) => ubahPutaran(i, nilai)}
            />
          ))}
        </div>

        {m.rounds.length > 1 && (
          <button
            onClick={() => simpan({ ...m, rounds: m.rounds.slice(0, -1) })}
            className="mt-2 flex items-center gap-1.5 rounded-xl bg-red-500/12 px-2.5 py-1.5 text-[11px] font-black text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={3} /> Hapus putaran terakhir
          </button>
        )}
      </div>

      {umpan && (
        <div className="mt-3 rounded-2xl bg-red-500/90 px-3 py-2.5 text-xs font-black text-white" role="alert">
          {umpan}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={simpanMisi}
          className="btn-pop flex flex-1 items-center justify-center gap-2 rounded-2xl bg-zippy-teal px-4 py-3 font-black text-white"
        >
          <Check className="h-5 w-5" strokeWidth={3} /> Selesai
        </button>
        <button
          onClick={batal}
          className="btn-pop rounded-2xl bg-zippy-navy/10 px-4 py-3 font-black text-zippy-navy"
        >
          Batal
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------
// Panel utama
// ---------------------------------------------------------------------

export default function PanelMisi({ slug, draf, simpanDraf, tutup, keKelolaPulau }) {
  const [suntingIdx, setSuntingIdx] = useState(null); // indeks misi yang sedang dibuka
  const [pilihTipe, setPilihTipe] = useState(false);
  const [konfirmHapus, setKonfirmHapus] = useState(null);

  const planet = (draf?.planets || []).find((p) => p.slug === slug);
  const daftar = draf?.missions?.[slug] || [];

  if (!planet) {
    return (
      <div className="fixed inset-0 z-[60] grid place-items-center bg-zippy-navy/95 px-6 text-center">
        <div>
          <p className="font-display text-lg font-bold text-white">Pulau tidak ditemukan.</p>
          <p className="mt-2 text-sm font-semibold text-white/60">
            Slug <b>{slug}</b> tidak ada dalam naskah saat ini.
          </p>
          <button
            onClick={keKelolaPulau}
            className="btn-pop mt-4 rounded-2xl bg-zippy-yellow px-5 py-3 font-black text-zippy-navy"
          >
            Buka Kelola Pulau
          </button>
        </div>
      </div>
    );
  }

  function tulisMisi(next) {
    simpanDraf({
      ...draf,
      missions: { ...draf.missions, [slug]: next },
    });
  }

  function tambahMisi(tipe) {
    const m = misiBaru(tipe);
    m.name = `Misi ${daftar.length + 1}`;
    tulisMisi([...daftar, m]);
    setPilihTipe(false);
    setSuntingIdx(daftar.length);
  }

  function geser(i, arah) {
    const j = i + arah;
    if (j < 0 || j >= daftar.length) return;
    const arr = daftar.slice();
    [arr[i], arr[j]] = [arr[j], arr[i]];
    // Nama "Misi N" mengikuti posisi, supaya daftar tidak menampilkan
    // Misi 3, Misi 1, Misi 2 setelah ditukar.
    tulisMisi(arr.map((m, k) => ({ ...m, name: `Misi ${k + 1}` })));
    if (suntingIdx === i) setSuntingIdx(j);
    else if (suntingIdx === j) setSuntingIdx(i);
  }

  function hapusMisi(i) {
    const arr = daftar.filter((_, j) => j !== i);
    tulisMisi(arr.map((m, k) => ({ ...m, name: `Misi ${k + 1}` })));
    setSuntingIdx(null);
    setKonfirmHapus(null);
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-zippy-navy/95 backdrop-blur-md">
      {/* Kepala */}
      <div className="sticky top-0 z-10 border-b-4 border-zippy-teal bg-zippy-navy px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={tutup}
            aria-label="Kembali ke peta"
            className="btn-pop grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/15 text-white"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={3} />
          </button>
          <span
            className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl"
            style={{ backgroundColor: planet.color || "#2AA5A0" }}
          >
            <img src={planet.icon} alt="" loading="lazy" className="h-8 w-8 object-contain" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-base font-bold text-white sm:text-lg">
              {planet.name}
            </span>
            <span className="block truncate text-[11px] font-bold text-zippy-mint">
              {planet.slug} · {daftar.length} misi · penyunting isi soal
            </span>
          </span>
          <button
            onClick={keKelolaPulau}
            className="btn-pop hidden items-center gap-2 rounded-2xl bg-white/15 px-3 py-2 text-xs font-black text-white sm:flex"
          >
            <Globe className="h-4 w-4" strokeWidth={3} /> Kelola Pulau
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-3">
          <p className="rounded-2xl border-2 border-zippy-yellow/50 bg-zippy-yellow/10 px-3 py-2.5 text-[11px] font-bold leading-relaxed text-white/80 sm:text-xs">
            Teks soal dan jawaban di sini <b>langsung tersimpan ke naskah</b>, tetapi belum
            dipakai anak. Tekan <b className="text-zippy-yellow">Terapkan Update</b> di peta
            setelah selesai.
          </p>

          {/* Tambah misi */}
          {pilihTipe ? (
            <div className="rounded-3xl border-4 border-zippy-teal bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-zippy-navy">
                  Pilih tipe misi baru
                </h3>
                <button
                  onClick={() => setPilihTipe(false)}
                  aria-label="Batal"
                  className="grid h-8 w-8 place-items-center rounded-xl bg-zippy-navy/10 text-zippy-navy"
                >
                  <X className="h-4 w-4" strokeWidth={3} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TIPE_MISI.map((t) => {
                  const info = TIPE_INFO[t];
                  return (
                    <button
                      key={t}
                      onClick={() => tambahMisi(t)}
                      className="btn-pop flex items-center gap-2 rounded-2xl border-2 border-zippy-navy/12 px-3 py-3 text-left hover:border-zippy-teal"
                    >
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white ${info.warna}`}>
                        <info.ikon className="h-4 w-4" strokeWidth={3} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-black text-zippy-navy">
                          {info.label}
                        </span>
                        <span className="block text-[10px] font-bold uppercase text-zippy-navy/45">
                          {t}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setPilihTipe(true)}
              className="btn-pop flex w-full items-center justify-center gap-2 rounded-2xl bg-zippy-yellow px-4 py-3 font-black text-zippy-navy"
            >
              <Plus className="h-5 w-5" strokeWidth={3} /> Tambah Misi
            </button>
          )}

          {daftar.length === 0 && (
            <p className="rounded-2xl bg-white/10 px-3 py-3 text-center text-xs font-bold text-white/65">
              Pulau ini belum punya misi sama sekali. Tambahkan minimal satu supaya pulau
              bisa dimainkan.
            </p>
          )}

          {daftar.map((m, i) => {
            const info = TIPE_INFO[m.type] || TIPE_INFO.mcq;
            const terbuka = suntingIdx === i;
            const sedangDihapus = konfirmHapus === m.id;
            return (
              <div key={m.id} className="rounded-3xl border-2 border-white/15 bg-white/10 p-3">
                {!terbuka && (
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-zippy-navy text-xs font-black text-zippy-yellow">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-white">
                        {m.title || "(tanpa judul)"}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-bold text-zippy-mint">
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase text-white ${info.warna}`}>
                          {info.label}
                        </span>
                        <span>{m.rounds.length} putaran</span>
                        <span>{m.reward} koin</span>
                        <span>{m.xp} XP</span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => geser(i, -1)}
                        disabled={i === 0}
                        aria-label="Naikkan urutan"
                        className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-25"
                      >
                        <ChevronUp className="h-4 w-4" strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => geser(i, 1)}
                        disabled={i === daftar.length - 1}
                        aria-label="Turunkan urutan"
                        className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-25"
                      >
                        <ChevronDown className="h-4 w-4" strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => setSuntingIdx(i)}
                        aria-label={`Sunting ${m.title}`}
                        className="btn-pop grid h-8 w-8 place-items-center rounded-xl bg-zippy-teal text-white"
                      >
                        <Puzzle className="h-4 w-4" strokeWidth={3} />
                      </button>
                    </span>
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {terbuka && (
                    <FormMisi
                      m={m}
                      simpan={(nilai) => tulisMisi(daftar.map((x, j) => (j === i ? nilai : x)))}
                      batal={() => setSuntingIdx(null)}
                      hapusMisi={() => {
                        if (sedangDihapus) hapusMisi(i);
                        else {
                          setKonfirmHapus(m.id);
                          setTimeout(() => setKonfirmHapus((k) => (k === m.id ? null : k)), 4000);
                        }
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          <button
            onClick={tutup}
            className="btn-pop flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} /> Kembali ke peta
          </button>

          <button
            onClick={keKelolaPulau}
            className="btn-pop flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/25 px-4 py-3 text-xs font-black text-white/70 sm:hidden"
          >
            <Globe className="h-4 w-4" strokeWidth={3} /> Kelola Pulau
          </button>
        </div>
      </div>
    </div>
  );
}
