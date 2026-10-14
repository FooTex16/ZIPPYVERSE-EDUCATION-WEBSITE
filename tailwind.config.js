/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  // Kelas yang dibangun dinamis (mis. `animate-${nama}`) tidak terlihat oleh
  // pemindai Tailwind, jadi harus didaftarkan manual di sini.
  safelist: [
    "animate-driftA",
    "animate-driftB",
    "animate-driftC",
    "animate-twinkle",
    "animate-shooting",
    "animate-rise",
    "animate-orbit",
    "animate-spinSlow",
    "animate-floatySlow",
    "animate-pulseGlow",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FFF6E5",
        teal: {
          50: "#EAF7F6",
          100: "#CDEBE9",
          200: "#A9D9D6",
          300: "#7FC5C1",
          400: "#4FB3AE",
          500: "#2AA5A0",
          600: "#1F8783",
          700: "#176966",
          800: "#0F2C3D",
        },
        zippy: {
          teal: "#2AA5A0",
          mint: "#B2D8D5",
          yellow: "#FFC93C",
          cream: "#FFF6E5",
          navy: "#0F2C3D",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        pop: "0 6px 0 rgba(15,44,61,0.12)",
        "pop-lg": "0 10px 0 rgba(15,44,61,0.14)",
        glow: "0 0 0 6px rgba(255,201,60,0.35)",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(-4deg)" },
          "50%": { transform: "rotate(4deg)" },
        },
        bob: {
          "0%,100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-6px) scale(1.03)" },
        },
        popIn: {
          "0%": { transform: "scale(0.7)", opacity: "0" },
          "70%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "20%,60%": { transform: "translateX(-8px)" },
          "40%,80%": { transform: "translateX(8px)" },
        },
        twinkle: {
          "0%,100%": { opacity: "0.25", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
        drift: {
          "0%": { transform: "translate(0,0)" },
          "100%": { transform: "translate(30px,-40px)" },
        },
        shooting: {
          "0%": { opacity: "0", transform: "translate3d(0,0,0) rotate(24deg)" },
          "10%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translate3d(320px,150px,0) rotate(24deg)" },
        },
        floatySlow: {
          "0%,100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-14px,0)" },
        },
        pulseGlow: {
          "0%,100%": { opacity: "0.45", transform: "scale(1)" },
          "50%": { opacity: "0.75", transform: "scale(1.06)" },
        },
        // ---- Latar: semua hanya transform + opacity (GPU) ----
        driftA: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(7vw,-5vh,0) scale(1.14)" },
        },
        driftB: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1.08)" },
          "50%": { transform: "translate3d(-6vw,6vh,0) scale(0.94)" },
        },
        driftC: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(5vw,4vh,0) scale(1.1)" },
          "66%": { transform: "translate3d(-4vw,-3vh,0) scale(0.96)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translate3d(0,0,0)" },
          "12%": { opacity: "0.9" },
          "50%": { transform: "translate3d(18px,-45vh,0)" },
          "88%": { opacity: "0.9" },
          "100%": { opacity: "0", transform: "translate3d(-14px,-95vh,0)" },
        },
        orbit: {
          "0%,100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(-2.5vw,1.6vh,0)" },
        },
        spinSlow: {
          "0%": { transform: "translate3d(0,0,0) rotate(-18deg)" },
          "50%": { transform: "translate3d(0,0,0) rotate(18deg)" },
          "100%": { transform: "translate3d(0,0,0) rotate(-18deg)" },
        },
      },
      animation: {
        floaty: "floaty 3s ease-in-out infinite",
        wiggle: "wiggle 1.6s ease-in-out infinite",
        bob: "bob 2.2s ease-in-out infinite",
        popIn: "popIn 0.45s cubic-bezier(0.34,1.56,0.64,1)",
        shake: "shake 0.4s ease-in-out",
        twinkle: "twinkle 2s ease-in-out infinite",
        drift: "drift 9s linear infinite alternate",
        shooting: "shooting 7s linear infinite",
        floatySlow: "floatySlow 5.5s ease-in-out infinite",
        pulseGlow: "pulseGlow 4.5s ease-in-out infinite",
        driftA: "driftA 44s ease-in-out infinite",
        driftB: "driftB 52s ease-in-out infinite",
        driftC: "driftC 37s ease-in-out infinite",
        rise: "rise 26s linear infinite",
        orbit: "orbit 34s ease-in-out infinite",
        spinSlow: "spinSlow 46s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};