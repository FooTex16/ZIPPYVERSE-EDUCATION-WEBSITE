"use client";

/**
 * Panel Kelola Pulau — ruang tambah/hapus/ubah pulau.
 *
 * Dibuka sebagai LAPISAN di atas halaman peta, bukan sebagai halaman terpisah.
 * Alasannya bukan sekadar singkat: halaman peta sudah memeriksa peran
 * pengelola lewat token sesi SEBELUM menampilkan apa pun, sehingga panel warisan
 * pemeriksaan yang sama. Memasangnya di rute baru berarti harus memasang gerbang
 * kedua yang bisa saja lupa - dan satu pintu tanpa gerbang sudah cukup untuk
 * membuat siapa pun menyunting isi situs.
 *
 * SEGALA SUNTINGAN DI SINI MENULIS NASKAH, BUKAN AWAN.
 * Tombol "Terapkan Update" pada bilah di atas peta lah yang menyebarkannya.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Lock,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  GripVertical,
} from "lucide-react";
import { ZIPPY_IMG } from "@/lib/gameData";

/** Berkas gambar yang benar-benar ada di public/. Tidak ada unggahan. */
const IKON_PULAU = [
  "/islands/angka.webp",
  "/islands/kata.webp",
  "/islands/sains.webp",
  "/islands/kreatif.webp",
  "/islands/bumi.webp",
  "/islands/inggris.svg",
  "/islands/musik.svg",
  "/islands/digital.svg",
  ...Object.values(ZIPPY_IMG),
];

/** Warna resmi palet ZippyVerse + dua pendukung yang sudah dipakai peta. */
const WARNA = ["#FFC93C", "#2AA5A0", "#4FB3AE", "#7FC5C1", "#B2D8D5", "#0F2C3D"];

const SUBJEK = [
  "Matematika",
  "Bahasa Indonesia",
  "IPA",
  "Seni & Logika",
  "IPS",
  "Bahasa Inggris",
  "Seni Musik",
  "Teknologi",
];

/** Ubah nama bebas menjadi slug yang sah dan unik. */
function buatSlug(nama, dipakai) {
  const dasar =
    String(nama)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "pulau-baru";
  if (!dipakai.has(dasar)) return dasar;
  for (let i = 2; i < 200; i++) {
    const c = `${dasar}-${i}`.slice(0, 40);
    if (!dipakai.has(c)) return c;
  }
  return `${dasar}-${Date.now()}`.slice(0, 40);
}

/** Pulau yang TIDAK BOLEH disunting atau dihapus pengelola. */
const terkunci = (p) => Boolean(p.trial);

