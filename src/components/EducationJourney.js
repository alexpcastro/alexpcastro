import { useEffect, useRef, useState } from "react";
import useMotionPreference from "./useMotionPreference";
import useCardTilt from "./useCardTilt";
import EducationArtwork from "./EducationArtwork";
import { educationVideos } from "../data/educationVideos";
import "./EducationJourney.css";

const schools = [
  { id: "pine-crest", name: "Pine Crest School", detail: "Kindergarten through 7th grade", place: "Fort Lauderdale, Florida", date: "c. 2001–2009", image: "pine-crest-artwork-640.jpg", imageLarge: "pine-crest-artwork-1280.jpg", alt: "AI-generated illustration of children reading and exploring a geometric sculpture in a palm-lined Florida school courtyard", width: 1280, height: 1280 },
  { id: "beau-soleil", name: "Collège Alpin Beau Soleil", detail: "Summer camp", place: "Villars-sur-Ollon, Switzerland", date: "Summers 2007 & 2008", image: "beau-soleil-artwork-640.jpg", imageLarge: "beau-soleil-artwork-1280.jpg", alt: "AI-generated illustration of a summer camp group hiking past a chalet into a sunlit Swiss Alpine valley", width: 1280, height: 1280 },
  { id: "id-tech-miami", name: "iD Tech Camp", institution: "University of Miami", detail: "At University of Miami", place: "Coral Gables, Florida", date: "Summer 2009", image: "id-tech-miami-artwork-640.jpg", imageLarge: "id-tech-miami-artwork-1280.jpg", alt: "AI-generated illustration of campers collaborating on a glowing computer project in a Miami workshop overlooking palms and a lake", width: 1280, height: 1280 },
  { id: "barcelona", name: "American School of Barcelona", detail: "High school", place: "Barcelona", date: "2009–2013", image: "asb-artwork-640.jpg", imageLarge: "asb-artwork-1280.jpg", alt: "AI-generated illustration of high-school students talking, playing music and basketball in a lively courtyard overlooking Barcelona", width: 1280, height: 1280 },
  { id: "oxford", name: "University of Oxford", detail: "Physics", place: "Oxford", date: "Winter 2013", image: "oxford-artwork-640.jpg", imageLarge: "oxford-artwork-1280.jpg", alt: "AI-generated illustration of students exploring a prism experiment in a snowy Oxford courtyard with illuminated winter spires", width: 1280, height: 1280 },
  { id: "fordham-bs", campus: "fordham", name: "Fordham University", degree: "BS", graduation: "2017", place: "New York", date: "2013–2017", image: "fordham-bs-artwork-640.jpg", imageLarge: "fordham-bs-artwork-1280.jpg", alt: "AI-generated illustration of undergraduate students building a robot at a lively computer science fair on a New York campus lawn", width: 1280, height: 1280 },
  { id: "esade", name: "Esade", detail: "Business", place: "Barcelona", date: "Summer 2014", image: "esade-artwork-640.jpg", imageLarge: "esade-artwork-1280.jpg", alt: "AI-generated illustration of business students developing a model city and sharing ideas at a bustling Barcelona courtyard workshop", width: 1280, height: 1280 },
  { id: "fordham-ms", campus: "fordham", name: "Fordham University", degree: "MS", graduation: "2022", publication: true, place: "New York", date: "2020–2022", image: "fordham-ms-artwork-640.jpg", imageLarge: "fordham-ms-artwork-1280.jpg", alt: "AI-generated illustration of graduate researchers exploring a luminous computing model in a grand atrium overlooking New York", width: 1280, height: 1280 },
];

