import { useEffect, useRef, useState } from "react";
import useMotionPreference from "./useMotionPreference";
import useCardTilt from "./useCardTilt";
import EducationArtwork from "./EducationArtwork";
import { educationVideos } from "../data/educationVideos";
import "./EducationJourney.css";

const schools = [
  { id: "barcelona", name: "American School of Barcelona", detail: "High school", place: "Barcelona", date: "2009–2013", image: "asb-artwork-640.jpg", imageLarge: "asb-artwork-1280.jpg", alt: "AI-generated illustration of a high-school desk with books, a laptop and a small server overlooking Barcelona", width: 1280, height: 1280 },
  { id: "oxford", name: "University of Oxford", detail: "Physics", place: "Oxford", date: "Winter 2013", image: "oxford-artwork-640.jpg", imageLarge: "oxford-artwork-1280.jpg", alt: "AI-generated physics illustration with a prism, spectral waves and a pendulum before Oxford winter spires", width: 1280, height: 1280 },
  { id: "fordham-bs", campus: "fordham", name: "Fordham University", degree: "BS", graduation: "2017", place: "New York", date: "2013–2017", image: "fordham-bs-artwork-640.jpg", imageLarge: "fordham-bs-artwork-1280.jpg", alt: "AI-generated computer science illustration of a coding desk and glowing algorithm tree with a New York university backdrop", width: 1280, height: 1280 },
  { id: "esade", name: "Esade", detail: "Business", place: "Barcelona", date: "Summer 2014", image: "esade-artwork-640.jpg", imageLarge: "esade-artwork-1280.jpg", alt: "AI-generated business illustration of a glowing miniature market and growth model on a seminar table overlooking Barcelona", width: 1280, height: 1280 },
  { id: "fordham-ms", campus: "fordham", name: "Fordham University", degree: "MS", graduation: "2022", publication: true, place: "New York", date: "2020–2022", image: "fordham-ms-artwork-640.jpg", imageLarge: "fordham-ms-artwork-1280.jpg", alt: "AI-generated graduate computer science illustration of a luminous computing lattice above a research desk with New York at night", width: 1280, height: 1280 },
];

export default function EducationJourney() {
  const allowMotion = useMotionPreference();
  const [paused, setPaused] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  const [inView, setInView] = useState(() => typeof IntersectionObserver === "undefined");
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState !== "hidden");
  const sectionRef = useRef(null);
  const artworkRefs = useRef([]);
  const [compact, setCompact] = useState(() => window.matchMedia("(max-width: 900px)").matches);
  const running = allowMotion && !paused && inView && pageVisible;
  const tilt = useCardTilt({ enabled: running && !compact, cardRefs: artworkRefs });

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => setCompact(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => { if (!running) setActiveVideo(null); }, [running]);

  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 }) : null;
    observer?.observe(sectionRef.current);
    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
      observer?.disconnect();
    };
  }, []);

  return <section id="education" ref={sectionRef} className="portfolio-education education-journey" tabIndex="-1" aria-labelledby="education-heading" data-motion={running ? "running" : "paused"} onKeyDown={tilt.reset}>
    <div className="education-heading-row">
      <h2 id="education-heading">Education</h2>
      {allowMotion && <button type="button" className="education-motion-control" aria-pressed={paused} aria-label={paused ? "Resume education motion" : "Pause education motion"} onClick={() => setPaused(value => !value)}>
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
          {paused ? <path d="M5 3 12 8 5 13Z" /> : <path d="M4 3h3v10H4zM10 3h3v10h-3z" />}
        </svg><span>{paused ? "Resume" : "Pause"}</span>
      </button>}
    </div>

    <p id="education-animation-hint" className="visually-hidden">Hover or focus to play. Tap or press Enter to pause or resume. Escape stops.</p>
    <div className="education-timeline">
      <div className="education-timeline-rail" aria-hidden="true"><span /></div>
      {schools.map((school, index) => <article className={`education-stop education-stop--${school.id}${school.campus ? ` education-stop--${school.campus}` : ""}`} key={school.id} aria-labelledby={`education-${school.id}${school.degree ? ` education-degree-${school.id}` : ""}`}>
        <EducationArtwork tilt={tilt} index={index} frameRef={node => { artworkRefs.current[index] = node; }} school={school} clip={educationVideos[school.id]} allowMotion={allowMotion} enabled={running} paused={paused}
          active={activeVideo === school.id} activate={() => setActiveVideo(school.id)}
          deactivate={() => setActiveVideo(current => current === school.id ? null : current)} />
        <div className="education-stop-marker"><span className="education-stop-dot" aria-hidden="true" /><p>{school.date}</p></div>
        <div className="education-stop-details">
          {school.degree ? <div className="education-degrees"><p id={`education-degree-${school.id}`}>{school.degree}, Computer Science <span>· {school.graduation}</span></p></div> : <p className="education-school-detail">{school.detail}</p>}
          {school.publication && <a className="education-paper" href="https://ieeexplore.ieee.org/document/9854976" target="_blank" rel="noopener noreferrer">Co-author, ScreenCoin · IEEE COINS 2022<span aria-hidden="true"> ↗</span><span className="visually-hidden"> (opens in a new tab)</span></a>}
        </div>
      </article>)}
    </div>
  </section>;
}
