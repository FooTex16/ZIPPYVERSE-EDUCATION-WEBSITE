"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Lock, Play, Star, Trophy, Coins, CheckCircle2 } from "lucide-react";
import SpaceBackdrop from "@/components/SpaceBackdrop";
import Zippy from "@/components/Zippy";
import Hud from "@/components/Hud";
import ZippyChat from "@/components/ZippyChat";
import MissionDragCount from "@/components/missions/MissionDragCount";
import MissionBlitz from "@/components/missions/MissionBlitz";
import MissionBoss from "@/components/missions/MissionBoss";
import MissionMCQ from "@/components/missions/MissionMCQ";
import MissionScramble from "@/components/missions/MissionScramble";
import MissionOrder from "@/components/missions/MissionOrder";
import { ISLANDS, MISSIONS, DAILY_ISLAND, isIslandOpen, isTamu, moodKostum, TRIAL_SLUG } from "@/lib/gameData";
import {
  load,
  touchStreak,
  completeMission,
  recordAnswers,
  addPlayTime,
  logMission,
  today,
  spendStamina,
  staminaInfo,
  STAMINA_PER_MISSION,
  biayaUlangMisi,
  beliUlangMisi,
} from "@/lib/store";
import { play, unlockAudio, setSfxEnabled } from "@/lib/sfx";
import LoadingMeteors from "@/components/LoadingMeteors";
import IstirahatOverlay from "@/components/IstirahatOverlay";
import PengingatDiam from "@/components/PengingatDiam";
import { Coffee, Zap } from "lucide-react";

// Pemetaan tipe misi ke komponennya. Ditulis sebagai tabel agar mudah
// ditambah ketika ada mode permainan baru.
const MISSION_COMPONENTS = {
  dragcount: MissionDragCount,
  blitz: MissionBlitz,
  boss: MissionBoss,
  mcq: MissionMCQ,
  scramble: MissionScramble,
  order: MissionOrder,
};

