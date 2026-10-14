"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Rocket,
  Gamepad2,
  Brain,
  ShieldCheck,
  ArrowRight,
  Users,
  TrendingUp,
  Gift,
  Lock,
  Check,
  HelpCircle,
  Star,
  Wifi,
  Eye,
  HeartHandshake,
  X,
} from "lucide-react";
import Link from "next/link";
import SpaceBackdrop from "@/components/SpaceBackdrop";
import Zippy from "@/components/Zippy";
import { unlockAudio, play } from "@/lib/sfx";
import { touchStreak, emptySave } from "@/lib/store";
import { supabase, supabaseEnabled } from "@/lib/supabase";
import FeedbackForm from "@/components/FeedbackForm";
import { daftarAnak, tambahAnak, pilihAnak, lepasProfil, MAKS_ANAK } from "@/lib/profil";
import { moodKostum, ISLANDS } from "@/lib/gameData";

// ============================================================
// Halaman tamu (landing page).
//
// Halaman ini adalah PINTU MASUK pertama. Tugasnya bukan langsung
// meminta nama, tapi menjelaskan dulu kepada anak DAN orang tua
// apa sebenarnya ZippyVerse ini, lalu menawarkan dua jalan:
//
//   1. "Mulai Bermain"  -> mode tamu. Tanpa daftar, progres tetap
//                          tersimpan di perangkat itu sendiri.
//   2. "Daftar / Masuk" -> supaya progres tersimpan dan bisa
//                          dipantau orang tua dari perangkat lain.
//
// Karena itu form nama TIDAK lagi berada di atas bersama judul.
// Anak yang penasaran tinggal menekan satu tombol; orang tua yang
// masih menimbang bisa membaca dulu tanpa merasa dipaksa mendaftar.
// ============================================================

// Lima pulau tujuan. Pulau `soon` dan pulau trial sengaja dibuang: yang
// dijual di halaman ini adalah pengalaman lengkapnya, bukan pintu coba-coba.
const PULAU = ISLANDS.filter((i) => !i.soon && !i.trial);

/** Keunggulan yang menarik bagi ANAK - bahasanya tentang bermain. */
const UNTUK_ANAK = [
  {
    icon: Gamepad2,
    title: "5 Pulau Petualangan",
    desc: "Matematika, Bahasa, Sains, Seni, sampai IPS. Tiap pulau punya bos misterius yang menunggu.",
    color: "#FFC93C",
  },
  {
    icon: Rocket,
    title: "Misi 3 Menit",
    desc: "Tidak ada ceramah panjang. Hitung, geser, dan jawab cepat sambil bermain.",
    color: "#2AA5A0",
  },
  {
    icon: Gift,
    title: "Koin & Kostum Zippy",
    desc: "Kumpulkan koin dari misi, tukar jadi kostum baru. Delapan kostum dengan keistimewaan masing-masing.",
    color: "#FFC93C",
  },
  {
    icon: Star,
    title: "Rangkaian Harian",
    desc: "Main tiap hari, apinya tetap menyala. Putus sehari, mulai lagi tanpa dimarahi.",
    color: "#2AA5A0",
  },
  {
    icon: Sparkles,
    title: "Tantangan Baru Tiap Hari",
    desc: "Soal berubah setiap hari, jadi tidak ada yang bisa dihafal jawabannya.",
    color: "#FFC93C",
  },
  {
    icon: HeartHandshake,
    title: "Zippy Membacakan Soal",
    desc: "Setiap soal dan petunjuk disuarakan. Anak yang belum lancar membaca tetap bisa ikut.",
    color: "#2AA5A0",
  },
];

/** Keunggulan yang menarik bagi ORANG TUA - bahasanya tentang hasil dan rasa aman. */
const UNTUK_ORANG_TUA = [
  {
    icon: TrendingUp,
    title: "Dasbor Perkembangan Anak",
    desc: "Ketepatan jawaban, waktu bermain, rangkaian hari, dan saran mendampingi - tersusun rapi dalam satu halaman.",
  },
  {
    icon: Users,
    title: "Satu Akun Keluarga",
    desc: "Satu akun orang tua bisa memuat banyak profil anak. Anak cukup memilih profilnya, tanpa perlu mengingat kata sandi.",
  },
  {
    icon: ShieldCheck,
    title: "Tanpa Iklan & Tanpa Link Keluar",
    desc: "Tidak ada tombol yang mengajak anak keluar halaman, tidak ada iklan pihak ketiga. Anak tetap berada di dalam ZippyVerse.",
  },
  {
    icon: Lock,
    title: "Data Hanya Untuk Kemajuan Belajar",
    desc: "Anak-anak hanya perlu nama panggilan. Tidak ada tanggal lahir, nomor telepon, foto, maupun lokasi yang diminta.",
  },
  {
    icon: Eye,
    title: "Orang Tua Tahu Isinya",
    desc: "Orang tua hanya bisa MELIHAT perkembangan, bukan mengubahnya. Perubahan data hanya dari sistem permainan.",
  },
  {
    icon: Wifi,
    title: "Bisa Dimainkan Luring",
    desc: "Tanpa sinyal pun anak tetap bisa belajar. Progres disimpan lebih dulu di perangkat, disinkronkan saat internet tersedia.",
  },
];

