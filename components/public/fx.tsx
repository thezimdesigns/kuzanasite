"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { IconBallFootball } from "@tabler/icons-react";

/**
 * Click effects in the KUZANA spirit: a drum beat (the button thumps and two
 * shockwaves ripple out like a struck skin) and a ball kick (a football flies
 * off the button in an arc). Purely visual, never on reduced motion.
 *
 * Use: data-fx="drum" | "kick" on any clickable element, or fireFx() from code.
 */
export type FxKind = "drum" | "kick";
type Fx = { id: number; kind: FxKind; x: number; y: number; dir: 1 | -1 };

const EVENT = "kuzana-fx";
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/** Point an effect starts from: the pointer, or the element's centre for keyboard clicks. */
function origin(el: Element, e?: MouseEvent) {
  if (e && (e.clientX || e.clientY)) return { x: e.clientX, y: e.clientY };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** The element itself reacts: a thump for the drum, a jolt for the kick. */
function nudge(el: Element, kind: FxKind) {
  if (!(el instanceof HTMLElement)) return;
  el.animate(
    kind === "drum"
      ? [{ transform: "scale(1)" }, { transform: "scale(0.93)", offset: 0.25 }, { transform: "scale(1.035)", offset: 0.6 }, { transform: "scale(1)" }]
      : [{ transform: "none" }, { transform: "translateY(2px) scale(0.97)", offset: 0.3 }, { transform: "none" }],
    { duration: kind === "drum" ? 420 : 240, easing: "ease-out" },
  );
}

export function fireFx(kind: FxKind, el: Element, e?: MouseEvent) {
  if (typeof window === "undefined" || reduced()) return;
  nudge(el, kind);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { kind, ...origin(el, e) } }));
}

/** Renders running effects in a fixed, click-through layer above the page. */
export function FxLayer() {
  const [effects, setEffects] = useState<Fx[]>([]);
  const next = useRef(0);

  useEffect(() => {
    const onFx = (e: Event) => {
      const { kind, x, y } = (e as CustomEvent<{ kind: FxKind; x: number; y: number }>).detail;
      // Kick the ball towards the side of the screen with more room.
      const dir = x < window.innerWidth / 2 ? 1 : -1;
      setEffects((list) => [...list.slice(-5), { id: next.current++, kind, x, y, dir }]);
    };
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-fx]");
      const kind = el?.dataset.fx;
      if (el && (kind === "drum" || kind === "kick")) fireFx(kind, el, e);
    };
    window.addEventListener(EVENT, onFx);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener(EVENT, onFx);
      document.removeEventListener("click", onClick);
    };
  }, []);

  const done = useCallback((id: number) => setEffects((list) => list.filter((f) => f.id !== id)), []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {effects.map((f) => (f.kind === "drum" ? <DrumBeat key={f.id} fx={f} onDone={done} /> : <BallKick key={f.id} fx={f} onDone={done} />))}
    </div>
  );
}

function DrumBeat({ fx, onDone }: { fx: Fx; onDone: (id: number) => void }) {
  const skin = useRef<HTMLSpanElement>(null);
  const ring1 = useRef<HTMLSpanElement>(null);
  const ring2 = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const wave = (el: HTMLSpanElement | null, delay: number, to: number) =>
      el?.animate(
        [
          { transform: "translate(-50%, -50%) scale(0.15)", opacity: 0.95, easing: EASE },
          { transform: `translate(-50%, -50%) scale(${to * 0.8})`, opacity: 0.7, offset: 0.45, easing: "ease-out" },
          { transform: `translate(-50%, -50%) scale(${to})`, opacity: 0 },
        ],
        { duration: 750, delay, fill: "both" },
      );
    skin.current?.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.4)", opacity: 0.45 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 0 },
      ],
      { duration: 280, easing: "ease-out", fill: "both" },
    );
    wave(ring1.current, 0, 1);
    // The second, softer beat: "ba-dum".
    const last = wave(ring2.current, 130, 1.35);
    if (last) last.onfinish = () => onDone(fx.id);
    else onDone(fx.id);
  }, [fx.id, onDone]);
  const at = { left: fx.x, top: fx.y };
  return (
    <>
      <span ref={skin} className="absolute size-16 rounded-full bg-orange-bright" style={at} />
      <span ref={ring1} className="absolute size-36 rounded-full border-[3px] border-orange-bright" style={at} />
      <span ref={ring2} className="absolute size-36 rounded-full border-2 border-gold" style={at} />
    </>
  );
}

function BallKick({ fx, onDone }: { fx: Fx; onDone: (id: number) => void }) {
  const ball = useRef<HTMLSpanElement>(null);
  const puff = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    // A parabola: up and across, then dropping away while it spins.
    const reach = Math.min(window.innerWidth * 0.32, 260) * fx.dir;
    const height = 150;
    const frames: Keyframe[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = reach * t;
      const y = -height * 4 * t * (1 - t) + 120 * t * t;
      frames.push({
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${fx.dir * 620 * t}deg) scale(${0.7 + 0.3 * Math.min(1, t * 4)})`,
        opacity: t > 0.8 ? (1 - t) * 5 : 1,
      });
    }
    puff.current?.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.3)", opacity: 0.7 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 0 },
      ],
      { duration: 320, easing: "ease-out", fill: "both" },
    );
    const anim = ball.current?.animate(frames, { duration: 760, easing: "cubic-bezier(0.25, 0.6, 0.45, 1)", fill: "both" });
    if (anim) anim.onfinish = () => onDone(fx.id);
    else onDone(fx.id);
  }, [fx.dir, fx.id, onDone]);
  const at = { left: fx.x, top: fx.y };
  return (
    <>
      <span ref={puff} className="absolute size-14 rounded-full border-2 border-white/80 bg-white/30" style={at} />
      <span
        ref={ball}
        className="absolute inline-flex size-11 items-center justify-center rounded-full bg-white text-green-950 shadow-[0_6px_14px_-4px_rgb(2_58_29/0.55)]"
        style={at}
      >
        <IconBallFootball size={42} stroke={1.5} />
      </span>
    </>
  );
}
