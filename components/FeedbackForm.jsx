"use client";

/**
 * Kolom masukan untuk pengembang
 * ===============================
 *
 * Mengapa memakai `mailto:` dan bukan mengirim langsung dari server?
 *
 *   Mengirim email dari dalam aplikasi membutuhkan kredensial SMTP (alamat
 *   beserta kata sandi aplikasinya), yang kalau disimpan di sisi server pun
 *   tetap merupakan rahasia tambahan yang harus dijaga. Formulir biasa yang
 *   diserahkan ke layanan pihak ketiga berarti menyerahkan alamat pengunjung
 *   kepada pihak ketiga lagi.
 *
 *   `mailto:` tidak membutuhkan keduanya. Pesan dirangkum di sini, lalu
 *   aplikasi email pengunjung yang mengirimkannya ke alamat pengembang.
 *   Tidak ada data yang melewati pihak ketiga, tidak ada layanan yang bisa
 *   mati, dan tidak ada rahasia baru yang harus dijaga.
 *
 *   Bila kelak ingin pengiriman sepenuhnya otomatis dari server, tambahkan
 *   berkas rute yang memakai kredensial SMTP - formulir ini sudah
 *   terpisah sehingga bisa ditukar tanpa menyentuh tampilannya.
 *
 * BATAS PENGIRIMAN
 *
 *   Satu hal TETAP melewati server: pengecekan kuota lewat `/api/masukan`
 *   (lima pesan per hari per IP). Batas yang hanya disimpan di peramban
 *   bisa dihapus dalam dua klik, sedangkan server tidak. Lihat berkas rute
 *   tersebut untuk rinciannya.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mail, Check, MessageSquareHeart, Gauge } from "lucide-react";
import { unlockAudio, play } from "@/lib/sfx";

const EMAIL_PENGEMBANG = "deepcrips@outlook.com";

/** Kategori masukan, supaya pengembang bisa menyortir cepat. */
const KATEGORI = [
  { id: "saran", label: "Saran perbaikan" },
  { id: "bug", label: "Ada yang tidak berfungsi" },
  { id: "pujian", label: "Pujian" },
  { id: "konten", label: "Usulan soal / pulau" },
  { id: "lainnya", label: "Lainnya" },
];

const BATAS_PESAN = 1200;

// ---------------------------------------------------------------
// Kuota dan penanda perangkat
// ---------------------------------------------------------------
//
// Batas yang berlaku sesungguhnya ada di server (`/api/masukan`): lima
// pesan per hari per IP, dan pengunjung tidak bisa menghapusnya dari
// Alat Pengembang. Yang di sini hanya LAPISAN TAMPILAN agar pengguna
// langsung tahu sisa kuotanya tanpa harus menunggu jawaban jaringan, dan
// tetap bisa mengirim bila server sedang tidak terjangkau.
//
// `deviceId` adalah pengganti "HWID" yang bisa disediakan peramban.
// Nomor seri asli tidak pernah tersedia bagi situs web (itu memang sengaja),
// jadi yang dipakai adalah UUID acak yang disimpan sekali di perangkat
// tersebut. Server menyimpannya sebagai hash, bukan apa adanya.
// ---------------------------------------------------------------

const BATAS_HARIAN = 5;
const HARI_MS = 24 * 60 * 60 * 1000;
const OFFSET_WIB = 7 * 60 * 60 * 1000;
const KUNCI_KUOTA = "zippyverse_masukan_v1";
const KUNCI_ALAT = "zippyverse_alat_v1";

/** Hari menurut kalender WIB, supaya sama dengan yang dihitung server. */
function hariWib() {
  return Math.floor((Date.now() + OFFSET_WIB) / HARI_MS);
}

/** Baca sisa kuota lokal untuk hari WIB berjalan. */
function bacaKuota() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(KUNCI_KUOTA) || "{}");
    if (raw.hari !== hariWib()) return BATAS_HARIAN;
    return Math.max(0, BATAS_HARIAN - (Number(raw.jumlah) || 0));
  } catch {
    return BATAS_HARIAN;
  }
}

/** Catat penggunaan kuota lokal. `sisa` datang dari server bila ada. */
function tulisKuota(sisa) {
  try {
    window.localStorage.setItem(
      KUNCI_KUOTA,
      JSON.stringify({ hari: hariWib(), jumlah: BATAS_HARIAN - Math.max(0, sisa) })
    );
  } catch {}
}

