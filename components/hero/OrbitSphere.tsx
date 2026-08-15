"use client";

import { Globe } from "@/components/hero/Globe";
import { OrbitCard } from "@/components/hero/OrbitCard";
import { track } from "@/lib/analytics";
import type { Episode } from "@/lib/episodes";
import { useCallback, useEffect, useRef } from "react";

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
/**
 * Pointer travel, in px, before a press counts as a drag rather than a click.
 *
 * This threshold is what makes the cards clickable at all. Capturing the pointer
 * on pointerdown — which is what this used to do — retargets both pointerdown and
 * pointerup to the belt, so the browser computes their common ancestor as the
 * belt and fires `click` there. The <a> underneath never activates: the cards
 * looked like links, had the right href, hit-tested correctly, and did nothing.
 *
 * So capture is deferred until the pointer has actually moved this far. Below it
 * the press is left completely alone and the anchor behaves like any other link.
 */
const DRAG_THRESHOLD = 5;
/**
 * Marks the belt while a drag-generated click is still pending.
 *
 * It exists because the swallow has TWO audiences and they cannot see each
 * other's state. React's onClickCapture below stops the anchor navigating, but
 * AnalyticsDelegate listens natively on `document`, so a swallowed click was
 * still being recorded as an episode open — calling stopPropagation does not
 * reach a listener bound on document, and which of the two runs first depends on
 * registration order, which is not something to build on.
 *
 * An attribute on the element sidesteps the ordering entirely: whichever handler
 * runs, it can ask the DOM. See the note on disarm() for when it clears.
 */
const SWALLOW_ATTR = "data-swallow-click";

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * The hero orbit. Every episode on one belt around an implied sphere.
 *
 *                    far side (dim, behind the wordmark)
 *              ·  ·  ·  ·  ·  ·  ·  ·  ·  ·
 *          ·                                  ·
 *   θ=270 ·            [ sphere ]              · θ=90
 *          ·                                  ·
 *              ▓  ▓  ▓  [θ=0]  ▓  ▓  ▓
 *                    near side (full opacity)
 *
 * The browser does the 3D. Each card is `rotateY(i·step) translateZ(R)` inside a
 * `preserve-3d` parent, so perspective, position and paint order all fall out of
 * the compositor — including back-to-front sorting, which we never compute.
 *
 * Rotating the whole belt is one number: `--spin`. Depth cues come from CSS
 * `cos()` reading that same variable, so there is no per-frame JavaScript walking
 * the elements. The only thing JS does per frame is write one custom property.
 *
 * No `filter: blur()` on the far side (eng review D4). It is the most expensive
 * composite operation there is and the back cards sit near 10% opacity, where it
 * buys almost nothing.
 */
