"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Coffee, Moon, ArrowLeft } from "lucide-react";
import Zippy from "./Zippy";
import { load, staminaInfo, MAX_STAMINA } from "@/lib/store";

function jam(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Layar istirahat.
 *
 * Muncul ketika energi bermain habis. Anak diajak berhenti sejenak dengan
 * pesan yang lembut (bukan larangan), lengkap dengan hitung mundur sampai
 * energi bertambah lagi supaya dia tahu kapan boleh bermain kembali.
 *
 * Angka energinya dibaca ulang tiap detik langsung dari store, jadi begitu
 * poin baru pulih layarnya langsung berubah tanpa perlu memuat ulang.
 */
export default function IstirahatOverlay({ energi, onClose, onPeta }) {
  const [info, setInfo] = useState(energi);

  useEffect(() => {
    const tick = () => setInfo(staminaInfo(load()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pct = Math.round((info.value / MAX_STAMINA) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 30 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="card-pop w-full max-w-sm overflow-hidden rounded-[30px] border-4 border-zippy-teal bg-cream"
        role="dialog"
        aria-modal="true"
        aria-label="Waktunya istirahat"
      >
        <div className="bg-zippy-navy px-5 pb-5 pt-4 text-center">
          <Zippy
            size={116}
            mood="membaca"
            anim="floaty"
            eager
            speechMaxW={230}
            speech="Matamu perlu istirahat, Sahabat!"
          />
          <h2 className="mt-1 font-display text-2xl font-bold text-white">
            Waktunya Istirahat
          </h2>
          <p className="mt-1 text-sm font-semibold leading-snug text-zippy-mint">
            Energi bermainmu sudah habis. Pergilah minum, jendurkan kaki, atau
            tatap yang jauh sebentar.
          </p>
        </div>

        <div className="px-5 pb-5 pt-4">
          {/* Batang energi */}
          <div className="flex items-center justify-between text-xs font-black text-zippy-navy/70">
            <span className="flex items-center gap-1">
              <Moon className="h-4 w-4" strokeWidth={3} />
              Energi
            </span>
            <span>
              {info.value}/{info.max}
            </span>
          </div>
          <div className="mt-1.5 h-4 overflow-hidden rounded-full bg-zippy-navy/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-zippy-teal to-zippy-mint transition-all duration-700"
              style={{ width: `${Math.max(pct, 3)}%` }}
            />
          </div>

          <p className="mt-3 rounded-2xl bg-zippy-yellow/30 p-3 text-center text-sm font-bold leading-snug text-zippy-navy">
            {info.canPlay
              ? "Energi sudah cukup untuk satu misi. Silakan lanjut, Sahabat!"
              : info.nextMs > 0
              ? `Energi bertambah lagi dalam ${jam(info.nextMs)}`
              : "Energi sedang dipulihkan..."}
          </p>

          <div className="mt-4 flex gap-3">
            <button
              onClick={onClose}
              className="btn-pop flex-1 rounded-2xl bg-zippy-navy/10 px-4 py-3 font-black text-zippy-navy"
            >
              <span className="flex items-center justify-center gap-1.5">
                <Coffee className="h-4 w-4" strokeWidth={3} /> Dulu Ya
              </span>
            </button>
            <button
              onClick={onPeta}
              className="btn-pop flex-[1.3] rounded-2xl bg-zippy-yellow px-4 py-3 font-black text-zippy-navy"
            >
              <span className="flex items-center justify-center gap-1.5">
                <ArrowLeft className="h-4 w-4" strokeWidth={3} /> Ke Peta
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