export default function PanelPulau({ draf, simpanDraf, tutup }) {
  const [form, setForm] = useState(null); // null = tertutup; objek = sedang menyunting
  const [konfirmHapus, setKonfirmHapus] = useState(null);
  const [galat, setGalat] = useState("");

  const planets = draf?.planets || [];
  const setPlanet = (i, patch) => {
    const next = { ...draf, planets: planets.map((p, j) => (i === j ? { ...p, ...patch } : p)) };
    simpanDraf(next);
  };

  function bukaBaru() {
    const dipakai = new Set(planets.map((p) => p.slug));
    setGalat("");
    setForm({
      _baru: true,
      slug: buatSlug("Pulau Baru", dipakai),
      name: "",
      subject: "",
      icon: IKON_PULAU[0],
      color: "#FFC93C",
      tagline: "",
      desc: "",
      atas: 50,
      kiri: 50,
      soon: false,
    });
  }

  function bukaUbah(p) {
    const pos = p.positions?.lg || p.pos || {};
    setGalat("");
    setForm({
      _baru: false,
      _slug: p.slug,
      slug: p.slug,
      name: p.name || "",
      subject: p.subject || "",
      icon: p.icon || IKON_PULAU[0],
      color: p.color || "#FFC93C",
      tagline: p.tagline || "",
      desc: p.desc || "",
      atas: parseFloat(pos.top) || 50,
      kiri: parseFloat(pos.left) || 50,
      soon: Boolean(p.soon),
    });
  }

  function simpanForm() {
    const f = form;
    const nama = String(f.name || "").trim();
    if (nama.length < 2) {
      setGalat("Nama pulau minimal 2 huruf.");
      return;
    }
    if (nama.length > 60) {
      setGalat("Nama pulau maksimal 60 huruf.");
      return;
    }

    // Slug lama dipertahankan apa adanya. Menggantinya akan membuat tautan
    // /pulau/<slug> lama putus dan, yang lebih penting, seluruh misi pulau
    // ini tertinggal (misi dirujuk lewat slug, bukan lewat nama).
    const dipakai = new Set(planets.map((p) => p.slug));
    let slug = f.slug;
    if (f._baru) {
      slug = buatSlug(nama, dipakai);
    } else if (!/^[a-z0-9-]{1,40}$/.test(slug)) {
      setGalat("Slug tidak sah: huruf kecil, angka, dan strip saja.");
      return;
    } else if (dipakai.has(slug) && slug !== f._slug) {
      setGalat("Slug itu sudah dipakai pulau lain.");
      return;
    }

    const persen = (n) => `${Math.min(100, Math.max(0, Number(n) || 0))}%`;

    // ---------------------------------------------------- pulau BARU
    if (f._baru) {
      const pos = { top: persen(f.atas), left: persen(f.kiri) };
      const baru = {
        slug,
        name: nama,
        subject: String(f.subject || "").slice(0, 40) || null,
        icon: f.icon,
        color: f.color,
        tagline: String(f.tagline || "").slice(0, 90),
        desc: String(f.desc || "").slice(0, 240),
        positions: { sm: pos, md: pos, lg: pos },
        pos,
        soon: Boolean(f.soon),
        available: !Boolean(f.soon),
        trial: false,
      };
      simpanDraf({ ...draf, planets: [...planets, baru] });
      setForm(null);
      setGalat("");
      return;
    }

    // ------------------------------------------------- pulau LAMA
    //
    // Hanya kolom yang benar-benar berubah yang ditulis ulang. Dua alasan:
    //
    // 1. Formulir mempunyai SATU pasang penggeser, sedangkan pulau bawaan
    //    mempunyai posisi berbeda untuk HP, tablet, dan desktop. Menimpa
    //    seluruh objek akan diam-diam memaksa posisi desktop ke layar kecil,
    //    dan pulau langsung tumpang tindih tanpa ada yang mengubah apa pun.
    //
    // 2. Menyimpan tanpa mengubah apa pun harus menghasilkan objek yang
    //    persis sama dengan aslinya. Kalau tidak, status naskah langsung
    //    berubah menjadi "belum diterapkan" hanya gara-gara membuka dan
    //    menutup formulir, lalu developer salah mengira ia sudah mengubah
    //    sesuatu dan menekan Terapkan Update tanpa perlu.
    const i = planets.findIndex((p) => p.slug === f._slug);
    if (i < 0) {
      setGalat("Pulau itu sudah tidak ada.");
      return;
    }
    const asli = planets[i];
    const beda = (a, b) => JSON.stringify(a) !== JSON.stringify(b);

    const subjek = String(f.subject || "").slice(0, 40) || null;
    const tagline = String(f.tagline || "").slice(0, 90);
    const desc = String(f.desc || "").slice(0, 240);
    const lgAsli = asli.positions?.lg || asli.pos || {};
    const digeser =
      parseFloat(lgAsli.top) !== Number(f.atas) || parseFloat(lgAsli.left) !== Number(f.kiri);

    const ganti = { ...asli };
    if (slug !== asli.slug) ganti.slug = slug;
    if (beda(nama, asli.name)) ganti.name = nama;
    if (beda(subjek, asli.subject ?? null)) ganti.subject = subjek;
    if (beda(f.icon, asli.icon)) ganti.icon = f.icon;
    if (beda(f.color, asli.color)) ganti.color = f.color;
    if (beda(tagline, asli.tagline || "")) ganti.tagline = tagline;
    if (beda(desc, asli.desc || "")) ganti.desc = desc;
    if (Boolean(f.soon) !== Boolean(asli.soon)) {
      ganti.soon = Boolean(f.soon);
      ganti.available = !ganti.soon;
    }
    if (digeser) {
      const pos = { top: persen(f.atas), left: persen(f.kiri) };
      ganti.positions = { sm: pos, md: pos, lg: pos };
      ganti.pos = pos;
    }

    // Slug berubah? Misi harus ikut pindah supaya pulau tidak jadi kosong.
    const missions = { ...draf.missions };
    if (slug !== f._slug && missions[f._slug]) {
      missions[slug] = missions[f._slug];
      delete missions[f._slug];
    }

    simpanDraf({ ...draf, planets: planets.map((p, j) => (i === j ? ganti : p)), missions });

    setForm(null);
    setGalat("");
  }

  function geser(i, arah) {
    const j = i + arah;
    // Posisi 0 adalah Pulau Perkenalan dan posisi 1 adalah pulau pertama
    // yang harus ditamatkan anak. Keduanya tidak boleh bertukar tempat:
    // rantai permainan dibaca dari urutan array, dan menaruh pulau biasa di
    // urutan pertama akan membuat tamu kehilangan satu-satunya pulau
    // yang boleh ia mainkan.
    if (j < 1 || j >= planets.length) return;
    if (i < 1) return;
    const arr = planets.slice();
    [arr[i], arr[j]] = [arr[j], arr[i]];
    simpanDraf({ ...draf, planets: arr });
  }

  function hapus(p) {
    if (konfirmHapus !== p.slug) {
      setKonfirmHapus(p.slug);
      return;
    }
    const missions = { ...draf.missions };
    delete missions[p.slug];
    simpanDraf({ ...draf, planets: planets.filter((x) => x.slug !== p.slug), missions });
    setKonfirmHapus(null);
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-zippy-navy/95 backdrop-blur-md">
      {/* Kepala panel */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b-4 border-zippy-teal bg-zippy-navy px-4 py-3 sm:px-6">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-zippy-yellow text-zippy-navy">
          <Globe className="h-5 w-5" strokeWidth={3} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold text-white sm:text-xl">Kelola Pulau</h2>
          <p className="truncate text-[11px] font-bold text-zippy-mint">
            {planets.length} pulau dalam naskah · belum diterapkan ke pemain
          </p>
        </div>
        <button
          onClick={bukaBaru}
          className="btn-pop flex items-center gap-2 rounded-2xl bg-zippy-yellow px-3 py-2 text-xs font-black text-zippy-navy sm:text-sm"
        >
          <Plus className="h-4 w-4" strokeWidth={3} /> <span className="hidden sm:inline">Tambah</span>
        </button>
        <button
          onClick={tutup}
          aria-label="Tutup panel"
          className="btn-pop grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/15 text-white"
        >
          <X className="h-5 w-5" strokeWidth={3} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-3">
          <p className="rounded-2xl border-2 border-zippy-yellow/50 bg-zippy-yellow/10 px-3 py-2.5 text-[11px] font-bold leading-relaxed text-white/80 sm:text-xs">
            Semua perubahan di sini disimpan sebagai <b>naskah</b> di perangkat ini.
            Pemain tidak melihatnya sampai Anda menekan{" "}
            <b className="text-zippy-yellow">Terapkan Update</b> pada bilah di atas peta.
          </p>

          {galat && (
            <div className="rounded-2xl bg-red-500/90 px-3 py-2.5 text-xs font-black text-white" role="alert">
              {galat}
            </div>
          )}

          {/* Formulir tambah/ubah */}
          {form && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border-4 border-zippy-teal bg-white p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-zippy-navy">
                  {form._baru ? "Tambah Pulau Baru" : "Ubah Pulau"}
                </h3>
                <button
                  onClick={() => {
                    setForm(null);
                    setGalat("");
                  }}
                  aria-label="Batal"
                  className="grid h-8 w-8 place-items-center rounded-xl bg-zippy-navy/10 text-zippy-navy"
                >
                  <X className="h-4 w-4" strokeWidth={3} />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-zippy-navy/60">
                    Nama pulau
                  </span>
                  <input
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((f) => ({ ...f, name }));
                    }}
                    placeholder="Misal: Pulau Angka"
                    maxLength={60}
                    className="w-full rounded-2xl border-2 border-zippy-navy/15 px-3 py-2.5 text-sm font-bold text-zippy-navy outline-none focus:border-zippy-teal"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-zippy-navy/60">
                    Mata pelajaran
                  </span>
                  <input
                    value={form.subject}
                    list="daftar-subjek"
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="Misal: Matematika"
                    maxLength={40}
                    className="w-full rounded-2xl border-2 border-zippy-navy/15 px-3 py-2.5 text-sm font-bold text-zippy-navy outline-none focus:border-zippy-teal"
                  />
                  <datalist id="daftar-subjek">
                    {SUBJEK.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-zippy-navy/60">
                    Kalimat ajakan (tagline)
                  </span>
                  <input
                    value={form.tagline}
                    onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                    placeholder="Misal: Ayo hitung bareng!"
                    maxLength={90}
                    className="w-full rounded-2xl border-2 border-zippy-navy/15 px-3 py-2.5 text-sm font-bold text-zippy-navy outline-none focus:border-zippy-teal"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-zippy-navy/60">
                    Deskripsi singkat
                  </span>
                  <textarea
                    value={form.desc}
                    onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
                    rows={2}
                    maxLength={240}
                    placeholder="Ditampilkan pada kartu pulau di peta."
                    className="w-full resize-none rounded-2xl border-2 border-zippy-navy/15 px-3 py-2.5 text-sm font-semibold text-zippy-navy outline-none focus:border-zippy-teal"
                  />
                  <span className="mt-1 block text-right text-[10px] font-bold text-zippy-navy/45">
                    {form.desc.length}/240
                  </span>
                </label>
              </div>

              {/* Ikon */}
              <div className="mt-3">
                <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-zippy-navy/60">
                  Ikon (dari aset yang sudah ada)
                </span>
                <div className="flex flex-wrap gap-2">
                  {IKON_PULAU.map((src) => (
                    <button
                      key={src}
                      onClick={() => setForm((f) => ({ ...f, icon: src }))}
                      title={src}
                      className={`grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border-4 transition ${
                        form.icon === src
                          ? "border-zippy-teal bg-zippy-mint/40"
                          : "border-zippy-navy/10 bg-zippy-navy/5 hover:border-zippy-navy/30"
                      }`}
                    >
                      <img src={src} alt="" loading="lazy" className="h-9 w-9 object-contain" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Warna */}
              <div className="mt-3">
                <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-zippy-navy/60">
                  Warna pulau
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {WARNA.map((w) => (
                    <button
                      key={w}
                      onClick={() => setForm((f) => ({ ...f, color: w }))}
                      aria-label={`Warna ${w}`}
                      style={{ backgroundColor: w }}
                      className={`h-9 w-9 rounded-full border-4 transition ${
                        form.color === w ? "border-zippy-navy scale-110" : "border-white/70"
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    value={/^#[0-9a-f]{6}$/i.test(form.color) ? form.color : "#FFC93C"}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    aria-label="Warna khusus"
                    className="h-9 w-9 cursor-pointer rounded-full border-2 border-zippy-navy/20 bg-transparent"
                  />
                </div>
              </div>

              {/* Posisi */}
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 flex items-baseline justify-between text-[11px] font-black uppercase tracking-wide text-zippy-navy/60">
                    Posisi dari atas <b className="text-zippy-teal">{form.atas}%</b>
                  </span>
                  <input
                    type="range"
                    min={4}
                    max={92}
                    value={form.atas}
                    onChange={(e) => setForm((f) => ({ ...f, atas: Number(e.target.value) }))}
                    className="w-full accent-zippy-teal"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 flex items-baseline justify-between text-[11px] font-black uppercase tracking-wide text-zippy-navy/60">
                    Posisi dari kiri <b className="text-zippy-teal">{form.kiri}%</b>
                  </span>
                  <input
                    type="range"
                    min={4}
                    max={92}
                    value={form.kiri}
                    onChange={(e) => setForm((f) => ({ ...f, kiri: Number(e.target.value) }))}
                    className="w-full accent-zippy-teal"
                  />
                </label>
                <p className="text-[10px] font-bold leading-relaxed text-zippy-navy/50 sm:col-span-2">
                  Pulau baru memakai posisi yang sama untuk HP, tablet, dan desktop.
                  Bila tumpang tindih dengan pulau lain, geser penggeser di atas lalu
                  periksa tampilannya di peta.
                </p>
              </div>

              <label className="mt-3 flex items-center gap-2.5 rounded-2xl bg-zippy-navy/5 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={form.soon}
                  onChange={(e) => setForm((f) => ({ ...f, soon: e.target.checked }))}
                  className="h-5 w-5 accent-zippy-teal"
                />
                <span className="text-xs font-bold text-zippy-navy">
                  Tandai &quot;segera hadir&quot; (terkunci, belum punya misi)
                </span>
              </label>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={simpanForm}
                  className="btn-pop flex flex-1 items-center justify-center gap-2 rounded-2xl bg-zippy-teal px-4 py-3 font-black text-white"
                >
                  <Check className="h-5 w-5" strokeWidth={3} /> Simpan ke Naskah
                </button>
                <button
                  onClick={() => {
                    setForm(null);
                    setGalat("");
                  }}
                  className="btn-pop rounded-2xl bg-zippy-navy/10 px-4 py-3 font-black text-zippy-navy"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          )}

          {/* Daftar pulau */}
          {planets.map((p, i) => {
            const kunci = terkunci(p);
            const jumlahMisi = draf?.missions?.[p.slug]?.length || 0;
            const sedangDihapus = konfirmHapus === p.slug;
            return (
              <div
                key={p.slug}
                className={`flex items-center gap-3 rounded-3xl border-2 p-3 ${
                  kunci
                    ? "border-zippy-yellow/50 bg-zippy-yellow/10"
                    : "border-white/15 bg-white/10"
                }`}
              >
                <span className="shrink-0 text-white/30">
                  <GripVertical className="h-5 w-5" strokeWidth={2.5} />
                </span>
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl"
                  style={{ backgroundColor: p.color || "#2AA5A0" }}
                >
                  <img src={p.icon} alt="" loading="lazy" className="h-9 w-9 object-contain" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-black text-white">{p.name}</span>
                    {p.soon && (
                      <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-black uppercase text-white/70">
                        Segera
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-[11px] font-bold text-zippy-mint">
                    {p.slug} · {jumlahMisi} misi{p.subject ? ` · ${p.subject}` : ""}
                  </span>
                </span>

                {!kunci && (
                  <span className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => geser(i, -1)}
                      disabled={i <= 1}
                      aria-label="Naikkan urutan"
                      className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-25"
                    >
                      <ChevronUp className="h-4 w-4" strokeWidth={3} />
                    </button>
                    <button
                      onClick={() => geser(i, 1)}
                      disabled={i === 0 || i === planets.length - 1}
                      aria-label="Turunkan urutan"
                      className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-25"
                    >
                      <ChevronDown className="h-4 w-4" strokeWidth={3} />
                    </button>
                    <button
                      onClick={() => bukaUbah(p)}
                      aria-label={`Ubah ${p.name}`}
                      className="grid h-8 w-8 place-items-center rounded-xl bg-zippy-teal text-white transition hover:brightness-110"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={3} />
                    </button>
                    <button
                      onClick={() => hapus(p)}
                      onBlur={() => setKonfirmHapus((k) => (k === p.slug ? null : k))}
                      aria-label={`Hapus ${p.name}`}
                      className={`grid h-8 w-8 place-items-center rounded-xl transition ${
                        sedangDihapus ? "bg-red-500 text-white" : "bg-red-500/25 text-red-200 hover:bg-red-500/45"
                      }`}
                      title={sedangDihapus ? "Tekan sekali lagi untuk menghapus" : "Hapus pulau"}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={3} />
                    </button>
                  </span>
                )}

                {kunci && (
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-zippy-yellow px-2.5 py-1 text-[10px] font-black text-zippy-navy">
                    <Lock className="h-3.5 w-3.5" strokeWidth={3} /> Terkunci
                  </span>
                )}

                {sedangDihapus && (
                  <span className="shrink-0 text-[11px] font-black text-red-300">
                    Tekan lagi untuk menghapus
                  </span>
                )}
              </div>
            );
          })}

          <p className="rounded-2xl border-2 border-dashed border-white/25 px-4 py-3 text-center text-[11px] font-bold leading-relaxed text-white/65 sm:text-xs">
            Untuk menyunting <b className="text-white/90">teks soal dan jawabannya</b>,
            tutup panel ini lalu <b className="text-white/90">ketuk pulau</b> yang diinginkan
            di peta dan tekan <b className="text-white/90">Masuk</b>.
          </p>

          <button
            onClick={() => {
              setKonfirmHapus(null);
              tutup();
            }}
            className="btn-pop flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={3} /> Selesai - kembali ke peta
          </button>
        </div>
      </div>
    </div>
  );
}
