"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Heart } from "lucide-react";
import Zippy from "../Zippy";
import Boss from "../Boss";
import { play } from "@/lib/sfx";
import { shuffleOptions } from "@/lib/shuffle";
import { useBacakanSoal } from "@/lib/speech";

/**
 * Misi 3 - Boss Battle melawan Gerhana Zahra.
 * - power 1 = bos sehat, 0 = kalah.
 */
export default function MissionBoss({ mission, onDone }) {
  const [idx, setIdx] = useState(0);
  const [right, setRight] = useState(0);
  const [hp, setHp] = useState(1);
  const [hit, setHit] = useState(false);
  const [over, setOver] = useState(false);
  const [picked, setPicked] = useState(null);
  const rounds = mission.rounds;
  const round = rounds[idx];
  const total = rounds.length;
  const reportedRef = useRef(false);

  // Opsi diacak supaya jawaban benar tidak selalu di posisi pertama.
  const opts = useMemo(() => shuffleOptions(round, `${mission.id}-bos-${idx}`), [round, idx, mission.id]);

  const finish = useCallback(
    (finalRight) => {
      setOver(true);
      const won = finalRight >= total;
      play(won ? "yeay" : "levelup");
      setTimeout(() => onDone({ score: finalRight, total, won }), 1400);
    },
    [onDone, total]
  );

  useEffect(() => {
    if (over && !reportedRef.current) {
      reportedRef.current = true;
    }
  }, [over]);

  // Bos membacakan soalnya saja. Petunjuk tetap ditampilkan di layar sehingga
  // tidak dibacakan ulang, supaya suara tidak bertumpuk saat suasana boss.
  useBacakanSoal(round?.q);

  const answer = useCallback(
    (val) => {
      if (over || picked) return;
      const ok = val === round.a;
      setPicked({ val, ok });

      if (ok) {
        play("correct");
        setRight((r) => r + 1);
        setHit(true);
        setTimeout(() => {
          setHp((h) => {
            const next = Math.max(0, h - 1 / total);
            setTimeout(() => setHit(false), 400);
            return next;
          });
        }, 50);
        setTimeout(() => {
          setPicked(null);
          if (idx + 1 >= total) {
            finish(right + 1);
          } else {
            setIdx((i) => i + 1);
          }
        }, 900);
      } else {
        play("wrong");
        setTimeout(() => {
          setPicked(null);
          if (idx + 1 >= total) {
            finish(right);
          } else {
            setIdx((i) => i + 1);
          }
        }, 1100);
      }
    },
    [over, picked, round.a, idx, total, finish, right]
  );

  if (!round) return null;

  // Hasil akhir
  if (over) {
    const won = right >= total;
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-8">
        <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Boss power={hp} defeated={won} />
        </motion.div>
        <Zippy
          size={150}
          mood={won ? "merayakan" : "berpikir"}
          speech={
            won
              ? "Zahra kalah! Planet Luminara aman, kau hebat!"
              : "Belum menang, tapi kamu sudah berani mencoba. Lanjut lagi ya!"
          }
        />
        <div className="rounded-full bg-zippy-yellow px-6 py-3 text-xl font-black text-zippy-navy shadow-pop-lg">
          {right} / {total} benar
        </div>
      </div>
    );
  }

  const defeated = hp <= 0;

  return (
    <div className="w-full">
      {/* Bar bos */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex-1">
          <p className="mb-1 text-sm font-black text-white">
            Kesabaran Gerhana Zahra
          </p>
          <div className="h-4 overflow-hidden rounded-full bg-white/15">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-red-400 to-orange-400"
              animate={{ width: `${Math.max(0, hp) * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            />
          </div>
        </div>
        <div className="rounded-2xl bg-white/10 px-4 py-2 text-center">
          <p className="text-xs font-bold text-white/70">Tebasan</p>
          <p className="text-2xl font-black text-zippy-yellow">
            {right}
            <span className="text-base text-white/50">/{total}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_250px]">
        {/* Boss + soal */}
        <div className="rounded-[28px] bg-white/10 p-5 backdrop-blur">
          <div className="mb-4 flex justify-center">
            <motion.div animate={hit ? { x: [0, -14, 14, -8, 8, 0] } : { x: 0 }} transition={{ duration: 0.45 }}>
              <Boss power={hp} defeated={defeated} />
            </motion.div>
          </div>

          <div className="rounded-3xl bg-zippy-navy/40 p-5">
            <p className="text-center text-xl font-black text-white sm:text-2xl">{round.q}</p>
            {round.hint && (
              <p className="mt-2 text-center text-sm font-bold text-zippy-mint">Petunjuk Zippy: {round.hint}</p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {opts.map((n) => {
                const showOk = picked?.ok && n === round.a;
                const showBad = picked && picked.ok === false && picked.val === n;
                return (
                  <motion.button
                    key={n}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => answer(n)}
                    className={`relative rounded-3xl px-3 py-4 text-2xl font-black shadow-pop transition ${
                      showOk
                        ? "bg-emerald-400 text-zippy-navy"
                        : showBad
                        ? "bg-red-400 text-white"
                        : "bg-zippy-yellow text-zippy-navy hover:brightness-105"
                    } ${picked ? "opacity-60" : ""}`}
                  >
                    {n}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Zippy + status */}
        <div className="flex flex-col items-center justify-center gap-3 rounded-[28px] bg-white/10 p-5 backdrop-blur">
          <Zippy
            size={130}
            mood={picked ? (picked.ok ? "merayakan" : "sedih") : defeated ? "merayakan" : "menunjuk"}
            speech={
              picked
                ? picked.ok
                  ? "Kena! Zahra makin lemah!"
                  : "Belum tepat, hitung dengan teliti."
                : defeated
                ? "Hore! Kita menang!"
                : "Fokus, Zippy menunggumu!"
            }
          />
          <div className="flex items-center gap-2 text-sm font-black text-white/80">
            {defeated ? (
              <>
                <Heart className="h-5 w-5 fill-emerald-400 text-emerald-400" /> Zahra kalah!
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 fill-zippy-yellow text-zippy-yellow" /> Pertarungan!
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}