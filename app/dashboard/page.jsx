"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Flame, Coins, Star, Clock, Target, TrendingUp, Lightbulb, Pencil, Zap, Settings2 } from "lucide-react";
import Link from "next/link";
import SpaceBackdrop from "@/components/SpaceBackdrop";
import Zippy from "@/components/Zippy";
import LoadingMeteors from "@/components/LoadingMeteors";
import { supabase, supabaseEnabled } from "@/lib/supabase";
import { load, staminaInfo, MAX_STAMINA, STAMINA_PER_MISSION, STAMINA_REGEN_MS } from "@/lib/store";
import { ISLANDS, MISSIONS } from "@/lib/gameData";
import { play } from "@/lib/sfx";

// ---------- Helper murni (bukan hook) ----------
function collectScores(save) {
  const out = [];
  for (const isl of Object.values(save.islands || {})) {
    for (const v of Object.values(isl.missions || {})) out.push(v);
  }
  return out;
}

function averageOf(arr) {
  if (!arr.length) return null;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function buildAdvice({ acc, minutes, streak, doneCount }) {
  if (minutes === 0) {
    return "Belum ada aktivitas belajar yang tercatat. Ajak anak memulai satu misi pendek sekitar 10 menit hari ini. Untuk anak SD, konsistensi setiap hari jauh lebih penting daripada durasi panjang.";
  }
  if (doneCount === 0) {
    return "Anak belum menyelesaikan pulau pertama. Rayakan progres kecil, misalnya puji ketekunannya, agar anak tetap bersemangat. Rutinitas harian lebih penting daripada belajar panjang sekaligus.";
  }
  if (acc >= 80) {
    return `Ketepatan jawaban ${acc}% tergolong sangat baik. Saatnya menaikkan tingkat kesulitan: beri Tantangan Kilat dengan angka lebih besar, atau majukan ke pulau berikutnya agar rasa ingin tahu anak tetap terpacu.`;
  }
  if (streak >= 3) {
    return `Streak ${streak} hari berturut-turut. Pertahankan kebiasaan ini dengan memberikan apresiasi secara verbal setiap malam, misalnya "kamu konsisten sekali hari ini".`;
  }
  return "Progres sudah berjalan. Jika streak terputus, jangan memberi tekanan. Cukup ingatkan bahwa belajar di ZippyVerse menyenangkan, dan biarkan Zippy yang memancing ketertarikan anak.";
}

export default function DashboardPage() {
  const router = useRouter();
  const [save, setSave] = useState(null);
  const [rows, setRows] = useState([]);
  const [dbStatus, setDbStatus] = useState("menunggu");
  const [bolehAdmin, setBolehAdmin] = useState(false);

  useEffect(() => {
    const s = load();
    setSave(s);

    (async () => {
      if (!supabaseEnabled) {
        setDbStatus("offline");
        return;
      }
      try {
        // Pintu masuk Panel Admin hanya diberikan kepada akun berperan
        // pengelola. Pemeriksaan memakai `app_metadata.role` - bukan
        // `user_metadata` - karena yang pertama tidak bisa diubah dari
        // peramban, sehingga tidak ada anak yang bisa memunculkan tombol
        // ini lewat Alat Pengembang.
        //
        // Tautan ini hanyalah kebijakan TAMPILAN. Pengaman sesungguhnya ada
        // di server: /api/admin menolak token yang perannya bukan pengelola,
        // jadi walau seseorang mengetik /admin secara langsung, ia tetap
        // berhenti di gerbang masuk.
        const { data: sesi } = await supabase.auth.getSession();
        const peran = sesi?.session?.user?.app_metadata?.role;
        setBolehAdmin(peran === "admin");

        let pid = s.playerId;
        if (!pid) {
          const { data } = await supabase
            .from("players")
            .select("id")
            .order("created_at", { ascending: false })
            .limit(1);
          if (data && data.length) pid = data[0].id;
        }
        if (!pid) {
          setDbStatus("kosong");
          return;
        }
        const { data, error } = await supabase
          .from("progress")
          .select("*")
          .eq("player_id", pid)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        setRows(data || []);
        setDbStatus("ok");
      } catch {
        setDbStatus("gagal");
      }
    })();
  }, []);

  if (!save) {
    return (
      <main className="space-bg relative grid min-h-screen place-items-center overflow-hidden">
        <SpaceBackdrop />
        <LoadingMeteors text="Memuat dasbor..." />
      </main>
    );
  }

  const level = Math.floor(save.xp / 100) + 1;
  const total = (save.totalCorrect || 0) + (save.totalWrong || 0);
  const acc = total > 0 ? Math.round(((save.totalCorrect || 0) / total) * 100) : 0;
  const minutes = Math.round((save.playSeconds || 0) / 60);
  const doneCount = Object.values(save.islands || {}).filter((i) => i.done).length;

  const scores = collectScores(save);
  const avgScore = averageOf(scores);
  const advice = buildAdvice({ acc, minutes, streak: save.streak, doneCount });
  const energi = staminaInfo(save);

  return (
    <main className="space-bg relative min-h-screen overflow-x-clip">
      <SpaceBackdrop stars={40} dust={10} />

      {/* Header sticky supaya tombol kembali & judul tetap terlihat.
          Wadahnya (main) memakai overflow-x-clip supaya sticky bekerja. */}
      <header className="sticky top-0 z-40 bg-zippy-navy/55 p-3 backdrop-blur-md sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => router.push("/peta")}
            className="flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-2 font-black text-white transition hover:bg-white/20 sm:px-4"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={3} />
            <span className="hidden sm:inline">Kembali</span>
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center font-display text-lg font-bold text-white sm:text-2xl">
            Dasbor Orang Tua
          </h1>
          <button
            onClick={() => {
              play("pop");
              router.push("/profil");
            }}
            className="flex shrink-0 items-center gap-2 rounded-full bg-zippy-yellow px-3 py-2 text-sm font-black text-zippy-navy transition hover:brightness-105"
          >
            <Pencil className="h-4 w-4" strokeWidth={2.8} />
            <span className="hidden sm:inline">Edit Profil</span>
          </button>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-5xl px-5 pb-16">
        {/* Identitas. Diklik untuk membuka halaman edit nama & avatar. */}
        <button
          onClick={() => {
            play("pop");
            router.push("/profil");
          }}
          className="card-pop mb-5 flex w-full flex-col items-center gap-4 rounded-[30px] border-4 border-white/10 bg-white/10 p-6 text-left backdrop-blur transition hover:border-zippy-mint/60 sm:flex-row"
        >
          <div className="rounded-full bg-white/15 p-1">
            <Zippy size={104} mood="melompat" />
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="flex items-center justify-center gap-1 text-sm font-bold text-white/55 sm:justify-start">
              Laporan belajar untuk
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-black text-zippy-mint">
                <Pencil className="h-3 w-3" strokeWidth={3} /> Ubah
              </span>
            </p>
            <h2 className="font-display text-3xl font-bold text-white">{save.nickname || "Penjelajah"}</h2>
            <p className="mt-1 font-bold text-zippy-mint">
              Penjelajah Level {level} · Streak {save.streak} hari
            </p>
          </div>
          <div className="flex gap-2">
            <Stat icon={Coins} label="Koin" value={save.coins} color="#FFC93C" />
            <Stat icon={Star} label="XP" value={save.xp} color="#B2D8D5" />
          </div>
        </button>

        {/* Statistik utama */}
        <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            icon={Clock}
            label="Waktu Belajar"
            value={`${minutes} menit`}
            sub="Total sejak mulai"
            color="#2AA5A0"
          />
          <Card
            icon={Target}
            label="Ketepatan"
            value={`${acc}%`}
            sub={`${save.totalCorrect || 0} benar dari ${total} soal`}
            color="#FFC93C"
          />
          <Card icon={Flame} label="Streak" value={`${save.streak} hari`} sub="Jaga terus ya!" color="#F97316" />
          <Card
            icon={TrendingUp}
            label="Rata-rata Skor"
            value={avgScore === null ? "-" : `${avgScore}`}
            sub="Jumlah soal benar"
            color="#7FC5C1"
          />
        </div>

        {/* Energi bermain — penjelasan sistem jeda untuk orang tua */}
        <div className="card-pop mb-5 overflow-hidden rounded-[30px] border-4 border-emerald-300/30 bg-emerald-400/10 p-6 backdrop-blur">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-display text-xl font-bold text-white">
              <Zap className="h-5 w-5 text-zippy-yellow" strokeWidth={3} />
              Batas Main Harian
            </h3>
            <span className="shrink-0 rounded-full bg-zippy-yellow px-3 py-1 text-sm font-black text-zippy-navy">
              {energi.value}/{energi.max}
            </span>
          </div>
          <div className="mb-3 h-4 overflow-hidden rounded-full bg-zippy-navy/30">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-zippy-mint transition-all duration-700"
              style={{ width: `${Math.max(Math.round((energi.value / MAX_STAMINA) * 100), 3)}%` }}
            />
          </div>
          <p className="text-sm font-semibold leading-relaxed text-white/75">
            Setiap misi memakai <b className="text-white">{STAMINA_PER_MISSION} energi</b>.
            Saat energi habis, anak dibawa ke layar istirahat — tidak ada lagi
            tombol untuk bermain sampai energi pulih (1 poin tiap{" "}
            <b className="text-white">{Math.round(STAMINA_REGEN_MS / 60000)} menit</b>).
            Ini yang membuat anak berhenti sendiri dan tidak bermain terus-menerus.
            {energi.nextMs > 0 && !energi.canPlay && (
              <span className="mt-2 block text-zippy-mint">
                Energi berikutnya pulih dalam {Math.ceil(energi.nextMs / 60000)} menit lagi.
              </span>
            )}
          </p>
        </div>

        {/* Progres misi */}
        <div className="card-pop mb-5 rounded-[30px] border-4 border-white/10 bg-white/10 p-6 backdrop-blur">
          <h3 className="mb-4 font-display text-xl font-bold text-white">Progres per Misi</h3>
          <div className="space-y-4">
            {Object.entries(MISSIONS).map(([islSlug, list]) => {
              const isl = ISLANDS.find((i) => i.slug === islSlug);
              return list.map((m) => {
                const best = save.islands?.[islSlug]?.missions?.[m.id];
                const pctDone = best === undefined ? 0 : Math.round((best / m.rounds.length) * 100);
                return (
                  <div key={m.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm font-black text-white">
                      <span className="truncate">
                        {isl?.name} · {m.title}
                      </span>
                      <span className={pctDone >= 60 ? "text-emerald-300" : "text-white/50"}>{pctDone}%</span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full bg-white/15">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pctDone}%` }}
                        transition={{ duration: 0.9 }}
                        className="h-full rounded-full bg-gradient-to-r from-zippy-teal to-zippy-yellow"
                      />
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>

        {/* Saran */}
        <div className="card-pop mb-5 rounded-[30px] border-4 border-zippy-teal/30 bg-zippy-teal/12 p-6">
          <div className="flex items-start gap-4">
            <Lightbulb className="h-8 w-8 shrink-0 text-zippy-yellow" strokeWidth={2.6} />
            <div>
              <h3 className="font-display text-xl font-bold text-white">Saran untuk Orang Tua</h3>
              <p className="mt-2 font-semibold leading-relaxed text-white/80">{advice}</p>
            </div>
          </div>
        </div>

        {/* Riwayat */}
        <div className="card-pop rounded-[30px] border-4 border-white/10 bg-white/10 p-6 backdrop-blur">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-display text-xl font-bold text-white">Riwayat Misi</h3>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                dbStatus === "ok" ? "bg-emerald-400 text-zippy-navy" : "bg-white/15 text-white/60"
              }`}
            >
              Database: {dbStatus === "ok" ? "tersinkron" : dbStatus}
            </span>
          </div>
          {rows.length === 0 ? (
            <p className="font-semibold text-white/50">
              Belum ada riwayat di server. Data lokal tetap tersimpan aman di perangkat ini.
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.slice(0, 10).map((r, i) => {
                const isl = ISLANDS.find((x) => x.slug === r.pulau);
                const m = (MISSIONS[r.pulau] || []).find((x) => x.id === r.misi_ke);
                return (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white/80"
                  >
                    <span className="truncate">
                      {isl?.name || r.pulau} · {m?.title || r.misi_ke}
                    </span>
                    <span className="shrink-0 text-zippy-yellow">Skor {r.score}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pintu masuk Panel Admin. Sengaja diletakkan di dasbor orang tua,
            bukan di menu anak, karena isinya mengubah data pemain.

            Tautan ini disembunyikan bagi seluruh akun yang bukan pengelola.
            Menyembunyikan memang bukan keamanan - orang masih bisa mengetik
            /admin langsung - tapi menampilkan tombol yang tidak bisa dipakai
            hanya membingungkan, dan membuat anak penasaran menekan-nekannya. */}
        {bolehAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="mt-6"
          >
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-3xl border-2 border-dashed border-zippy-yellow/60 bg-zippy-yellow/12 px-4 py-3 text-white transition hover:border-zippy-yellow hover:bg-zippy-yellow/22 active:scale-[0.99]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zippy-yellow text-zippy-navy">
                <Settings2 className="h-5 w-5" strokeWidth={2.8} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black">Panel Admin</span>
                <span className="block text-xs font-semibold text-white/65">
                  Kelola data pemain, tabel Supabase, dan pengaturan konten.
                </span>
              </span>
            </Link>
          </motion.div>
        )}

        <div className="mt-8 flex justify-center">
          <Zippy size={110} mood="membaca" speech="Terus dukung Zippy ya! Kamu luar biasa." />
        </div>
      </div>
    </main>
  );
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/12 px-4 py-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: color }}>
        <Icon className="h-5 w-5 text-zippy-navy" strokeWidth={2.8} />
      </div>
      <div>
        <p className="text-xs font-black text-white/55">{label}</p>
        <p className="font-display text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function Card({ icon: Icon, label, value, sub, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-pop rounded-3xl border-4 border-white/10 bg-white/10 p-5 backdrop-blur"
    >
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl" style={{ background: color }}>
        <Icon className="h-6 w-6 text-zippy-navy" strokeWidth={2.8} />
      </div>
      <p className="text-xs font-black text-white/55">{label}</p>
      <p className="font-display text-2xl font-bold text-white">{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-white/45">{sub}</p>
    </motion.div>
  );
}