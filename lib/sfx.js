// ============================================================
// Sound Manager - berbasis Web Audio + file mp3 di /public/sfx
// ============================================================

const FILES = {
  pop: "/sfx/pop.mp3",
  correct: "/sfx/correct.mp3",
  wrong: "/sfx/wrong.mp3",
  coin: "/sfx/coin.mp3",
  yeay: "/sfx/yeay.mp3",
  levelup: "/sfx/levelup.mp3",
};

let cache = null;
let enabled = true;

function getAudio() {
  if (typeof window === "undefined") return null;
  if (!cache) {
    cache = {};
    for (const k in FILES) {
      const a = new Audio(FILES[k]);
      a.preload = "auto";
      a.volume = 0.45;
      cache[k] = a;
    }
  }
  return cache;
}

export function setSfxEnabled(v) {
  enabled = v;
}
export function isSfxEnabled() {
  return enabled;
}

export function play(name) {
  if (!enabled) return;
  try {
    const a = getAudio();
    if (!a || !a[name]) return;
    const c = a[name].cloneNode();
    c.volume = a[name].volume;
    c.play().catch(() => {});
  } catch (e) {
    // diamkan error autoplay
  }
}

// Unlock audio setelah interaksi pertama user (policy browser)
export function unlockAudio() {
  try {
    const a = getAudio();
    if (!a) return;
    Object.values(a).forEach((x) => {
      x.muted = true;
      x.play()
        .then(() => {
          x.pause();
          x.currentTime = 0;
          x.muted = false;
        })
        .catch(() => {});
    });
  } catch (e) {}
}