/** Nomor identifikasi perangkat (pengganti HWID), dibuat sekali. */
function idAlat() {
  try {
    const lama = window.localStorage.getItem(KUNCI_ALAT);
    if (lama) return lama;
    const baru =
      (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
      `alat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(KUNCI_ALAT, baru);
    return baru;
  } catch {
    return null;
  }
}

export default function FeedbackForm() {
  const [nama, setNama] = useState("");
  const [kategori, setKategori] = useState(KATEGORI[0].id);
  const [pesan, setPesan] = useState("");
  const [galat, setGalat] = useState("");
  const [terkirim, setTerkirim] = useState(false);
  const [tautan, setTautan] = useState("");
  const [sisa, setSisa] = useState(BATAS_HARIAN);
  const [sibuk, setSibuk] = useState(false);

  // Baca kuota setelah komponen terpasang: `localStorage` tidak ada di
  // server, jadi tidak boleh dibaca saat render pertama.
  useEffect(() => {
    setSisa(bacaKuota());
  }, []);

  async function kirim(e) {
    e.preventDefault();
    unlockAudio();

    const isi = pesan.trim();
    if (isi.length < 10) {
      setGalat("Tulis minimal 10 huruf supaya masukannya bisa ditindaklanjuti.");
      return;
    }

    // Cek cepat di sini supaya tombol tidak lagi memanggil jaringan bila
    // kuota sudah habis hari ini.
    const lokal = bacaKuota();
    if (lokal <= 0) {
      setGalat(
        `Batas ${BATAS_HARIAN} pesan per hari sudah tercapai. Kuota berikutnya tersedia besok.`
      );
      setSisa(0);
      return;
    }

    setGalat("");
    setSibuk(true);

    // Penjaga sesungguhnya ada di server. Bila di sini ditolak, formulir
    // berhenti - pesan tidak akan sempat dibuka di aplikasi email.
    let sisaServer = lokal;
    try {
      const ac = new AbortController();
      const jeda = setTimeout(() => ac.abort(), 7000);
      const r = await fetch("/api/masukan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nama: nama.trim(),
          kategori,
          pesan: isi,
          deviceId: idAlat(),
        }),
        signal: ac.signal,
      });
      clearTimeout(jeda);

      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) {
        setSibuk(false);
        setGalat(d.pesan || "Pengiriman ditolak. Coba lagi nanti.");
        if (r.status === 429) {
          setSisa(0);
          tulisKuota(0);
        }
        return;
      }
      sisaServer = typeof d.sisa === "number" ? d.sisa : Math.max(0, lokal - 1);
      tulisKuota(sisaServer);
    } catch {
      // Server tidak terjangkau. Kuota lokal dipakai sebagai cadangan
      // supaya formulir tidak mati total, dan batasnya tetap 5 per hari.
      sisaServer = Math.max(0, lokal - 1);
      tulisKuota(sisaServer);
    }

    setSisa(sisaServer);
    setSibuk(false);
    play("levelup");

    const judul = `[ZippyVerse] ${
      KATEGORI.find((k) => k.id === kategori)?.label || "Masukan"
    }${nama.trim() ? ` dari ${nama.trim()}` : ""}`;

    // Body disusun sebagai teks biasa. `%0D%0A` dipakai untuk baris baru
    // karena `mailto:` tidak menerima karakter newline mentah.
    const baris = [
      `Nama : ${nama.trim() || "(tidak disebutkan)"}`,
      `Kategori : ${KATEGORI.find((k) => k.id === kategori)?.label || kategori}`,
      `Waktu : ${new Date().toLocaleString("id-ID")}`,
      `Sisa kuota hari ini : ${sisaServer} dari ${BATAS_HARIAN}`,
      "",
      "Pesan:",
      isi,
    ];
    const url =
      `mailto:${EMAIL_PENGEMBANG}` +
      `?subject=${encodeURIComponent(judul)}` +
      `&body=${encodeURIComponent(baris.join("\n"))}`;

    setTautan(url);
    setTerkirim(true);
    // Jendela email dibuka setelah state tersimpan, supaya komponen sudah
    // menampilkan layar "terkirim" bahkan bila peramban menahan popup.
    window.location.href = url;
  }

  function ulangi() {
    setTerkirim(false);
    setPesan("");
    setGalat("");
  }

  return (
    <div className="relative overflow-hidden rounded-[30px] border-4 border-zippy-teal bg-white/10 p-5 backdrop-blur sm:p-7">
      {/* Pita dekoratif yang sama dengan kartu akun, supaya terasa satu keluarga */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5"
        style={{ background: "linear-gradient(90deg, #FFC93C, #2AA5A0, #B2D8D5)" }}
      />

      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-zippy-yellow text-zippy-navy shadow-pop">
          <MessageSquareHeart className="h-6 w-6" strokeWidth={2.6} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
            Kirim masukan ke pengembang
          </h2>
          <p className="mt-1 text-sm font-semibold text-white/65">
            Ada yang kurang? Ada ide? Pesan Anda dibaca langsung oleh pembuat
            ZippyVerse.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {terkirim ? (
          /* ------------------------------------------------ Layar sukses */
          <motion.div
            key="sukses"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 180, damping: 18 }}
            className="mt-5 rounded-3xl border-2 border-emerald-400/60 bg-emerald-500/15 p-5 text-center"
          >
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-pop">
              <Check className="h-8 w-8" strokeWidth={3.5} />
            </span>
            <p className="mt-3 font-display text-lg font-bold text-white">
              Aplikasi email Anda sedang dibuka
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm font-semibold text-white/70">
              Pesan sudah dirangkum. Tekan <b className="text-white">Kirim</b>{" "}
              di aplikasi email untuk mengantarkannya ke pengembang.
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <motion.a
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                href={tautan}
                className="inline-flex items-center gap-2 rounded-2xl bg-zippy-yellow px-4 py-2.5 text-sm font-black text-zippy-navy"
              >
                <Mail className="h-4 w-4" strokeWidth={3} />
                Buka lagi
              </motion.a>
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={ulangi}
                className="rounded-2xl border-2 border-white/35 px-4 py-2.5 text-sm font-black text-white transition hover:border-white/70 hover:bg-white/10"
              >
                Tulis lagi
              </motion.button>
            </div>

            <p className="mt-4 break-all rounded-2xl bg-black/25 px-3 py-2 text-[11px] font-semibold text-white/55">
              Alamat pengembang: {EMAIL_PENGEMBANG}
            </p>
          </motion.div>
        ) : (
          /* ----------------------------------------------------- Formulir */
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={kirim}
            className="mt-5 space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black text-zippy-mint">
                  Nama <span className="font-bold text-white/45">(boleh kosong)</span>
                </span>
                <input
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  maxLength={40}
                  placeholder="Contoh: Bunda Deka"
                  className="w-full rounded-2xl border-2 border-white/15 bg-white/95 px-4 py-3 text-sm font-bold text-zippy-navy outline-none transition placeholder:text-zippy-navy/40 focus:border-zippy-yellow"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black text-zippy-mint">
                  Jenis masukan
                </span>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full appearance-none rounded-2xl border-2 border-white/15 bg-white/95 px-4 py-3 text-sm font-bold text-zippy-navy outline-none transition focus:border-zippy-yellow"
                >
                  {KATEGORI.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-black text-zippy-mint">
                <span>Pesan Anda</span>
                <span
                  className={`font-bold ${
                    pesan.length > BATAS_PESAN - 120 ? "text-zippy-yellow" : "text-white/45"
                  }`}
                >
                  {pesan.length}/{BATAS_PESAN}
                </span>
              </span>
              <textarea
                value={pesan}
                onChange={(e) => {
                  setPesan(e.target.value.slice(0, BATAS_PESAN));
                  setGalat("");
                }}
                rows={5}
                placeholder="Tulis di sini... misalnya: sebaiknya pulau musik menampilkan partitur sederhana."
                className="w-full resize-y rounded-2xl border-2 border-white/15 bg-white/95 px-4 py-3 text-sm font-semibold leading-relaxed text-zippy-navy outline-none transition placeholder:text-zippy-navy/40 focus:border-zippy-yellow"
              />
            </label>

            {galat && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-red-500/25 px-4 py-2.5 text-center text-xs font-black text-red-200"
              >
                {galat}
              </motion.p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <motion.button
                type="submit"
                disabled={sibuk || sisa <= 0}
                whileHover={sibuk || sisa <= 0 ? undefined : { scale: 1.03, y: -2 }}
                whileTap={sibuk || sisa <= 0 ? undefined : { scale: 0.96 }}
                className="btn-pop flex items-center gap-2 rounded-2xl bg-zippy-yellow px-6 py-3 text-base font-black text-zippy-navy transition disabled:cursor-not-allowed disabled:opacity-55"
              >
                {sibuk ? "Mengirim..." : "Kirim ke Pengembang"}
                <Send className="h-5 w-5" strokeWidth={3} />
              </motion.button>

              <span
                title="Batas pesan yang dapat dikirim hari ini"
                className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-black ${
                  sisa > 0
                    ? "bg-white/10 text-zippy-mint"
                    : "bg-zippy-yellow/25 text-zippy-yellow"
                }`}
              >
                <Gauge className="h-4 w-4" strokeWidth={3} />
                Sisa hari ini: {sisa} dari {BATAS_HARIAN}
              </span>

              <a
                href={`mailto:${EMAIL_PENGEMBANG}`}
                className="inline-flex items-center gap-1.5 text-xs font-black text-zippy-mint underline underline-offset-4 transition hover:text-zippy-yellow"
              >
                <Mail className="h-4 w-4" strokeWidth={3} />
                Atau kirim manual ke {EMAIL_PENGEMBANG}
              </a>
            </div>

            <p className="rounded-2xl bg-white/6 px-4 py-2.5 text-[11px] font-semibold leading-relaxed text-white/55">
              Pesan dibuka di aplikasi email Anda lalu dikirim langsung ke
              pengembang. <b className="text-white/75">Tidak ada pihak ketiga</b>{" "}
              yang ikut meneruskan. Demi kenyamanan bersama, pengiriman
              dibatasi <b className="text-white/75">{BATAS_HARIAN} pesan per hari</b> -
              server hanya menyimpan catatan berupa hash untuk menahan spam,
              bukan alamat maupun isi pesan Anda.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
