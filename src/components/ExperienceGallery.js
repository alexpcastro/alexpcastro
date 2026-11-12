import { useEffect, useRef, useState } from "react";
import CareerScene from "./CareerScene";
import OrganicFrame from "./OrganicFrame";
import { career } from "../data/career";
import useMotionPreference from "./useMotionPreference";
import useMobileCardMotion from "./useMobileCardMotion";
import useCardTilt from "./useCardTilt";
import "./ExperienceGallery.css";

const labels = { deloitte: "Deloitte", fordham: "Fordham", columbia: "Columbia", brokr: "BROKR", "pure-digital": "Pure Digital", apc: "APC" };

export default function ExperienceGallery() {
  const [selected, setSelected] = useState(0);
  const [motionPaused, setMotionPaused] = useState(false);
  const allowMotion = useMotionPreference();
  const [inView, setInView] = useState(() => typeof IntersectionObserver === "undefined");
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState !== "hidden");
  const running = allowMotion && !motionPaused && inView && pageVisible;
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 760px)").matches);
  const imageRefs = useRef([]);
  const galleryRef = useRef(null);
  const trackRef = useRef(null);
  const cardRefs = useRef([]);
  const tilt = useCardTilt({ enabled: running && !isMobile, cardRefs });
  const { prepare: prepareMobileSwap, departing } = useMobileCardMotion({ mobile: isMobile, enabled: running, selected, trackRef, cardRefs });
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const update = event => setIsMobile(event.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 }) : null;
    if (observer) observer.observe(galleryRef.current);
    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
      observer?.disconnect();
    };
  }, []);
  const hoverTimer = useRef(null);
  const keyboardMode = useRef(false);
  const clearHover = () => window.clearTimeout(hoverTimer.current);
  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  const select = index => {
    clearHover();
    if (index === selected) return;
    prepareMobileSwap();
    setSelected(index);
  };
  const handleKey = (event, index) => {
    keyboardMode.current = true;
    const destinations = { ArrowRight: (index + 1) % career.length, ArrowLeft: (index - 1 + career.length) % career.length, Home: 0, End: career.length - 1,
      ...(isMobile ? { ArrowDown: (index + 1) % career.length, ArrowUp: (index - 1 + career.length) % career.length } : {}) };
    if (!(event.key in destinations)) return;
    event.preventDefault();
    const next = destinations[event.key];
    select(next);
    imageRefs.current[next]?.focus({ preventScroll: true });
  };
  const preview = (event, index) => {
    if (isMobile || event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const focused = document.activeElement;
    // Do not replace the reading surface underneath a keyboard user or a
    // focused project link. Pointer selection remains available deliberately.
    if (galleryRef.current?.contains(focused) && (keyboardMode.current || focused.closest(".portfolio-story"))) return;
    clearHover();
    hoverTimer.current = window.setTimeout(() => setSelected(index), 120);
  };

  return <div className="experience-gallery" ref={galleryRef} data-motion={running ? "running" : "paused"} onPointerDown={() => { keyboardMode.current = false; }} onKeyDown={() => { keyboardMode.current = true; tilt.reset(); }}>
    <div className="experience-heading-row"><h2 id="work-heading">Experience</h2></div>
    <p id="gallery-help" className="visually-hidden">Select an image to open its chapter. Use arrow keys to move between images. Home selects the first and End selects the last.{allowMotion && " Activate the open artwork to pause or resume animation."}</p>
    <div className="gallery-track" ref={trackRef} onPointerLeave={clearHover}>
      {career.map((item, index) => {
        const active = selected === index;
        const leaving = isMobile && departing === index;
        // Existing company text sometimes already contains the project name.
        // Keep one linked label, followed only by the remaining organization.
        const companyRemainder = item.company === item.linkLabel ? ""
          : item.company.startsWith(`${item.linkLabel}, `) ? item.company.slice(item.linkLabel.length + 2) : item.company;
        const pictureProps = {
          type: "button", id: `image-${item.id}`, "aria-expanded": active, "aria-controls": `story-${item.id}`,
          "aria-label": `${labels[item.id]}: ${active ? `current chapter${allowMotion ? `. ${motionPaused ? "Resume" : "Pause"} animation` : ""}` : "open chapter"}`,
          "aria-pressed": active && allowMotion ? motionPaused : undefined,
          title: active && allowMotion ? `${motionPaused ? "Resume" : "Pause"} animation` : undefined,
          "aria-describedby": "gallery-help", tabIndex: active ? 0 : -1,
          ref: node => { imageRefs.current[index] = node; },
          onFocus: event => { keyboardMode.current = event.currentTarget.matches(":focus-visible"); },
          onClick: () => {
            clearHover();
            if (active && allowMotion) setMotionPaused(value => !value);
            else select(index);
          },
          onKeyDown: event => handleKey(event, index),
        };
        return <article key={item.id} id={`experience-${item.id}`} ref={node => { cardRefs.current[index] = node; }}
          className={`portfolio-entry experience-card${active ? " is-active" : ""}${leaving ? " is-departing" : ""}`}
          aria-labelledby={`image-${item.id}`}
          onPointerEnter={event => { preview(event, index); tilt.move(event, index); }}
          onPointerMove={event => tilt.move(event, index)}
          onPointerLeave={() => { clearHover(); tilt.leave(index); }} onPointerCancel={() => tilt.leave(index)}>
          <div className="experience-card-surface">
          <button className="gallery-picture" {...pictureProps}>
            <div className="gallery-art-window"><div className={`portfolio-art portfolio-art--${item.id}`}><OrganicFrame kind={item.id} /><CareerScene kind={item.id} active={active || leaving} allowMotion={allowMotion} motionPaused={motionPaused || !active} /></div></div>
            <span className="gallery-picture-caption" aria-hidden="true"><span>{String(index + 1).padStart(2, "0")}</span>{labels[item.id]}</span>
          </button>
          <div id={`story-${item.id}`} className="portfolio-story experience-story" hidden={!active} aria-hidden={!active} inert={!active}>
            <p className="portfolio-date">{item.date}</p>
            <h3 id={`${item.id}-title`}>{item.role}</h3>
            <p className="portfolio-company">{item.link ? <>
              <a className="portfolio-work-link" href={item.link} target="_blank" rel="noopener noreferrer" aria-label={`${item.linkLabel} (opens in a new tab)`}>{item.linkLabel}</a>
              {companyRemainder && `, ${companyRemainder}`}
            </> : item.company}</p>
            <p className="portfolio-summary">{item.summary}</p>
          </div>
          </div>
        </article>;
      })}
    </div>
  </div>;
}
