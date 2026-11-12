import "./styles.css";
import "./portfolio.css";
import { useEffect, useRef } from "react";
import ExperienceGallery from "./components/ExperienceGallery";
import FloatingSkills from "./components/FloatingSkills";
import EducationJourney from "./components/EducationJourney";
import ContactFinale from "./components/ContactFinale";

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

      <EducationJourney />

      <ContactFinale />
    </main>
  </div>;
}
