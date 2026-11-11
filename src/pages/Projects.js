import "../styles.css";
import "./projects.css";

const studies = [
  { title: "Sudoku Game Generator", field: "Software Development", year: "2021", kind: "sudoku", tech: "C++", text: "Generate a Sudoku puzzle of a given difficulty.", link: "https://github.com/alexpcastro/Sudoku-Game-Generator/blob/main/gameGenerator.cpp" },
  { title: "A* Search Algorithm", field: "Artificial Intelligence", year: "2020", kind: "path", tech: "Heuristics · Route planning", text: "Compare heuristic approaches to a route-planning problem using A* search.", link: "https://github.com/alexpcastro/A-Star-Search-Algorithm" },
  { title: "K-Means Pixel Clustering", field: "Data Mining", year: "2020", kind: "pixels", tech: "Python · Vector quantization", text: "Partition an image’s pixels into clusters and recolor the image using k-means.", link: "https://github.com/alexpcastro/K-Means" },
];
const archive = [
  { title: "United Nations Scraper", context: "Personal / 2021", tech: "Python 3 · BeautifulSoup", text: "Pull United Nations data, format it, and save it to a file.", link: "https://github.com/alexpcastro/UN-Member-States-Scraper" },
  { title: "N-Queens Solution", context: "Fordham University · Artificial Intelligence / 2020", tech: "Local search", text: "A local-search solution to the N-Queens problem.", link: "https://github.com/alexpcastro/N-Queens-Local-Search/blob/main/nqueens.py" },
  { title: "Ensemble Method Modelling", context: "Fordham University · Data Mining / 2020", tech: "Python · Ensemble methods", text: "Calculate ensemble success and error rates from a configurable number of models and individual success rates.", link: "https://github.com/alexpcastro/Ensemble-Method" },
  { title: "Edgar Agents", context: "Pure Digital · Client project / 2016", tech: "WordPress · Design & development", text: "Design and development of a custom WordPress website.", link: "https://edgaragents.com", website: true },
  { title: "The Tax Zone", context: "Pure Digital · Client project / 2016", tech: "WordPress · Design & development", text: "Design and development of a custom WordPress website.", link: "https://thetaxzone.com", website: true },
];

function ProjectLink({ href, children }) {
  return <a className="project-link" href={href} target="_blank" rel="noopener noreferrer">{children}<span aria-hidden="true"> ↗</span><span className="project-sr-only"> (opens in a new tab)</span></a>;
}

function StudyFigure({ kind }) {
  if (kind === "sudoku") {
    const numbers = ["5", "", "", "6", "", "8", "", "", "2", "", "7", "", "", "9", "", "3", "", "", "", "", "8", "", "", "2", "", "6", ""];
    return <svg viewBox="0 0 320 220" aria-hidden="true"><rect x="80" y="22" width="160" height="160" fill="#f5f2e4" />{Array.from({length: 10}, (_, i) => <g key={i} stroke={i % 3 === 0 ? "#354f3d" : "#bbc3a6"} strokeWidth={i % 3 === 0 ? 1.5 : .6}><path d={`M${80+i*160/9} 22v160`} /><path d={`M80 ${22+i*160/9}h160`} /></g>)}{numbers.map((n, i) => <text key={i} x={89+(i%9)*160/9} y={36+Math.floor(i/9)*3*160/9} textAnchor="middle" fontSize="12" fill="#354f3d" fontFamily="monospace">{n}</text>)}<rect x="134" y="76" width="17" height="17" fill="#be7b50"/><text x="160" y="207" textAnchor="middle" className="project-svg-label">CONSTRAINT → POSSIBILITY</text></svg>;
  }
  if (kind === "path") {
    const points = [[30,150],[76,60],[103,160],[153,106],[185,38],[222,166],[282,65]];
    return <svg viewBox="0 0 320 220" aria-hidden="true"><g stroke="#a3b491" strokeWidth="1.3" fill="none"><path d="M30 150L76 60L153 106L103 160L30 150M76 60L185 38L282 65L222 166L103 160M185 38L153 106L222 166M153 106L282 65"/></g><path d="M30 150L103 160L153 106L282 65" stroke="#ae663d" strokeWidth="4" fill="none"/>{points.map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r={i===0||i===6?10:6} fill={i===0||i===6?"#2c4937":"#eeeddf"} stroke="#2c4937" strokeWidth="2"/></g>)}<text x="30" y="179" textAnchor="middle" className="project-svg-label">A</text><text x="282" y="44" textAnchor="middle" className="project-svg-label">B</text><text x="160" y="207" textAnchor="middle" className="project-svg-label">EXPLORE → FIND A PATH</text></svg>;
  }
  const palette = ["#2c4937", "#799061", "#c4d29a", "#be7b50", "#e6c18b"];
  return <svg viewBox="0 0 320 220" aria-hidden="true">{Array.from({length: 126},(_,i)=>{const x=i%14,y=Math.floor(i/14);const cluster=Math.floor(x/3+y/3)%5;return <rect key={i} x={49+x*16} y={25+y*17} width="14" height="15" fill={palette[cluster]}/>;})}<text x="160" y="207" textAnchor="middle" className="project-svg-label">PIXELS → PALETTE</text></svg>;
}

