"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Shirt, BarChart3, Home, Sparkles } from "lucide-react";
import SpaceBackdrop from "@/components/SpaceBackdrop";
import Zippy from "@/components/Zippy";
import Hud from "@/components/Hud";
import ZippyChat from "@/components/ZippyChat";
import ShopModal from "@/components/ShopModal";
import { ISLANDS, COSTUMES, DAILY_ISLAND, isIslandOpen, isTamu, moodKostum, TRIAL_SLUG } from "@/lib/gameData";
import { useBreakpoint, useMotionToggle } from "@/lib/useMediaQuery";
import {
  load,
  persist,
  touchStreak,
  today,
  rewardInfo,
  claimDailyReward,
} from "@/lib/store";
import { play, unlockAudio, setSfxEnabled } from "@/lib/sfx";
import LoadingMeteors from "@/components/LoadingMeteors";
import { Gift, Check } from "lucide-react";

/**
 * Titik kontrol satu segmen rantai.
 *
 * Jalur rantai dibuat dengan Catmull-Rom yang dikonversi ke Bezier kubik,
 * supaya garisnya melengkung halus seperti jalur di peta harta karun, bukan
 * garis lurus yang kaku dan menyilang.
 */
function kontrolRantai(simpul, i) {
  const p0 = simpul[i - 1] || simpul[i];
  const p1 = simpul[i];
  const p2 = simpul[i + 1];
  const p3 = simpul[i + 2] || p2;
  return {
    c1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
    c2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
  };
}

