"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Mail, KeyRound, AlertTriangle, Check, Users } from "lucide-react";
import Link from "next/link";
import SpaceBackdrop from "@/components/SpaceBackdrop";
import Zippy from "@/components/Zippy";
import { unlockAudio, play } from "@/lib/sfx";
import { supabase, supabaseEnabled } from "@/lib/supabase";
import { update, load } from "@/lib/store";
import { lepasProfil } from "@/lib/profil";

/**
 * Halaman Daftar / Masuk.
 *
 * Ditujukan kepada ORANG TUA, bukan anak. Satu akun keluarga memuat banyak
 * profil anak, jadi yang mendaftar di sini adalah orang tua dengan emailnya
 * sendiri. Anak tidak dimintai email maupun kata sandi.
 *
 * Peran (role) disimpan Supabase di `app_metadata` sehingga tidak bisa
 * diubah dari sisi browser. Halaman ini tidak pernah menentukan peran -
 * peran dibaca dari sesi yang sudah terbentuk.
 */
export default function HalamanDaftar() {
  const router = useRouter();
  const [mode, setMode] = useState("daftar"); // "daftar" | "masuk"
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState(null); // { jenis: "sukses"|"galat", teks }
  const [sudahMasuk, setSudahMasuk] = useState(null); // email aktif

  /**
   * Tulis penanda akun Pendamping ke simpanan perangkat.
   *
   * Penanda inilah yang membuka lima pulau asli. Tanpanya pengunjung tetap
   * dihitung tamu dan hanya boleh memainkan Pulau Perkenalan, jadi fungsi ini
   * adalah sakelar utama antara mode tamu dan mode anggota.
   */
  function tandaiMasuk(user) {
    if (!user?.email) return;
    update((s) => ({
      ...s,
      pendamping: { id: user.id || null, email: user.email },
    }));
  }

  function tandaiKeluar() {
    // Reset penuh, sama persis dengan tombol "Keluar" di halaman utama.
    //
    // Versi lama hanya menghapus empat kunci akun, tetapi SIMPANAN AKTIF
    // dibiarkan utuh. Padahal blob aktif saat orang tua keluar adalah milik
    // anak yang terakhir bermain (koin, pulau, kostumnya), jadi tamu
    // berikutnya tetap mewarisi kemajuannya. lepasProfil() mengembalikan
    // seluruh simpanan ke keadaan awal instalasi.
    lepasProfil();
  }

  useEffect(() => {
    let batal = false;
    (async () => {
      if (!supabaseEnabled) return;
      try {
        const { data } = await supabase.auth.getSession();
        if (batal) return;
        const u = data?.session?.user;
        if (u?.email) {
          setSudahMasuk(u.email);
          // Sesi Supabase bertahan walau localStorage perangkat sempat
          // dibersihkan. Samakan penanda supaya anak tidak tiba-tiba
          // dikurung hanya di Pulau Perkenalan.
          tandaiMasuk(u);
        }
      } catch {}
    })();
    return () => {
      batal = true;
    };
  }, []);

  /** Terjemahkan pesan galat Supabase ke bahasa yang dimengerti orang tua. */
  function bahasaIndonesia(pesanAsli) {
    const p = (pesanAsli || "").toLowerCase();
    if (p.includes("invalid login credentials")) return "Email atau kata sandi salah.";
    if (p.includes("already registered")) return "Email ini sudah terdaftar. Coba tab Masuk.";
    if (p.includes("password should be at least"))
      return "Kata sandi minimal 6 karakter.";
    if (p.includes("email not confirmed"))
      return "Email belum dikonfirmasi. Buka tautan konfirmasi yang dikirim ke kotak masuk email Anda.";
    if (p.includes("rate limit") || p.includes("too many"))
      return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
    if (p.includes("failed to fetch") || p.includes("network"))
      return "Tidak bisa tersambung ke server. Periksa koneksi internet Anda.";
    return pesanAsli || "Terjadi kesalahan. Silakan coba lagi.";
  }

  async function kirim(e) {
    e.preventDefault();
    if (sibuk) return;
    setPesan(null);

    const alamat = email.trim().toLowerCase();
    if (!alamat || !sandi) {
      setPesan({ jenis: "galat", teks: "Email dan kata sandi wajib diisi." });
      return;
    }

    setSibuk(true);
    try {
      if (mode === "daftar") {
        if (sandi.length < 6) {
          setPesan({ jenis: "galat", teks: "Kata sandi minimal 6 karakter." });
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: alamat,
          password: sandi,
        });
        if (error) {
          setPesan({ jenis: "galat", teks: bahasaIndonesia(error.message) });
          return;
        }
        // Supabase bisa saja meminta konfirmasi email lebih dulu. Kalau sesi
        // sudah terbentuk, akun langsung bisa dipakai.
        if (data.session) {
          unlockAudio();
          play("yeay");
          tandaiMasuk(data.session.user);
          setPesan({
            jenis: "sukses",
            teks: "Akun keluarga berhasil dibuat. Selamat datang!",
          });
          // Buka HALAMAN AWAL, bukan /peta. Di halaman awal akun langsung
          // terlihat: alamat surel, daftar anak, dan tombol tambah anak.
          // Ke /peta justru akan menampilkan blob tamu yang masih tersimpan
          // dari percobaan sebelumnya, seolah akunnya belum pernah ada.
          setTimeout(() => router.push("/"), 900);
        } else {
          setPesan({
            jenis: "sukses",
            teks: "Pendaftaran diterima. Silakan cek email Anda untuk mengaktifkan akun, lalu kembali ke halaman ini dan masuk.",
          });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: alamat,
          password: sandi,
        });
        if (error) {
          setPesan({ jenis: "galat", teks: bahasaIndonesia(error.message) });
          return;
        }
        unlockAudio();
        play("yeay");
        tandaiMasuk(data?.session?.user);
        setPesan({ jenis: "sukses", teks: "Berhasil masuk. Membuka ZippyVerse..." });
        // Ke HALAMAN AWAL, bukan /peta. Orang tua baru masuk harus langsung
        // melihat kartu akunnya beserta daftar anak. Bila langsung ke /peta,
        // blob aktif masih berisi simpanan TAMU dari sebelum masuk, sehingga
        // peta menampilkan akun tamu - persis keluhan yang memicu perbaikan
        // ini. Dari halaman awal mereka memilih nama anak lebih dulu.
        setTimeout(() => router.push("/"), 900);
      }
    } catch (err) {
      setPesan({ jenis: "galat", teks: bahasaIndonesia(err?.message) });
    } finally {
      setSibuk(false);
    }
  }

  async function keluar() {
    if (supabaseEnabled) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    tandaiKeluar();
    setSudahMasuk(null);
    setPesan({ jenis: "sukses", teks: "Anda sudah keluar dari akun." });
  }

  return (
    <main className="space-bg relative grid min-h-screen place-items-center overflow-hidden px-5 py-8">
      <SpaceBackdrop />

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          onClick={() => unlockAudio()}
          className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={3} />
          Kembali
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card-pop rounded-[30px] border-4 border-zippy-teal bg-cream p-6 sm:p-7"
        >
          {/* Kepala kartu */}
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-zippy-mint">
              <img
                src="/zippy/menyapa.webp"
                alt=""
                className="h-12 w-12 object-contain"
                decoding="async"
              />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold text-zippy-navy sm:text-2xl">
                {mode === "daftar" ? "Buat Akun Keluarga" : "Masuk Akun"}
              </h1>
              <p className="text-xs font-bold text-zippy-navy/60 sm:text-sm">
                {mode === "daftar"
                  ? "Satu akun, banyak profil anak."
                  : "Lanjutkan progres Anda."}
              </p>
            </div>
          </div>

          {/* Tab Daftar / Masuk */}
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-zippy-navy/10 p-1.5">
            {[
              ["daftar", "Daftar"],
              ["masuk", "Masuk"],
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setMode(k);
                  setPesan(null);
                }}
                className={`rounded-xl px-3 py-2.5 text-sm font-black transition ${
                  mode === k
                    ? "bg-zippy-yellow text-zippy-navy shadow-pop"
                    : "text-zippy-navy/60 hover:text-zippy-navy"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sudah masuk */}
          {sudahMasuk && (
            <div className="mt-4 rounded-2xl border-4 border-zippy-teal/40 bg-zippy-teal/12 p-4">
              <p className="flex items-start gap-2 text-sm font-black text-zippy-navy">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-zippy-teal" strokeWidth={3.5} />
                <span className="min-w-0 break-all">
                  Anda sudah masuk sebagai {sudahMasuk}
                </span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    unlockAudio();
                    // Tanpa anak yang sedang aktif, /peta akan menampilkan
                    // blob yang tersisa dari percobaan mode tamu. Bawa ke
                    // halaman awal supaya nama anak dipilih lebih dulu.
                    const s = load();
                    router.push(s.pendamping && s.anakAktif ? "/peta" : "/");
                  }}
                  className="btn-pop flex items-center gap-1.5 rounded-xl bg-zippy-yellow px-4 py-2 text-sm font-black text-zippy-navy"
                >
                  Masuk ZippyVerse
                  <ArrowRight className="h-4 w-4" strokeWidth={3} />
                </button>
                <button
                  onClick={keluar}
                  className="rounded-xl border-4 border-zippy-navy/20 px-4 py-1.5 text-sm font-black text-zippy-navy/70 transition hover:border-zippy-navy/40"
                >
                  Keluar
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={kirim} className="mt-5 space-y-4">
            <div>
              <label
                className="mb-2 flex items-center gap-1.5 text-sm font-black text-zippy-navy"
                htmlFor="email"
              >
                <Mail className="h-4 w-4" strokeWidth={3} />
                Email orang tua
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@contoh.com"
                className="w-full rounded-2xl border-4 border-zippy-teal bg-white px-4 py-3 text-base font-black text-zippy-navy outline-none placeholder:text-zippy-navy/35"
              />
            </div>

            <div>
              <label
                className="mb-2 flex items-center gap-1.5 text-sm font-black text-zippy-navy"
                htmlFor="sandi"
              >
                <KeyRound className="h-4 w-4" strokeWidth={3} />
                Kata sandi
              </label>
              <input
                id="sandi"
                type="password"
                autoComplete={mode === "daftar" ? "new-password" : "current-password"}
                value={sandi}
                onChange={(e) => setSandi(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full rounded-2xl border-4 border-zippy-teal bg-white px-4 py-3 text-base font-black text-zippy-navy outline-none placeholder:text-zippy-navy/35"
              />
            </div>

            {pesan && (
              <p
                className={`flex items-start gap-2 rounded-2xl p-3 text-sm font-bold ${
                  pesan.jenis === "galat"
                    ? "bg-red-100 text-red-800"
                    : "bg-zippy-mint text-zippy-navy"
                }`}
              >
                {pesan.jenis === "galat" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={3} />
                ) : (
                  <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={3.5} />
                )}
                <span className="min-w-0">{pesan.teks}</span>
              </p>
            )}

            {!supabaseEnabled && (
              <p className="flex items-start gap-2 rounded-2xl bg-amber-100 p-3 text-sm font-bold text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={3} />
                <span>
                  Supabase belum dikonfigurasi di perangkat ini. Anda tetap bisa
                  bermain sebagai tamu - progres tersimpan di perangkat.
                </span>
              </p>
            )}

            <motion.button
              whileTap={{ scale: 0.96 }}
              type="submit"
              disabled={sibuk}
              className="btn-pop flex w-full items-center justify-center gap-2 rounded-2xl bg-zippy-yellow px-6 py-3.5 text-lg font-black text-zippy-navy disabled:opacity-60"
            >
              {sibuk ? "Memproses..." : mode === "daftar" ? "Buat Akun" : "Masuk"}
              {!sibuk && <ArrowRight className="h-5 w-5" strokeWidth={3} />}
            </motion.button>
          </form>

          <p className="mt-4 text-center text-sm font-bold text-zippy-navy/60">
            {mode === "daftar" ? "Sudah punya akun? " : "Belum punya akun? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "daftar" ? "masuk" : "daftar");
                setPesan(null);
              }}
              className="font-black text-zippy-teal underline underline-offset-4"
            >
              {mode === "daftar" ? "Masuk" : "Daftar"}
            </button>
          </p>
        </motion.div>

        {/* Kenapa perlu akun */}
        <div className="mt-5 rounded-3xl border-4 border-white/12 bg-white/8 p-5 backdrop-blur">
          <p className="flex items-center gap-2 font-display text-sm font-bold text-white">
            <Users className="h-4 w-4 text-zippy-yellow" strokeWidth={3} />
            Untuk apa akun ini?
          </p>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-white/70">
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-zippy-mint" strokeWidth={3.5} />
              <span className="min-w-0">Progres anak tersimpan dan tidak hilang saat ganti perangkat.</span>
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-zippy-mint" strokeWidth={3.5} />
              <span className="min-w-0">Satu akun bisa memuat beberapa profil anak dalam satu keluarga.</span>
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-zippy-mint" strokeWidth={3.5} />
              <span className="min-w-0">Orang tua dapat membuka Dasbor Perkembangan dari perangkat mana pun.</span>
            </li>
          </ul>
          <p className="mt-3 text-xs font-bold text-white/45">
            Anak tidak perlu email maupun kata sandi - cukup memilih profilnya.
          </p>
        </div>
      </div>
    </main>
  );
}
