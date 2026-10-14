"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Zippy from "../Zippy";
import { play } from "@/lib/sfx";
import { useBacakanSoal } from "@/lib/speech";

/**
 * Misi Susun Kata.
 *
 * Huruf-huruf teracak disajikan sebagai ubin yang bisa diklik. Anak
 * mengklik sesuai urutan untuk membentuk kata. Jika salah, kata direset
 * dan petunjuk muncul. Mendukung papan ketik untuk yang lebih cepat.
 */
export default function MissionScramble({ mission, onDone }) {
  const rounds = mission.rounds;
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const [pickedIds, setPickedIds] = useState([]);
  const [shake, setShake] = useState(false);
  // Tanda "coba lagi" khusus untuk soal yang sedang tampil, supaya tidak
  // ikut tersisa ke soal berikutnya.
  const [retry, setRetry] = useState(false);
  // Kunci masukan selama umpan balik (benar maupun salah) sedang berjalan,
  // supaya ketukan anak tidak menimpa penilaian yang sedang diproses.
  const [busy, setBusy] = useState(false);
  const [solved, setSolved] = useState(false);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  const reportedRef = useRef(false);

  const round = rounds[idx];

  // Huruf diacak secara menentukan (seed berdasar indeks soal) supaya tidak
  // berubah tiap render. Hasil akhir juga dijamin tidak sama persis dengan
  // jawaban, agar anak benar-benar harus menyusun.
  const letters = useMemo(() => {
    if (!round) return [];
    const answer = round.answer;
    const pool = round.scrambled.split("");

    const shuffle = (arr, seed) => {
      let a = seed >>> 0;
      const next = () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      const out = [...arr];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    };

    let out = shuffle(pool, idx * 7919 + 13);
    // Kalau kebetulan sama dengan jawaban, geser sekali lagi.
    if (out.join("") === answer) out = [...out.slice(1), ...out.slice(0, 1)];

    return out.map((ch, i) => ({ ch, id: i }));
  }, [round, idx]);

  const answerText = pickedIds.map((id) => letters[id]?.ch || "").join("");
  const filled = pickedIds.length === letters.length;

  useEffect(() => {
    if (done && doneRef.current && !reportedRef.current) {
      reportedRef.current = true;
      play("levelup");
      const t = setTimeout(() => onDone({ score, total: rounds.length, wrongs }), 500);
      return () => clearTimeout(t);
    }
  }, [done, score, wrongs, rounds.length, onDone]);

  // ----1. Menilai begitu semua huruf terisi ----
  // Efek ini hanya memutuskan benar atau salah. Ia tidak menjadwalkan
  // perpindahan soal, karena dulu penjadwalan dilakukan di sini lalu
  // langsung dibatalkan oleh cleanup saat `solved` berubah.
  useEffect(() => {
    if (!filled || busy || solved || done) return;
    if (answerText === round.answer) {
      setBusy(true);
      setSolved(true);
      setScore((s) => s + 1);
      play("correct");
    } else {
      setBusy(true);
      setWrongs((w) => w + 1);
      setRetry(true);
      setShake(true);
      play("wrong");
    }
  }, [filled, answerText, round, solved, done, busy]);

  // ---- 2. Lanjut ke soal berikutnya setelah jawaban benar ----
  // Terpisah dari efek penilaian supaya timer tidak ikut terhapus ketika
  // `solved` berubah nilainya.
  useEffect(() => {
    if (!solved) return;
    const t = setTimeout(() => {
      setSolved(false);
      setRetry(false);
      setBusy(false);
      setPickedIds([]);
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
      setPickedIds([]);
      setBusy(false);
    }, 560);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [busy, solved]);

  const pickLetter = (id) => {
    if (busy || solved || done || pickedIds.includes(id)) return;
    play("tap");
    setPickedIds((p) => [...p, id]);
  };

  const unpick = (id) => {
    if (busy || solved || done) return;
    setPickedIds((p) => p.filter((x) => x !== id));
  };

  // Dukungan papan ketik
  useEffect(() => {
    const onKey = (e) => {
      if (done || solved || busy || !round) return;
      if (e.key === "Backspace") {
        setPickedIds((p) => p.slice(0, -1));
        return;
      }
      const ch = e.key.toUpperCase();
      const found = letters.find((l) => l.ch === ch && !pickedIds.includes(l.id));
      if (found) pickLetter(found.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, solved, busy, round, letters, pickedIds]);

  // Yang dibacakan adalah petunjuk kata, karena anak perlu tahu kata apa
  // yang harus disusun.
  useBacakanSoal(round?.hint);

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10">
        <Zippy size={150} mood="merayakan" speech={`Luar biasa! ${score} kata berhasil kamu susun!`} />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between text-sm font-black text-white">
            <span>
              Kata {idx + 1} / {rounds.length}
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
          <div className="mb-2 flex min-h-[70px] flex-col items-center justify-center rounded-3xl bg-zippy-navy/40 px-4 py-4">
            <p className="text-center text-lg font-black text-white">Petunjuk</p>
            <p className="text-center text-xl font-black text-zippy-yellow sm:text-2xl">{round.hint}</p>
          </div>

          {/* Huruf terpilih */}
          <motion.div
            animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-5 flex min-h-[76px] flex-wrap items-center justify-center gap-2 rounded-3xl bg-cream/90 p-4"
          >
            {Array.from({ length: letters.length }).map((_, i) => {
              const id = pickedIds[i];
              const huruf = id === undefined ? null : letters[id];
              return (
                <button
                  key={`slot-${i}`}
                  onClick={() => huruf && unpick(huruf.id)}
                  className={`grid h-12 w-10 place-items-center rounded-xl text-2xl font-black transition sm:h-14 sm:w-12 sm:text-3xl ${
                    !huruf
                      ? "bg-zippy-navy/10 text-zippy-navy/25"
                      : solved
                      ? "bg-emerald-400 text-zippy-navy"
                      : "bg-zippy-teal text-white"
                  }`}
                >
                  {huruf ? huruf.ch : "-"}
                </button>
              );
            })}
          </motion.div>

          <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-white/60">
            Klik huruf sesuai urutan
          </p>

          {/* Huruf tersedia */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {letters.map((l) => {
              const used = pickedIds.includes(l.id);
              return (
                <motion.button
                  key={`tile-${l.id}`}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => pickLetter(l.id)}
                  className={`grid h-14 w-12 place-items-center rounded-2xl text-3xl font-black shadow-pop transition sm:h-16 sm:w-14 sm:text-4xl ${
                    used ? "bg-white/5 text-white/20" : "bg-zippy-yellow text-zippy-navy hover:brightness-105"
                  }`}
                >
                  {l.ch}
                </motion.button>
              );
            })}
          </div>

          {retry && (
            <div className="mt-4 flex items-center gap-2">
              <p className="flex-1 rounded-2xl bg-zippy-teal/25 px-4 py-3 text-center text-sm font-bold text-white">
                Belum tepat. Susun ulang dari awal ya!
              </p>
              <button
                onClick={() => setPickedIds([])}
                className="shrink-0 rounded-2xl bg-white/15 px-4 py-3 text-sm font-black text-white transition hover:bg-white/25"
              >
                Hapus
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-3 rounded-[28px] bg-white/10 p-5 backdrop-blur">
          <Zippy
            size={120}
            mood={solved ? "merayakan" : retry ? "berpikir" : "menunjuk"}
            speech={
              solved
                ? "Kata benar! Lanjut!"
                : retry
                ? "Yuk coba lagi, pelan-pelan!"
                : "Lihat petunjuk lalu klik hurufnya!"
            }
          />
        </div>
      </div>
    </div>
  );
}
