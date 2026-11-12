import { useEffect, useId, useRef, useState } from "react";
import useMotionPreference from "./useMotionPreference";
import "./ContactFinale.css";

function Arrow({ className = "" }) {
  return <svg className={className} viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true" focusable="false"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

// Three translucent ribbons and traveling highlights form a continuous sculpture.
// Closed paths and full rotations meet at identical endpoints, with no reset frame.
function ContactSculpture() {
  const id = useId().replace(/:/g, "");
  return <svg className="contact-sculpture" viewBox="0 0 400 400" width="400" height="400" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-ribbon`} x1="60" y1="95" x2="335" y2="305" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#93b9ef" /><stop offset=".38" stopColor="#d1b4f5" /><stop offset=".7" stopColor="#eca7bd" /><stop offset="1" stopColor="#edba83" />
      </linearGradient>
      <radialGradient id={`${id}-core`} cx="32%" cy="24%" r="80%">
        <stop offset="0" stopColor="#fff5e8" /><stop offset=".25" stopColor="#efc5d1" /><stop offset=".65" stopColor="#9c8cb9" /><stop offset="1" stopColor="#46415f" />
      </radialGradient>
      <radialGradient id={`${id}-halo`}>
        <stop offset="0" stopColor="#d1b4f5" stopOpacity=".12" /><stop offset="1" stopColor="#d1b4f5" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="200" cy="200" r="168" fill={`url(#${id}-halo)`} />
    <g className="contact-sculpture-spin">
      {[0, 60, 120].map((angle, index) => <g key={angle} transform={`rotate(${angle} 200 200)`}>
        <ellipse className="contact-ribbon-body" cx="200" cy="200" rx="145" ry="77" fill="none" stroke={`url(#${id}-ribbon)`} />
        <ellipse className="contact-ribbon-edge" cx="200" cy="200" rx="145" ry="77" fill="none" stroke={`url(#${id}-ribbon)`} />
        <ellipse className={`contact-ribbon-light contact-ribbon-light--${index + 1}`} cx="200" cy="200" rx="145" ry="77" fill="none" stroke={`url(#${id}-ribbon)`} pathLength="100" strokeDasharray="13 87" />
      </g>)}
    </g>
    <circle className="contact-sculpture-core" cx="200" cy="200" r="24" fill={`url(#${id}-core)`} />
    <circle cx="193" cy="191" r="4" fill="#fff5e8" opacity=".35" />
  </svg>;
}

const linkedinUrl = "https://linkedin.com/in/alexpcastro";
const githubUrl = "https://github.com/alexpcastro";
const printableUrl = url => url.replace(/^https?:\/\/(?:www\.)?/, "");

export default function ContactFinale() {
  const allowMotion = useMotionPreference();
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(() => typeof IntersectionObserver === "undefined");
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState !== "hidden");
  const sectionRef = useRef(null);
  const running = allowMotion && !paused && inView && pageVisible;

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

  return <section id="contact" ref={sectionRef} className="portfolio-contact contact-finale" tabIndex="-1" aria-labelledby="contact-heading" data-motion={running ? "running" : "paused"} data-motion-allowed={allowMotion}>
    <div className="contact-stage">
      <div className="contact-art">
        <ContactSculpture />
        {allowMotion && <button type="button" className="contact-art-control" aria-label={paused ? "Resume contact animation" : "Pause contact animation"} title={paused ? "Resume animation" : "Pause animation"} aria-pressed={paused} onClick={() => setPaused(value => !value)}>
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">{paused ? <path d="M5 3 12 8 5 13Z" /> : <path d="M4 3h3v10H4zM10 3h3v10h-3z" />}</svg>
        </button>}
      </div>
      <div className="contact-invitation">
        <h2 id="contact-heading">Let’s talk<span>.</span></h2>
        <a className="contact-email" href="mailto:alexpcastro95@gmail.com"><span>Say hello<span className="visually-hidden"> by email</span></span><Arrow /></a>
        <p className="contact-address">alexpcastro95@gmail.com</p>
      </div>
      <div className="contact-stage-footer">
        <nav className="portfolio-contact-links" aria-label="Contact Alex">
          <a href={linkedinUrl} data-print-url={printableUrl(linkedinUrl)} target="_blank" rel="noopener noreferrer"><span>LinkedIn</span><Arrow /><span className="visually-hidden"> (opens in a new tab)</span></a>
          <a href={githubUrl} data-print-url={printableUrl(githubUrl)} target="_blank" rel="noopener noreferrer"><span>GitHub</span><Arrow /><span className="visually-hidden"> (opens in a new tab)</span></a>
        </nav>
        <span className="contact-signature">Alex Castro</span>
      </div>
    </div>
    <a className="contact-back-top" href="#home">Back to top<span aria-hidden="true"> ↑</span></a>
    <div className="portfolio-download" aria-hidden="true" />
  </section>;
}
