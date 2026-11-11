import "../styles.css";
import "./education-skills.css";
import { skillSections as sections } from "../data/skills";

const icon = (name) => `${process.env.PUBLIC_URL || ""}/skill-icons/${name}.svg`;


export default function Skills() {
  return <div className="page-container toolkit-page">
    <header className="learning-intro"><div><p className="eyebrow">SKILLS / ALEX CASTRO</p><h1>A useful toolkit.</h1></div><p className="learning-deck">From an idea to a system.<br />The tools for every layer.</p></header>
    <nav className="toolkit-map" aria-label="Toolkit categories">{sections.map((section) => <button key={section.id} type="button" onClick={() => { const target = document.getElementById(`toolkit-${section.id}`); target?.scrollIntoView({ behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); target?.focus({ preventScroll: true }); }}><span>{section.number}</span><strong>{section.verb}</strong><span aria-hidden="true">↘</span></button>)}</nav>
    <div className="toolkit-sections">{sections.map((section) => <section className={`toolkit-section toolkit-${section.id}`} id={`toolkit-${section.id}`} tabIndex="-1" aria-labelledby={`heading-${section.id}`} key={section.id}>
      <div className="toolkit-heading"><span className="toolkit-number" aria-hidden="true">{section.number}</span><div><p className="eyebrow">{section.verb}</p><h2 id={`heading-${section.id}`}>{section.title}</h2><p className="toolkit-description">{section.description}</p></div></div>
      <div className="toolkit-content">
        <div className="toolkit-logos" aria-label="Selected platforms and tools">{section.logos.map(([file, label]) => <div className="toolkit-logo" key={file}><img src={icon(file)} alt="" width="38" height="38" loading="lazy" decoding="async" /><span>{label}</span></div>)}</div>
        <ul className="toolkit-skills">{section.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
      </div>
    </section>)}</div>
    <footer className="toolkit-footnote"><span className="toolkit-plus" aria-hidden="true">+</span><p>The toolkit keeps growing.<br /><span>Good engineering starts with choosing the right tool for the problem.</span></p></footer>
    <details className="asset-credits"><summary>Logo credits</summary><p>Selected technology marks from <a href="https://github.com/devicons/devicon/tree/v2.17.0">Devicon v2.17.0</a>, distributed under the <a href={`${process.env.PUBLIC_URL || ""}/skill-icons/LICENSE.txt`}>MIT license</a>. All trademarks belong to their respective owners. Logos identify tools, not endorsements or certifications.</p></details>
  </div>;
}