/** Data `d` untuk satu segmen rantai (dari simpul i ke simpul i+1). */
function jalurRantai(simpul, i) {
  const p1 = simpul[i];
  const p2 = simpul[i + 1];
  const { c1, c2 } = kontrolRantai(simpul, i);
  return `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
}

/**
 * Titik tengah kurva (t = 0.5) beserta sudut garis singgungnya.
 * Dipakai untuk menempatkan panah penunjuk arah di tengah-tengah segmen,
 * supaya anak tahu arah pulau berikutnya tanpa perlu menebak.
 */
function tengahRantai(simpul, i) {
  const p1 = simpul[i];
  const p2 = simpul[i + 1];
  const { c1, c2 } = kontrolRantai(simpul, i);
  const x = (p1.x + 3 * c1.x + 3 * c2.x + p2.x) / 8;
  const y = (p1.y + 3 * c1.y + 3 * c2.y + p2.y) / 8;
  const dx = 0.75 * (c1.x - p1.x) + 1.5 * (c2.x - c1.x) + 0.75 * (p2.x - c2.x);
  const dy = 0.75 * (c1.y - p1.y) + 1.5 * (c2.y - c1.y) + 0.75 * (p2.y - c2.y);
  return { x, y, sudut: (Math.atan2(dy, dx) * 180) / Math.PI };
}

export default function PetaPage() {
  const router = useRouter();
  const [save, setSave] = useState(null);
  const [sel, setSel] = useState(null);
  const [shop, setShop] = useState(false);
  // Gerbang tamu: muncul ketika pengunjung tanpa akun menekan pulau yang
  // masih terkunci, supaya ia diajak mendaftar, bukan sekadar dibuatkan
  // suara "salah" yang tidak menjelaskan apa-apa.
  const [gerbang, setGerbang] = useState(false);
  const [sound, setSound] = useState(true);
  const bp = useBreakpoint();
  const { motionOn, toggleMotion } = useMotionToggle();

  // Ambil posisi pulau sesuai ukuran jendela, dengan cadangan aman.
  const posOf = (isl) => {
    const table = isl.positions || {};
    return table[bp] || table.lg || isl.pos || { top: "50%", left: "50%" };
  };

  // Ukuran kotak peta dalam piksel. Dibutuhkan untuk menggambar rantai
  // penghubung antar pulau dalam satuan piksel, supaya ujung garisnya selalu
  // tepat di pusat ikon berapa pun lebar layarnya.
  const petaRef = useRef(null);
  const [ukuran, setUkuran] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!save) return; // peta belum dirender selagi masih memuat
    const el = petaRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ukur = () => {
      const r = el.getBoundingClientRect();
      // Bandingkan dulu supaya tidak memicu render ulang yang tidak perlu
      // (ResizeObserver bisa memanggil berkali-kali untuk ukuran yang sama).
      setUkuran((d) =>
        Math.abs(d.w - r.width) < 0.5 && Math.abs(d.h - r.height) < 0.5
          ? d
          : { w: r.width, h: r.height }
      );
    };
    ukur();
    const ro = new ResizeObserver(ukur);
    ro.observe(el);
    window.addEventListener("resize", ukur);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", ukur);
    };
  }, [save]);

  useEffect(() => {
    const s = touchStreak();
    unlockAudio();

    // Pengaman akhir: pemilik akun yang belum memilih anak TIDAK BOLEH sampai
    // melihat peta. Blob aktif pada saat itu masih berisi simpanan TAMU dari
    // percobaan sebelumnya, sehingga peta menampilkan akun tamu seolah-olah
    // si pemilik tidak pernah mendaftarkan anak sama sekali.
    //
    // Bawa ke halaman awal, tempat kartu akun dan daftar anak menunggu.
    // Tamu (tanpa `pendamping`) dibiarkan lewat - mereka memang berhak
    // memainkan Pulau Perkenalan.
    if (s.pendamping && !s.anakAktif) {
      router.replace("/");
      return;
    }

    setSave(s);
    // `router` dari `useRouter()` stabil selama berada di halaman yang sama,
    // jadi efek ini tetap hanya berjalan sekali seperti sebelumnya. Dimasukkan
    // ke daftar dependensi sekadar untuk memuaskan `react-hooks/exhaustive-deps`.
  }, [router]);

  const equipped = useMemo(() => {
    if (!save) return COSTUMES[0];
    return COSTUMES.find((c) => c.id === save.equipped) || COSTUMES[0];
  }, [save]);

  function toggleSound() {
    const v = !sound;
    setSound(v);
    setSfxEnabled(v);
    if (v) play("pop");
  }

  function goIsland(slug) {
    play("levelup");
    router.push(`/pulau/${slug}`);
  }

  /** Klaim hadiah login harian. Sekali sehari, besok datang lagi. */
  function klaimHadiah() {
    const out = claimDailyReward();
    if (out.already || !out.coins) {
      play("wrong");
      return;
    }
    play("levelup");
    setSave(load());
  }

  if (!save) {
    return (
      <main className="space-bg relative grid min-h-screen place-items-center overflow-hidden">
        <SpaceBackdrop />
        <LoadingMeteors text="Memuat Planet Luminara..." />
      </main>
    );
  }

  const doneCount = Object.values(save.islands || {}).filter((i) => i.done).length;

  // Sudah mengerjakan Tantangan Harian hari ini?
  const dailyKey = `daily-${today()}`;
  const dailyDone = Boolean(save.islands?.[DAILY_ISLAND.slug]?.missions?.[dailyKey]);

  // Hadiah login harian (rangkaian 7 hari).
  const hadiah = rewardInfo(save);

  // Pulau berikutnya yang seharusnya dimainkan anak (yang pertama belum
  // tamat dan sudah terbuka). Dipakai untuk memberi penanda berdenyut.
  const nextSlug =
    ISLANDS.find(
      (isl) =>
        !isl.soon &&
        !save.islands?.[isl.slug]?.done &&
        isIslandOpen(isl.slug, save)
    )?.slug || null;

  // Posisi pusat ikon setiap pulau dalam piksel, disusun sesuai urutan rantai.
  // Perhitungannya analitis (persen x ukuran kotak + setengah tinggi ikon)
  // supaya tetap tepat walaupun ikonnya sedang melayang karena animasi idle.
  const setengahIkon = bp === "sm" ? 48 : 56;
  const simpul = ukuran.w
    ? ISLANDS.map((isl) => {
        const p = posOf(isl);
        return {
          x: (parseFloat(p.left) / 100) * ukuran.w,
          y: (parseFloat(p.top) / 100) * ukuran.h + setengahIkon,
        };
      })
    : [];

  return (
    <main className="space-bg relative min-h-screen overflow-x-clip">
      <SpaceBackdrop />

      {/* Header. Sticky supaya tombol dan HUD tetap terlihat saat peta
          digulir; wadahnya (main) memakai overflow-x-clip supaya position:
          sticky tetap bekerja.

          Di layar HP header dipecah jadi dua baris supaya tidak ada yang
          terpotong: baris pertama berisi tombol navigasi + tombol aksi,
          baris kedua diisi penuh oleh HUD. Urutan diatur lewat `order`
          sehingga di layar lebar kembali menjadi satu baris. */}
      <header className="sticky top-0 z-40 bg-zippy-navy/55 p-3 backdrop-blur-md sm:p-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              play("pop");
              router.push("/");
            }}
            className="order-1 flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-white transition hover:bg-white/20"
            aria-label="Kembali ke beranda"
          >
            <Home className="h-5 w-5" strokeWidth={2.6} />
            <span className="hidden text-sm font-black sm:inline">Beranda</span>
          </button>

          <div className="order-3 w-full basis-full sm:order-2 sm:w-auto sm:basis-auto">
            <Hud
              coins={save.coins}
              streak={save.streak}
              xp={save.xp}
              nickname={save.nickname}
              equipped={save.equipped}
              stamina={save.stamina}
              soundOn={sound}
              onToggleSound={toggleSound}
              motionOn={motionOn}
              onToggleMotion={toggleMotion}
              onProfile={() => {
                play("pop");
                router.push("/profil");
              }}
              compact
            />
          </div>

          <div className="order-2 ml-auto flex shrink-0 items-center gap-2 sm:order-3 sm:ml-auto">
            <button
              onClick={() => {
                play("pop");
                setShop(true);
              }}
              className="flex items-center gap-2 rounded-full bg-zippy-yellow px-3 py-2 text-sm font-black text-zippy-navy btn-pop"
            >
              <Shirt className="h-5 w-5" strokeWidth={2.8} />
              <span className="hidden sm:inline">Toko</span>
            </button>
            <button
              onClick={() => {
                play("pop");
                router.push("/dashboard");
              }}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Dasbor orang tua"
            >
              <BarChart3 className="h-5 w-5" strokeWidth={2.6} />
            </button>
          </div>
        </div>
      </header>

      {/* Judul + hadiah harian */}
      <div className="relative z-20 px-4 pt-3 text-center sm:px-5 sm:pt-4">
        <h1 className="font-display text-[22px] font-bold leading-tight text-white text-stroke-navy sm:text-3xl">
          Peta Planet Luminara
        </h1>
        <p className="mx-auto mt-1 max-w-md text-[13px] font-bold leading-snug text-white/60 sm:text-sm">
          {doneCount === 0
            ? "Pilih pulau untuk memulai petualangan pertamamu!"
            : `Hebat! ${doneCount} pulau sudah kamu selesaikan. Lanjut yang berikutnya!`}
        </p>

        {/* Hadiah harian: kecil, jelas, dan bisa diklaim satu kali sehari */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 170, damping: 16 }}
          className="mx-auto mt-3 flex max-w-md items-center gap-3 rounded-3xl border-4 border-white/20 bg-white/10 px-3 py-2.5 text-left backdrop-blur sm:px-4 sm:py-3"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-zippy-mint text-zippy-navy sm:h-11 sm:w-11">
            <Gift className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className="font-display text-sm font-bold text-white sm:text-base">
                Hadiah Harian
              </span>
              <span className="shrink-0 text-xs font-black text-zippy-yellow sm:text-sm">
                {hadiah.amount} koin
              </span>
            </span>
            <span className="mt-1.5 flex gap-1" aria-hidden="true">
              {Array.from({ length: hadiah.total }).map((_, i) => {
                const sudah = i < hadiah.progress;
                const berikut = !hadiah.claimedToday && i === hadiah.progress;
                return (
                  <span
                    key={i}
                    className={`h-2 flex-1 rounded-full transition ${
                      sudah
                        ? "bg-zippy-yellow"
                        : berikut
                        ? "bg-zippy-mint"
                        : "bg-white/20"
                    }`}
                  />
                );
              })}
            </span>
            <span className="mt-1 block text-[11px] font-bold leading-tight text-white/55">
              Hari ke-{hadiah.day} ·{" "}
              {hadiah.claimedToday
                ? "Sudah diambil. Kembali besok ya!"
                : "Tekan tombol untuk ambil."}
            </span>
          </span>
          <button
            onClick={klaimHadiah}
            disabled={!hadiah.claimable}
            aria-label="Ambil hadiah harian"
            className={`btn-pop grid h-10 w-10 shrink-0 place-items-center rounded-full sm:h-11 sm:w-11 ${
              hadiah.claimable
                ? "bg-zippy-yellow text-zippy-navy"
                : "bg-white/15 text-white/50"
            }`}
          >
            {hadiah.claimedToday ? (
              <Check className="h-5 w-5" strokeWidth={3.2} />
            ) : (
              <Gift className="h-5 w-5" strokeWidth={2.8} />
            )}
          </button>
        </motion.div>

        {/* Ajakan daftar untuk tamu. Ditaruh sebelum Tantangan Harian supaya
            langsung terlihat tanpa menggulir, dan supaya anak paham mengapa
            mayoritas pulau di peta masih berkabut. */}
        {isTamu(save) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 170, damping: 16 }}
            className="mx-auto mt-3 w-full max-w-md rounded-3xl border-4 border-zippy-mint/60 bg-zippy-teal/25 p-4 text-center"
          >
            <p className="font-display text-base font-bold text-white">
              Kamu bermain sebagai <span className="text-zippy-yellow">tamu</span>
            </p>
            <p className="mt-1 text-xs font-semibold text-white/70">
              Pulau Perkenalan sudah bisa dimainkan. Masuk ke akun Pendamping untuk
              membuka lima pulau lainnya dan menyimpan progresmu.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => {
                  play("pop");
                  router.push("/daftar");
                }}
                className="btn-pop rounded-2xl bg-zippy-yellow px-5 py-2.5 text-sm font-black text-zippy-navy"
              >
                Daftar / Masuk
              </button>
              <button
                onClick={() => {
                  play("pop");
                  router.push(`/pulau/${TRIAL_SLUG}`);
                }}
                className="rounded-2xl border-4 border-white/30 px-5 py-2 text-sm font-black text-white transition hover:bg-white/10"
              >
                Mulai Pulau Perkenalan
              </button>
            </div>
          </motion.div>
        )}

        {/* Tantangan Harian: selalu tersedia, hadiah penuh sekali sehari */}
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: "spring", stiffness: 170, damping: 16 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            play("pop");
            // Tantangan Harian mengambil soal dari semua pulau, jadi untuk
            // tamu ia ikut dikunci - tamu hanya memainkan satu pulau.
            if (isTamu(save)) {
              setGerbang(true);
              return;
            }
            router.push(`/pulau/${DAILY_ISLAND.slug}`);
          }}
          className={`mx-auto mt-3 flex w-full max-w-md items-center gap-3 rounded-3xl border-4 px-4 py-3 text-left shadow-pop-lg transition sm:px-5 ${
            dailyDone
              ? "border-emerald-300/50 bg-emerald-400/20"
              : "border-zippy-yellow/70 bg-zippy-yellow/15"
          }`}
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-zippy-yellow text-zippy-navy">
            <Sparkles className="h-6 w-6" strokeWidth={2.8} />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-base font-bold text-white">
              {DAILY_ISLAND.name}
            </span>
            <span className="block text-xs font-bold leading-snug text-white/65">
              {dailyDone
                ? "Hadiah hari ini sudah diambil. Tunggu besok, ya!"
                : "5 soal campuran. Koin penuh hari ini!"}
            </span>
          </span>
          {dailyDone && (
            <span className="ml-auto shrink-0 rounded-full bg-emerald-400 px-2 py-1 text-[10px] font-black text-zippy-navy">
              SELESAI
            </span>
          )}
        </motion.button>
      </div>

      {/* Peta pulau.

          Tingginya dibuat dua versi karena beda layar memakai beda jumlah baris:
          layar lebar cukup 2 baris, layar sedang/sempit butuh 3 baris supaya
          ke-8 pulau tidak saling bertumpuk. */}
      <div
        ref={petaRef}
        className="relative z-10 mx-auto w-full max-w-6xl"
        style={{
          height:
            bp === "lg" ? "clamp(420px, 52vh, 600px)" : "clamp(520px, 74vh, 740px)",
        }}
      >
        {/* Rantai penghubung antar pulau: menunjukkan urutan yang harus
            diselesaikan. Digambar paling bawah supaya tertutup ikon pulau,
            sehingga garisnya seolah-olah masuk dan keluar dari balik pulau. */}
        {simpul.length > 1 && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            {simpul.slice(0, -1).map((_, i) => {
              const sudah = Boolean(save.islands?.[ISLANDS[i].slug]?.done);
              const warna = sudah ? "#FFC93C" : "#FFFFFF";
              const tengah = tengahRantai(simpul, i);
              return (
                <g key={i}>
                  {/* Kabut lebar sebagai alas, supaya garis tetap terlihat di
                      atas bintang-bintang yang bergerak */}
                  <path
                    d={jalurRantai(simpul, i)}
                    fill="none"
                    stroke={warna}
                    strokeOpacity={sudah ? 0.3 : 0.14}
                    strokeWidth={15}
                    strokeLinecap="round"
                  />
                  {/* Garis putus-putus: titik-titik untuk jalur yang sudah
                      dilewati, garis pendek untuk jalur yang belum */}
                  <path
                    d={jalurRantai(simpul, i)}
                    fill="none"
                    stroke={warna}
                    strokeOpacity={sudah ? 0.95 : 0.45}
                    strokeWidth={sudah ? 7 : 5}
                    strokeLinecap="round"
                    strokeDasharray={sudah ? "1 17" : "9 13"}
                  />
                  {/* Panah arah di tengah segmen */}
                  <polygon
                    points="0,-9 14,0 0,9"
                    fill={warna}
                    fillOpacity={sudah ? 0.95 : 0.5}
                    transform={`translate(${tengah.x} ${tengah.y}) rotate(${tengah.sudut})`}
                  />
                </g>
              );
            })}
          </svg>
        )}

        {ISLANDS.map((isl, i) => {
          const isDone = Boolean(save.islands?.[isl.slug]?.done);
          const open = isIslandOpen(isl.slug, save);
          // Pulau berikutnya yang harus dimainkan anak: dapat sorotan
          // berdenyut supaya jelas ke mana harus pergi.
          const berikut = open && !isDone && isl.slug === nextSlug;
          const p = posOf(isl);
          return (
            <div
              key={isl.slug}
              className="absolute -translate-x-1/2"
              style={{ top: p.top, left: p.left, transition: "top .45s ease, left .45s ease" }}
            >
              {/* Lapisan melayang. Terpisah dari transform Framer Motion di
                  bawahnya supaya keduanya tidak saling menimpa. */}
              <div
                className="animate-island-float"
                style={{
                  animationDelay: `${i * 0.55}s`,
                  animationDuration: `${5.4 + i * 0.35}s`,
                }}
              >
              <motion.button
                initial={{ opacity: 0, scale: 0.6, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.12, type: "spring", stiffness: 150, damping: 13 }}
                whileHover={open ? { scale: 1.08, y: -6 } : {}}
                whileTap={open ? { scale: 0.95 } : {}}
                onClick={() => {
                  // Pulau masa depan tetap boleh diketuk supaya anak tahu
                  // isinya sedang disiapkan, bukan merasa salah menekan.
                  if (open || isl.soon) setSel(isl);
                  // Tamu tidak diberi suara "salah" begitu saja - ia dibawa
                  // ke ajakan mendaftar, karena itu memang satu-satunya cara
                  // membuka pulau yang dikliknya.
                  else if (isTamu(save)) setGerbang(true);
                  else play("wrong");
                }}
                aria-label={
                  open
                    ? `Buka ${isl.name}`
                    : isl.soon
                    ? `${isl.name} segera hadir`
                    : `${isl.name} masih terkunci`
                }
                className="relative flex w-24 flex-col items-center sm:w-40"
              >
              {/* Kabut abu untuk pulau terkunci */}
              {open ? (
                <span className="relative block">
                  {/* Cincin bercahaya yang mengembang berulang: penanda bahwa
                      pulau ini terbuka dan boleh dimainkan. Pakai margin,
                      bukan translate, supaya tidak bentrok dengan transform
                      milik keyframes-nya sendiri. */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-3 -ml-11 h-[88px] w-[88px] sm:top-4 sm:-ml-[56px] sm:h-28 sm:w-28"
                  >
                    <span
                      className="animate-island-ring absolute inset-0 rounded-full border-[3px]"
                      style={{
                        borderColor: isl.color || "#FFC93C",
                        boxShadow: `0 0 26px 4px ${isl.color || "#FFC93C"}45`,
                        animationDelay: `${i * 0.45}s`,
                      }}
                    />
                  </span>

                  {/* Kilau kecil yang berkedip di dua sisi pulau */}
                  <span
                    aria-hidden="true"
                    className="animate-island-spark pointer-events-none absolute -left-1 top-2 text-base text-zippy-yellow sm:text-lg"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  >
                    ✦
                  </span>
                  <span
                    aria-hidden="true"
                    className="animate-island-spark pointer-events-none absolute -right-1 top-8 text-sm text-zippy-mint sm:top-10"
                    style={{ animationDelay: `${i * 0.3 + 0.9}s` }}
                  >
                    ✦
                  </span>

                  <img
                    src={isl.icon}
                    decoding="async"
                    alt={isl.name}
                    className={`h-24 w-24 object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)] sm:h-28 sm:w-28 ${
                      berikut ? "animate-island-invite" : ""
                    }`}
                  />
                </span>
              ) : (
                <div className="relative">
                  <img
                    src={isl.icon}
                    decoding="async"
                    alt={isl.name}
                    className="h-24 w-24 object-contain opacity-30 grayscale drop-shadow-[0_8px_14px_rgba(0,0,0,0.4)] sm:h-28 sm:w-28"
                  />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-zippy-navy/85 text-zippy-mint">
                      <Lock className="h-6 w-6" strokeWidth={3} />
                    </span>
                  </span>
                </div>
              )}

              <span
                className={`animate-label-bounce mt-1 whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-black leading-4 shadow-pop sm:px-3 sm:text-xs ${
                  open ? "bg-white text-zippy-navy" : "bg-white/15 text-white/60"
                }`}
                style={{ animationDelay: `${i * 0.4}s` }}
              >
                {isl.name}
              </span>
              {berikut && (
                <span className="mt-1 rounded-full bg-zippy-yellow px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-zippy-navy sm:text-[10px]">
                  Main di sini
                </span>
              )}
              {isDone && (
                <span className="mt-1 rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-black text-zippy-navy">
                  SELESAI
                </span>
              )}
              </motion.button>
              </div>
            </div>
          );
        })}

        {/* (Zippy sengaja tidak diletakkan di dalam kotak peta: di dalam peta
            dia selalu menutupi salah satu pulau dan ukurannya ikut berubah
            ketika isinya berganti. Sekarang dia berdiri tepat di bawah peta.) */}
      </div>

      {/* Zippy penjelajah */}
      <div className="relative z-20 mx-auto flex w-full max-w-6xl justify-center px-4 pt-1 sm:justify-start">
        <Zippy
          size={104}
          // Saat menunjuk pulau tertentu Zippy tetap menunjuk (momen percakapan
          // harus jelas). Di sela-sela itu dia berdiri mengenakan kostum yang
          // sedang dipakai anak, sehingga pembelian di Toko terlihat nyata.
          mood={sel ? "menunjuk" : moodKostum(save.equipped, "menyapa")}
          anim="floaty"
          eager
          speechW={238}
          speechH={76}
          speech={
            sel
              ? `Kau mau ke ${sel.name}?`
              : doneCount === 0
              ? "Ayo pilih pulau, Sahabat!"
              : "Pulau mana yang mau kita coba?"
          }
        />
      </div>

      {/* Panel info pulau */}
      <AnimatePresence>
        {sel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSel(null)}
            className="fixed inset-0 z-40 grid place-items-end bg-black/60 p-4 backdrop-blur-sm sm:place-items-center"
          >
            <motion.div
              initial={{ y: 60, scale: 0.94 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 60, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="card-pop w-full max-w-md overflow-hidden rounded-[30px] border-4 border-zippy-teal bg-cream"
            >
              <div className="relative bg-zippy-navy p-6 text-center">
                <img
                  src={sel.icon}
                  alt={sel.name}
                  className="mx-auto h-28 w-28 object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.4)]"
                />
                <h2 className="mt-2 font-display text-2xl font-bold text-white">{sel.name}</h2>
                <p className="text-sm font-bold text-zippy-mint">{sel.subject}</p>
                {sel.soon && (
                  <span className="mt-3 inline-block rounded-full bg-zippy-yellow px-3 py-1 text-[11px] font-black text-zippy-navy">
                    SEGERA HADIR
                  </span>
                )}
              </div>
              <div className="p-6">
                <p className="font-display text-lg font-bold text-zippy-navy">{sel.tagline}</p>
                <p className="mt-1 text-sm font-semibold text-zippy-navy/70">{sel.desc}</p>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => setSel(null)}
                    className={`btn-pop rounded-2xl px-4 py-3 font-black text-zippy-navy ${
                      sel.soon ? "w-full" : "flex-1"
                    } bg-zippy-navy/10`}
                  >
                    Nanti
                  </button>
                  {!sel.soon && (
                    <button
                      onClick={() => goIsland(sel.slug)}
                      className="btn-pop flex-[2] rounded-2xl bg-zippy-yellow px-4 py-3 font-black text-zippy-navy"
                    >
                      Masuk Pulau!
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gerbang tamu: ajakan daftar ketika pulau terkunci ditekan */}
      <AnimatePresence>
        {gerbang && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setGerbang(false)}
            className="fixed inset-0 z-50 grid place-items-end bg-black/70 p-4 backdrop-blur-sm sm:place-items-center"
          >
            <motion.div
              initial={{ y: 60, scale: 0.94 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 60, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="card-pop w-full max-w-md rounded-[30px] border-4 border-zippy-teal bg-cream p-6 text-center"
            >
              <img
                src="/zippy/berpikir.webp"
                alt=""
                className="mx-auto h-28 w-28 object-contain"
                decoding="async"
              />
              <h2 className="mt-2 font-display text-xl font-bold text-zippy-navy sm:text-2xl">
                Pulau ini masih tertutup kabut
              </h2>
              <p className="mt-2 text-sm font-semibold text-zippy-navy/70">
                Kamu sudah mencoba ZippyVerse sebagai tamu. Masuk ke akun
                Pendamping untuk membuka lima pulau lainnya, Tantangan Harian, dan
                menyimpan progres supaya tidak hilang saat ganti perangkat.
              </p>
              <button
                onClick={() => {
                  play("pop");
                  setGerbang(false);
                  router.push("/daftar");
                }}
                className="btn-pop mt-5 w-full rounded-2xl bg-zippy-yellow px-6 py-3.5 font-black text-zippy-navy"
              >
                Daftar / Masuk
              </button>
              <button
                onClick={() => {
                  play("pop");
                  setGerbang(false);
                  router.push(`/pulau/${TRIAL_SLUG}`);
                }}
                className="mt-3 block w-full text-sm font-black text-zippy-teal underline underline-offset-4"
              >
                Nanti dulu, lanjutkan Pulau Perkenalan
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toko kostum */}
      <ShopModal
        open={shop}
        onClose={() => setShop(false)}
        save={save}
        onChange={(s) => {
          setSave(s);
          persist(s);
        }}
      />

      <ZippyChat />

      {/* Info kecil */}
      <p className="relative z-10 px-5 pb-6 text-center text-xs font-bold text-white/35">
        <Sparkles className="mr-1 inline h-3.5 w-3.5" />
        ZippyVerse · Petualangan di Planet Luminara — ketuk pulau untuk membuka.
      </p>
    </main>
  );
}