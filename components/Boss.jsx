"use client";

/**
 * Gerhana Zahra - bos misterius Pulau Angka.
 * Dibuat 100% dengan SVG + CSS, tanpa aset gambar.
 * @param power 1 = penuh (sehat), 0 = kalah
 */
export default function Boss({ power = 1, defeated = false }) {
  const eyeY = 52;
  const eyeH = Math.max(6, 26 * power);
  const wobble = defeated ? 0 : 1;

  return (
    <div className="relative select-none" style={{ width: 190, height: 190 }}>
      <div
        className={defeated ? "" : "animate-floaty"}
        style={{ width: 190, height: 190, opacity: defeated ? 0.35 : 1 }}
      >
        <svg viewBox="0 0 200 200" width="190" height="190" aria-label="Gerhana Zahra">
          <defs>
            <radialGradient id="bossBody" cx="38%" cy="30%">
              <stop offset="0%" stopColor="#3C5C77" />
              <stop offset="60%" stopColor="#1B3A52" />
              <stop offset="100%" stopColor="#0B1F2E" />
            </radialGradient>
            <radialGradient id="bossGlow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(255,201,60,0.55)" />
              <stop offset="100%" stopColor="rgba(255,201,60,0)" />
            </radialGradient>
          </defs>

          {/* aura saat health rendah */}
          {power < 0.4 && (
            <circle cx="100" cy="100" r="92" fill="url(#bossGlow)" opacity={0.8} />
          )}

          {/* badan */}
          <ellipse cx="100" cy="104" rx="74" ry="76" fill="url(#bossBody)" />

          {/* mahkota bayangan (spikes) */}
          <path d="M46 56 L62 26 L76 54 Z" fill="#1B3A52" />
          <path d="M154 56 L138 26 L124 54 Z" fill="#1B3A52" />
          <path d="M100 30 L112 8 L126 34 Z" fill="#1B3A52" />

          {/* mata */}
          <ellipse cx="76" cy={eyeY} rx="13" ry={eyeH / 2} fill="#FFC93C" />
          <ellipse cx="124" cy={eyeY} rx="13" ry={eyeH / 2} fill="#FFC93C" />
          <circle cx="76" cy={eyeY} r={Math.max(2, eyeH / 5)} fill="#0F2C3D" />
          <circle cx="124" cy={eyeY} r={Math.max(2, eyeH / 5)} fill="#0F2C3D" />

          {/* mulut */}
          {defeated ? (
            <path
              d="M82 136 Q100 152 118 136"
              stroke="#FFC93C"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />
          ) : (
            <ellipse cx="100" cy={140} rx={18 + power * 6} ry={6 + power * 10} fill="#0B1F2E" />
          )}

          {/* retakan muncul saat health turun */}
          {power < 0.7 && (
            <path
              d={`M${100 - power * 30} 44 L100 78 L${100 + power * 26} 96`}
              stroke="#FFC93C"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              opacity={0.75}
            />
          )}
        </svg>
      </div>

      {/* label */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-zippy-navy/85 px-3 py-1 text-xs font-black text-zippy-yellow">
        {defeated ? "Zahra KALAH!" : "GERHANA ZAHRA"}
      </div>
    </div>
  );
}