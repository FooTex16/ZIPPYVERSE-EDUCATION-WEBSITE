"use client";

import { useEffect, useState } from "react";

/**
 * Pantau breakpoint untuk menentukan tata letak.
 * Mengembalikan nama breakpoint aktif:
 * "sm" (<640px), "md" (640-1023px), "lg" (>=1024px)
 */
export function useBreakpoint() {
  const [bp, setBp] = useState("lg");

  useEffect(() => {
    const mqSm = window.matchMedia("(max-width: 639px)");
    const mqMd = window.matchMedia("(min-width: 640px) and (max-width: 1023px)");

    const pick = () => {
      if (mqSm.matches) setBp("sm");
      else if (mqMd.matches) setBp("md");
      else setBp("lg");
    };

    pick();
    mqSm.addEventListener("change", pick);
    mqMd.addEventListener("change", pick);
    window.addEventListener("orientationchange", pick);
    return () => {
      mqSm.removeEventListener("change", pick);
      mqMd.removeEventListener("change", pick);
      window.removeEventListener("orientationchange", pick);
    };
  }, []);

  return bp;
}

/**
 * Kendali animasi.
 *
 * Mengembalikan status dan fungsi toggle. Status disimpan di localStorage
 * dan ditulis ke atribut `data-motion` pada <html> supaya CSS bisa
 * memaksa animasi penuh walau sistem memakai "kurangi animasi".
 *
 * Default-nya mengikuti preferensi sistem. Kalau sistem minta kurangi,
 * gerakan ambient lambat tetap jalan (lihat globals.css) supaya langit
 * tidak terasa mati.
 */
export function useMotionToggle() {
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let initial = true;
    try {
      const saved = window.localStorage.getItem("zippyverse_motion");
      if (saved === "on") initial = true;
      else if (saved === "off") initial = false;
      else initial = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {}
    setOn(initial);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.setAttribute("data-motion", on ? "on" : "off");
    try {
      window.localStorage.setItem("zippyverse_motion", on ? "on" : "off");
    } catch {}
  }, [on, ready]);

  const toggle = () => setOn((v) => !v);
  return { motionOn: on, toggleMotion: toggle, motionReady: ready };
}

/** Ukuran jendela, dibatasi supaya tidak memicu render terlalu sering. */
export function useViewport() {
  const [vp, setVp] = useState({ w: 1280, h: 800 });

  useEffect(() => {
    let frame = 0;
    let last = { w: window.innerWidth, h: window.innerHeight };

    const onResize = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const w = window.innerWidth;
        const h = window.innerHeight;
        // Abaikan perubahan kecil supaya tidak re-render berlebihan
        if (Math.abs(w - last.w) < 24 && Math.abs(h - last.h) < 24) return;
        last = { w, h };
        setVp({ w, h });
      });
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return vp;
}