"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Coins, Check, Lock, Sparkles } from "lucide-react";
import { daftarKostum } from "@/lib/gameData";
import { update } from "@/lib/store";
import { play } from "@/lib/sfx";

export default function ShopModal({ open, onClose, save, onChange }) {
  if (!save) return null;
  const owned = save.costumes || ["default"];
  // Dibaca ulang tiap render supaya harga hasil pengaturan Panel Admin langsung
  // terpakai, dan supaya tiap item menampilkan keistimewaannya sendiri.
  const daftar = daftarKostum();

  function buy(item) {
    if (owned.includes(item.id)) {
      const s = update((st) => ({ ...st, equipped: item.id }));
      onChange(s);
      play("pop");
      return;
    }
    if (save.coins < item.price) {
      play("wrong");
      return;
    }
    play("yeay");
    const s = update((st) => ({
      ...st,
      coins: st.coins - item.price,
      costumes: [...(st.costumes || ["default"]), item.id],
      equipped: item.id,
    }));
    onChange(s);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 grid place-items-end bg-black/60 p-4 backdrop-blur-sm sm:place-items-center"
        >
          <motion.div
            initial={{ y: 60, scale: 0.94 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 60, scale: 0.94 }}
            onClick={(e) => e.stopPropagation()}
            className="card-pop max-h-[86vh] w-full max-w-2xl overflow-hidden rounded-[30px] border-4 border-zippy-teal bg-cream"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 bg-zippy-teal px-5 py-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">Toko Kostum Zippy</h2>
                <p className="text-xs font-bold text-white/80">
                  Tiap kostum punya keistimewaan yang membuat bermain lebih mudah!
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-zippy-yellow px-4 py-2 font-black text-zippy-navy">
                <Coins className="h-5 w-5" strokeWidth={2.8} />
                {save.coins}
              </div>
            </div>

            {/* Grid */}
            <div className="no-scrollbar max-h-[62vh] overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {daftar.map((c) => {
                  const has = owned.includes(c.id);
                  const active = save.equipped === c.id;
                  const poor = !has && save.coins < c.price;
                  return (
                    <button
                      key={c.id}
                      onClick={() => buy(c)}
                      className={`relative flex flex-col items-center gap-2 rounded-3xl border-4 p-3 transition ${
                        active
                          ? "border-zippy-teal bg-zippy-teal/12"
                          : "border-transparent bg-white shadow-pop hover:border-zippy-mint"
                      }`}
                    >
                      {/* Opasitas rendah sengaja tidak dipakai di sini.
                          Kostum yang belum terbeli tetap tampil penuh warna
                          supaya anak bisa benar-benar melihat yang ia incar;
                          keterbatasan ditandai lencana gembok dan harga. */}
                      <img src={c.img} alt={c.name} className="h-24 w-24 object-contain" />
                      <p className="text-center text-xs font-black text-zippy-navy">{c.name}</p>

                      {/* Keistimewaan kostum. Tanpa kalimat ini anak tidak
                          tahu apa yang didapatnya dengan membayar koin, dan
                          toko terasa sekadar ganti gambar. */}
                      {c.perk ? (
                        <span className="flex items-start gap-1 rounded-2xl bg-zippy-mint/45 px-2 py-1 text-center text-[10px] leading-tight font-bold text-zippy-navy">
                          <Sparkles className="mt-px h-3 w-3 shrink-0 text-zippy-teal" strokeWidth={3} />
                          {c.perk}
                        </span>
                      ) : (
                        <span className="rounded-2xl bg-zippy-navy/6 px-2 py-1 text-center text-[10px] leading-tight font-bold text-zippy-navy/55">
                          Kostum awal Zippy
                        </span>
                      )}

                      {active ? (
                        <span className="flex items-center gap-1 rounded-full bg-zippy-teal px-3 py-1 text-[11px] font-black text-white">
                          <Check className="h-3 w-3" strokeWidth={3.5} /> Dipakai
                        </span>
                      ) : has ? (
                        <span className="rounded-full bg-zippy-mint/60 px-3 py-1 text-[11px] font-black text-zippy-navy">
                          Pakai
                        </span>
                      ) : (
                        <span
                          className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black ${
                            poor ? "bg-zippy-navy/10 text-zippy-navy/45" : "bg-zippy-yellow text-zippy-navy"
                          }`}
                        >
                          {poor && <Lock className="h-3 w-3" strokeWidth={3} />}
                          <Coins className="h-3 w-3" strokeWidth={3} />
                          {c.price}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t-4 border-zippy-navy/10 bg-white px-5 py-3">
              <button
                onClick={onClose}
                className="btn-pop w-full rounded-2xl bg-zippy-navy px-4 py-3 font-black text-white"
              >
                Selesai
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}