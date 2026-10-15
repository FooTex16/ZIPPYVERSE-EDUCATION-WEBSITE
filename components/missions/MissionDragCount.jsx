"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Zippy from "../Zippy";
import { play } from "@/lib/sfx";
import { useBacakanSoal } from "@/lib/speech";
import { petunjukUntuk } from "@/lib/petunjukHitung";

/**
 * Misi 1 - Hitung benda lalu seret angka yang tepat ke jembatan.
 * Mendukung drag (mouse + sentuh) dan tap-dulu-kemudian-tap.
 */
export default function MissionDragCount({ mission, onDone, onScore }) {
  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);
  const [selected, setSelected] = useState(null);
  const [drag, setDrag] = useState(null);
  const [toast, setToast] = useState(null);

  const slotRef = useRef(null);
  const round = mission.rounds[idx];

  const advance = useCallback(
    (earned) => {
      const finalScore = score + (earned ? 1 : 0);
      play("coin");
      if (idx + 1 >= mission.rounds.length) {
        onDone({ score: finalScore, total: mission.rounds.length });
      } else {
        setTimeout(() => {
          setIdx((i) => i + 1);
          setPlaced(null);
          setAttempts(0);
          setSelected(null);
          setScore(finalScore);
        }, 850);
      }
    },
    [idx, mission.rounds.length, onDone, score]
  );

  // Petunjuk dibacakan tiap soal. Benda di kotak berupa gambar sehingga
  // tidak bisa diucapkan, jadi yang dibacakan adalah instruksinya.
  //
  // Kalimatnya dipilih dari beberapa pilihan dan berganti tiap ronde, supaya
  // anak yang memainkan misi ini berulang kali tidak mendengar kalimat yang
  // persis sama terus-menerus. Pilihannya deterministik (judul + ronde), jadi
  // tidak ada risiko teks berganti saat render ulang atau hydration.
  useBacakanSoal(petunjukUntuk(mission.title, idx), 350, idx, petunjukUntuk(mission.title, idx + 1));

  const attempt = useCallback(
    (value) => {
      if (placed !== null) return;
      setSelected(null);
      if (value === round.count) {
        setPlaced(value);
        play("correct");
        setTimeout(() => advance(true), 700);
      } else {
        setAttempts((a) => a + 1);
        play("wrong");
        setShake(true);
        setTimeout(() => setShake(false), 450);
      }
    },
    [placed, round.count, advance]
  );

  // Logika drag memakai Pointer Events (jalan di mouse & layar sentuh).
  //
  // ------------------------------------------------------- MENGAPA LAG DULU
  //
  // `pointermove` bisa dipanggil ratusan kali per detik, dan tiap gerakan
  // dulu melakukan dua pekerjaan berat sekaligus:
  //
  //   1. `setDrag(...)` - mengubah state, sehingga SELURUH misi dirender
  //      ulang: daftar benda yang dihitung, empat tombol angka, kotak slot,
  //      dan komponen Zippy. Padahal yang benar-benar berubah cuma satu
  //      angka melayang di layar.
  //   2. Efeknya bergantung pada `[drag, attempt]`, jadi listener jendela
  //      ikut dilepas dan dipasang ulang pada tiap gerakan pula.
  //
  // Dua pekerjaan itu berlipat ganda ratusan kali per detik, dan di HP yang
  // lambat hasilnya adalah seretan yang tersendat di belakang jari anak.
  //
  // ------------------------------------------------------------- SEKARANG
  //
  // Posisi seretan tidak lagi disentuh React. Semua disimpan di ref, lalu
  // ditulis langsung ke DOM dengan `transform: translate3d(...)` yang
  // hanya memicu kompositasi - bukan perhitungan tata letak, bukan render
  // ulang. `requestAnimationFrame` memastikan paling banyak satu tulisan
  // per frame, seberapapun cepatnya jari bergerak.
  //
  // `drag` (state) kini hanya berubah dua kali dalam satu seretan: saat
  // angkat dan saat lepas.
  //
  // Efek listener dipasang SEKALI di awal dan tidak pernah dilepas ulang;
  // ia membaca keadaan terkini lewat ref, bukan lewat penutupan klosure.
  const ghostRef = useRef(null);
  const dragRef = useRef(null); // { value } selama seretan berlangsung
  const posRef = useRef({ x: 0, y: 0 }); // posisi penunjuk terakhir
  const asalRef = useRef({ x: 0, y: 0 }); // posisi saat penunjuk ditekan
  const gerakRef = useRef(false); // penunjuk sudah bergeser cukup jauh?
  const abaikanRef = useRef(false); // menelan klik hasil seretan
  const rafRef = useRef(0);
  const attemptRef = useRef(null); // attempt terbaru, dibaca listener

  // Menyalin `attempt` terbaru ke ref. `attempt` berubah tiap ronde dan tiap
  // kali anak menang, sedangkan listener tidak mau dipasang ulang terus -
  // jadi ia dipancing lewat ref, bukan lewat daftar kebergantungan.
  useEffect(() => {
    attemptRef.current = attempt;
  });

  useEffect(() => {
    const geser = () => {
      if (!ghostRef.current) return;
      ghostRef.current.style.transform =
        `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) translate(-50%, -50%)`;
    };

    const onMove = (e) => {
      if (!dragRef.current) return;
      // Diabaikan selama tombol belum benar-benar dilepas, supaya browser
      // tidak mengerjakan apa pun untuk sebuah seretan yang belum terjadi.
      e.preventDefault();

      // Penanda "ini seretan, bukan ketukan". Ambang 8 piksel sengaja kecil
      // supaya jari yang sedikit bergeser tidak disalahartikan sebagai
      // menekan tombol angka saat dilepas.
      if (Math.abs(e.clientX - asalRef.current.x) + Math.abs(e.clientY - asalRef.current.y) > 8) {
        gerakRef.current = true;
      }

      posRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(geser);
    };

    const onUp = (e) => {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = null;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }

      // Gerakan yang sungguh terjadi tidak boleh diteruskan sebagai ketukan,
      // sebab event `click` tetap terbit setelah `pointerup`. Tanpa penanda
      // ini, melepas jari di atas kotak slot sekaligus menyalakan tombol
      // angka dan memainkan bunyi "pop" di atas bunyi jawaban benar.
      if (gerakRef.current) abaikanRef.current = true;

      const el = slotRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const inside =
          e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (inside) attemptRef.current(d.value);
      }

      setDrag(null);
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!round) return null;

  const total = mission.rounds.length;

  return (
    <div className="w-full">
      {/* Info bar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="rounded-full bg-white/15 px-4 py-2 text-sm font-black text-white">
          Ronde {idx + 1} / {total}
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-zippy-yellow px-4 py-2 text-sm font-black text-zippy-navy shadow-pop">
            Skor {score}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        {/* Area utama */}
        <div className="rounded-[28px] bg-white/10 p-5 backdrop-blur">
          <p className="mb-4 text-center text-lg font-extrabold text-white">
            Ada berapa <span className="text-4xl align-middle">{round.emoji}</span> ?
          </p>

          {/* Benda yang dihitung */}
          <div className="mb-6 flex min-h-[130px] flex-wrap items-center justify-center gap-2 rounded-3xl bg-zippy-navy/40 p-4">
            {Array.from({ length: round.count }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 14 }}
                className="text-4xl sm:text-5xl"
              >
                {round.emoji}
              </motion.span>
            ))}
          </div>

          {/* Jembatan + slot */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="flex w-full items-center justify-center gap-2">
              <div className="h-3 w-16 rounded-full bg-zippy-mint/70" />
              <div className="h-3 w-16 rounded-full bg-zippy-mint/70" />
            </div>
            <motion.div
              ref={slotRef}
              onClick={() => selected !== null && attempt(selected)}
              animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
              transition={{ duration: 0.45 }}
              onPointerDown={(e) => e.preventDefault()}
              className={`grid h-24 w-40 cursor-pointer place-items-center rounded-3xl border-4 border-dashed transition ${
                placed !== null
                  ? "border-zippy-yellow bg-zippy-yellow text-zippy-navy"
                  : selected !== null
                  ? "border-zippy-yellow bg-white/25"
                  : "border-white/60 bg-white/10"
              }`}
            >
              <AnimatePresence mode="wait">
                {placed !== null ? (
                  <motion.span
                    key="placed"
                    initial={{ scale: 0, rotate: -40 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="text-5xl font-black"
                  >
                    {placed}
                  </motion.span>
                ) : (
                  <motion.span
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-5xl font-black text-white/60"
                  >
                    ?
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
            <p className="text-center text-sm font-bold text-white/75">
              {placed !== null
                ? "Hebat! Jembatan tersambung!"
                : "Seret angka yang benar ke kotak tanda tanya"}
            </p>
          </div>

          {/* Pilihan angka */}
          <div className="grid grid-cols-4 gap-3">
            {round.options.map((n) => (
              <motion.button
                key={n}
                disabled={placed !== null}
                whileTap={{ scale: 0.9 }}
                onPointerDown={(e) => {
                  if (placed !== null) return;
                  abaikanRef.current = false;
                  gerakRef.current = false;
                  asalRef.current = { x: e.clientX, y: e.clientY };
                  posRef.current = { x: e.clientX, y: e.clientY };
                  dragRef.current = { value: n };
                  setDrag({ value: n, x: e.clientX, y: e.clientY });
                }}
                onClick={() => {
                  // Klik yang lahir dari sebuah seretan dibuang. Event `click`
                  // memang masih terbit setelah `pointerup`, jadi tanpa
                  // penanda ini melepas jari di atas jembatan ikut menyalakan
                  // tombol angkanya - lengkap dengan bunyi "pop" yang menimpa
                  // bunyi jawaban benar.
                  if (abaikanRef.current) {
                    abaikanRef.current = false;
                    return;
                  }
                  if (placed !== null) return;
                  setSelected((s) => (s === n ? null : n));
                  play("pop");
                }}
                className={`drag-tile relative aspect-square select-none rounded-3xl text-4xl font-black shadow-pop transition ${
                  placed !== null
                    ? "bg-white/20 text-white/40"
                    : selected === n
                    ? "bg-zippy-teal text-white"
                    : "bg-zippy-yellow text-zippy-navy hover:brightness-105"
                }`}
              >
                {n}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Zippy */}
        <div className="flex flex-col items-center justify-center gap-3 rounded-[28px] bg-white/10 p-5 backdrop-blur">
          <Zippy
            size={130}
            mood={
              placed !== null ? "merayakan" : attempts > 0 ? (attempts > 1 ? "sedih" : "berpikir") : "menunjuk"
            }
            speech={
              placed !== null
                ? "Keren! Jembatan kita nyambung!"
                : attempts === 0
                ? "Hitung pelan-pelan ya, aku boleh bantu!"
                : attempts === 1
                ? "Hampir benar! Coba hitung lagi."
                : "Ayo coba lagi, kamu pasti bisa!"
            }
          />
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-x-0 top-6 z-50 mx-auto w-fit rounded-full bg-zippy-yellow px-6 py-3 text-lg font-black text-zippy-navy shadow-pop-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ghost angka yang sedang diseret.
          Posisinya ditulis langsung ke DOM lewat `transform: translate3d`,
          bukan lewat state - supaya gerakan jari tidak pernah merender ulang
          seluruh misi. Lihat catatan panjang pada efek drag di atas. */}
      {drag && (
        <div
          ref={ghostRef}
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-[60] grid place-items-center rounded-3xl bg-zippy-yellow px-5 py-3 text-4xl font-black text-zippy-navy shadow-pop-lg will-change-transform"
          style={{ transform: `translate3d(${drag.x}px, ${drag.y}px, 0) translate(-50%, -50%)` }}
        >
          {drag.value}
        </div>
      )}
    </div>
  );
}