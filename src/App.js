import "./styles.css";
import "./portfolio.css";
import { useEffect, useRef } from "react";
import ExperienceGallery from "./components/ExperienceGallery";
import FloatingSkills from "./components/FloatingSkills";

const legacySections = { projects: "experience", about: "contact" };

export default function App() {
  const mainRef = useRef(null);
  useEffect(() => {
    document.title = "Alex Castro · Engineering Leadership";
    const followSection = () => {
      const hash = window.location.hash.slice(1);
      const targetId = legacySections[hash] || hash;
      if (legacySections[hash]) window.history.replaceState(null, "", `#${targetId}`);
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView?.({ behavior: "auto", block: "start" });
        target.focus({ preventScroll: true });
      }
    };
    followSection();
    window.addEventListener("hashchange", followSection);
    return () => window.removeEventListener("hashchange", followSection);
  }, []);

  return <div id="app" className="portfolio-shell">
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); mainRef.current?.focus(); }}>Skip to content</a>
    <main id="main-content" ref={mainRef} tabIndex="-1" className="portfolio-page">
      <section id="home" className="portfolio-intro" tabIndex="-1" aria-label="Introduction">
        <h1 className="intro-statement">I’m Alex Castro, an engineering leader at <span className="deloitte-brand is-ready"><span className="deloitte-letters">Deloitte</span><span className="deloitte-dot" aria-hidden="true" /><span className="deloitte-punctuation">.</span></span></h1>
      </section>

      <section id="experience" className="portfolio-work" tabIndex="-1" aria-labelledby="work-heading">
        <ExperienceGallery />
      </section>

      <FloatingSkills />

      <section id="education" className="portfolio-education" tabIndex="-1" aria-labelledby="education-heading">
        <h2 id="education-heading">Education</h2>
        <div>
          <h3>Fordham University</h3>
          <p>MS, Computer Science · 2022<br />BS, Computer Science · 2017</p>
          <p className="portfolio-small">AI and Data Science specializations.</p>
        </div>
        <div className="portfolio-study">
          <p>Additional coursework at Esade and Oxford.<br />High school at the American School of Barcelona.</p>
          <a className="portfolio-work-link" href="https://ieeexplore.ieee.org/document/9854976" target="_blank" rel="noopener noreferrer">Co-author, ScreenCoin · IEEE COINS 2022<span aria-hidden="true"> ↗</span><span className="visually-hidden"> (opens in a new tab)</span></a>
        </div>
      </section>

      <section id="contact" className="portfolio-contact" tabIndex="-1" aria-labelledby="contact-heading">
        <div>
          <h2 id="contact-heading">Let’s talk.</h2>
          <nav className="portfolio-contact-links" aria-label="Contact Alex">
            <a href="mailto:alexpcastro95@gmail.com">Email<span aria-hidden="true"> ↗</span></a>
            <a href="https://linkedin.com/in/alexpcastro" target="_blank" rel="noopener noreferrer">LinkedIn<span aria-hidden="true"> ↗</span><span className="visually-hidden"> (opens in a new tab)</span></a>
            <a href="https://github.com/alexpcastro" target="_blank" rel="noopener noreferrer">GitHub<span aria-hidden="true"> ↗</span><span className="visually-hidden"> (opens in a new tab)</span></a>
          </nav>
        </div>
        <div className="portfolio-download" aria-hidden="true" />
      </section>
    </main>
  </div>;
}
