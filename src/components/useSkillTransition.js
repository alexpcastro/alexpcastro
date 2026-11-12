import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const DURATION = 760;
const EASING = "cubic-bezier(.22, 1, .36, 1)";
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const viewport = () => ({ left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight });

function visibleArea(rect, clip) {
  return Math.max(0, Math.min(rect.right, clip.right) - Math.max(rect.left, clip.left))
    * Math.max(0, Math.min(rect.bottom, clip.bottom) - Math.max(rect.top, clip.top));
}

// A river skill occurs twice. Pick its visible copy, or the nearest copy at a
// bank, rather than animating a duplicate across thousands of offscreen pixels.
function capture(section, catalog) {
  const bounds = viewport();
  const field = section.querySelector(".skills-field");
  const fieldRect = field?.getBoundingClientRect();
  const clip = !catalog && fieldRect ? {
    left: Math.max(bounds.left, fieldRect.left), right: Math.min(bounds.right, fieldRect.right),
    top: Math.max(bounds.top, fieldRect.top), bottom: Math.min(bounds.bottom, fieldRect.bottom),
  } : bounds;
  const records = new Map();
  section.querySelectorAll(catalog ? ".skills-catalog .skill-chip" : ".skills-field .skill-chip").forEach(node => {
    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const area = visibleArea(rect, clip);
    const distance = Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2);
    const score = area > 0 ? area : -distance;
    const label = node.textContent;
    if (records.has(label) && records.get(label).score >= score) return;
    records.set(label, {
      node, rect, score, width: node.offsetWidth || rect.width, height: node.offsetHeight || rect.height,
      opacity: area > 0 ? 1 : 0,
      angle: catalog ? 0 : parseFloat(node.closest(".skill-drift")?.style.getPropertyValue("--angle")) || 0,
    });
  });
  return records;
}

function boundedPosition(record) {
  const { rect } = record;
  return {
    x: clamp(rect.left + rect.width / 2, -rect.width / 2, window.innerWidth + rect.width / 2),
    y: clamp(rect.top + rect.height / 2, -rect.height / 2, window.innerHeight + rect.height / 2),
  };
}

const copiedStyles = ["font", "color", "background", "border", "borderRadius", "padding", "gap", "whiteSpace", "overflowWrap", "alignItems", "letterSpacing"];

// Button-triggered FLIP bridge: the live river is untouched between switches.
// All reads precede writes. Temporary, aria-hidden copies animate on the
// compositor while the real, accessible catalog occupies its final layout.
export default function useSkillTransition(sectionRef, readable, allowMotion) {
  const pending = useRef(null);
  const active = useRef(null);
  const [transitioning, setTransitioning] = useState(false);

  const dispose = useCallback((updateState = true) => {
    const job = active.current;
    active.current = null;
    if (job) {
      clearTimeout(job.timer);
      job.animations.forEach(animation => animation.cancel());
      job.layer.remove();
      delete job.section.dataset.skillTransition;
      job.removeListeners();
    }
    if (updateState) setTransitioning(false);
  }, []);

  const changeView = useCallback(change => {
    const section = sectionRef.current;
    if (!allowMotion || !section || !Element.prototype.animate || document.hidden) {
      pending.current = null;
      dispose();
      change();
      return;
    }
    let from = capture(section, readable);
    // A quick reversal starts from the chips' actual mid-flight positions.
    if (active.current) {
      from = new Map(active.current.chips.map(({ label, node }) => [label, {
        node, rect: node.getBoundingClientRect(),
        width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height, angle: 0,
        opacity: Number(getComputedStyle(node).opacity),
      }]));
    }
    const height = section.getBoundingClientRect().height;
    dispose(false);
    pending.current = { from, height };
    setTransitioning(true);
    change();
  }, [allowMotion, dispose, readable, sectionRef]);

  useLayoutEffect(() => {
    if (!allowMotion) {
      pending.current = null;
      dispose();
      return;
    }
    const snapshot = pending.current;
    pending.current = null;
    const section = sectionRef.current;
    if (!snapshot || !section) return;
    const to = capture(section, readable);
    const nextHeight = section.getBoundingClientRect().height;
    const pairs = [...to].flatMap(([label, target]) => {
      const source = snapshot.from.get(label);
      if (!source || (!source.opacity && !target.opacity)) return [];
      const style = getComputedStyle(target.node);
      return [{ label, source, target, styles: Object.fromEntries(copiedStyles.map(key => [key, style[key]])) }];
    });
    if (!pairs.length) { setTransitioning(false); return; }

    const layer = document.createElement("div");
    layer.className = "skills-transition-layer";
    layer.setAttribute("aria-hidden", "true");
    const job = { section, layer, chips: [], animations: [], removeListeners: () => {} };
    active.current = job;
    const animate = (node, frames, options = {}) => {
      const animation = node.animate(frames, { duration: DURATION, easing: EASING, fill: "both", ...options });
      job.animations.push(animation);
      return animation;
    };
    pairs.forEach(({ label, source, target, styles }, index) => {
      const chip = target.node.cloneNode(true);
      chip.classList.add("skills-transition-chip");
      if (readable) chip.classList.add("skills-transition-chip--catalog");
      Object.assign(chip.style, styles, {
        width: `${target.width}px`, height: `${target.height}px`,
        maxWidth: "none", margin: "0", boxSizing: "border-box", animation: "none",
      });
      chip.removeAttribute("id");
      layer.appendChild(chip);
      job.chips.push({ label, node: chip });
      const start = boundedPosition(source), end = boundedPosition(target);
      const first = `translate3d(${start.x - target.width / 2}px, ${start.y - target.height / 2}px, 0) rotate(${source.angle}deg) scale(${source.width / target.width}, ${source.height / target.height})`;
      const last = `translate3d(${end.x - target.width / 2}px, ${end.y - target.height / 2}px, 0) rotate(${target.angle}deg) scale(1, 1)`;
      animate(chip, [
        { transform: first, opacity: source.opacity },
        { transform: last, opacity: target.opacity },
      ], { delay: Math.min(index * 3, 80) });
    });
    document.body.appendChild(layer);
    section.dataset.skillTransition = "active";
    animate(section, [{ height: `${snapshot.height}px` }, { height: `${nextHeight}px` }]);
    if (readable) section.querySelectorAll(".skills-category h3").forEach(heading => {
      animate(heading, [{ opacity: 0 }, { opacity: 1 }], { duration: 320, delay: 160 });
    });
    const finish = () => { if (active.current === job) dispose(); };
    const hide = () => { if (document.hidden) finish(); };
    window.addEventListener("resize", finish);
    window.addEventListener("scroll", finish, { passive: true });
    document.addEventListener("visibilitychange", hide);
    job.removeListeners = () => {
      window.removeEventListener("resize", finish);
      window.removeEventListener("scroll", finish);
      document.removeEventListener("visibilitychange", hide);
    };
    // The timeout is a bounded fallback for older Web Animations implementations.
    job.timer = setTimeout(finish, DURATION + 160);
    if (job.animations.every(animation => animation.finished?.then)) {
      Promise.all(job.animations.map(animation => animation.finished)).then(finish, () => {});
    }
  }, [allowMotion, dispose, readable, sectionRef]);

  useEffect(() => () => { pending.current = null; dispose(false); }, [dispose]);
  return { changeView, transitioning };
}
