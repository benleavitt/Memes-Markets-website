"use client";

import { OrbitCard } from "@/components/hero/OrbitCard";
import { track } from "@/lib/analytics";
import type { Episode } from "@/lib/episodes";
import { ORBIT } from "@/lib/orbit";
import { useCallback, useEffect, useRef } from "react";

const STEP = 360 / ORBIT.COUNT;
/** Pixels of drag per degree of rotation. Tuned so a full flick is about a third of a turn. */
const DRAG_SENSITIVITY = 0.35;
/** Page-scroll pixels per degree, while the hero is on screen. */
const SCROLL_SENSITIVITY = 0.09;
const FRICTION = 0.94;
const SNAP_EASE = 0.16;
/**
 * Degrees per frame ceiling on a flick. Total coast is velocity / (1 - FRICTION),
 * so 8 lands at roughly 133 degrees — about four and a half cards. Without the
 * clamp a single large pointer delta (a hard flick, or one synthetic event)
 * launches the belt through several complete turns.
 */
const MAX_VELOCITY = 8;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * The hero orbit. Twelve episode cards on one belt around an implied sphere.
 *
 *                    far side (dim, behind the wordmark)
 *              ·  ·  ·  ·  ·  ·  ·  ·  ·  ·
 *          ·                                  ·
 *   θ=270 ·            [ sphere ]              · θ=90
 *          ·                                  ·
 *              ▓  ▓  ▓  [θ=0]  ▓  ▓  ▓
 *                    near side (full opacity)
 *
 * The browser does the 3D. Each card is `rotateY(i·30deg) translateZ(R)` inside a
 * `preserve-3d` parent, so perspective, position and paint order all fall out of
 * the compositor — including back-to-front sorting, which we never compute.
 *
 * Rotating the whole belt is one number: `--spin`. Depth cues come from CSS
 * `cos()` reading that same variable, so there is no per-frame JavaScript walking
 * twelve elements. The only thing JS does per frame is write one custom property.
 *
 * No `filter: blur()` on the far side (eng review D4). It is the most expensive
 * composite operation there is and the back cards sit near 10% opacity, where it
 * buys almost nothing.
 */
export function OrbitSphere({ episodes }: { episodes: Episode[] }) {
  const beltRef = useRef<HTMLUListElement>(null);
  const spin = useRef(0);
  const velocity = useRef(0);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const target = useRef<number | null>(null);
  const frame = useRef<number | null>(null);
  // Fired once per visit. Whether anyone touches the sphere at all is the
  // question; every individual drag frame is noise.
  const reported = useRef(false);
  const reportOnce = (how: "drag" | "keyboard") => {
    if (reported.current) return;
    reported.current = true;
    track("orbit_interact", { how });
  };

  const write = useCallback(() => {
    beltRef.current?.style.setProperty("--spin", `${spin.current}deg`);
  }, []);

  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);

  /** Momentum, then ease onto the nearest card. Skipped entirely under reduced motion. */
  const run = useCallback(() => {
    stop();
    const tick = () => {
      if (target.current !== null) {
        const delta = target.current - spin.current;
        if (Math.abs(delta) < 0.05) {
          spin.current = target.current;
          target.current = null;
          write();
          frame.current = null;
          return;
        }
        spin.current += delta * SNAP_EASE;
      } else {
        spin.current += velocity.current;
        velocity.current *= FRICTION;
        if (Math.abs(velocity.current) < 0.05) {
          velocity.current = 0;
          target.current = Math.round(spin.current / STEP) * STEP;
        }
      }
      write();
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, [stop, write]);

  const reduced = useCallback(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const goTo = useCallback(
    (degrees: number) => {
      if (reduced()) {
        stop();
        spin.current = degrees;
        target.current = null;
        velocity.current = 0;
        write();
        return;
      }
      velocity.current = 0;
      target.current = degrees;
      run();
    },
    [reduced, run, stop, write],
  );

  // Pointer drag. Capture on the belt so a fast flick that leaves the element
  // still completes rather than sticking half-rotated.
  const onPointerDown = (e: React.PointerEvent) => {
    stop();
    reportOnce("drag");
    dragging.current = true;
    velocity.current = 0;
    target.current = null;
    lastX.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    const step = dx * DRAG_SENSITIVITY;
    spin.current += step;
    // Smoothed across moves, then clamped. Reading velocity straight off the last
    // delta makes the coast hostage to one frame's jitter.
    velocity.current = clamp(
      velocity.current * 0.7 + step * 0.3,
      -MAX_VELOCITY,
      MAX_VELOCITY,
    );
    write();
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (reduced()) {
      goTo(Math.round(spin.current / STEP) * STEP);
      return;
    }
    run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    reportOnce("keyboard");
    const base = target.current ?? spin.current;
    const snapped = Math.round(base / STEP) * STEP;
    goTo(snapped + (e.key === "ArrowLeft" ? STEP : -STEP));
  };

  // Page scroll turns the belt while the hero is on screen. Passive, and it never
  // calls preventDefault — hijacking the wheel to drive an animation is hostile,
  // and it breaks the page for anyone who just wants to read further down.
  useEffect(() => {
    if (reduced()) return;
    const el = beltRef.current;
    if (!el) return;
    let visible = true;
    let lastY = window.scrollY;

    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
    });
    io.observe(el);

    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      if (!visible || dragging.current || target.current !== null) return;
      spin.current += dy * SCROLL_SENSITIVITY;
      write();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, [reduced, write]);

  useEffect(() => {
    write();
    return stop;
  }, [write, stop]);

  return (
    <div className="mm-orbit-stage">
      {/* The belt is not itself focusable. The cards are links, so they are already
          in the tab order; adding a tabIndex on the container would just create a
          second stop that lands on nothing. Arrow keys bubble up from whichever
          card has focus, which is also what makes the hint below true. */}
      <ul
        ref={beltRef}
        className="mm-orbit-belt"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {episodes.map((episode, i) => (
          <li
            key={episode.id}
            className="mm-orbit-slot"
            style={{ "--a": `${i * STEP}deg` } as React.CSSProperties}
            // Tabbing to a card that is round the back is disorienting, so bring
            // it to the front. Keyboard order then matches what is on screen.
            onFocus={() => goTo(-i * STEP)}
          >
            <OrbitCard episode={episode} priority={i < 3} />
          </li>
        ))}
      </ul>
    </div>
  );
}
