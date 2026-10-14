"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Zippy from "../Zippy";
import { play } from "@/lib/sfx";
import { useBacakanSoal } from "@/lib/speech";

/**
 * Misi Urutan.
 *
 * Anak mengklik langkah-langkah sesuai urutan yang benar. Semua langkah
 * dikumpulkan ke daftar atas, lalu diperiksa. Jika salah, urutan direset
 * dan petunjuk ditampilkan agar anak bisa mencoba lagi.
 */
export default function MissionOrder({ mission, onDone }) {
  const rounds = mission.rounds;
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const [placed, setPlaced] = useState([]);
  const [shake, setShake] = useState(false);
  // Kunci masukan selama umpan balik sedang berjalan.
  const [busy, setBusy] = useState(false);
  const [solved, setSolved] = useState(false);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  const reportedRef = useRef(false);

  const round = rounds[idx];

  // Acak urutan tampilan secara menentukan, dan jangan sampai sama dengan
  // urutan jawaban yang benar.
  const visible = useMemo(() => {
    if (!round) return [];
    const answerText = round.answer.join("|");
    const pool = round.items.map((t, i) => ({ t, id: i }));

    let a = (idx * 7919 + 31) >>> 0;
    const next = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const shuffle = (arr) => {
      const out = [...arr];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    };

    let out = shuffle(pool);
    if (out.map((x) => x.t).join("|") === answerText) {
      out = [...out.slice(1), ...out.slice(0, 1)];
    }
    return out;
  }, [round, idx]);

  const allPlaced = placed.length === visible.length;

  useEffect(() => {
    if (done && doneRef.current && !reportedRef.current) {
      reportedRef.current = true;
      play("levelup");
      const t = setTimeout(() => onDone({ score, total: rounds.length, wrongs }), 500);
      return () => clearTimeout(t);
    }
  }, [done, score, wrongs, rounds.length, onDone]);

  // ---- 1. Menilai begitu semua langkah terpasang ----
  // Kuncinya berupa teks, bukan larik. Larik dibuat baru tiap render sehingga
  // kalau dipakai sebagai dependensi, efek ini jalan terus dan timer
  // perpindahan soal selalu dibatalkan cleanup-nya.
  useEffect(() => {
    if (!allPlaced || busy || solved || done) return;
    // `placed` berisi indeks asli dari round.items, bukan posisi di dalam
    // `visible` yang sudah diacak. Makanya teksnya diambil dari round.items.
    const urutanTeks = placed.map((id) => round.items[id] || "").join("|");
    if (urutanTeks === round.answer.join("|")) {
      setBusy(true);
      setSolved(true);
      setScore((s) => s + 1);
      play("correct");
    } else {
      setBusy(true);
      setWrongs((w) => w + 1);
      setShake(true);
      play("wrong");
    }
  }, [allPlaced, placed, visible, round, solved, done, busy]);

  // ---- 2. Lanjut ke soal berikutnya setelah jawaban benar ----
  useEffect(() => {
    if (!solved) return;
    const t = setTimeout(() => {
      setSolved(false);
      setBusy(false);
      setPlaced([]);
      setIdx((i) => {
        const next = i + 1;
        if (next >= rounds.length) {
          doneRef.current = true;
          setDone(true);
        }
        return next;
      });
    }, 700);
    return () => clearTimeout(t);
  }, [solved, rounds.length]);

  // ---- 3. Bersihkan setelah jawaban salah ----
  useEffect(() => {
    if (!busy || solved) return;
    const t1 = setTimeout(() => setShake(false), 480);
    const t2 = setTimeout(() => {
      setPlaced([]);
      setBusy(false);
    }, 560);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [busy, solved]);

  const place = (id) => {
    if (busy || solved || done || placed.includes(id)) return;
    play("tap");
    setPlaced((p) => [...p, id]);
  };

  const unplace = (id) => {
    if (busy || solved || done) return;
    setPlaced((p) => p.filter((x) => x !== id));
  };

  useEffect(() => {
    const onKey = (e) => {
      if (done || solved || busy || !round) return;
      if (e.key === "Backspace") setPlaced((p) => p.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, solved, busy, round]);

  // Dibacakan petunjuk urutannya, bukan daftar langkahnya, supaya anak
  // tetap harus berpikir sendiri mana yang paling awal.
  useBacakanSoal(round?.hint);

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10">
        <Zippy size={150} mood="merayakan" speech={`Mantap! ${score} urutan berhasil kamu susun!`} />
      </div>
    );
  }

  return (
    <div className="w-full">
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
              animate={{ width: `${((idx + (solved ? 1 : 0)) / rounds.length) * 100}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="rounded-[28px] bg-white/10 p-6 backdrop-blur">
          <p className="mb-3 text-center text-lg font-black text-white sm:text-xl">{round.hint}</p>

          {/* Urutan yang sudah dipilih */}
          <motion.div
            animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-5 min-h-[120px] rounded-3xl bg-cream/90 p-4"
          >
            <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-zippy-navy/50">
              Urutan kamu
            </p>
            {placed.length === 0 ? (
              <p className="py-4 text-center text-sm font-bold text-zippy-navy/40">
                Klik langkah pertama di bawah
              </p>
            ) : (
              <ol className="flex flex-col gap-2">
                {placed.map((id, i) => (
                  <motion.li
                    key={id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm font-black sm:text-base ${
                      solved ? "bg-emerald-400 text-zippy-navy" : "bg-zippy-teal text-white"
                    }`}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/25 text-sm">
                      {i + 1}
                    </span>
                    <button onClick={() => unplace(id)} className="flex-1 text-left hover:underline">
                      {round.items[id]}
                    </button>
                  </motion.li>
                ))}
              </ol>
            )}
          </motion.div>

          {/* Langkah tersedia */}
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-white/60">
            Klik langkah sesuai urutan
          </p>
          <div className="flex flex-col gap-2">
            {visible.map((v) => {
              const used = placed.includes(v.id);
              return (
                <motion.button
                  key={v.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => place(v.id)}
                  className={`rounded-2xl px-4 py-4 text-left text-sm font-black shadow-pop transition sm:text-base ${
                    used ? "bg-white/5 text-white/20" : "bg-zippy-yellow text-zippy-navy hover:brightness-105"
                  }`}
                >
                  {v.t}
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {wrongs > 0 && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 rounded-2xl bg-zippy-teal/25 px-4 py-3 text-center text-sm font-bold text-white"
              >
                Belum tepat. Susun ulang dari langkah pertama ya!
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 rounded-[28px] bg-white/10 p-5 backdrop-blur">
          <Zippy
            size={120}
            mood={solved ? "merayakan" : wrongs > 0 ? "berpikir" : "menunjuk"}
            speech={
              solved
                ? "Urutan tepat!"
                : wrongs > 0
                ? "Pikirkan apa yang paling awal."
                : "Mulai dari langkah yang paling awal!"
            }
          />
        </div>
      </div>
    </div>
  );
}
