"use client";

import { Coins, Flame, Star, Volume2, VolumeX, Sparkles, Zap } from "lucide-react";
import SpeechMenu from "./SpeechMenu";
import { COSTUMES } from "@/lib/gameData";

/**
 * Bilah status penjelajah (HUD).
 *
 * Catatan untuk layar HP:
 *  - Nama pengguna disembunyikan di bawah `sm` dan digantikan avatar, karena
 *    nama panjang membuat bilah ini terpotong di layar sempit.
 *  - `flex-wrap` dipasang supaya kalau muatnya kurang, tombol turun ke baris
 *    berikutnya dengan rapi — bukan keluar layar / terpotong.
 *  - Tombol-tombolnya dikecilkan di HP lalu kembali normal di `sm`.
 */
export default function Hud({
  coins = 0,
  streak = 1,
  xp = 0,
  nickname = "",
  equipped = "default",
  stamina = null,
  soundOn = true,
  onToggleSound,
  motionOn = true,
  onToggleMotion,
  onProfile,
  compact = false,
}) {
  const level = Math.floor(xp / 100) + 1;
  const pct = xp % 100;

  // Avatar memakai kostum yang sedang dipakai Zippy, sehingga kostum yang
  // dibeli di Toko langsung terlihat di sini.
  const kostum = COSTUMES.find((c) => c.id === equipped) || COSTUMES[0];

  const profileBtn = (
    <button
      onClick={() => {
        if (onProfile) onProfile();
      }}
      aria-label={nickname ? `Profil ${nickname}` : "Profil penjelajah"}
      title="Buka profil"
      className="flex items-center gap-1.5 rounded-full border-2 border-transparent py-0.5 pl-0.5 pr-2 transition hover:border-zippy-teal/40 active:scale-95 sm:gap-2 sm:pr-3"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-zippy-teal/20 ring-2 ring-zippy-teal/40">
        <img
          src={kostum.img}
          alt=""
          className="h-full w-full object-cover object-top"
          draggable={false}
          loading="eager"
          decoding="async"
        />
      </span>
      {nickname && (
        <span className="hidden max-w-[110px] truncate font-extrabold text-zippy-navy sm:inline">
          {nickname}
        </span>
      )}
    </button>
  );

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-1 rounded-full bg-cream/95 px-2 py-1.5 shadow-pop backdrop-blur sm:flex-nowrap sm:justify-start sm:gap-2 sm:px-3 sm:py-2 ${
        compact ? "text-sm" : "text-base"
      }`}
    >
      {onProfile && (
        <div className="flex items-center border-r border-zippy-navy/15 pr-1 sm:pr-2">
          {profileBtn}
        </div>
      )}

      {!onProfile && nickname && (
        <div className="hidden items-center gap-2 border-r border-zippy-navy/15 pr-3 sm:flex">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-zippy-teal text-sm font-black text-white">
            <span className="truncate px-1">
              {nickname.trim().charAt(0).toUpperCase() || "Z"}
            </span>
          </div>
          <span className="max-w-[110px] truncate font-extrabold text-zippy-navy">{nickname}</span>
        </div>
      )}

      <div
        className="flex items-center gap-1 font-black text-zippy-navy"
        title="Koin Bintang"
      >
        <Coins className="h-5 w-5 text-zippy-yellow" strokeWidth={2.6} />
        <span>{coins}</span>
      </div>

      {/* Energi bermain. Anak perlu istirahat kalau batang ini habis. */}
      {typeof stamina === "number" && (
        <div
          className="flex items-center gap-1 font-black text-zippy-navy"
          title="Energi bermain"
        >
          <Zap className="h-5 w-5 text-emerald-500" strokeWidth={2.6} />
          <span>{stamina}</span>
        </div>
      )}

      <div className="flex items-center gap-1 font-black text-zippy-navy" title="Streak harian">
        <Flame className="h-5 w-5 text-orange-500" strokeWidth={2.6} />
        <span>{streak}</span>
      </div>

      {/* Level hanya tampil di layar lebar supaya di tablet/HP tidak membuat
          baris HUD memanjang dan memaksa header membungkus jadi dua baris. */}
      <div className="hidden items-center gap-2 lg:flex" title={`Level ${level}`}>
        <Star className="h-5 w-5 text-zippy-teal" strokeWidth={2.6} />
        <div className="h-2.5 w-24 overflow-hidden rounded-full bg-zippy-navy/15">
          <div
            className="h-full rounded-full bg-zippy-teal transition-all duration-500"
            style={{ width: `${Math.max(pct, 4)}%` }}
          />
        </div>
        <span className="text-xs font-extrabold text-zippy-navy/70">Lv{level}</span>
      </div>

      {onToggleSound && (
        <button
          onClick={onToggleSound}
          aria-label={soundOn ? "Matikan suara" : "Nyalakan suara"}
          className="grid h-10 w-10 place-items-center rounded-full bg-zippy-teal/15 text-zippy-teal transition hover:bg-zippy-teal/25 active:scale-90"
        >
          {soundOn ? (
            <Volume2 className="h-5 w-5" strokeWidth={2.6} />
          ) : (
            <VolumeX className="h-5 w-5" strokeWidth={2.6} />
          )}
        </button>
      )}

      <SpeechMenu />

      {onToggleMotion && (
        <button
          onClick={onToggleMotion}
          aria-label={motionOn ? "Kurangi animasi" : "Aktifkan animasi penuh"}
          title={motionOn ? "Animasi penuh" : "Animasi ringan"}
          className={`grid h-10 w-10 place-items-center rounded-full transition active:scale-90 ${
            motionOn
              ? "bg-zippy-yellow/40 text-zippy-navy"
              : "bg-zippy-navy/10 text-zippy-navy/45"
          }`}
        >
          <Sparkles className="h-5 w-5" strokeWidth={2.6} />
        </button>
      )}
    </div>
  );
}
