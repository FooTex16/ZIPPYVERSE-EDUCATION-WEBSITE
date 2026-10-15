"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Coins,
  Check,
  Lock,
  Pencil,
  Shirt,
  Save,
  RotateCcw,
} from "lucide-react";
import SpaceBackdrop from "@/components/SpaceBackdrop";
import Zippy from "@/components/Zippy";
import ShopModal from "@/components/ShopModal";
import LoadingMeteors from "@/components/LoadingMeteors";
import { COSTUMES, daftarKostum } from "@/lib/gameData";
import { load, update } from "@/lib/store";
import { play, unlockAudio } from "@/lib/sfx";
import { useMotionToggle } from "@/lib/useMediaQuery";

const MAX_NAMA = 18;

/**
 * Halaman Profil Penjelajah.
 *
 * Dibuka dengan menekan nama/avatar di Peta, di Dasbor Orang Tua, atau dari
 * tombol Profil di beranda. Di sini anak bisa:
 *   1. mengganti nama penjelajah,
 *   2. memilih avatar dari kostum yang sudah dimilikinya di Toko.
 *
 * Avatar dan kostum yang dipakai Zippy memakai nilai yang sama
 * (`save.equipped`), sehingga membeli kostum di Toko otomatis menambah
 * pilihan avatar di sini.
 */