function RecruitmentFigure() {
  return <div className="recruitment-figure" aria-hidden="true">
    <div className="recruitment-diagram-head"><span>RECRUITMENT PLATFORM</span><span>01 / SYSTEM STUDY</span></div>
    <div className="recruitment-interface"><div className="recruitment-rail"><span className="recruitment-symbol">r.</span><i/><i/><i/></div><div className="recruitment-ui-body"><div className="recruitment-ui-title">A place to connect.</div><div className="recruitment-ui-rule"/><div className="recruitment-profile-grid">{[0,1,2].map(i=><div className="recruitment-profile" key={i}><span className={`recruitment-avatar avatar-${i}`} /><i/><i/><span className="recruitment-profile-button"/></div>)}</div></div></div>
    <div className="recruitment-connections"><span>React</span><b>↔</b><span>GraphQL</span><b>↔</b><span>SQLite</span></div>
    <span className="recruitment-caption">ILLUSTRATIVE INTERFACE / NOT A PRODUCT SCREENSHOT</span>
  </div>;
}

export default function Projects() {
  return <div className="page-container projects-page">
    <header className="projects-heading"><div><p className="eyebrow">PROJECTS / ALEX CASTRO</p><h1>Ideas, made tangible.</h1><p>Web applications, algorithm experiments, and work for the real world.</p></div><span className="projects-index">SELECTED WORK<br/>2016—2021</span></header>
    <section className="project-feature" aria-labelledby="recruitment-title"><div className="project-feature-copy"><p className="project-kicker">01 / FEATURED BUILD</p><h2 id="recruitment-title">Recruitment<br/>App<span>.</span></h2><p className="project-context">Fordham University · Capstone project / 2021</p><p>A full-stack web application, bringing a React interface together with a GraphQL-powered backend.</p><ul className="project-stack" aria-label="Technologies">{["React", "Node.js", "JavaScript", "Material-UI", "Python", "Flask", "Apollo", "SQLite", "JWT sessions", "GraphQL"].map(t=><li key={t}>{t}</li>)}</ul><ProjectLink href="https://github.com/RecruitmentPlatform">Explore the code</ProjectLink></div><RecruitmentFigure/></section>
    <section className="project-studies" aria-labelledby="studies-title"><div className="projects-section-heading"><h2 id="studies-title">Small problems. Deep dives.</h2><span>02—04 / ALGORITHM STUDIES</span></div><div className="project-study-grid">{studies.map((p,i)=><article className="project-study" key={p.title}><div className={`project-study-art study-${p.kind}`}><span className="project-study-number">0{i+2}</span><StudyFigure kind={p.kind}/></div><p className="project-kicker">{p.tech}</p><h3>{p.title}</h3><p>{p.text}</p><p className="project-context">Fordham University · {p.field} / {p.year}</p><ProjectLink href={p.link}>View source</ProjectLink></article>)}</div></section>
    <section className="project-archive" aria-labelledby="archive-title"><div className="projects-section-heading"><h2 id="archive-title">More from the archive.</h2><span>05—09 / EXPLORATIONS & CLIENT WORK</span></div>{archive.map((p,i)=><article className="project-archive-row" key={p.title}><span className="project-row-number">0{i+5}</span><div><p className="project-kicker">{p.tech}</p><h3>{p.title}</h3><p className="project-context">{p.context}</p></div><p className="project-row-description">{p.text}</p><ProjectLink href={p.link}>{p.website ? "Visit site" : "View source"}</ProjectLink></article>)}</section>
    <footer className="projects-footer"><span>Always another idea to explore.</span><ProjectLink href="https://github.com/alexpcastro">Find me on GitHub</ProjectLink></footer>
  </div>;
}
