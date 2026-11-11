import { useEffect, useRef, useState } from "react";
import { skillSections } from "../data/skills";
import useMotionPreference from "./useMotionPreference";
import "./FloatingSkills.css";

const allSkills = skillSections.flatMap(section => section.skills.map(label => ({ label, category: section.id })));
// Mix the four disciplines across the field, rather than turning them into four
// category tickers. Each exact-width group is repeated for a seamless wrap.
const lanes = Array.from({ length: 4 }, (_, lane) => allSkills.filter((_, index) => index % 4 === lane));
const offsets = [-9, 12, -2, 17, -12, 5, -4];
const angles = [-3, 2, -1, 3, -2, 1, 0];

function SkillCatalog({ readable }) {
  return <div id="skills-catalog" className={`skills-catalog${readable ? "" : " visually-hidden"}`}>
    {skillSections.map(section => <div className="skills-category" key={section.id}>
      <h3>{section.title}</h3>
      <ul>{section.skills.map(label => <li className={`skill-chip skill-chip--${section.id}`} key={label}>{label}</li>)}</ul>
    </div>)}
  </div>;
}

export default function FloatingSkills() {
  const allowMotion = useMotionPreference();
  const [paused, setPaused] = useState(false);
  const [viewAll, setViewAll] = useState(false);
  const [inView, setInView] = useState(() => typeof IntersectionObserver === "undefined");
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState !== "hidden");
  const sectionRef = useRef(null);
  const readable = viewAll || !allowMotion;
  const running = !paused && inView && pageVisible && !readable;

  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 }) : null;
    if (observer) observer.observe(sectionRef.current);
    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
      observer?.disconnect();
    };
  }, []);

  return <section id="skills" ref={sectionRef} className="portfolio-skills" tabIndex="-1" aria-labelledby="skills-heading" data-motion={running ? "running" : "paused"}>
    <div className="skills-heading-row">
      <h2 id="skills-heading">Skills &amp; toolkit</h2>
      {allowMotion && <div className="skills-controls">
        {!readable && <button type="button" className="skills-motion-control" aria-pressed={paused} aria-label={paused ? "Resume skill motion" : "Pause skill motion"} onClick={() => setPaused(value => !value)}>
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
            {paused ? <path d="M5 3 12 8 5 13Z" /> : <path d="M4 3h3v10H4zM10 3h3v10h-3z" />}
          </svg><span>{paused ? "Resume" : "Pause"}</span>
        </button>}
        <button type="button" className="skills-view-control" aria-controls="skills-catalog" aria-pressed={viewAll} onClick={() => setViewAll(value => !value)}>
          {readable ? "Show floating skills" : "View all skills"}<span aria-hidden="true">{readable ? " ↗" : " +"}</span>
        </button>
      </div>}
    </div>

    {!readable && <div className="skills-field" aria-hidden="true">
      {lanes.map((skills, lane) => <div className={`skills-lane skills-lane--${lane + 1}`} key={lane}>
        <div className="skills-track">
          {[0, 1].map(copy => <div className="skills-group" key={copy}>
            {skills.map((skill, index) => <span className="skill-drift" key={skill.label} style={{
              "--offset": `${offsets[(index + lane * 2) % offsets.length]}px`,
              "--angle": `${angles[(index + lane) % angles.length]}deg`,
              "--float-delay": `${-(index * 1.7 + lane * 2)}s`,
              "--float-duration": `${8 + index % 4}s`,
            }}><span className={`skill-chip skill-chip--${skill.category}${(index + lane) % 5 === 0 ? " skill-chip--featured" : ""}`}>{skill.label}</span></span>)}
          </div>)}
        </div>
      </div>)}
    </div>}
    <SkillCatalog readable={readable} />
  </section>;
}