export default function ProfilPage() {
  const router = useRouter();
  const [save, setSave] = useState(null);
  const [nama, setNama] = useState("");
  const [pilih, setPilih] = useState("default");
  const [shop, setShop] = useState(false);
  const [tersimpan, setTersimpan] = useState(false);
  const { motionOn, toggleMotion } = useMotionToggle();

  useEffect(() => {
    const s = load();
    setSave(s);
    setNama(s.nickname || "");
    setPilih(s.equipped || "default");
    unlockAudio();
  }, []);

  const owned = useMemo(() => save?.costumes || ["default"], [save]);

  const kostumTerpilih = useMemo(
    () => COSTUMES.find((c) => c.id === pilih) || COSTUMES[0],
    [pilih]
  );

  // Nama hasil suntingan, dibersihkan dari spasi berlebih di kedua ujung.
  const namaBersih = nama.trim().slice(0, MAX_NAMA);

  function simpan() {
    if (!namaBersih) {
      play("wrong");
      return;
    }
    play("yeay");
    const s = update((st) => ({
      ...st,
      nickname: namaBersih,
      equipped: pilih,
    }));
    setSave(s);
    setTersimpan(true);
    // Balik ke tanda centang sesudah sekejap supaya anak tahu berhasil.
    setTimeout(() => setTersimpan(false), 1600);
  }

  function reset() {
    play("pop");
    setNama(save?.nickname || "");
    setPilih(save?.equipped || "default");
  }

  if (!save) {
    return (
      <main className="space-bg relative grid min-h-screen place-items-center overflow-hidden">
        <SpaceBackdrop />
        <LoadingMeteors text="Memuat profil..." />
      </main>
    );
  }

  return (
    <main className="space-bg relative min-h-screen overflow-x-clip">
      <SpaceBackdrop stars={45} dust={12} />

      {/* Header sticky: judul dan tombol kembali tetap terlihat saat digulir */}
      <header className="sticky top-0 z-40 bg-zippy-navy/55 p-3 backdrop-blur-md sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              play("pop");
              router.push("/peta");
            }}
            className="flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-2 font-black text-white transition hover:bg-white/20 sm:px-4"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={3} />
            <span className="hidden sm:inline">Peta</span>
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center font-display text-lg font-bold text-white sm:text-2xl">
            Profil Penjelajah
          </h1>
          <button
            onClick={toggleMotion}
            aria-label={motionOn ? "Kurangi animasi" : "Aktifkan animasi penuh"}
            title={motionOn ? "Animasi penuh" : "Animasi ringan"}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition active:scale-90 ${
              motionOn ? "bg-zippy-yellow/40 text-white" : "bg-white/10 text-white/45"
            }`}
          >
            ✨
          </button>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-16 sm:px-5">
        {/* Kartu pratinjau: avatar + nama hasil suntingan */}
        <div className="card-pop mt-3 flex flex-col items-center gap-4 rounded-[30px] border-4 border-white/10 bg-white/10 p-6 backdrop-blur">
          <div className="rounded-full bg-white/15 p-2">
            <Zippy
              size={150}
              mood="menyapa"
              anim="floaty"
              eager
              speech={`Halo, ${namaBersih || "Penjelajah"}!`}
              speechMaxW={200}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white/55">Nama penjelajah</p>
            <h2 className="font-display text-3xl font-bold text-white">
              {namaBersih || "Penjelajah"}
            </h2>
            <p className="mt-1 text-xs font-bold text-zippy-mint">
              Avatar: {kostumTerpilih.name}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-zippy-yellow px-4 py-2 font-black text-zippy-navy">
            <Coins className="h-5 w-5" strokeWidth={2.8} />
            {save.coins} koin
          </div>
        </div>

        {/* 1. Edit nama */}
        <section className="card-pop mt-5 rounded-[28px] border-4 border-white/10 bg-white/10 p-5 backdrop-blur">
          <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-white">
            <Pencil className="h-5 w-5 text-zippy-yellow" strokeWidth={2.8} />
            Ganti Nama
          </h3>
          <div className="flex gap-3">
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value.slice(0, MAX_NAMA))}
              placeholder="Contoh: Zepta"
              maxLength={MAX_NAMA}
              className="min-w-0 flex-1 rounded-2xl border-4 border-zippy-teal bg-white px-4 py-3 text-lg font-black text-zippy-navy outline-none placeholder:text-zippy-navy/35"
            />
          </div>
          <p className="mt-2 text-xs font-bold text-white/50">
            {nama.length}/{MAX_NAMA} huruf
          </p>
        </section>

        {/* 2. Edit avatar */}
        <section className="card-pop mt-5 rounded-[28px] border-4 border-white/10 bg-white/10 p-5 backdrop-blur">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-white">
              <Shirt className="h-5 w-5 text-zippy-yellow" strokeWidth={2.8} />
              Ganti Avatar
            </h3>
            <button
              onClick={() => {
                play("pop");
                setShop(true);
              }}
              className="btn-pop flex items-center gap-1 rounded-full bg-zippy-yellow px-3 py-1.5 text-xs font-black text-zippy-navy"
            >
              <Shirt className="h-4 w-4" strokeWidth={2.8} />
              Toko
            </button>
          </div>
          <p className="mb-3 text-xs font-bold text-white/55">
            Kostum yang kamu beli di Toko dipakai Zippy di mana-mana, dan tiap
            kostum punya keistimewaan yang membantu kamu bermain.
          </p>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {daftarKostum().map((c) => {
              const has = owned.includes(c.id);
              const active = pilih === c.id;
              const kurangKoin = !has && save.coins < c.price;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    if (has) {
                      play("pop");
                      setPilih(c.id);
                    } else {
                      // Belum punya: arahkan ke Toko supaya bisa dibeli.
                      play("pop");
                      setShop(true);
                    }
                  }}
                  className={`relative flex flex-col items-center gap-1.5 rounded-3xl border-4 p-2 transition ${
                    active
                      ? "border-zippy-yellow bg-zippy-yellow/15"
                      : "border-transparent bg-white/90 hover:border-zippy-mint"
                  }`}
                >
                  {active && (
                    <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-zippy-yellow text-zippy-navy shadow-pop">
                      <Check className="h-4 w-4" strokeWidth={3.5} />
                    </span>
                  )}
                  {/* Gambar kostum TIDAK boleh dibuat redup maupun grayscale.
                      Maskot adalah daya tarik utama bagi anak; menurunkan
                      opasitas sampai 45% membuatnya tampak rusak atau tembus
                      pandang, bukan "terkunci". Penanda "belum dimiliki" sudah
                      cukup lewat lencana gembok dan harga di bawahnya. */}
                  <img
                    src={c.img}
                    alt={c.name}
                    className="h-16 w-16 object-contain sm:h-20 sm:w-20"
                    loading="lazy"
                    decoding="async"
                  />
                  {/* Ukuran huruf naik dari 10/9 px ke 12 px: nama dan
                      keistimewaan kostum adalah penanda utama yang harus
                      terbaca anak SD, dan pada layar 320 px ukuran lama tidak
                      lagi terbaca. `sm:` tidak diperlukan lagi karena ukuran
                      ponsel dan tablet kini sama. */}
                  <span className="text-center text-xs font-black leading-tight text-zippy-navy">
                    {c.name}
                  </span>
                  {c.perk && (
                    <span className="text-center text-xs font-bold leading-tight text-zippy-teal">
                      {c.perk}
                    </span>
                  )}
                  {!has && (
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-black ${
                        kurangKoin
                          ? "bg-zippy-navy/10 text-zippy-navy/45"
                          : "bg-zippy-teal/15 text-zippy-navy"
                      }`}
                    >
                      {kurangKoin && <Lock className="h-3 w-3" strokeWidth={3} />}
                      <Coins className="h-3 w-3" strokeWidth={3} />
                      {c.price}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Tombol aksi */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={reset}
            className="btn-pop flex items-center gap-2 rounded-2xl bg-white/15 px-5 py-3 font-black text-white"
          >
            <RotateCcw className="h-5 w-5" strokeWidth={2.8} />
            Batalkan
          </button>
          <button
            onClick={simpan}
            className="btn-pop flex flex-1 items-center justify-center gap-2 rounded-2xl bg-zippy-yellow px-5 py-3 font-black text-zippy-navy"
          >
            {tersimpan ? (
              <>
                <Check className="h-5 w-5" strokeWidth={3.2} /> Tersimpan!
              </>
            ) : (
              <>
                <Save className="h-5 w-5" strokeWidth={2.8} /> Simpan Profil
              </>
            )}
          </button>
        </div>

        <p className="mt-4 text-center text-xs font-bold text-white/40">
          Profil tersimpan di perangkat ini. Orang tua bisa melihat kemajuan di
          Dasbor.
        </p>
      </div>

      {/* Toko kostum, dipakai juga dari sini */}
      <ShopModal
        open={shop}
        onClose={() => setShop(false)}
        save={save}
        onChange={(s) => {
          setSave(s);
          // Kalau kostum baru langsung dipakai di Toko, ikutkan ke pratinjau.
          setPilih(s.equipped || pilih);
        }}
      />
    </main>
  );
}
