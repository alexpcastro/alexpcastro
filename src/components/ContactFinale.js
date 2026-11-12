import { useEffect, useRef, useState } from "react";
import useMotionPreference from "./useMotionPreference";
import "./ContactFinale.css";

function Arrow({ className = "" }) {
  return <svg className={className} viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true" focusable="false"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

// A quiet, code-drawn counterpart to the organic artwork and floating skills.
// Decorative motion settles after four seconds, with no ongoing loop or control.
// The invitation and contact targets stay still.
function ContactOrbit() {
  return <div className="contact-orbit" aria-hidden="true">
    <div className="contact-orbit-halo" />
    <div className="contact-orbit-ring contact-orbit-ring--outer"><span /></div>
    <div className="contact-orbit-ring contact-orbit-ring--inner"><span /></div>
    <svg className="contact-orbit-flower" viewBox="0 0 240 240" width="240" height="240" focusable="false">
      <path className="contact-petal contact-petal--violet" d="M120 120C25 126 20 31 65 23c45-8 70 40 55 97Z" />
      <path className="contact-petal contact-petal--blue" d="M120 120C114 25 209 20 217 65c8 45-40 70-97 55Z" />
      <path className="contact-petal contact-petal--rose" d="M120 120c95-6 100 89 55 97-45 8-70-40-55-97Z" />
      <path className="contact-petal contact-petal--gold" d="M120 120c6 95-89 100-97 55-8-45 40-70 97-55Z" />
      <circle cx="120" cy="120" r="11" fill="#f0ebe4" />
    </svg>
    <span className="contact-orbit-spark contact-orbit-spark--one" />
    <span className="contact-orbit-spark contact-orbit-spark--two" />
  </div>;
}

export default function ContactFinale() {
  const allowMotion = useMotionPreference();
  const [inView, setInView] = useState(() => typeof IntersectionObserver === "undefined");
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState !== "hidden");
  const sectionRef = useRef(null);
  const running = allowMotion && inView && pageVisible;

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
      <ContactOrbit />
      <div className="contact-invitation">
        <h2 id="contact-heading">Let’s talk<span>.</span></h2>
        <a className="contact-email" href="mailto:alexpcastro95@gmail.com"><span>Say hello<span className="visually-hidden"> by email</span></span><Arrow /></a>
        <p className="contact-address">alexpcastro95@gmail.com</p>
      </div>
      <div className="contact-stage-footer">
        <nav className="portfolio-contact-links" aria-label="Contact Alex">
          <a href="https://linkedin.com/in/alexpcastro" target="_blank" rel="noopener noreferrer"><span>LinkedIn</span><Arrow /><span className="visually-hidden"> (opens in a new tab)</span></a>
          <a href="https://github.com/alexpcastro" target="_blank" rel="noopener noreferrer"><span>GitHub</span><Arrow /><span className="visually-hidden"> (opens in a new tab)</span></a>
        </nav>
        <span className="contact-signature">Alex Castro</span>
      </div>
    </div>
    <a className="contact-back-top" href="#home">Back to top<span aria-hidden="true"> ↑</span></a>
    <div className="portfolio-download" aria-hidden="true" />
  </section>;
}
