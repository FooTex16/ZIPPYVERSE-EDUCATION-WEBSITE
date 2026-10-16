"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Zippy from "../Zippy";
import { play } from "@/lib/sfx";
import { shuffleOptions } from "@/lib/shuffle";
import { useBacakanSoal } from "@/lib/speech";

/**
 * Misi Pilihan Ganda.
 *
 * Tidak ada jadi jam: anak boleh memikirkan jawabannya. Kalau salah,
 * petunjuk muncul dan anak dipersilakan mencoba lagi, sehingga tetap
 * bisa menyelesaikan misi tanpa merasa gagal. Setelah dua kali salah,
 * tombol "Lewati" muncul sebagai jalan keluar.
 */
export default function MissionMCQ({ mission, onDone, repeat = 0 }) {
  const rounds = mission.rounds;
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [picked, setPicked] = useState(null); // {val, ok}
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  const reportedRef = useRef(false);
  const round = rounds[idx];

  // Opsi diacak supaya jawaban benar tidak selalu jatuh di posisi yang sama.
  // Tanpa ini, anak cukup menghafal "kiri atas" dan lulus semua soal.
  // `repeat` menaikkan benih tiap kali misi diulang (izin ulang sudah dibeli),
  // sehingga urutan jawaban berbeda setiap kali meski soalnya tetap sama.
  const opts = useMemo(
    () => shuffleOptions(round, `${mission.id}-${idx}-${repeat}`),
    [round, idx, mission.id, repeat]
  );

  useEffect(() => {
    if (done && doneRef.current && !reportedRef.current) {
      reportedRef.current = true;
      play("levelup");
      const t = setTimeout(() => onDone({ score, total: rounds.length, wrongs }), 500);
      return () => clearTimeout(t);
    }
  }, [done, score, wrongs, rounds.length, onDone]);

  const answer = useCallback(
    (val) => {
      if (done || picked) return;
      const ok = val === round.a;
      setPicked({ val, ok });
      if (ok) {
        play("correct");
        setScore((s) => s + 1);
        setTimeout(() => {
          setPicked(null);
          setAttempts(0);
          setIdx((i) => {
            const next = i + 1;
            if (next >= rounds.length) {
              doneRef.current = true;
              setDone(true);
            }
            return next;
          });
        }, 420);
      } else {
        play("wrong");
        setWrongs((w) => w + 1);
        setAttempts((a) => a + 1);
        setTimeout(() => setPicked(null), 700);
      }
    },
    [done, picked, round, rounds.length]
  );

  const skip = () => {
    setAttempts(0);
    setIdx((i) => {
      const next = i + 1;
      if (next >= rounds.length) {
        doneRef.current = true;
        setDone(true);
      }
      return next;
    });
  };

  // Dukungan keyboard 1-4, sesuai posisi opsi yang sedang tampil
  useEffect(() => {
    const onKey = (e) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 4 && opts[n - 1] !== undefined) answer(opts[n - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, opts]);

  const showHint = attempts >= 1;

  // Soal dibacakan dari rekaman. Saat anak salah, yang dibacakan hanya
  // petunjuknya saja karena soalnya tadi sudah sempat dibacakan.
  useBacakanSoal(showHint && round.hint ? round.hint : round?.q, 350, "", rounds[idx + 1]?.q);

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10">
        <Zippy size={150} mood="merayakan" speech={`Hebat! Kamu benar ${score} dari ${rounds.length} soal!`} />
      </div>
    );
  }


  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between text-sm font-black text-white">
            <span>
              Soal {idx + 1} / {rounds.length}
            </span>
            <span className="text-zippy-yellow">Benar {score}</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-white/15">
            <motion.div
              className="h-full rounded-full bg-zippy-yellow"
              animate={{ width: `${((idx + (picked?.ok ? 1 : 0)) / rounds.length) * 100}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="rounded-[28px] bg-white/10 p-6 backdrop-blur">
          {/* Soal dan pilihan memakai satu bungkus ber-key, jadi keduanya
              selalu berganti bersamaan. Animasi keluar sengaja tidak dipakai:
              kalau animasi terputus (misal tab sedang tidak terlihat), blok lama
              bisa tertinggal di layar dan teks soal tidak nyambung dengan pilihan. */}
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-6 flex min-h-[120px] items-center justify-center rounded-3xl bg-zippy-navy/40 px-5">
              <p className="text-center text-2xl font-black leading-snug text-white sm:text-3xl">
                {round.q}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {opts.map((n, i) => {
                const isPicked = picked?.val === n;
                const showOk = picked && n === round.a;
                const showBad = picked?.ok === false && isPicked;
                return (
                  <motion.button
                    key={`${idx}-${n}`}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => answer(n)}
                    className={`relative rounded-3xl px-4 py-5 text-xl font-black shadow-pop transition sm:text-2xl ${
                      showOk
                        ? "bg-emerald-400 text-zippy-navy"
                        : showBad
                        ? "bg-red-400 text-white"
                        : "bg-zippy-yellow text-zippy-navy hover:brightness-105"
                    } ${picked ? "opacity-60" : ""}`}
                  >
                    {n}
                    <span className="absolute left-3 top-2 text-xs font-black opacity-40">{i + 1}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Petunjuk + lewati */}
          <div className="mt-4 flex items-center gap-3">
            <AnimatePresence>
              {showHint && round.hint && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 rounded-2xl bg-zippy-teal/25 px-4 py-3 text-sm font-bold text-white"
                >
                  Petunjuk: {round.hint}
                </motion.p>
              )}
            </AnimatePresence>
            {attempts >= 2 && (
              <motion.button
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                onClick={skip}
                className="rounded-2xl bg-white/15 px-5 py-3 text-sm font-black text-white hover:bg-white/25"
              >
                Lewati
              </motion.button>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 rounded-[28px] bg-white/10 p-5 backdrop-blur">
          <Zippy
            size={120}
            mood={picked ? (picked.ok ? "merayakan" : "berpikir") : "menunjuk"}
            speech={
              picked
                ? picked.ok
                  ? "Tepat sekali!"
                  : "Coba lagi ya, baca petunjuknya!"
                : showHint
                ? "Baca petunjuk di bawah soal!"
                : "Pilih jawaban yang paling tepat!"
            }
          />
        </div>
      </div>
    </div>
  );
}
