"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ZIPPY_IMG } from "@/lib/gameData";

/**
 * Komponen maskot Zippy.
 *
 * Animasi idle adalah kombinasi tiga gerakan yang berjalan bersamaan:
 * melayang (naik-turun), bergoyang (miring kiri-kanan), dan "bernapas"
 * (membesar-mengecil). Efek sederhana ini membuat Zippy terlihat hidup walau
 * cuma memakai satu gambar diam.
 *
 * @param mood  happy|berpikir|terkejut|sedih|merayakan|melompat|membaca|menunjuk|menyapa|berlari|depan
 * @param speech pesan singkat dalam gelembung bicara
 * @param anim  idle|floaty|wiggle|hop|none
 * @param eager muat gambar langsung (untuk gambar di atas layar)
 * @param speechW lebar gelembung dalam piksel; dipakai supaya gelembung tidak
 *                berubah ukuran ketika isinya berganti
 * @param speechH tinggi gelembung dalam piksel; dipakai supaya seluruh tumpukan
 *                tidak bergeser naik-turun ketika jumlah baris teks berubah
 *
 * `size` boleh berupa angka (diameter dalam piksel) ATAU string CSS apa pun,
 * misalnya `size="min(330px, calc(100vw - 88px))"`. Cara kedua dipakai untuk
 * maskot besar di halaman beranda supaya Zippy mengecil sendiri di layar HP
 * dan tidak terpotong tepi layar.
 * @param speechMaxW lebar maksimum gelembung; mengecil supaya tidak melebar
 *                   keluar layar di HP, teksnya dibungkus otomatis
 */
export default function Zippy({
  mood = "bahagia",
  speech = null,
  size = 170,
  anim = "idle",
  className = "",
  flip = false,
  eager = false,
  speechW = null,
  speechH = null,
  speechMaxW = 260,
}) {
  // Setiap ekspresi punya ritme gerak sendiri supaya Zippy terasa punya kepribadian.
  const profile = {
    merayakan: { dur: 1.5, lift: 16, tilt: 7, breathe: 1.07, delay: 0 },
    melompat: { dur: 1.1, lift: 22, tilt: 5, breathe: 1.05, delay: 0 },
    terkejut: { dur: 0.75, lift: 12, tilt: 9, breathe: 1.1, delay: 0 },
    bahagia: { dur: 2.2, lift: 12, tilt: 4, breathe: 1.05, delay: 0 },
    menyapa: { dur: 2.0, lift: 12, tilt: 5, breathe: 1.05, delay: 0 },
    menunjuk: { dur: 2.6, lift: 9, tilt: 3, breathe: 1.04, delay: 0.2 },
    membaca: { dur: 3.2, lift: 7, tilt: 2, breathe: 1.03, delay: 0 },
    berpikir: { dur: 2.8, lift: 8, tilt: 4, breathe: 1.04, delay: 0.4 },
    sedih: { dur: 3.6, lift: 5, tilt: 3, breathe: 1.06, delay: 0 },
    berlari: { dur: 0.9, lift: 14, tilt: 8, breathe: 1.03, delay: 0 },
  };
  const p = profile[mood] || profile.bahagia;

  const idleAnim =
    {
      idle: {
        y: [0, -p.lift, 0],
        rotate: [0, p.tilt, 0, -p.tilt, 0],
        scale: [1, p.breathe, 1],
      },
      floaty: { y: [0, -p.lift * 1.6, 0], rotate: [0, p.tilt * 0.5, 0] },
      wiggle: { rotate: [0, p.tilt * 2, 0, -p.tilt * 2, 0], scale: [1, 1.04, 1] },
      hop: {
        y: [0, -p.lift * 2, 0, -p.lift * 0.6, 0],
        scale: [1, 0.92, 1.05, 1, 1],
        rotate: [0, p.tilt, 0, 0],
      },
      none: { y: 0, rotate: 0, scale: 1 },
    }[anim] ?? null;

  const idleTransition = {
    duration: p.dur,
    times: [0, 0.3, 0.55, 0.8, 1],
    repeat: Infinity,
    ease: "easeInOut",
    delay: p.delay,
  };

  const animClass = anim === "none" ? "" : "";

  // `size` bisa angka (px) atau string CSS seperti "min(330px, 70vw)".
  // Nilai CSS dipakai langsung pada style, sedangkan atribut width/height
  // gambar hanya diisi kalau ukurannya angka (atribut butuh bilangan bulat).
  const sizeCss = typeof size === "number" ? `${size}px` : String(size);
  const sizeAttr = typeof size === "number" ? size : undefined;

  const bubbleAnim = {
    initial: { opacity: 0, y: 12, scale: 0.85 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -8, scale: 0.9 },
  };

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <AnimatePresence>
        {speech && (
          <motion.div
            {...bubbleAnim}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className={`relative z-20 mb-3 rounded-3xl bg-cream px-5 py-3 text-center text-[15px] leading-snug font-bold text-zippy-navy shadow-pop-lg ${
              speechH ? "flex items-center justify-center" : ""
            }`}
            style={{
              width: speechW || undefined,
              minHeight: speechH || undefined,
              // Lebar gelembung dibatasi supaya di layar sempit teksnya
              // turun baris, bukan melebar keluar tepi layar lalu terpotong.
              maxWidth: speechW ? undefined : speechMaxW,
            }}
          >
            <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-cream" />
            <span className="relative">{speech}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={idleAnim}
        transition={idleTransition}
        className="relative shrink-0"
        style={{ width: sizeCss, height: sizeCss }}
      >
        {/* `object-contain` ini WAJIB ada. Semua berkas Zippy berbentuk bukan
            persegi (rasio 0,636 s/d 1,217), sementara kotak pembungkus di
            atas sengaja persegi agar tata letak tidak melompat-lompat ketika
            ekspresi berganti. Tanpa object-contain, object-fit bawaan "fill"
            memaksa gambar mengisi kotak persegi dan Zippy jadi penyot:
            pose samping melebar 57%, pose membaca menyempit 18%. */}
        <motion.img
          key={mood}
          src={ZIPPY_IMG[mood] || ZIPPY_IMG.bahagia}
          alt="Zippy, Si Penjelajah Ilmu"
          width={sizeAttr}
          height={sizeAttr}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          style={{
            width: sizeCss,
            height: sizeCss,
            transform: flip ? "scaleX(-1)" : undefined,
          }}
          className={`select-none object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)] ${animClass}`}
          draggable={false}
          decoding="async"
          loading={eager ? "eager" : "lazy"}
        />
      </motion.div>
    </div>
  );
}
