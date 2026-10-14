"use client";

import { useMemo, useRef, useEffect } from "react";

/**
 * Latar luar angkasa yang hidup.
 *
 * Prinsip:
 * - Semua animasi hanya `transform` + `opacity` (diolak GPU, tidak memicu layout).
 * - Tidak ada `filter: blur()` pada elemen yang bergerak.
 * - Bintang dibagi 3 lapis dan tiap lapis melayang dengan kecepatan berbeda
 *   sehingga terlihat sepertidrome-depth (parallax). Loop-nya mulus karena
 *   tiap lapis memakai tinggi 200% lalu digeser -50%.
 * - Pointer / kemiringan HP memberi parallax halus.
 * - Tidak ada planet kaku; langitnya hidup dari bintang yang bergerak.
 */

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Kabut warna (alpha disertakan langsung di hex 8 digit)
const NEBULA = [
  { x: 6, y: 8, size: 620, color: "2AA5A0", alpha: "2E", anim: "driftA", dur: 46, delay: -4 },
  { x: 66, y: 14, size: 540, color: "B2D8D5", alpha: "22", anim: "driftB", dur: 54, delay: -12 },
  { x: 82, y: 62, size: 680, color: "FFC93C", alpha: "18", anim: "driftC", dur: 58, delay: -20 },
  { x: 24, y: 74, size: 600, color: "2AA5A0", alpha: "20", anim: "driftB", dur: 50, delay: -8 },
  { x: 48, y: 38, size: 460, color: "B2D8D5", alpha: "16", anim: "driftA", dur: 42, delay: -26 },
  { x: -8, y: 52, size: 520, color: "FFC93C", alpha: "12", anim: "driftC", dur: 61, delay: -16 },
];

export default function SpaceBackdrop({
  stars = 54,
  dust = 14,
  seed = 20240,
  parallax = true,
}) {
  const sceneRef = useRef(null);

  const { starLayers, shooters, motes } = useMemo(() => {
    const rnd = mulberry32(seed);

    // Tiga lapis: makin dekat, makin besar, makin cepat.
    const share = [0.48, 0.32, 0.2];
    const sizeBase = [1, 2, 3.2];
    const speed = [70, 46, 30]; // detik per putaran
    const opBase = [0.32, 0.6, 0.95];

    const starLayers = share.map((s, li) => ({
      duration: speed[li] + rnd() * 12,
      stars: Array.from({ length: Math.max(1, Math.round(stars * s)) }, () => ({
        left: rnd() * 100,
        top: rnd() * 200, // 200% tinggi agar loop mulus
        size: sizeBase[li] * (0.7 + rnd() * 0.7),
        op: opBase[li] * (0.55 + rnd() * 0.45),
        dur: 2.4 + rnd() * 4,
        phase: rnd(),
      })),
    }));

    const shooters = Array.from({ length: 2 }, () => ({
      left: 8 + rnd() * 72,
      top: 4 + rnd() * 32,
      delay: 5 + rnd() * 11,
      dur: 1.05,
      len: 70 + rnd() * 70,
      angle: 22 + rnd() * 12,
    }));

    const motes = Array.from({ length: dust }, () => ({
      left: rnd() * 100,
      size: 1.5 + rnd() * 2.5,
      delay: rnd() * 26,
      dur: 22 + rnd() * 14,
      op: 0.3 + rnd() * 0.45,
    }));

    return { starLayers, shooters, motes };
  }, [stars, dust, seed]);

  // Parallax halus mengikuti kursor, atau kemiringan HP.
  useEffect(() => {
    if (!parallax) return;
    const el = sceneRef.current;
    if (!el) return;

    let frame = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let running = false;

    const loop = () => {
      cx += (tx - cx) * 0.05;
      cy += (ty - cy) * 0.05;
      el.style.setProperty("--px", `${cx.toFixed(2)}px`);
      el.style.setProperty("--py", `${cy.toFixed(2)}px`);
      if (Math.abs(tx - cx) > 0.03 || Math.abs(ty - cy) > 0.03) {
        frame = requestAnimationFrame(loop);
      } else {
        running = false;
      }
    };

    const start = () => {
      if (!running) {
        running = true;
        frame = requestAnimationFrame(loop);
      }
    };

    const onPointer = (e) => {
      if (e.pointerType === "touch") return;
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      start();
    };

    const onLeave = () => {
      tx = 0;
      ty = 0;
      start();
    };

    const onTilt = (e) => {
      if (e.gamma == null) return;
      tx = Math.max(-1, Math.min(1, e.gamma / 30));
      start();
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("deviceorientation", onTilt, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("deviceorientation", onTilt);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [parallax]);

  return (
    <div
      ref={sceneRef}
      className="space-scene pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* 1. Kabut/nebula yang mengambang */}
      {NEBULA.map((n, i) => (
        <div
          key={`neb-${i}`}
          className={`absolute rounded-full animate-${n.anim} layer-extra`}
          style={{
            left: `${n.x}%`,
            top: `${n.y}%`,
            width: n.size,
            height: n.size,
            marginLeft: -n.size / 2,
            marginTop: -n.size / 2,
            background: `radial-gradient(circle, #${n.color}${n.alpha} 0%, #${n.color}${n.alpha} 38%, transparent 70%)`,
            animationDuration: `${n.dur}s`,
            animationDelay: `${n.delay}s`,
          }}
        />
      ))}

      {/* 2. Bintang melayang: outer untuk parallax, inner untuk drift */}
      {starLayers.map((layer, li) => (
        <div key={`sl-${li}`} className={`absolute left-0 top-0 w-full star-par-${li}`}>
          <div
            className="absolute left-0 top-0 w-full"
            style={{
              height: "200%",
              animation: `starDrift ${layer.duration}s linear infinite`,
              willChange: "transform",
            }}
          >
            {layer.stars.map((s, i) => (
              <span
                key={i}
                className="absolute rounded-full bg-white animate-twinkle"
                style={{
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  opacity: s.op,
                  animationDelay: `${(-s.dur * s.phase).toFixed(2)}s`,
                  animationDuration: `${s.dur}s`,
                }}
              />
            ))}
          </div>
        </div>
      ))}

      {/* 3. Bintang jatuh */}
      {shooters.map((s, i) => (
        <span
          key={`shoot-${i}`}
          className="absolute block h-px animate-shooting layer-extra"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.len}px`,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.95), rgba(255,201,60,0))",
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
            transform: `rotate(${s.angle}deg)`,
          }}
        />
      ))}

      {/* 4. Debu halus yang naik perlahan */}
      {motes.map((m, i) => (
        <span
          key={`mote-${i}`}
          className="absolute bottom-0 rounded-full bg-zippy-mint animate-rise layer-extra"
          style={{
            left: `${m.left}%`,
            width: `${m.size}px`,
            height: `${m.size}px`,
            opacity: m.op,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.dur}s`,
          }}
        />
      ))}
    </div>
  );
}