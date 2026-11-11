import { useEffect, useRef, useState } from "react";
import CareerScene from "./CareerScene";
import OrganicFrame from "./OrganicFrame";
import { career } from "../data/career";
import { careerVideos } from "../data/careerVideos";
import useMotionPreference from "./useMotionPreference";
import "./ExperienceGallery.css";

const labels = { deloitte: "Deloitte", fordham: "Fordham", columbia: "Columbia", brokr: "BROKR", "pure-digital": "Pure Digital", apc: "APC" };

export default function ExperienceGallery() {
  const [selected, setSelected] = useState(0);
  const [motionPaused, setMotionPaused] = useState(false);
  const allowMotion = useMotionPreference();
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 760px)").matches);
  const imageRefs = useRef([]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const update = event => setIsMobile(event.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const galleryRef = useRef(null);
  const hoverTimer = useRef(null);
  const keyboardMode = useRef(false);
  const clearHover = () => window.clearTimeout(hoverTimer.current);
  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  const select = index => {
    clearHover();
    setSelected(index);
  };
  const handleKey = (event, index) => {
    keyboardMode.current = true;
    const destinations = { ArrowRight: (index + 1) % career.length, ArrowLeft: (index - 1 + career.length) % career.length, Home: 0, End: career.length - 1 };
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

  return <div className="experience-gallery" ref={galleryRef} onPointerDown={() => { keyboardMode.current = false; }} onKeyDown={() => { keyboardMode.current = true; }}>
    <h2 id="work-heading" className="visually-hidden">Work and experience</h2>
    <p id="gallery-help" className="visually-hidden">Select an image to open its chapter. Use arrow keys to move between images. Home selects the first and End selects the last.</p>
    <div className="gallery-track" onPointerLeave={clearHover}>
      {career.map((item, index) => {
        const active = selected === index;
        const pictureProps = {
          type: "button", id: `image-${item.id}`, "aria-expanded": active, "aria-controls": `story-${item.id}`,
          "aria-label": `${labels[item.id]}: ${active ? "current chapter" : "open chapter"}`,
          "aria-describedby": "gallery-help", tabIndex: isMobile || active ? 0 : -1,
          ref: node => { imageRefs.current[index] = node; },
          onFocus: event => { keyboardMode.current = event.currentTarget.matches(":focus-visible"); },
          onClick: () => select(index),
          onKeyDown: event => {
            if (!isMobile) { handleKey(event, index); return; }
            const next = { ArrowDown: (index + 1) % career.length, ArrowUp: (index - 1 + career.length) % career.length, Home: 0, End: career.length - 1 }[event.key];
            if (next !== undefined) { event.preventDefault(); imageRefs.current[next]?.focus(); }
          },
        };
        return <article key={item.id} id={`experience-${item.id}`} className={`portfolio-entry experience-card${active ? " is-active" : ""}`} aria-labelledby={`image-${item.id}`}
          onPointerEnter={event => preview(event, index)} onPointerLeave={clearHover}>
          <button className="gallery-picture" {...pictureProps}>
            <div className="gallery-art-window"><div className={`portfolio-art portfolio-art--${item.id}`}><OrganicFrame kind={item.id} /><CareerScene kind={item.id} active={active} allowMotion={allowMotion} motionPaused={motionPaused} /></div></div>
            <span className="gallery-picture-caption" aria-hidden="true"><span>{String(index + 1).padStart(2, "0")}</span>{labels[item.id]}</span>
          </button>
          <div id={`story-${item.id}`} className="portfolio-story experience-story" hidden={!active}>
            <p className="portfolio-date">{item.date}</p>
            <h3 id={`${item.id}-title`}>{item.role}</h3>
            <p className="portfolio-company">{item.company}</p>
            {item.link && <a className="portfolio-work-link" href={item.link} target="_blank" rel="noopener noreferrer">
              {item.linkLabel}<span aria-hidden="true"> ↗</span>
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>}
            {careerVideos[item.id] && allowMotion && <button type="button" className="gallery-motion-control"
              aria-pressed={motionPaused} onClick={() => setMotionPaused(value => !value)}>
              {motionPaused ? "Resume animation" : "Pause animation"}
            </button>}
            <p className="portfolio-summary">{item.summary}</p>
          </div>
        </article>;
      })}
    </div>
  </div>;
}
