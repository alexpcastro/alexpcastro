import { useEffect, useRef, useState } from "react";
import OrganicFrame from "./OrganicFrame";

const frames = { "pine-crest": "apc", "beau-soleil": "columbia", "id-tech-miami": "deloitte", barcelona: "brokr", oxford: "columbia", "fordham-bs": "fordham", esade: "deloitte", "fordham-ms": "pure-digital" };
const asset = name => `${process.env.PUBLIC_URL || ""}/education/${name}`;

// Keep the responsive still underneath. Mobile cards autoplay only while
// visible; desktop cards remain interaction-driven. Offscreen media is released.
export default function EducationArtwork({ school, clip, allowMotion, enabled, paused, autoPlay = false, active, activate, deactivate, onPlaybackStart, onUserPause, tilt, index, frameRef }) {
  const art = useRef(null);
  const player = useRef(null);
  const pointerFocus = useRef(false);
  const hovered = useRef(false);
  const keyboardFocus = useRef(false);
  const stop = useRef(deactivate);
  stop.current = deactivate;
  const [inView, setInView] = useState(() => typeof IntersectionObserver === "undefined");
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [autoPaused, setAutoPaused] = useState(false);
  const src = clip?.src;
  const available = Boolean(src && allowMotion && !failed);
  const mounted = available && enabled && inView && (autoPlay ? !autoPaused : active);
  const startPreview = () => { if (autoPlay) setAutoPaused(false); else activate(); };
  const stopPreview = () => { if (autoPlay) setAutoPaused(true); else if (onUserPause) onUserPause(); else deactivate(); };
  const label = `${school.name}${school.degree ? `, ${school.degree} Computer Science` : ""}, ${school.date}`;

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      const visible = entry.isIntersecting;
      setInView(visible);
      if (!visible) { stop.current(); tilt.reset(); }
    }, { threshold: 0 });
    observer.observe(art.current);
    return () => observer.disconnect();
  }, [src, tilt.reset]);

  useEffect(() => {
    const video = player.current;
    if (!mounted || !video) { setPlaying(false); return undefined; }
    let cancelled = false;
    video.play()?.catch(() => {
      if (!cancelled) { setPlaying(false); setAutoPaused(true); stop.current(); }
    });
    return () => {
      cancelled = true;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [mounted, src]);

  // The stable frame owns pointer geometry; its entire inner image/video/text
  // surface rotates together, exactly like the Experience cards.
  return <div className="education-art-frame" ref={frameRef}
    onPointerMove={event => tilt.move(event, index)} onPointerLeave={() => tilt.leave(index)} onPointerCancel={tilt.reset}>
    <div className="education-art-surface">
      <OrganicFrame kind={frames[school.id]} />
    <div ref={art} className="education-stop-art" data-video-playing={mounted && playing ? "true" : undefined}>
      <img src={asset(school.image)} srcSet={`${asset(school.image)} 640w, ${asset(school.imageLarge)} 1280w`} sizes="(max-width: 600px) calc((100vw - 54px) / 2), (max-width: 900px) calc((100vw - 100px) / 4), 420px" alt={school.alt} width={school.width} height={school.height} loading="lazy" decoding="async" />
      {mounted && <video ref={player} className={`education-video${playing ? " is-playing" : ""}`}
        src={`${process.env.PUBLIC_URL || ""}${src}`} poster={asset(school.imageLarge)} muted playsInline autoPlay={autoPlay} loop preload="none"
        tabIndex={-1} aria-hidden="true" disablePictureInPicture
        onPlaying={() => { setPlaying(true); onPlaybackStart?.(); }}
        onError={() => { setPlaying(false); setFailed(true); stop.current(); }} />}
      <p className="education-date-chip">{school.date}</p>
      <div className="education-stop-heading">
        <p className="education-stop-place">{school.place}</p>
        <h3 id={`education-${school.id}`}>{school.name}</h3>
        {school.institution && <p className="education-stop-institution">{school.institution}</p>}
      </div>
      {available && <button type="button" className="education-art-control" disabled={paused}
        aria-label={`${mounted ? "Pause" : "Play"} animation: ${label}`} aria-pressed={Boolean(mounted)} aria-describedby="education-animation-hint"
        onPointerEnter={event => { if (!autoPlay && event.pointerType !== "touch") { hovered.current = true; activate(); } }}
        onPointerLeave={event => { if (!autoPlay && event.pointerType !== "touch") { hovered.current = false; if (!keyboardFocus.current) deactivate(); } }}
        onPointerDown={() => { pointerFocus.current = true; keyboardFocus.current = false; }}
        onFocus={() => { if (!pointerFocus.current) { keyboardFocus.current = true; if (!autoPlay) activate(); } }}
        onBlur={() => { pointerFocus.current = false; keyboardFocus.current = false; if (!autoPlay && !hovered.current) deactivate(); }}
        onKeyDown={event => {
          pointerFocus.current = false;
          keyboardFocus.current = true;
          if (event.key === "Escape") { event.preventDefault(); stopPreview(); }
        }}
        onClick={() => { if (mounted) stopPreview(); else startPreview(); }} />}
    </div>
    </div>
  </div>;
}