export default function IslandPage() {
  const { slug } = useParams();
  const router = useRouter();
  const island = useMemo(
    () => ISLANDS.find((i) => i.slug === slug) || (slug === DAILY_ISLAND.slug ? DAILY_ISLAND : null),
    [slug]
  );
  const missions = useMemo(() => MISSIONS[slug] || [], [slug]);

  const [save, setSave] = useState(null);
  const [phase, setPhase] = useState("pilih"); // pilih | main | reward
  const [active, setActive] = useState(null);
  const [result, setResult] = useState(null);
  const [sound, setSound] = useState(true);
  // Layar istirahat: muncul saat energi habis.
  const [istirahat, setIstirahat] = useState(false);
  const startedRef = useRef(null);
  // Penghitung pengulangan: tiap kali anak memulai ulang misi di pulau yang
  // sudah dibeli izin urungnya, angka ini naik. Dipakai sebagai benih acak
  // supaya urutan jawaban berubah tiap kali, tapi soalnya tetap sama.
  const [repeatCount, setRepeatCount] = useState(0);

  useEffect(() => {
    setSave(touchStreak());
    unlockAudio();
  }, []);

  // Hitung waktu bermain
  useEffect(() => {
    if (phase !== "main") return;
    startedRef.current = Date.now();
    const id = setInterval(() => {
      if (startedRef.current) {
        const sec = Math.round((Date.now() - startedRef.current) / 1000);
        addPlayTime(sec);
        startedRef.current = Date.now();
      }
    }, 10000);
    return () => clearInterval(id);
  }, [phase]);

  const toggleSound = () => {
    const v = !sound;
    setSound(v);
    setSfxEnabled(v);
    if (v) play("pop");
  };

  const handleDone = useCallback(
    (res, mission) => {
      // Catat ketepatan jawaban untuk dasbor orang tua
      const correct = res.score ?? 0;
      const wrong =
        res.wrongs !== undefined ? res.wrongs : Math.max(0, (res.total ?? 0) - correct);
      recordAnswers(correct, wrong);

      // Tantangan Harian diberi kunci tanggal supaya hadiah penuh kembali
      // tersedia setiap hari. Misi biasa memakai id tetap.
      const missionKey =
        slug === DAILY_ISLAND.slug ? `daily-${today()}` : mission.id;

      const out = completeMission(
        slug,
        missionKey,
        mission.reward,
        mission.xp,
        res.score ?? 0,
        // Tantangan Harian hanya memberi koin penuh sekali sehari.
        { daily: slug === DAILY_ISLAND.slug }
      );

      // Muat ulang setelah completeMission, karena playerId baru dibuat di sana.
      const after = load();
      logMission(after.playerId, slug, missionKey, res.score ?? 0, "selesai");

      const fresh = load();
      setSave(fresh);
      setResult({ ...res, gained: out.coins, first: out.v, mission });
      setPhase("reward");
    },
    [slug]
  );

  /**
   * Mulai satu misi.
   *
   * Anak memakai stamina tiap kali masuk misi. Kalau energinya habis,
   * layar istirahat muncul — ini cara supaya anak tidak bermain terus
   * tanpa henti dan mau beristirahat mata serta badannya.
   */
  function mulaiMisi(m) {
    const info = staminaInfo(load());
    if (!info.canPlay) {
      play("wrong");
      setIstirahat(true);
      return;
    }
    spendStamina(STAMINA_PER_MISSION);
    setSave(load());
    // Kalau ini pengulangan (izin sudah dibeli), naikkan penghitung supaya
    // urutan jawaban berbeda dari sebelumnya.
    if (save?.islands?.[slug]?.ulang) setRepeatCount((c) => c + 1);
    play("levelup");
    setActive(m);
    setPhase("main");
  }

  // Dua keadaan yang dulu dirangkap satu `if` tetapi artinya berbeda:
  //
  //   `!save`   -> `save` masih `null` karena `useEffect` di atas belum
  //                sempat berjalan. Ini memuat yang sesungguhnya, sebentar
  //                lalu hilang sendiri.
  //   `!island` -> `island` dihitung dari `ISLANDS` yang statis, jadi `null`
  //                berarti slug itu memang tidak pernah ada. Tidak akan
  //                berubah walau ditunggu berjam-jam.
  //
  // Dulu keduanya dipakai bersama, sehingga salah mengetik alamat pulau
  // menampilkan "Memuat pulau..." selamanya - tanpa satu pun tombol untuk
  // keluar. Kini keduanya dipisah supaya slug yang tak dikenal bisa
  // menawarkan jalan pulang.
  if (!save) {
    return (
      <main className="space-bg relative grid min-h-screen place-items-center overflow-hidden">
        <SpaceBackdrop />
        <LoadingMeteors
          text="Memuat pulau..."
          sub="Zippy sedang menyiapkan misi untukmu."
        />
      </main>
    );
  }

  if (!island) {
    return (
      <main className="space-bg relative grid min-h-screen place-items-center overflow-hidden">
        <SpaceBackdrop />
        <div className="relative z-10 flex flex-col items-center gap-4 px-5 text-center">
          <Zippy
            size={130}
            mood="terkejut"
            speech="Pulau ini tidak ada, Sahabat!"
          />
          <h1 className="font-display text-3xl font-bold text-white">
            Pulau Tidak Ditemukan
          </h1>
          <p className="max-w-sm text-sm font-semibold text-white/70">
            Alamat <span className="text-zippy-yellow">{slug}</span> tidak ada
            di Planet Luminara. Mungkin Zippy salah menulisnya? Yuk kembali ke
            peta dan pilih pulau yang lain.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => router.push("/peta")}
              className="btn-pop rounded-2xl bg-zippy-yellow px-6 py-3 font-black text-zippy-navy"
            >
              Kembali ke Peta
            </button>
            <button
              onClick={() => router.push(`/pulau/${TRIAL_SLUG}`)}
              className="rounded-2xl border-4 border-white/30 px-6 py-2.5 font-black text-white transition hover:bg-white/10"
            >
              Main Pulau Perkenalan
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!isIslandOpen(slug, save)) {
    // Cari pulau sebelumnya agar pesannya bisa menyebut pulau yang harus
    // diselesaikan lebih dulu, bukan hanya menyebut Pulau Angka.
    const idx = ISLANDS.findIndex((i) => i.slug === slug);
    const prev = idx > 0 ? ISLANDS[idx - 1] : null;
    const soon = idx >= 0 && ISLANDS[idx].soon;
    // Tamu tidak dikurung karena belum menyelesaikan pulau lain, melainkan
    // karena belum punya akun Pendamping. Pesannya harus jujur soal itu -
    // kalau tidak, anak akan kebingungan mencari "pulau sebelumnya" yang
    // justru masih terkunci juga.
    const tamu = !soon && isTamu(save);
    return (
      <main className="space-bg relative grid min-h-screen place-items-center overflow-hidden">
        <SpaceBackdrop />
        <div className="relative z-10 flex flex-col items-center gap-4 px-5 text-center">
          <img src={island.icon} alt={island.name} className="h-32 w-32 opacity-40 grayscale" />
          <h1 className="font-display text-3xl font-bold text-white">
            {island.name} {soon ? "Segera Hadir" : tamu ? "Khusus Anggota" : "Terkunci"}
          </h1>
          <p className="max-w-sm text-sm font-semibold text-white/70">
            {soon ? (
              "Zippy masih menyiapkan pulau ini. Nantikan ya, Sahabat!"
            ) : tamu ? (
              <>
                Kamu sedang bermain sebagai{" "}
                <span className="text-zippy-yellow">tamu</span>, jadi baru Pulau
                Perkenalan yang bisa dimainkan. Masuk ke akun Pendamping untuk
                membuka lima pulau lainnya!
              </>
            ) : (
              <>
                Selesaikan {prev ? prev.name : "pulau sebelumnya"} dulu, ya. Kalau
                sudah, {island.name} langsung terbuka!
              </>
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {tamu ? (
              <>
                <button
                  onClick={() => router.push("/daftar")}
                  className="btn-pop rounded-2xl bg-zippy-yellow px-6 py-3 font-black text-zippy-navy"
                >
                  Daftar / Masuk
                </button>
                <button
                  onClick={() => router.push(`/pulau/${TRIAL_SLUG}`)}
                  className="rounded-2xl border-4 border-white/30 px-6 py-2.5 font-black text-white transition hover:bg-white/10"
                >
                  Main Pulau Perkenalan
                </button>
              </>
            ) : (
              <button
                onClick={() =>
                  router.push(!soon && prev ? `/pulau/${prev.slug}` : "/peta")
                }
                className="btn-pop rounded-2xl bg-zippy-yellow px-6 py-3 font-black text-zippy-navy"
              >
                {!soon && prev ? `Ke ${prev.name}` : "Kembali ke Peta"}
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ---------- Fase memilih misi ----------
  if (phase === "pilih") {
    const doneMissions = save.islands?.[slug]?.missions || {};
    // Pulau biasa yang sudah tamat tidak bisa diulang, supaya koin tetap
    // bisa didapat lewat Tantangan Harian atau tantangan besok.
    const isDaily = slug === DAILY_ISLAND.slug;
    const dailyKey = `daily-${today()}`;
    const sudahBeliUlang = Boolean(save.islands?.[slug]?.ulang);
    const tamat = !isDaily && Boolean(save.islands?.[slug]?.done) && !sudahBeliUlang;
    const bisaUlang = !isDaily && Boolean(save.islands?.[slug]?.done) && sudahBeliUlang;
    const dailyHariIni = isDaily && Boolean(doneMissions[dailyKey]);
    const energi = staminaInfo(save);
    const hargaUlang = biayaUlangMisi();
    const koinKurang = save.coins < hargaUlang;

    return (
      <main className="space-bg relative min-h-screen overflow-x-clip">
        <SpaceBackdrop />
        {/* Header sticky. Di HP dipecah jadi dua baris supaya tombol dan HUD
            tidak saling berebut ruang sampai ada yang terpotong. */}
        <header className="sticky top-0 z-40 bg-zippy-navy/55 p-3 backdrop-blur-md sm:p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                play("pop");
                router.push("/peta");
              }}
              className="order-1 flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-2 font-black text-white transition hover:bg-white/20 sm:px-4"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={3} />
              Peta
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
                compact
              />
            </div>

            <div className="order-2 ml-auto flex shrink-0 items-center gap-2 sm:order-3">
              <span
                className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-black sm:px-3 ${
                  energi.canPlay
                    ? "bg-emerald-400/20 text-emerald-200"
                    : "bg-zippy-yellow text-zippy-navy"
                }`}
                title={`Energi ${energi.value} dari ${energi.max}`}
              >
                <Zap className="h-4 w-4" strokeWidth={3} />
                {energi.value}
              </span>
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-4xl px-4 pb-16 sm:px-5">
          {/* Kartu pulau */}
          <div className="card-pop mb-6 overflow-hidden rounded-[30px] border-4 border-white/10 bg-white/10 backdrop-blur sm:mb-7">
            <div className="flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:p-6 sm:text-left">
              <img
                src={island.icon}
                alt={island.name}
                className="h-24 w-24 shrink-0 object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.4)] sm:h-28 sm:w-28"
              />
              <div className="min-w-0">
                <span className="rounded-full bg-zippy-yellow px-3 py-1 text-xs font-black text-zippy-navy">
                  {island.subject}
                </span>
                <h1 className="mt-2 font-display text-2xl font-bold leading-tight text-white sm:text-3xl">
                  {island.name}
                </h1>
                <p className="mt-1 font-bold text-white/70">{island.tagline}</p>
                <p className="mt-1 text-sm font-semibold text-white/55">{island.desc}</p>
              </div>
            </div>
          </div>

          {/* Pulau tamat / hadiah harian sudah habis hari ini */}
          {tamat && (
            <div className="mb-6 rounded-3xl border-4 border-emerald-300/40 bg-emerald-400/15 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-400 text-zippy-navy">
                  <Trophy className="h-5 w-5" strokeWidth={2.8} />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-base font-bold text-white">
                    Pulau ini sudah tamat!
                  </p>
                  <p className="mt-0.5 text-sm font-semibold leading-snug text-white/70">
                    Semua misinya sudah selesai. Beli izin ulang untuk
                    mengulang misinya lagi — koinnya <b>50%</b> dari hadiah
                    asli, dan soalnya tetap sama tapi urutan jawabannya diacak.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  disabled={koinKurang}
                  onClick={() => {
                    const hasil = beliUlangMisi(slug);
                    if (hasil.ok) {
                      setSave(hasil.s);
                      play("yeay");
                    } else {
                      play("wrong");
                    }
                  }}
                  className={`btn-pop flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 font-black transition ${
                    koinKurang
                      ? "cursor-not-allowed bg-white/10 text-white/40"
                      : "bg-zippy-yellow text-zippy-navy hover:bg-zippy-yellow/90"
                  }`}
                >
                  <Coins className="h-4 w-4" strokeWidth={3} />
                  Ulang Misi — {hargaUlang} koin
                </button>
                {koinKurang && (
                  <p className="text-xs font-bold text-white/60">
                    Kurang {hargaUlang - save.coins} koin lagi.
                  </p>
                )}
              </div>
            </div>
          )}
          {bisaUlang && (
            <div className="mb-6 flex items-start gap-3 rounded-3xl border-4 border-zippy-teal/60 bg-zippy-teal/15 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-zippy-teal text-white">
                <Play className="h-5 w-5" strokeWidth={2.8} />
              </span>
              <div className="min-w-0">
                <p className="font-display text-base font-bold text-white">
                  Izin ulang aktif — main lagi yuk!
                </p>
                <p className="mt-0.5 text-sm font-semibold leading-snug text-white/70">
                  Semua misi di pulau ini bisa diulang tanpa batas. Koin yang
                  didapat <b>50%</b> dari hadiah asli, dan urutan jawaban diacak
                  setiap kali.
                </p>
              </div>
            </div>
          )}
          {dailyHariIni && (
            <div className="mb-6 flex items-start gap-3 rounded-3xl border-4 border-zippy-yellow/50 bg-zippy-yellow/15 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-zippy-yellow text-zippy-navy">
                <Trophy className="h-5 w-5" strokeWidth={2.8} />
              </span>
              <div className="min-w-0">
                <p className="font-display text-base font-bold text-white">
                  Hadiah hari ini sudah diambil
                </p>
                <p className="mt-0.5 text-sm font-semibold leading-snug text-white/70">
                  Boleh bermain lagi untuk latihan, tapi koinnya kembali penuh
                  besok pagi. Kembali ke peta untuk hadiah harian ya!
                </p>
              </div>
            </div>
          )}

          {/* Energi menipis: ajakan istirahat sebelum anak memaksa bermain */}
          {!energi.canPlay && !tamat && (
            <div className="mb-6 flex items-start gap-3 rounded-3xl border-4 border-zippy-teal/60 bg-zippy-teal/15 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-zippy-teal text-white">
                <Coffee className="h-5 w-5" strokeWidth={2.8} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-bold text-white">
                  Energi hampir habis
                </p>
                <p className="mt-0.5 text-sm font-semibold leading-snug text-white/70">
                  Mata dan badan perlu istirahat dulu. Energi pulih sendiri
                  seiring waktu.
                </p>
              </div>
              <button
                onClick={() => setIstirahat(true)}
                className="btn-pop shrink-0 self-center rounded-2xl bg-zippy-yellow px-3 py-2 text-xs font-black text-zippy-navy"
              >
                Istirahat
              </button>
            </div>
          )}

          {/* Daftar misi */}
          <h2 className="mb-4 font-display text-xl font-bold text-white sm:text-2xl">
            {tamat ? "Semua Misi Selesai" : bisaUlang ? "Ulang Misi" : "Pilih Misi"}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {missions.map((m, i) => {
              const unlocked =
                !tamat &&
                (i === 0 ||
                  missions[i - 1]?.id in doneMissions ||
                  Boolean(doneMissions[missions[i - 1]?.id]));
              const best = doneMissions[m.id];
              return (
                <motion.button
                  key={m.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={unlocked ? { y: -6 } : {}}
                  whileTap={unlocked ? { scale: 0.96 } : {}}
                  disabled={!unlocked}
                  onClick={() => mulaiMisi(m)}
                  className={`card-pop relative flex flex-col items-start gap-2 rounded-[26px] p-4 text-left transition sm:p-5 ${
                    unlocked
                      ? "bg-white/12 hover:bg-white/18"
                      : "cursor-not-allowed bg-white/5 opacity-50"
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="rounded-full bg-zippy-teal px-3 py-1 text-xs font-black text-white">
                      {m.name}
                    </span>
                    {tamat ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-400 px-2.5 py-1 text-xs font-black text-zippy-navy">
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={3} /> Tamat
                      </span>
                    ) : best !== undefined ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-400 px-2.5 py-1 text-xs font-black text-zippy-navy">
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={3} /> Selesai
                      </span>
                    ) : !unlocked ? (
                      <Lock className="h-5 w-5 shrink-0 text-white/50" strokeWidth={3} />
                    ) : (
                      <Play className="h-5 w-5 shrink-0 text-zippy-yellow" strokeWidth={3} />
                    )}
                  </div>

                  <h3 className="font-display text-lg font-bold leading-tight text-white sm:text-xl">
                    {m.title}
                  </h3>
                  <p className="text-sm font-semibold leading-snug text-white/65">
                    {m.subtitle}
                  </p>

                  <div className="mt-2 flex items-center gap-3 text-sm font-black">
                    <span
                      className={`flex items-center gap-1 ${
                        tamat ? "text-white/40" : "text-zippy-yellow"
                      }`}
                      title={
                        tamat
                          ? "Pulau sudah tamat, tidak ada koin tambahan"
                          : bisaUlang
                            ? "Izin ulang aktif: koin 50% dari hadiah asli"
                            : undefined
                      }
                    >
                      <Coins className="h-4 w-4" strokeWidth={3} />
                      {tamat ? 0 : bisaUlang ? Math.round(m.reward * 0.5) : m.reward}
                    </span>
                    <span className="flex items-center gap-1 text-zippy-mint">
                      <Star className="h-4 w-4" strokeWidth={3} />+{m.xp} XP
                    </span>
                  </div>

                  {!unlocked && (
                    <p className="mt-1 text-xs font-bold leading-snug text-white/50">
                      {tamat
                        ? "Misi ini sudah tamat. Koin baru bisa didapat dari Tantangan Harian."
                        : `Selesaikan ${(missions[i - 1] || m).name} dulu, ya!`}
                    </p>
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center">
            <Zippy
              size={120}
              // Pulau tamat tetap memakai pose "merayakan" sebagai ganjaran
              // yang jelas. Selain itu Zippy berdiri mengenakan kostum anak.
              mood={tamat ? "merayakan" : moodKostum(save.equipped, "menyapa")}
              speech={
                tamat
                  ? "Luar biasa! Semua misi tamat, Sahabat!"
                  : bisaUlang
                    ? "Izin ulang aktif! Main lagi kapan saja, Sahabat!"
                    : "Pilih misi yang mau kamu main, Sahabat!"
              }
            />
          </div>
        </div>

        {/* Layar istirahat. Muncul saat energi habis supaya anak berhenti
            sejenak. Hitung mundurnya menunjukkan kapan energi pulih. */}
        <AnimatePresence>
          {istirahat && (
            <IstirahatOverlay
              energi={staminaInfo(save)}
              onClose={() => setIstirahat(false)}
              onPeta={() => {
                setIstirahat(false);
                router.push("/peta");
              }}
            />
          )}
        </AnimatePresence>

        <ZippyChat />
      </main>
    );
  }

  // ---------- Fase bermain ----------
  if (phase === "main" && active) {
    const Comp = MISSION_COMPONENTS[active.type] || MissionMCQ;

    return (
      <main className="space-bg relative min-h-screen overflow-x-clip">
        <SpaceBackdrop stars={40} dust={10} />
        <header className="sticky top-0 z-40 bg-zippy-navy/55 p-3 backdrop-blur-md sm:p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                play("pop");
                setPhase("pilih");
                setActive(null);
              }}
              className="order-1 flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-2 font-black text-white transition hover:bg-white/20 sm:px-4"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={3} />
              Keluar
            </button>
            <div className="order-2 min-w-0 flex-1 truncate rounded-full bg-white/10 px-3 py-2 text-center text-sm font-black text-white sm:px-4">
              {active.title}
            </div>
            <div className="order-3 w-full basis-full sm:w-auto sm:basis-auto">
              <Hud
                coins={save.coins}
                streak={save.streak}
                xp={save.xp}
                nickname={save.nickname}
                equipped={save.equipped}
                stamina={save.stamina}
                soundOn={sound}
                onToggleSound={toggleSound}
                compact
              />
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-5xl px-4 pb-10">
          <Comp mission={active} onDone={(res) => handleDone(res, active)} repeat={repeatCount} />
        </div>

        {/* Ajakan menjawab bila anak diam. Dipasang sekali di sini supaya
            berlaku untuk seluruh jenis misi tanpa mengulang logika di tiap
            komponen misi. Hanya aktif selama misi benar-benar berjalan. */}
        <PengingatDiam aktif={phase === "main" && Boolean(active)} />

        <ZippyChat />
      </main>
    );
  }

  // ---------- Fase hadiah ----------
  const r = result;
  // Penjelasan koin mengikuti aturan baru: pulau tamat & hadiah harian
  // yang sudah habis hari ini tidak menambah koin lagi.
  const dapat = r?.gained ?? 0;
  const pesanKoin =
    dapat > 0
      ? r?.first
        ? "Keren! Ini hadiah penuh untuk misi pertama kamu."
        : "Bagus! Kamu masih dapat koin tambahan dari misi ini."
      : slug === DAILY_ISLAND.slug
      ? "Hadiah harian hari ini sudah kamu ambil. Koin penuh kembali besok pagi!"
      : "Pulau ini sudah tamat. Koin baru bisa kamu dapat dari Tantangan Harian — atau tunggu tantangan besok ya!";
  // Pulau tamat tidak punya misi untuk diulang, jadi tombol "Misi lain"
  // disembunyikan dan tombol kembali peta yang dipakai (lebar penuh).
  const bolehUlang =
    slug === DAILY_ISLAND.slug || !save.islands?.[slug]?.done;

  return (
    <main className="space-bg relative grid min-h-screen place-items-center overflow-hidden">
      <SpaceBackdrop />

      {/* Konfeti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.span
            key={i}
            initial={{ y: -60, x: `${(i * 41) % 100}%`, opacity: 1 }}
            animate={{ y: "105vh", rotate: 360 }}
            transition={{ duration: 3.2 + (i % 5) * 0.6, repeat: Infinity, delay: (i % 8) * 0.4 }}
            className="absolute h-3.5 w-2.5 rounded-sm"
            style={{
              background: ["#FFC93C", "#2AA5A0", "#B2D8D5", "#FFF6E5"][i % 4],
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 170, damping: 15 }}
        className="card-pop relative z-10 mx-4 w-full max-w-lg overflow-hidden rounded-[32px] border-4 border-zippy-teal bg-cream"
      >
        <div className="bg-gradient-to-b from-zippy-yellow to-zippy-teal px-6 pb-10 pt-8 text-center">
          <motion.div
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="mx-auto mb-2 grid h-20 w-20 place-items-center rounded-full bg-white shadow-pop-lg"
          >
            <Trophy className="h-11 w-11 text-zippy-yellow" strokeWidth={2.6} />
          </motion.div>
          <h2 className="font-display text-3xl font-bold text-zippy-navy">Misi Selesai!</h2>
          <p className="mt-1 font-bold text-zippy-navy/70">{r?.mission?.title}</p>
        </div>

        <div className="-mt-6 px-6 pb-7">
          <div className="rounded-[26px] border-4 border-zippy-navy/10 bg-white p-5 shadow-pop">
            <div className="flex items-center justify-center gap-3">
              <Zippy size={92} mood="merayakan" anim="wiggle" />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-zippy-teal/12 py-3">
                <p className="text-xs font-black text-zippy-navy/60">Skor</p>
                <p className="text-2xl font-black text-zippy-teal">
                  {r?.score ?? 0}
                  <span className="text-sm text-zippy-navy/40">/{r?.total ?? 0}</span>
                </p>
              </div>
              <div className="rounded-2xl bg-zippy-yellow/25 py-3">
                <p className="text-xs font-black text-zippy-navy/60">Koin</p>
                <p className="text-2xl font-black text-zippy-navy">+{r?.gained ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-zippy-mint/30 py-3">
                <p className="text-xs font-black text-zippy-navy/60">XP</p>
                <p className="text-2xl font-black text-zippy-navy">+{r?.mission?.xp ?? 0}</p>
              </div>
            </div>

            <p className="mt-4 text-center text-sm font-bold leading-snug text-zippy-navy/70">
              {pesanKoin}
            </p>

            <div className="mt-5 flex gap-3">
              {bolehUlang && (
                <button
                  onClick={() => {
                    play("pop");
                    setPhase("pilih");
                    setActive(null);
                    setResult(null);
                  }}
                  className="btn-pop flex-1 rounded-2xl bg-zippy-navy/10 px-4 py-3 font-black text-zippy-navy"
                >
                  Misi lain
                </button>
              )}
              <button
                onClick={() => {
                  play("levelup");
                  router.push("/peta");
                }}
                className={`btn-pop rounded-2xl bg-zippy-yellow px-4 py-3 font-black text-zippy-navy ${
                  bolehUlang ? "flex-[2]" : "w-full"
                }`}
              >
                {bolehUlang ? "Balik ke Peta" : "Ke Peta — Ada Hadiah Harian"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}