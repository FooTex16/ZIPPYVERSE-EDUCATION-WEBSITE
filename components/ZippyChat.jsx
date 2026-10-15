"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Eraser } from "lucide-react";
import Zippy from "./Zippy";
import { play } from "@/lib/sfx";
import { load } from "@/lib/store";
import { ISLANDS, MISSIONS } from "@/lib/gameData";
import { SAPAAN, JAWABAN_RUSAK, JAWABAN_PUTUS } from "@/lib/chatTeks";
import { isSpeechEnabled, speak, stopSpeaking } from "@/lib/speech";
import { mainkanAudio, stopAudio } from "@/lib/audioSoal";

const SARAN = ["Apa itu Planet Luminara?", "Bantu hitung 7 + 5", "Siapa Zippy?"];

/**
 * Rapikan jawaban AI sebelum dibacakan.
 *
 * Balasan Gemini suka memakai emoji dan baris kosong. Emoji tidak perlu
 * dibacakan - sebagian mesin justru membacakannya dengan nama yang membingungkan
 * - dan spasi berlebih membuat jeda aneh di tengah kalimat.
 *
 * Pembersihan ini tidak mengubah teks yang memang sudah terekam, karena teks
 * rekaman tidak pernah berisi emoji, jadi pencocokan manifest tetap cocok.
 */
function bersihUntukSuara(teks) {
  return String(teks || "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Bacakan jawaban Zippy dengan suara Indonesia.
 *
 * Utamakan rekaman suara Zippy supaya logatnya benar di HP apa pun.
 * Balasan yang belum pernah terekam - misalnya jawaban Gemini yang bebas
 * bentuknya - jatuh ke suara Indonesia bawaan perangkat.
 */
function bacakan(teks) {
  const kalimat = bersihUntukSuara(teks);
  if (!kalimat || !isSpeechEnabled()) return;
  stopSpeaking();
  stopAudio();
  mainkanAudio(kalimat).then((main) => {
    if (!main) speak(kalimat);
  });
}

export default function ZippyChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([SAPAAN]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [mode, setMode] = useState(null);
  const boxRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [msgs, typing]);

  // Konteks permainan supaya jawaban Zippy relevan dengan yang anak lakukan.
  const gameContext = useCallback(() => {
    const s = load();
    const ctx = {
      nickname: s.nickname,
      level: Math.floor((s.xp || 0) / 100) + 1,
      coins: s.coins,
      correct: s.totalCorrect,
    };
    // Insel aktif dari URL: /pulau/angka
    const slug = typeof pathname === "string" ? pathname.split("/")[2] : null;
    if (slug) {
      const isl = ISLANDS.find((i) => i.slug === slug);
      if (isl) ctx.island = isl.name;
      const done = s.islands?.[slug]?.missions || {};
      const next = (MISSIONS[slug] || []).find((m) => done[m.id] === undefined);
      if (next) ctx.mission = next.title;
    }
    return ctx;
  }, [pathname]);

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput("");
    setMsgs((m) => [...m, { from: "me", text: q }]);
    setBusy(true);
    setTyping(true);
    play("pop");
    try {
      // Kirim riwayat supaya Zippy ingat percakapan sebelumnya.
      const history = msgs.slice(-6).map(({ from, text }) => ({ from, text }));
      const res = await fetch("/api/zippy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          history,
          context: gameContext(),
        }),
      });
      const data = await res.json();
      setTyping(false);
      const jawaban = data.reply || JAWABAN_RUSAK;
      setMsgs((m) => [...m, { from: "zippy", text: jawaban }]);
      setMode(data.mode === "gemini" ? "AI" : "lokal");
      bacakan(jawaban);
    } catch {
      setTyping(false);
      setMsgs((m) => [...m, { from: "zippy", text: JAWABAN_PUTUS }]);
      bacakan(JAWABAN_PUTUS);
    } finally {
      setBusy(false);
    }
  }

  // Bersihkan percakapan
  function reset() {
    setMsgs([SAPAAN]);
    setInput("");
    setMode(null);
    stopSpeaking();
    stopAudio();
    play("pop");
  }

  return (
    <>
      {/* Tombol mengambang. Ini pengendali panel: ia membuka dan menutup
          jendela percakapan di atasnya. Tanpa `aria-expanded`, pembaca layar
          hanya menyebut "Ngobrol dengan Zippy" tanpa pernah memberi tahu
          apakah jendelanya sedang terbuka atau tertutup. */}
      <motion.button
        onClick={() => {
          const buka = !open;
          setOpen(buka);
          play("pop");
          // Menutup chat berarti percakapan selesai, jadi hentikan suara
          // Zippy supaya tidak menyusul keluar setelah jendelanya tertutup.
          if (!buka) {
            stopSpeaking();
            stopAudio();
          }
        }}
        whileTap={{ scale: 0.88 }}
        aria-label="Ngobrol dengan Zippy"
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-40 grid h-16 w-16 place-items-center rounded-full bg-zippy-yellow text-zippy-navy shadow-pop-lg transition hover:brightness-105 animate-pulseGlow"
      >
        {open ? (
          <X className="h-8 w-8" strokeWidth={3} />
        ) : (
          <MessageCircle className="h-8 w-8" strokeWidth={2.6} />
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="fixed bottom-24 right-4 z-40 flex h-[min(560px,72vh)] w-[min(370px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[28px] border-4 border-zippy-teal bg-cream shadow-pop-lg"
          >
            {/* Header */}
            <div className="flex items-center gap-3 bg-zippy-teal px-4 py-3">
              <div className={`h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/90 ${busy ? "animate-pulse" : ""}`}>
                <img src="/zippy/bahagia.webp" alt="Zippy" className="h-full w-full object-contain animate-bob" loading="lazy" decoding="async" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold leading-none text-white">Zippy AI</p>
                <p className="text-xs font-bold text-white/80">
                  Teman belajarmu · {mode === "lokal" ? "mode lokal" : "online"}
                </p>
              </div>
              <button
                onClick={reset}
                aria-label="Bersihkan percakapan"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20 text-white transition hover:bg-white/35 active:scale-90"
              >
                <Eraser className="h-4 w-4" strokeWidth={2.6} />
              </button>
            </div>

            {/* Pesan */}
            <div ref={boxRef} className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-[15px] font-bold leading-snug ${
                      m.from === "me"
                        ? "rounded-br-md bg-zippy-teal text-white"
                        : "rounded-bl-md bg-white text-zippy-navy shadow-pop"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-pop">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="h-2 w-2 animate-bounce rounded-full bg-zippy-teal/60"
                        style={{ animationDelay: `${d * 0.14}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Saran cepat */}
            {msgs.length < 4 && !busy && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-2">
                {SARAN.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="shrink-0 rounded-full border-2 border-zippy-teal/40 bg-white px-3 py-1.5 text-xs font-bold text-zippy-teal transition hover:bg-zippy-teal/10 active:scale-95"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 border-t-4 border-zippy-teal/20 bg-white px-3 py-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanya Zippy..."
                className="min-w-0 flex-1 rounded-2xl border-2 border-zippy-navy/10 bg-zippy-cream px-4 py-3 text-[15px] font-bold text-zippy-navy outline-none placeholder:text-zippy-navy/35 focus:border-zippy-teal"
              />
              <button
                type="submit"
                disabled={!input.trim() || busy}
                aria-label="Kirim"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-zippy-teal text-white transition active:scale-90 disabled:opacity-40"
              >
                <Send className="h-5 w-5" strokeWidth={2.6} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}