/** Tiga langkah - menutup keraguan "harus daftar dulukah?". */
const LANGKAH = [
  {
    no: "1",
    title: "Coba dulu, gratis",
    desc: "Tekan Mulai Bermain. Tanpa daftar, tanpa kartu. Anak langsung masuk ke Planet Luminara.",
  },
  {
    no: "2",
    title: "Daftar supaya tersimpan",
    desc: "Kalau cocok, buat akun. Progres yang sudah berjalan ikut terbawa dan tidak hilang saat ganti perangkat.",
  },
  {
    no: "3",
    title: "Pantau dari dasbor",
    desc: "Orang tua masuk dan melihat perkembangan anak: ketepatan, waktu belajar, dan langkah berikutnya.",
  },
];

const FAQ = [
  {
    q: "Apakah ZippyVerse benar-benar gratis?",
    a: "Ya. Seluruh pulau, misi, koin, dan kostum bisa diakses tanpa biaya. Tidak ada iklan dan tidak ada pembelian di dalam aplikasi.",
  },
  {
    q: "Perlu unduh aplikasi dulu?",
    a: "Tidak. ZippyVerse berjalan langsung di browser ponsel, tablet, maupun komputer. Cukup buka tautannya dan bermain.",
  },
  {
    q: "Anak saya belum lancar membaca, apakah bisa?",
    a: "Bisa. Setiap soal dan petunjuk dibacakan Zippy dengan suara, jadi anak yang belum lancar membaca tetap mengerti apa yang ditanyakan.",
  },
  {
    q: "Berapa lama sekali anak seharusnya bermain?",
    a: "Tiap misi berdurasi sekitar 3 menit. Ada energi yang berkurang saat memulai misi dan pulih kembali dengan sendirinya, sehingga ritme bermain anak terjaga tanpa orang tua perlu mengatur timer.",
  },
  {
    q: "Apakah orang tua bisa melihat hasil belajar anak?",
    a: "Ya. Melalui Dasbor Orang Tua, Anda melihat rangkuman perkembangan dan saran mendampingi. Cakupannya hanya melihat - data anak tidak bisa diubah sewenang-wenang dari halaman itu.",
  },
  {
    q: "Apakah aman untuk anak?",
    a: "ZippyVerse tidak memiliki iklan, tautan keluar, ruang obrolan dengan orang asing, maupun permintaan data pribadi. Yang disimpan hanya kemajuan belajar.",
  },
];

const TOMBOL_KEcil = "text-sm font-black";

