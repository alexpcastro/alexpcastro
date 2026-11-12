import { useCallback, useLayoutEffect, useRef, useState } from "react";

const DURATION = 720;
const EASING = "cubic-bezier(.22,.76,.2,1)";

/** A vertical version of the desktop accordion. Real heights expand in normal
 * flow, so every card keeps its chronological position and text is never scaled.
 * Each open height fits its own story, and the list reflows smoothly with it. */
export default function useMobileCardMotion({ mobile, enabled, selected, trackRef, cardRefs }) {
  const [departing, setDeparting] = useState(null);
  const snapshot = useRef(null);
  const animations = useRef([]);
  const finishTimer = useRef(null);
  const run = useRef(0);

  const stop = useCallback(() => {
    run.current += 1;
    window.clearTimeout(finishTimer.current);
    animations.current.forEach(animation => animation.cancel());
    animations.current = [];
    trackRef.current?.removeAttribute("data-rearranging");
  }, [trackRef]);

  const prepare = () => {
    if (!mobile || !enabled || !cardRefs.current.every(card => typeof card?.animate === "function")) return;
    // Read the currently painted positions before canceling an interrupted swap.
    snapshot.current = {
      from: selected,
      boxes: cardRefs.current.map(card => card.getBoundingClientRect()),
      pictures: cardRefs.current.map(card => card.querySelector(".gallery-picture").getBoundingClientRect().height),
      artwork: cardRefs.current.map(card => getComputedStyle(card.querySelector(".gallery-art-window")).transform || "none"),
    };
    stop();
    setDeparting(selected);
  };

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || !mobile) {
      stop();
      snapshot.current = null;
      setDeparting(null);
      track?.style.removeProperty("--mobile-art-height");
      cardRefs.current.forEach(card => card?.style.removeProperty("--mobile-feature-height"));
      return undefined;
    }
    let lastWidth = track.clientWidth;
    const measure = () => {
      const cards = cardRefs.current.filter(Boolean);
      const art = cards[0]?.querySelector(".gallery-art-window");
      if (!art) return;
      const artHeight = Math.ceil(art.getBoundingClientRect().height);
      // jsdom has no layout. CSS also supplies a safe first-render fallback.
      if (artHeight > 0) {
        track.style.setProperty("--mobile-art-height", `${artHeight}px`);
        cards.forEach(card => {
          const storyHeight = card.querySelector(".experience-story").scrollHeight;
          if (storyHeight > 0) card.style.setProperty("--mobile-feature-height", `${artHeight + storyHeight}px`);
        });
      }
    };
    const resize = () => {
      if (Math.abs(track.clientWidth - lastWidth) > 1) {
        stop(); snapshot.current = null; setDeparting(null);
        lastWidth = track.clientWidth;
      }
      measure();
    };
    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(track);
    cardRefs.current.forEach(card => observer?.observe(card.querySelector(".experience-story")));
    window.addEventListener("resize", resize);
    const beforePrint = () => { stop(); snapshot.current = null; setDeparting(null); };
    window.addEventListener("beforeprint", beforePrint);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("beforeprint", beforePrint);
    };
  }, [mobile, cardRefs, trackRef, stop]);

  useLayoutEffect(() => {
    const before = snapshot.current;
    snapshot.current = null;
    if (!mobile || !enabled) {
      stop(); setDeparting(null); return;
    }
    if (!before || before.from === selected) return;
    const track = trackRef.current;
    const token = run.current;
    track.setAttribute("data-rearranging", "true");
    const add = (element, frames, options) => {
      const animation = element.animate(frames, { duration: DURATION, easing: EASING, ...options });
      animations.current.push(animation);
      return animation;
    };
    cardRefs.current.forEach((card, index) => {
      const first = before.boxes[index];
      const last = card.getBoundingClientRect();
      if (!first || !last.width) return;
      add(card, [{ height: `${first.height}px` }, { height: `${last.height}px` }]);
      // Let the image unfold from its centered horizontal crop without resizing
      // or replacing the video. Interrupted taps start from the painted frame.
      if (index === selected || index === before.from) {
        const picture = card.querySelector(".gallery-picture");
        add(picture, [{ height: `${before.pictures[index]}px` }, { height: `${picture.getBoundingClientRect().height}px` }]);
        const art = card.querySelector(".gallery-art-window");
        add(art, [{ transform: before.artwork[index] }, { transform: getComputedStyle(art).transform || "none" }]);
      }
    });
    const incoming = cardRefs.current[selected];
    const outgoing = cardRefs.current[before.from];
    add(incoming.querySelector(".experience-story"), [{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: 380, fill: "both" });
    add(outgoing.querySelector(".experience-story"), [{ opacity: 1 }, { opacity: 0 }], { duration: 130, fill: "both" });
    add(incoming.querySelector(".gallery-picture-caption"), [{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: "both" });
    add(outgoing.querySelector(".gallery-picture-caption"), [{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 380, fill: "both" });
    finishTimer.current = window.setTimeout(() => {
      if (token !== run.current) return;
      stop(); setDeparting(null);
    }, DURATION + 20);
  }, [selected, mobile, enabled, cardRefs, trackRef, stop]);

  useLayoutEffect(() => () => stop(), [stop]);
  return { prepare, departing };
}