export default function EducationJourney({ autoCycle = true }) {
  const allowMotion = useMotionPreference();
  const [paused, setPaused] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [playingId, setPlayingId] = useState(null);
  const [inView, setInView] = useState(() => typeof IntersectionObserver === "undefined");
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState !== "hidden");
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const scrollTimer = useRef(null);
  const programmaticUntil = useRef(0);
  const pointerStart = useRef(null);
  const pointerCycleStart = useRef(0);
  const dragged = useRef(false);
  const [interacting, setInteracting] = useState(false);
  const artworkRefs = useRef([]);
  const [compact, setCompact] = useState(() => window.matchMedia("(max-width: 900px)").matches);
  const running = allowMotion && !paused && inView && pageVisible;
  const cycling = autoCycle;
  const selectedId = activeVideo || schools[cycleIndex].id;
  const tilt = useCardTilt({ enabled: running && !compact, cardRefs: artworkRefs });

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => setCompact(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!running) { setActiveVideo(null); setPlayingId(null); }
  }, [running]);

  // Count five seconds of actual playback, not network/loading time. A stalled
  // or unavailable clip gets a bounded fallback, so the tour never gets stuck.
  useEffect(() => {
    if (!cycling || !running || activeVideo || interacting) return undefined;
    const timer = window.setTimeout(() => {
      setPlayingId(null);
      setCycleIndex(index => (index + 1) % schools.length);
    }, playingId === selectedId ? 5000 : 10000);
    return () => window.clearTimeout(timer);
  }, [cycling, running, activeVideo, interacting, playingId, selectedId]);

  // Follow the expanding card inside the mobile rail without scrolling the page.
  useEffect(() => {
    if (!compact || !cycling || !inView || interacting) return;
    const track = trackRef.current;
    const card = track?.children[cycleIndex];
    if (!track || !card) return;
    const target = () => Math.max(0, Math.min(track.scrollWidth - track.clientWidth,
      card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2));
    if (!allowMotion) { track.scrollLeft = target(); return; }
    const from = track.scrollLeft, started = performance.now();
    let frame;
    programmaticUntil.current = Date.now() + 1000;
    const follow = now => {
      const progress = Math.min(1, (now - started) / 850);
      const eased = 1 - Math.pow(1 - progress, 3);
      track.scrollLeft = from + (target() - from) * eased;
      if (progress < 1) frame = window.requestAnimationFrame(follow);
    };
    frame = window.requestAnimationFrame(follow);
    return () => window.cancelAnimationFrame(frame);
  }, [compact, cycling, cycleIndex, inView, interacting, allowMotion]);

  useEffect(() => () => window.clearTimeout(scrollTimer.current), []);
  const selectNearest = (swipeDelta = 0) => {
    const track = trackRef.current;
    if (!track) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let nearest = cycleIndex, distance = Infinity;
    [...track.children].forEach((card, index) => {
      const delta = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      if (delta < distance) { nearest = index; distance = delta; }
    });
    // A short decisive swipe should still select its neighbor before momentum
    // finishes. Expansion starts immediately, independently of scroll settling.
    if (nearest === cycleIndex && cycleIndex === pointerCycleStart.current && Math.abs(swipeDelta) > 24) {
      nearest = Math.max(0, Math.min(schools.length - 1, cycleIndex + (swipeDelta < 0 ? 1 : -1)));
    }
    if (nearest !== cycleIndex) { setPlayingId(null); setActiveVideo(null); setCycleIndex(nearest); }
  };
  const settleTouch = () => {
    window.clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => setInteracting(false), 70);
  };
  const finishTouch = event => {
    if (!compact || !cycling) return;
    window.clearTimeout(scrollTimer.current);
    if (dragged.current) selectNearest(event.clientX - pointerStart.current);
    pointerStart.current = null;
    setInteracting(false);
  };
  const startTouch = event => {
    if (!compact || !cycling) return;
    programmaticUntil.current = 0;
    pointerStart.current = event.clientX;
    pointerCycleStart.current = cycleIndex;
    dragged.current = false;
    window.clearTimeout(scrollTimer.current);
    setInteracting(true);
  };

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

    <p id="education-animation-hint" className="visually-hidden">Each active image plays for five seconds before the next. On mobile, swipe the horizontal row to explore. On desktop, the next image expands. Hover or focus to explore a school and hold the tour. Tap or press Enter to pause. Use Resume to continue. Escape stops.</p>
    <div ref={trackRef} className="education-card-grid" data-auto-cycle={cycling && allowMotion ? "true" : undefined} data-carousel={compact && cycling && allowMotion ? "true" : undefined}
      onPointerDown={startTouch}
      onPointerMove={event => { if (pointerStart.current !== null && Math.abs(event.clientX - pointerStart.current) > 8) dragged.current = true; }}
      onPointerUp={finishTouch}
      onPointerCancel={() => { if (compact && cycling) { pointerStart.current = null; settleTouch(); } }}
      onWheel={() => { if (compact && cycling) { programmaticUntil.current = 0; setInteracting(true); settleTouch(); } }}
      onScroll={() => { if (compact && cycling && Date.now() >= programmaticUntil.current) { setInteracting(true); selectNearest(); settleTouch(); } }}
      onClickCapture={event => { if (dragged.current) { event.preventDefault(); event.stopPropagation(); dragged.current = false; } }}
      onKeyDown={event => {
        if (compact && cycling && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
          event.preventDefault(); setActiveVideo(null); setPlayingId(null);
          setCycleIndex(index => (index + (event.key === "ArrowRight" ? 1 : -1) + schools.length) % schools.length);
        }
      }}>
      {schools.map((school, index) => <article className={`education-stop education-stop--${school.id}${school.campus ? ` education-stop--${school.campus}` : ""}`} key={school.id} data-active={cycling && selectedId === school.id ? "true" : undefined} data-print-detail={school.degree ? `${school.degree} · Computer Science` : undefined} aria-label={`${school.name}${school.degree ? `, ${school.degree} Computer Science` : ""}, ${school.date}`}>
        <EducationArtwork tilt={tilt} index={index} frameRef={node => { artworkRefs.current[index] = node; }} school={school} clip={educationVideos[school.id]} allowMotion={allowMotion} enabled={running} paused={paused}
          autoPlay={compact && !cycling} active={cycling ? selectedId === school.id : activeVideo === school.id}
          onPlaybackStart={() => setPlayingId(school.id)} onUserPause={cycling ? () => setPaused(true) : undefined}
          activate={() => { if (cycling) setCycleIndex(index); if (compact && cycling) { setActiveVideo(null); setPaused(false); } else setActiveVideo(school.id); }}
          deactivate={() => setActiveVideo(current => current === school.id ? null : current)} />
      </article>)}
    </div>
  </section>;
}