export function OrbitSphere({ episodes }: { episodes: Episode[] }) {
  const beltRef = useRef<HTMLUListElement>(null);
  const spin = useRef(0);
  const velocity = useRef(0);
  /** Pointer is down. Not yet a drag — see DRAG_THRESHOLD. */
  const pressing = useRef(false);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);
  /** Set when a drag ends, so the click it generates does not open a card. */
  const swallowClick = useRef(false);
  const target = useRef<number | null>(null);
  const frame = useRef<number | null>(null);

  /**
   * Degrees between cards, derived from what actually came back.
   *
   * It used to be `360 / ORBIT.COUNT` — a flat 12 — which is right whenever the
   * feed and the fallback both hold at least twelve, and silently wrong the
   * moment either does not: eight episodes would ride a belt spaced for twelve,
   * leaving a third of it empty and arrow keys that step onto nothing.
   */
  const step = 360 / Math.max(episodes.length, 1);

  // Fired once per visit. Whether anyone touches the sphere at all is the
  // question; every individual drag frame is noise.
  const reported = useRef(false);
  const reportOnce = (how: "drag" | "keyboard") => {
    if (reported.current) return;
    reported.current = true;
    track("orbit_interact", { how });
  };

  // Writes --nudge, never --spin. --spin is animated by CSS (the continuous
  // drift); --nudge is the user's offset on top of it. The belt adds them.
  const write = useCallback(() => {
    beltRef.current?.style.setProperty("--nudge", `${spin.current}deg`);
  }, []);

  const arm = useCallback(() => {
    swallowClick.current = true;
    beltRef.current?.setAttribute(SWALLOW_ATTR, "true");
  }, []);

  /**
   * Cleared on the next deliberate INPUT — a press or a keystroke — rather than
   * on the click it was armed for.
   *
   * Two bugs live in that choice. Clearing it on the click meant a gesture that
   * produces no click never cleared it, and the flag was then spent on the next
   * genuine one: drag past the threshold, then move vertically so `touch-action:
   * pan-y` hands the gesture to the scroller and cancels the pointer, and the
   * following tap on an episode did nothing. Clearing it inside onClickCapture
   * would also race AnalyticsDelegate, which is the whole reason SWALLOW_ATTR
   * exists. Waiting for the next input answers both, and covers the keyboard
   * route too — Enter on a focused card fires keydown before click.
   */
  const disarm = useCallback(() => {
    swallowClick.current = false;
    beltRef.current?.removeAttribute(SWALLOW_ATTR);
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
          target.current = Math.round(spin.current / step) * step;
        }
      }
      write();
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, [step, stop, write]);

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

  // Pointer drag, in two stages: a press arms it, and only real movement promotes
  // it to a drag. See DRAG_THRESHOLD — doing the promotion on pointerdown is what
  // stopped the cards being clickable.
  const onPointerDown = (e: React.PointerEvent) => {
    stop();
    disarm();
    pressing.current = true;
    dragging.current = false;
    velocity.current = 0;
    target.current = null;
    lastX.current = e.clientX;
    startX.current = e.clientX;
    startY.current = e.clientY;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pressing.current) return;

    if (!dragging.current) {
      const travelled = Math.hypot(
        e.clientX - startX.current,
        e.clientY - startY.current,
      );
      if (travelled < DRAG_THRESHOLD) return;
      // Now it is a drag. Capture from here so a fast flick that leaves the
      // element still completes rather than sticking half-rotated.
      dragging.current = true;
      reportOnce("drag");
      beltRef.current?.setAttribute("data-dragging", "true");
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    const delta = dx * DRAG_SENSITIVITY;
    spin.current += delta;
    // Smoothed across moves, then clamped. Reading velocity straight off the last
    // delta makes the coast hostage to one frame's jitter.
    velocity.current = clamp(
      velocity.current * 0.7 + delta * 0.3,
      -MAX_VELOCITY,
      MAX_VELOCITY,
    );
    write();
  };

  const endPress = (coast: boolean) => {
    if (!pressing.current) return;
    pressing.current = false;
    if (!dragging.current) return; // a plain click: leave it entirely alone

    dragging.current = false;
    // Releasing a flick over a card must not also open that card, so the click
    // that follows gets swallowed — see disarm() for when the arming clears.
    arm();
    beltRef.current?.removeAttribute("data-dragging");
    if (!coast || reduced()) {
      goTo(Math.round(spin.current / step) * step);
      return;
    }
    run();
  };

  const onPointerUp = () => endPress(true);
  /**
   * A cancelled pointer is a drag the browser took away — the page started
   * scrolling, or the gesture was interrupted. Snap to the nearest card rather
   * than coasting on a velocity the user never meant to hand over.
   */
  const onPointerCancel = () => endPress(false);

  // Capture phase, so it runs before the anchor's own default action.
  const onClickCapture = (e: React.MouseEvent) => {
    if (!swallowClick.current) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Any keystroke counts as the next deliberate input, so Enter on a focused
    // card is never eaten by a swallow left over from an earlier drag.
    disarm();
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    reportOnce("keyboard");
    const base = target.current ?? spin.current;
    const snapped = Math.round(base / step) * step;
    goTo(snapped + (e.key === "ArrowLeft" ? step : -step));
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
      <Globe />
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
        onPointerCancel={onPointerCancel}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
      >
        {episodes.map((episode, i) => (
          <li
            key={episode.id}
            className="mm-orbit-slot"
            style={{ "--a": `${i * step}deg` } as React.CSSProperties}
            // Tabbing to a card that is round the back is disorienting, so bring
            // it to the front. Keyboard order then matches what is on screen.
            onFocus={() => goTo(-i * step)}
          >
            <OrbitCard episode={episode} priority={i < 3} />
          </li>
        ))}
      </ul>
      <div className="mm-orbit-core" aria-hidden="true">
        {/* Decorative: the wordmark above already names the show, so announcing
            the mark again would just repeat it. */}
        <img src="/brand/mm-logo.png" alt="" width={522} height={640} />
      </div>
    </div>
  );
}