export default function LandingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [equipped, setEquipped] = useState("default");
  const [adaSimpanan, setAdaSimpanan] = useState(false);
  const [ready, setReady] = useState(false);
  // Form nama dibuka lewat tombol, bukan langsung tampil di atas.
  const [bukaNama, setBukaNama] = useState(false);
  // Tiga isi panel yang mungkin tampil, supaya tombol "tutup" dan Esc tidak
  // perlu menebak isinya:
  //   "pilih" -> sudah ada Akun Pendamping berisi profil anak -> pilih nama
  //   "tambah"-> Akun Pendamping ada tapi belum ada anak -> daftarkan anak
  //   "tamu"  -> belum ada akun -> cukup nama panggilan
  const [modeNama, setModeNama] = useState("tamu");
  const [pendamping, setPendamping] = useState(null);
  const [anak, setAnak] = useState([]);
  const [galatNama, setGalatNama] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("zippyverse_save_v1");
      if (raw) {
        const s = JSON.parse(raw);
        setNickname(s.nickname || "");
        setEquipped(s.equipped || "default");
        setAdaSimpanan(Boolean(s.nickname || s.playerId));
        setPendamping(s.pendamping || null);
        setAnak(daftarAnak(s));
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    // Tutup panel nama dengan tombol Esc supaya tidak terasa seperti jebakan.
    if (!bukaNama) return;
    const onKey = (e) => {
      if (e.key === "Escape") setBukaNama(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bukaNama]);

  /**
   * Buka panel penjelajah, dengan isi yang sesuai status akunnya.
   *
   * Anak yang datang ke perangkat keluarga tidak perlu mengetik namanya lagi:
   * namanya sudah ada di daftar, tinggal dipetik.
   */
  function bukaPanel() {
    unlockAudio();
    play("pop");
    setGalatNama("");
    // Akun sudah tertaut tapi belum ada anak -> langsung tampilkan form
    // pendaftaran anak pertama, supaya orang tua tidak kebingungan mencari
    // tombol tambah yang baru muncul setelah daftar.
    setModeNama(
      pendamping ? (anak.length ? "pilih" : "tambah") : "tamu"
    );
    setBukaNama(true);
  }

  /**
   * Mode tamu: cukup nama panggilan, tersimpan hanya di perangkat ini.
   *
   * Simpanan yang dibawa TIDAK BOLEH menyimpan jejak akun. Bila masih ada
   * (sisa akun yang belum sempat dibersihkan), simpanan itu dianggap milik
   * anak dan dibuang SELURUHNYA, bukan sekadar disembunyikan - tamu harus
   * memulai dari nol. Simpanan tamu yang murni (tanpa jejak) tetap
   * dipertahankan, supaya tamu yang kembali tidak kehilangan kemajuannya.
   */
  function mulai(e) {
    e.preventDefault();
    unlockAudio();
    play("levelup");
    const name = nickname.trim() || "Penjelajah";
    try {
      const KEY = "zippyverse_save_v1";
      const cur = JSON.parse(window.localStorage.getItem(KEY) || "{}");

      // Jejak akun = salah satu dari empat kunci akun masih terisi. Kehadiran
      // salah satunya berarti blob aktif di perangkat ini adalah milik anak.
      const jejak =
        Boolean(cur.pendamping) ||
        Boolean(cur.anakAktif) ||
        (Array.isArray(cur.anak) && cur.anak.length > 0) ||
        Object.keys(cur.simpanan || {}).length > 0;

      window.localStorage.setItem(
        KEY,
        JSON.stringify({
          ...(jejak ? emptySave() : cur),
          pendamping: null,
          anak: [],
          anakAktif: null,
          simpanan: {},
          nickname: name,
        })
      );
    } catch {}
    touchStreak();
    router.push("/peta");
  }

  /** Anak memilih profilnya: kemajuannya diangkat dari gudang simpanan. */
  function mulaiSebagai(id) {
    unlockAudio();
    play("levelup");
    pilihAnak(id);
    touchStreak();
    router.push("/peta");
  }

  /** Orang tua mendaftarkan anak, lalu anak itu langsung menjadi pemain. */
  function simpanAnak(e) {
    e.preventDefault();
    const r = tambahAnak(nickname);
    if (!r.ok) {
      setGalatNama(r.alasan || "Nama belum bisa disimpan.");
      return;
    }
    unlockAudio();
    play("levelup");
    pilihAnak(r.id);
    touchStreak();
    router.push("/peta");
  }

  /**
   * Keluar dari Akun Pendamping.
   *
   * Dua hal harus diputus sekaligus, dan dulu hanya yang pertama yang
   * dilakukan:
   *
   *   1. Ikatan PERANGKAT dengan akun (sakelar `pendamping`, daftar anak,
   *      gudang simpanan, serta simpanan aktif milik anak).
   *   2. SESI Supabase. Bila sesi dibiarkan, token di `sb-...-auth-token`
   *      tetap hidup, lalu halaman /daftar akan menyambungkan akun itu
   *      kembali sendiri lewat `tandaiMasuk()` begitu dibuka. Akibatnya
   *      akun seolah-olah "hidup lagi" sesudah dikeluarkan - persis
   *      keluhan yang membuat perbaikan ini ditulis.
   */
  async function keluar() {
    unlockAudio();
    play("pop");

    // 1. Lepas ikatan perangkat lebih dulu supaya UI langsung berubah bahkan
    //    sebelum panggilan jaringan selesai. Tidak ada pendengar
    //    onAuthStateChange di proyek ini, jadi tidak ada yang akan menulis
    //    ulang `pendamping` sesudah ini.
    lepasProfil();
    setPendamping(null);
    setAnak([]);
    setNickname("");
    setAdaSimpanan(false);

    // 2. Putus sesi Supabase. Bila langkah ini ditiadakan, token di
    //    `sb-...-auth-token` tetap hidup dan halaman /daftar akan
    //    menyambungkan akun itu kembali sendiri lewat `tandaiMasuk()`.
    if (supabaseEnabled) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
  }

  /**
   * Sudah masuk akun Pendamping atau belum.
   *
   * Dipakai di banyak tempat untuk memilih isi tampilan: pengunjung yang
   * sudah masuk TIDAK lagi ditawari "Daftar / Masuk" - tawaran itu sudah
   * tidak relevan dan hanya menimbulkan keraguan.
   */
  const sudahMasuk = Boolean(pendamping);

  return (
    <main className="space-bg relative min-h-screen overflow-x-clip">
      <SpaceBackdrop />

      {/* Cahaya berdenyut di belakang Zippy (gradient, tanpa filter blur) */}
      <div
        className="pointer-events-none absolute right-[12%] top-[14%] h-72 w-72 animate-pulseGlow rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,201,60,0.30) 0%, rgba(255,201,60,0.12) 45%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-8">
        {/* ---------------------------------------------------------- Navbar */}
        <nav className="sticky top-0 z-40 mb-6 -mx-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-2xl bg-zippy-navy/55 px-2 py-2 backdrop-blur-md">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/zippy/depan.webp"
              alt="Zippy"
              className="h-10 w-10 animate-bob object-contain"
              loading="eager"
              decoding="async"
            />
            <span className="font-display text-base font-bold text-white sm:text-xl">
              ZippyVerse
            </span>
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => {
                unlockAudio();
                router.push("/dashboard");
              }}
              aria-label="Buka dasbor orang tua"
              className="grid h-10 w-10 place-items-center rounded-full border-2 border-white/30 text-white transition hover:bg-white/10 sm:w-auto sm:px-4"
            >
              <ShieldCheck className="h-5 w-5 sm:hidden" strokeWidth={2.8} />
              <span className={`hidden sm:inline ${TOMBOL_KEcil}`}>
                Dasbor Orang Tua
              </span>
            </button>
            {sudahMasuk ? (
              /* Sudah masuk Akun Pendamping: tawaran "Daftar / Masuk" sudah
                 tidak relevan. Yang ditampilkan justru siapa yang sedang
                 masuk, dan cara keluar. */
              <>
                <span className="hidden max-w-[min(46vw,15rem)] truncate rounded-full bg-white/12 px-3 py-2 text-xs font-black text-zippy-mint sm:inline-block">
                  {pendamping.email}
                </span>
                <button
                  onClick={keluar}
                  className="rounded-full border-2 border-white/35 px-4 py-2 text-sm font-black text-white transition hover:border-white/70 hover:bg-white/10"
                >
                  Keluar
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  unlockAudio();
                  router.push("/daftar");
                }}
                className="rounded-full bg-zippy-yellow px-4 py-2 text-sm font-black text-zippy-navy transition hover:brightness-105"
              >
                {ready && adaSimpanan ? "Masuk" : "Daftar"}
              </button>
            )}
          </div>
        </nav>

        {/* ----------------------------------------------------------- Hero */}
        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-zippy-yellow px-4 py-2 text-xs font-black text-zippy-navy sm:text-sm">
                <Sparkles className="h-4 w-4 shrink-0" strokeWidth={3} />
                Innovating Education Through Technology
              </span>

              <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
                <span className="block text-zippy-yellow text-stroke-navy">Zippy</span>
                <span className="block text-zippy-mint">Verse</span>
              </h1>

              <p className="mt-4 max-w-xl text-lg font-bold text-white/85 sm:text-xl">
                Belajar bukan lagi PR. Sekarang belajar adalah{" "}
                <span className="text-zippy-yellow">petualangan</span> bersama Zippy di
                Planet Luminara.
              </p>

              <p className="mt-3 max-w-xl font-semibold text-white/60">
                Alternatif sehat untuk gadget anak. Alih-alih menonton video tanpa
                ujung, anak menyelesaikan misi 3 menit untuk membuka dunia baru.
              </p>

              {/* Pengunjung yang sudah masuk hanya diberi SATU jalan: bermain.
                  Tidak ada lagi "Daftar / Masuk" (sudah masuk) dan tidak ada
                  "Lanjutkan Bermain" (nama pemainnya belum dipilih - justru
                  pemilihan itulah yang dimulai lewat tombol ini). */}
              <div className="mt-8 flex flex-wrap gap-3">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={bukaPanel}
                  className="btn-pop flex items-center gap-2 rounded-2xl bg-zippy-yellow px-6 py-3.5 text-base font-black text-zippy-navy sm:text-lg"
                >
                  {sudahMasuk ? "Mulai Bermain" : ready && adaSimpanan ? "Lanjutkan Bermain" : "Mulai Bermain"}
                  <ArrowRight className="h-5 w-5" strokeWidth={3} />
                </motion.button>

                {!sudahMasuk && (
                  <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      unlockAudio();
                      router.push("/daftar");
                    }}
                    className="flex items-center gap-2 rounded-2xl border-4 border-white/35 px-6 py-3 text-base font-black text-white transition hover:border-white/60 hover:bg-white/10 sm:text-lg"
                  >
                    Daftar / Masuk
                  </motion.button>
                )}
              </div>

              <p className="mt-3 max-w-md text-sm font-semibold text-white/55">
                {sudahMasuk ? (
                  <>
                    <span className="text-zippy-mint">Pilih nama anak</span> di
                    bawah, lalu petualangan langsung dimulai. Kemajuan tiap anak
                    tersimpan terpisah.
                  </>
                ) : (
                  <>
                    <span className="text-zippy-mint">Pulau Perkenalan</span>{" "}
                    terbuka untuk siapa pun tanpa daftar. Daftar nanti supaya
                    lima pulau lainnya terbuka dan progres tersimpan di semua
                    perangkat.
                  </>
                )}
              </p>
            </motion.div>
          </div>

          {/* Zippy hero */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 140, damping: 14 }}
            className="relative flex min-w-0 justify-center"
          >
            <div className="absolute inset-0 m-auto h-64 w-64 rounded-full bg-zippy-yellow/20 blur-2xl" />
            <Zippy
              size="min(330px, calc(100vw - 110px))"
              mood={equipped === "default" ? "merayakan" : moodKostum(equipped, "merayakan")}
              anim="floaty"
              className="relative min-w-0"
              eager
            />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-2 left-1/2 max-w-[min(280px,calc(100vw-2rem))] -translate-x-1/2 rounded-full bg-white px-5 py-2 text-center text-sm font-black text-zippy-navy shadow-pop-lg"
            >
              &quot;Halo! Aku Zippy, ayo menjelajah! 🌟&quot;
            </motion.div>
          </motion.div>
        </div>

        {/* --------------------------------------- Akun Pendamping (masuk) */}
        {sudahMasuk && (
          <section className="mt-12 sm:mt-16" id="akun">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative overflow-hidden rounded-[30px] border-4 border-zippy-teal bg-white/10 p-5 backdrop-blur sm:p-7"
            >
              {/* Garis dekoratif atas - memberi kesan "kartu", bukan kotak datar */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-1.5"
                style={{
                  background:
                    "linear-gradient(90deg, #2AA5A0, #FFC93C, #B2D8D5)",
                }}
              />

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-zippy-teal font-display text-2xl font-black text-white shadow-pop">
                    {(pendamping.email || "?").charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-wider text-zippy-mint">
                      Akun Pendamping
                    </p>
                    <p className="truncate font-display text-lg font-bold text-white">
                      {pendamping.email}
                    </p>
                    <p className="text-xs font-bold text-white/55">
                      {anak.length === 0
                        ? "Belum ada anak terdaftar"
                        : `${anak.length} anak terdaftar`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={bukaPanel}
                    className="rounded-full bg-zippy-yellow px-4 py-2.5 text-sm font-black text-zippy-navy transition hover:brightness-105"
                  >
                    + Tambah Anak
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={keluar}
                    className="rounded-full border-2 border-white/35 px-4 py-2.5 text-sm font-black text-white transition hover:border-white/70 hover:bg-white/10"
                  >
                    Keluar
                  </motion.button>
                </div>
              </div>

              {/* Daftar anak - inti dari halaman ini */}
              <div className="mt-6">
                <h3 className="font-display text-lg font-bold text-white sm:text-xl">
                  Siapa yang mau bermain hari ini?
                </h3>
                <p className="mt-1 text-sm font-semibold text-white/60">
                  Petik nama, lalu petualangan langsung dimulai. Tidak perlu
                  kata sandi.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {anak.map((a, i) => (
                    <motion.button
                      key={a.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.25 + i * 0.06 }}
                      whileHover={{ scale: 1.05, y: -6 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => mulaiSebagai(a.id)}
                      className="group flex items-center gap-2.5 rounded-2xl border-4 border-zippy-teal/60 bg-white px-3 py-3 text-left transition hover:border-zippy-teal hover:bg-zippy-mint/30"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zippy-teal font-display text-base font-black text-white transition group-hover:bg-zippy-yellow group-hover:text-zippy-navy">
                        {a.nama.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-black text-zippy-navy">
                        {a.nama}
                      </span>
                    </motion.button>
                  ))}

                  {/* Kotak tambah - selalu ada selama belum mencapai batas */}
                  {anak.length < MAKS_ANAK && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.25 + anak.length * 0.06 }}
                      whileHover={{ scale: 1.05, y: -6 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={bukaPanel}
                      className="grid place-items-center gap-1 rounded-2xl border-4 border-dashed border-white/25 px-3 py-3 text-center text-white/60 transition hover:border-zippy-yellow hover:bg-zippy-yellow/10 hover:text-zippy-yellow"
                    >
                      <span className="text-2xl leading-none font-black">+</span>
                      <span className="text-xs font-black">Tambah anak</span>
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Keadaan kosong: cara mendaftarkan anak pertama */}
              {anak.length === 0 && (
                <div className="mt-5 rounded-2xl border-2 border-zippy-mint/30 bg-zippy-mint/10 p-4">
                  <p className="font-display text-sm font-bold text-zippy-mint">
                    Cara mendaftarkan anak
                  </p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs font-semibold leading-relaxed text-white/70">
                    <li>Tekan tombol <b className="text-white">+ Tambah Anak</b>.</li>
                    <li>Ketik nama anak, misalnya <b className="text-white">Deka</b>.</li>
                    <li>
                      Selesai. Selanjutnya anak cukup memetik namanya sendiri
                      setiap kali bermain.
                    </li>
                    <li>
                      Untuk anak berikutnya, ulangi langkah yang sama — hingga{" "}
                      <b className="text-white">{MAKS_ANAK} profil</b> dalam satu
                      akun.
                    </li>
                  </ol>
                </div>
              )}

              <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-bold text-white/50">
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-zippy-mint" strokeWidth={3.5} />
                  Kemajuan tiap anak terpisah
                </span>
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-zippy-mint" strokeWidth={3.5} />
                  Sesi tetap tersimpan
                </span>
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-zippy-mint" strokeWidth={3.5} />
                  Tidak perlu kata sandi anak
                </span>
              </p>
            </motion.div>
          </section>
        )}

        {/* ------------------------------------------------- Kenapa ada Zippy */}
        <section className="mt-16 sm:mt-20">
          <div className="grid gap-6 rounded-[30px] border-4 border-zippy-mint/25 bg-white/8 p-5 backdrop-blur sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full bg-zippy-teal/30 px-3 py-1.5 text-xs font-black text-zippy-mint">
                <HelpCircle className="h-3.5 w-3.5" strokeWidth={3} />
                Untuk Orang Tua
              </span>
              <h2 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
                Layar memang menarik. Tapi ke mana perginya waktu itu?
              </h2>
              <p className="mt-3 font-semibold leading-relaxed text-white/70">
                Anak menonton video berjam-jam, lalu lupa apa yang ditontonnya. Yang
                didapat cuma jempol yang geser terus dan perhatian yang makin pendek.
              </p>
              <p className="mt-3 font-semibold leading-relaxed text-white/70">
                ZippyVerse memakai tarikan yang sama - dunia, koin, rangkaian, dan
                hadiah - tapi tujuannya berbeda. Setiap kali anak membuka ZippyVerse,
                ia selesai dengan <span className="text-zippy-yellow">sesuatu yang
                dikuasainya</span>, bukan sekadar video berikutnya.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Sebelum", "Menonton tanpa henti", "Tidak ada hasil yang bisa dibawa ke mana pun."],
                ["Sesudah", "Misi yang tuntas", "Anak tahu jawabannya, dan orang tua bisa melihatnya."],
              ].map(([label, judul, isi], i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.04, y: -8 }}
                  whileTap={{ scale: 0.97 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`rounded-3xl border-4 p-4 ${
                    i === 1
                      ? "border-zippy-yellow bg-zippy-yellow/12"
                      : "border-white/12 bg-white/6"
                  }`}
                >
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                      i === 1 ? "bg-zippy-yellow text-zippy-navy" : "bg-white/15 text-white/70"
                    }`}
                  >
                    {label}
                  </span>
                  <p className="mt-2 font-display text-lg font-bold text-white">{judul}</p>
                  <p className="mt-1 text-sm font-semibold text-white/60">{isi}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- Untuk anak */}
        <section className="mt-16 sm:mt-20">
          <div className="mb-6 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-zippy-yellow px-3 py-1.5 text-xs font-black text-zippy-navy">
              <Star className="h-3.5 w-3.5" strokeWidth={3} />
              Untuk Kamu, Penjelajah
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold text-white sm:text-4xl">
              Ini bukan sekolah. Ini planet yang harus dibuka.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {UNTUK_ANAK.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.04, y: -10 }}
                whileTap={{ scale: 0.96 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.08 }}
                className="card-pop rounded-3xl border-4 border-white/10 bg-white/10 p-5 backdrop-blur transition-colors hover:border-zippy-yellow/60 hover:bg-white/16"
              >
                <div
                  className="mb-3 grid h-12 w-12 place-items-center rounded-2xl"
                  style={{ background: f.color }}
                >
                  <f.icon className="h-6 w-6 text-zippy-navy" strokeWidth={2.8} />
                </div>
                <h3 className="font-display text-lg font-bold text-white">{f.title}</h3>
                <p className="mt-1 text-sm font-semibold text-white/65">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------- Untuk orang tua */}
        <section className="mt-16 sm:mt-20">
          <div className="mb-6 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-zippy-teal px-3 py-1.5 text-xs font-black text-zippy-navy">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={3} />
              Untuk Kamu, Orang Tua
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold text-white sm:text-4xl">
              Yang bisa Anda lihat, dan yang tidak bisa Anda khawatirkan.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {UNTUK_ORANG_TUA.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.04, y: -10 }}
                whileTap={{ scale: 0.96 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.08 }}
                className="rounded-3xl border-4 border-zippy-teal/35 bg-zippy-teal/12 p-5 transition-colors hover:border-zippy-yellow/70 hover:bg-zippy-teal/22"
              >
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-zippy-mint">
                  <f.icon className="h-6 w-6 text-zippy-navy" strokeWidth={2.8} />
                </div>
                <h3 className="font-display text-lg font-bold text-white">{f.title}</h3>
                <p className="mt-1 text-sm font-semibold text-white/70">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* --------------------------------------------------- 3 langkah */}
        <section className="mt-16 sm:mt-20">
          <h2 className="font-display text-2xl font-bold text-white sm:text-4xl">
            Mulainya sederhana
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {LANGKAH.map((l, i) => (
              <motion.div
                key={l.no}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.04, y: -8 }}
                whileTap={{ scale: 0.97 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-3xl border-4 border-white/10 bg-white/8 p-5 transition-colors hover:border-zippy-yellow/55 hover:bg-white/14"
              >
                <span className="grid h-11 w-11 place-items-center rounded-full bg-zippy-yellow font-display text-xl font-bold text-zippy-navy">
                  {l.no}
                </span>
                <h3 className="mt-3 font-display text-lg font-bold text-white">{l.title}</h3>
                <p className="mt-1 text-sm font-semibold text-white/65">{l.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------- 5 pulau */}
        <section className="mt-16 sm:mt-20">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-2xl font-bold text-white sm:text-4xl">
              Kenalan dengan pulaunya
            </h2>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-zippy-mint">
              {PULAU.length} pulau siap dimainkan
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {PULAU.map((p, i) => (
              <motion.div
                key={p.slug}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.07, y: -10 }}
                whileTap={{ scale: 0.95 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="flex cursor-pointer flex-col items-center rounded-3xl border-4 border-white/10 bg-white/8 p-4 text-center transition-colors hover:border-zippy-yellow/65 hover:bg-white/16"
              >
                <span
                  className="grid h-16 w-16 place-items-center rounded-2xl"
                  style={{ background: `${p.color}33` }}
                >
                  <img
                    src={p.icon}
                    alt=""
                    className="h-12 w-12 object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </span>
                <p className="mt-3 font-display text-sm font-bold text-white">{p.name}</p>
                <p className="mt-1 text-[11px] font-semibold leading-snug text-white/55">
                  {p.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* -------------------------------------------------------- FAQ */}
        <section className="mt-16 sm:mt-20">
          <h2 className="font-display text-2xl font-bold text-white sm:text-4xl">
            Pertanyaan orang tua
          </h2>
          <div className="mt-6 grid gap-3">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="group rounded-3xl border-4 border-white/10 bg-white/8 px-5 py-4 transition-all duration-200 hover:border-zippy-teal/60 hover:bg-white/14 [&::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-display text-base font-bold text-white transition-colors hover:text-zippy-yellow sm:text-lg">
                  <span className="min-w-0">{f.q}</span>
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-zippy-yellow text-zippy-navy transition duration-300 group-open:rotate-[135deg] group-hover:scale-110">
                    <span className="text-lg leading-none font-black">+</span>
                  </span>
                </summary>
                <p className="mt-3 border-t-2 border-white/10 pt-3 text-sm font-semibold leading-relaxed text-white/70">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ----------------------------------------------- ZippyVerse dalam angka */}
        <section className="mt-16 sm:mt-20">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["6", "Pulau siap dimainkan", "#FFC93C"],
              ["18", "Misi berdurasi 3 menit", "#B2D8D5"],
              ["143", "Butir soal asli", "#FFC93C"],
              ["211", "Rekaman suara Indonesia", "#B2D8D5"],
              ["6", "Tipe permainan berbeda", "#FFC93C"],
            ].map(([angka, label, warna], i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, y: -8 }}
                whileTap={{ scale: 0.96 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="rounded-3xl border-4 border-white/10 bg-white/8 p-4 text-center transition-colors hover:bg-white/14"
              >
                <p
                  className="font-display text-3xl font-bold sm:text-4xl"
                  style={{ color: warna }}
                >
                  {angka}
                </p>
                <p className="mt-1 text-xs font-bold leading-snug text-white/60">
                  {label}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------- Masukan pengembang */}
        <section className="mt-16 sm:mt-20">
          <FeedbackForm />
        </section>

        {/* ----------------------------------------------------- CTA akhir */}
        <section className="mt-16 sm:mt-20">
          <div className="relative overflow-hidden rounded-[30px] border-4 border-zippy-yellow bg-zippy-yellow/12 p-6 text-center sm:p-10">
            <h2 className="font-display text-2xl font-bold text-white sm:text-4xl">
              Sudah cukup membaca?
            </h2>
            <p className="mx-auto mt-2 max-w-xl font-semibold text-white/75">
              Zippy sudah menunggu di Planet Luminara. Coba dulu - tidak ada yang perlu
              diisi, tidak ada yang perlu dibayar.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.04, y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={bukaPanel}
                className="btn-pop flex items-center gap-2 rounded-2xl bg-zippy-yellow px-6 py-3.5 text-base font-black text-zippy-navy"
              >
                Mulai Bermain
                <ArrowRight className="h-5 w-5" strokeWidth={3} />
              </motion.button>
              {!sudahMasuk && (
                <motion.button
                  whileHover={{ scale: 1.04, y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    unlockAudio();
                    router.push("/daftar");
                  }}
                  className="flex items-center gap-2 rounded-2xl border-4 border-white/40 px-6 py-3 text-base font-black text-white transition hover:bg-white/10"
                >
                  Daftar / Masuk
                </motion.button>
              )}
            </div>
            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-bold text-white/55">
              <span className="inline-flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-zippy-mint" strokeWidth={3.5} /> Gratis
              </span>
              <span className="inline-flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-zippy-mint" strokeWidth={3.5} /> Tanpa
                iklan
              </span>
              <span className="inline-flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-zippy-mint" strokeWidth={3.5} /> Tanpa
                unduhan
              </span>
            </p>
          </div>
        </section>

        <footer className="mt-10 pb-4 text-center text-sm font-bold text-white/40">
          ZippyVerse &mdash; Innovating Education Through Technology
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> &middot; </span>
          Web Education for Kids
        </footer>
      </div>

      {/* ---------------------------------------------- Panel nama (tamu) */}
      <AnimatePresence>
        {bukaNama && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setBukaNama(false)}
            className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 50, scale: 0.94 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="card-pop w-full max-w-md rounded-[30px] border-4 border-zippy-teal bg-cream p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-xl font-bold text-zippy-navy">
                    {modeNama === "pilih"
                      ? "Siapa yang mau bermain?"
                      : "Siapa nama penjelajah hari ini?"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zippy-navy/60">
                    {modeNama === "pilih"
                      ? "Pilih namamu, lalu langsung masuk."
                      : modeNama === "tambah"
                      ? "Nama ini disimpan di akun Pendamping di perangkat ini."
                      : "Cukup nama panggilan. Tanpa email, tanpa kata sandi."}
                  </p>
                </div>
                <button
                  onClick={() => setBukaNama(false)}
                  aria-label="Tutup"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zippy-navy/10 text-zippy-navy transition hover:bg-zippy-navy/20"
                >
                  <X className="h-5 w-5" strokeWidth={3} />
                </button>
              </div>

              {modeNama === "pilih" ? (
                <div className="mt-5">
                  {/* Daftar profil anak. Anak tidak perlu mengetik namanya
                      lagi - cukup dipetik, kemajuannya ikut terangkat. */}
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    {anak.map((a) => (
                      <motion.button
                        key={a.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => mulaiSebagai(a.id)}
                        className="flex items-center gap-2.5 rounded-2xl border-4 border-zippy-teal bg-white px-3 py-3 text-left transition hover:bg-zippy-mint/30"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zippy-teal font-display text-base font-black text-white">
                          {a.nama.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-black text-zippy-navy">
                          {a.nama}
                        </span>
                      </motion.button>
                    ))}
                  </div>

                  {anak.length < MAKS_ANAK && (
                    <button
                      onClick={() => {
                        setGalatNama("");
                        setNickname("");
                        setModeNama("tambah");
                      }}
                      className="mt-3 block w-full rounded-2xl border-4 border-dashed border-zippy-teal/40 px-4 py-3 text-sm font-black text-zippy-teal transition hover:bg-zippy-teal/10"
                    >
                      + Tambah anak
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setGalatNama("");
                      setModeNama("tamu");
                    }}
                    className="mt-2 block w-full text-center text-xs font-black text-zippy-navy/50 underline underline-offset-4"
                  >
                    Bukan anak di daftar ini? Main sebagai tamu
                  </button>
                </div>
              ) : (
                <form onSubmit={modeNama === "tambah" ? simpanAnak : mulai} className="mt-5">
                  <label className="mb-2 block text-sm font-black text-zippy-navy" htmlFor="nick">
                    {modeNama === "tambah" ? "Nama anak" : "Nama penjelajah"}
                  </label>
                  <input
                    id="nick"
                    autoFocus
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value);
                      setGalatNama("");
                    }}
                    placeholder="Contoh: Zepta"
                    maxLength={18}
                    className="w-full rounded-2xl border-4 border-zippy-teal bg-white px-4 py-3 text-lg font-black text-zippy-navy outline-none placeholder:text-zippy-navy/35"
                  />
                  {galatNama && (
                    <p className="mt-2 text-sm font-black text-red-600">{galatNama}</p>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="btn-pop mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-zippy-yellow px-6 py-3.5 text-lg font-black text-zippy-navy"
                  >
                    {modeNama === "tambah" ? "Simpan & Mulai Bermain" : "Mulai Petualangan"}
                    <ArrowRight className="h-5 w-5" strokeWidth={3} />
                  </motion.button>
                  {/* Tombol "Kembali" hanya ada bila memang ada layar untuk
                      dikembalikan. Mode "tambah" bisa muncul dalam dua keadaan:
                      (a) anak sudah ada -> kembali ke pilihan nama, atau
                      (b) akun masih kosong -> inilah layar paling awal, jadi
                      tombol kembali akan membawa orang tua ke formulir tamu,
                      yang justru menawarkan "Daftar / Masuk" kepada orang yang
                      SUDAH masuk. Karena itu tombolnya tidak dirender. */}
                  {modeNama === "tambah" && anak.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setGalatNama("");
                        setNickname("");
                        setModeNama("pilih");
                      }}
                      className="mt-3 block w-full text-center text-sm font-black text-zippy-navy/60 underline underline-offset-4"
                    >
                      Kembali
                    </button>
                  )}
                </form>
              )}

              {/* Ajakan daftar/masuk hanya untuk pengunjung yang belum punya
                  akun. Menampilkannya kepada orang yang sudah masuk sama saja
                  dengan mempertanyakan statusnya sendiri. */}
              {!sudahMasuk && modeNama !== "pilih" && (
                <button
                  onClick={() => {
                    setBukaNama(false);
                    router.push("/daftar");
                  }}
                  className="mt-4 block w-full text-center text-sm font-black text-zippy-teal underline underline-offset-4"
                >
                  Sudah punya akun? Masuk supaya progres tersimpan
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
