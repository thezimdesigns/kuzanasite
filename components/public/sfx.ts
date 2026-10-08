"use client";

/**
 * Optional sound effects, synthesised with the Web Audio API (no audio files).
 * Off by default; visitors switch them on in the menu. Never plays when the
 * visitor prefers reduced motion.
 */
const KEY = "kuzana.sfx";
export type Sfx = "drum" | "kick";

let ctx: AudioContext | null = null;

export function sfxEnabled() {
  try {
    return localStorage.getItem(KEY) === "on" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function setSfxEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
    window.dispatchEvent(new Event("kuzana-sfx"));
  } catch {}
}

export function subscribeSfx(cb: () => void) {
  window.addEventListener("kuzana-sfx", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("kuzana-sfx", cb);
    window.removeEventListener("storage", cb);
  };
}

function audio() {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noise(a: AudioContext, seconds: number) {
  const buffer = a.createBuffer(1, Math.floor(a.sampleRate * seconds), a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buffer;
  return src;
}

/** A low hand-drum hit: pitched thump with a short skin slap. */
function drum(a: AudioContext) {
  const t = a.currentTime;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(170, t);
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.28);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.55, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + 0.45);

  const slap = noise(a, 0.05);
  const band = a.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 1800;
  const sg = a.createGain();
  sg.gain.setValueAtTime(0.18, t);
  sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  slap.connect(band).connect(sg).connect(a.destination);
  slap.start(t);
}

/** A ball kick: dull leather thud plus a quick scuff. */
function kick(a: AudioContext) {
  const t = a.currentTime;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.6, t + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + 0.18);

  const scuff = noise(a, 0.08);
  const low = a.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = 900;
  const sg = a.createGain();
  sg.gain.setValueAtTime(0.35, t);
  sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  scuff.connect(low).connect(sg).connect(a.destination);
  scuff.start(t);
}

export function playSfx(kind: Sfx) {
  if (!sfxEnabled()) return;
  try {
    const a = audio();
    if (kind === "drum") drum(a);
    else kick(a);
  } catch {
    // Audio unavailable: stay silent.
  }
}
