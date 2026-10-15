"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import Zippy from "../Zippy";
import { play } from "@/lib/sfx";
import { shuffleOptions } from "@/lib/shuffle";
import { useBacakanSoal } from "@/lib/speech";

/**
 * Misi 2 - Tantangan Kilat.
 * Jawab soal matematika sebanyak mungkin dalam waktu terbatas.
 */
export default function MissionBlitz({ mission, onDone }) {
  const duration = mission.duration || 30;
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [finished, setFinished] = useState(false);
  const [picked, setPicked] = useState(null); // {val, ok}
  const [combo, setCombo] = useState(0);
  const rounds = mission.rounds;
  const round = rounds[idx % rounds.length];
  const finishedRef = useRef(false);
  const reportedRef = useRef(false);

  // Opsi diacak memakai idx absolut, supaya saat soal yang sama muncul
  // kembali susunannya ikut berubah dan tidak bisa dihafal.
  const opts = useMemo(
    () => shuffleOptions(round, `${mission.id}-kilat-${idx}`),
    [round, idx, mission.id]
  );

  // Timer
  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => {
      setTimeLeft((v) => {
        if (v <= 1) {
          clearInterval(t);
          setFinished(true);
          finishedRef.current = true;
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [finished]);

  // Selesai
  useEffect(() => {
    if (finished && finishedRef.current && !reportedRef.current) {
      reportedRef.current = true;
      play("levelup");
      const t = setTimeout(
        () => onDone({ score, total: rounds.length, wrongs }),
        400
      );
      return () => clearTimeout(t);
    }
  }, [finished, score, wrongs, rounds.length, onDone]);

  const answer = useCallback(
    (val) => {
      if (finished || picked) return;
      const ok = val === round.a;
      setPicked({ val, ok });
      if (ok) {
        play("correct");
        setScore((s) => s + 1);
        setCombo((c) => c + 1);
      } else {
        play("wrong");
        setWrongs((w) => w + 1);
        setCombo(0);
      }
      setTimeout(() => {
        setPicked(null);
        setIdx((i) => (i + 1) % rounds.length);
      }, ok ? 420 : 850);
    },
    [finished, picked, round.a, rounds.length]
  );

  // Dukungan keyboard untuk jawaban 1-4, sesuai posisi yang sedang tampil
  useEffect(() => {
    const onKey = (e) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 4 && opts[n - 1] !== undefined) answer(opts[n - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, opts]);

  // Misi ini berpacu dengan waktu, jadi soal dibacakan sedikit lebih cepat.
  useBacakanSoal(round?.q, 250, "", rounds[(idx + 1) % rounds.length]?.q);

  const pct = Math.max(0, (timeLeft / duration) * 100);
  const danger = timeLeft <= 8;

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10">
        <Zippy size={150} mood="merayakan" speech={`Waktu habis! Kamu menjawab ${score} soal. Keren!`} />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Timer + skor */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between text-sm font-black text-white">
            <span>Waktu</span>
            <span className={danger ? "text-zippy-yellow" : ""}>{timeLeft}s</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-white/15">
            <motion.div
              className={`h-full rounded-full ${danger ? "bg-orange-400" : "bg-zippy-yellow"}`}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        <div className="rounded-2xl bg-white/10 px-4 py-2 text-center">
          <p className="text-xs font-bold text-white/70">Skor</p>
          <p className="text-2xl font-black text-zippy-yellow">{score}</p>
        </div>
        {combo >= 3 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="rounded-2xl bg-zippy-teal px-3 py-2 text-sm font-black text-white"
          >
            Kombo x{combo}!
          </motion.div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="rounded-[28px] bg-white/10 p-6 backdrop-blur">
          {/* Soal dan pilihan memakai satu bungkus ber-key supaya selalu
              berganti bersamaan tanpa risiko blok lama tertinggal. */}
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-6 flex min-h-[120px] items-center justify-center rounded-3xl bg-zippy-navy/40 px-4">
              <p className="text-center text-4xl font-black text-white sm:text-5xl">
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
                    className={`relative rounded-3xl px-4 py-5 text-3xl font-black shadow-pop transition ${
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
        </div>

        <div className="flex flex-col items-center justify-center gap-3 rounded-[28px] bg-white/10 p-5 backdrop-blur">
          <Zippy
            size={120}
            mood={picked ? (picked.ok ? "merayakan" : "sedih") : combo >= 3 ? "terkejut" : "menunjuk"}
            speech={
              picked
                ? picked.ok
                  ? "Benar! Lanjut lagi!"
                  : `Jawaban itu ${round.a}, coba fokus!`
                : "Ayo cepat, waktunya sedikit!"
            }
          />
        </div>
      </div>
    </div>
  );
}