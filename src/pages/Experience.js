import "../styles.css";
import { aiAdvantageUrl } from "../links";
import CompanyScale from "../components/CompanyScale";
import "./experience.css";

export default function Experience() {
  const experiences = [
    {
      id: "apc",
      company: "APC Technology Group, Inc.",
      headline: "From servers to scale.",
      discipline: "ENTREPRENEURSHIP / INFRASTRUCTURE",
      role: "Founder, Hosting Business",
      date: "August 2009 – April 2015",
      details: [
        "Founded the company at age 14 to sell dedicated server hosting, serving over 800 clients.",
        "Operated company-owned Linux and Windows servers co-located in IBM (SoftLayer) data centers."
      ]
    },
    {
      id: "deloitte",
      company: "Deloitte",
      headline: "Building AI for the real world.",
      discipline: "AI SYSTEMS / ENGINEERING LEADERSHIP",
      role: "Head of Engineering, AI Advantage",
      scale: { name: "AI Advantage", joinCount: 12, approximateJoin: true, laterCount: 100, laterPlus: true, scopeNote: "AI Advantage organization size, not direct reports or the core engineering team." },
      date: "March 2022 – Present",
      details: [
        "Lead a core team of 15 engineers and own end-to-end AI development and delivery, from client discussions through production and hypercare.",
        "Own product architecture and technical decisions as a hands-on player-coach working with React, Python, FastAPI, and AWS for AI in finance.",
        "Lead global delivery, shaping CI/CD and staffing across organizations while enabling and supporting additional U.S. and international client teams.",
        "Lead AI Advantage frontend and design, signing off on designs and translating client requirements into architectures, sprint scope, and delivery sequencing.",
        "Led development of financial forecasting capabilities for production use.",
        "Led specification-driven development and trained over 100 developers, creating custom development skills to reduce repeated work and accelerate onboarding.",
        "Created an agent-development tool used by dozens of developers to build Amazon Bedrock agents, and implemented AI development guardrails and evaluations."
      ]
    },
    {
      id: "fordham-research",
      company: "Fordham University",
      headline: "Making research accessible.",
      discipline: "RESEARCH / WEB DEVELOPMENT",
      role: "Research Assistant",
      date: "March 2020 – December 2021",
      details: [
        "Designed Dr. Sophie Mitra’s 2021 disability data report, presented to the UN and WHO, and built the Global Disability Data Initiative WordPress theme.",
        "Created custom shortcodes, post types, and plugins with HTML, CSS, PHP, and Bootstrap, plus Schema.org JSON-LD for SEO."
      ]
    },
    {
      id: "columbia-research",
      company: "Columbia University",
      headline: "Turning search into data.",
      discipline: "RESEARCH / DATA ENGINEERING",
      role: "Research Assistant",
      date: "October 2020 – December 2020",
      details: [
        "Built Python/cURL scrapers for Dr. Qun Wang at the Tow Center for Digital Journalism, collecting Google video search data.",
        "Parsed HTML and video metadata into Excel with BeautifulSoup, Pandas, ffmpeg, and youtube-dl."
      ]
    },
    {
      id: "brokr",
      company: "BROKR.com LLC",
      headline: "A platform for the city.",
      discipline: "REAL ESTATE / FULL-STACK ENGINEERING",
      role: "Co-Owner, Chief Technology Officer (CTO)",
      scale: { name: "BROKR", joinCount: 3, joinOrdinal: 3, laterCount: 21, scopeNote: "Company size, not direct reports." },
      date: "March 2017 – March 2020",
      details: [
        "Helped transform a two-person real estate firm into a 21-person SaaS company through CRM development.",
        "Built and managed pipelines and CRM handling approximately $2M in monthly lead volume using PHP, MySQL, JavaScript, and REST APIs; designed a relational database with 1M+ data points."
      ]
    },
    {
      id: "pure-digital",
      company: "Pure Digital",
      headline: "Where design meets delivery.",
      discipline: "WEB DEVELOPMENT / DIGITAL STRATEGY",
      role: "Account Manager, Lead Developer",
      scale: { name: "Pure Digital", joinCount: 4, joinOrdinal: 4, laterCount: 16, scopeNote: "Company size. I led a department with three direct reports." },
      date: "April 2015 – March 2017",
      details: [
        "Led the software development and technical SEO department with three direct reports, reporting directly to the CEO.",
        "Helped grow the company from three to 16 people and improved client websites for acquisition and conversion."
      ]
    }
  ];

  return <div className="page-container experience-page">
    <header className="experience-intro"><p className="eyebrow">EXPERIENCE / ALEX CASTRO</p><h1>A working history.</h1><p>From building a hosting business to leading enterprise AI engineering. A few chapters in an ongoing story.</p></header>
    <div className="career-summary"><span><strong>2009</strong>STARTED BUILDING</span><span><strong>{experiences.length}</strong>CAREER CHAPTERS</span><span><strong>∞</strong>THINGS TO LEARN</span></div>
    <div className="career-timeline">{experiences.map((exp, i) => <article className={`career-chapter chapter-${i}`} key={exp.company}>
      <aside className="career-margin"><span className="career-number">0{i + 1}</span><span className="career-date">{exp.date}</span><span className="career-discipline">{exp.discipline}</span></aside>
      <div className="career-story"><div className="career-title"><p className="eyebrow">{exp.company}</p><h2>{exp.headline}</h2><p className="career-role">{exp.id === "deloitte" ? <>Head of Engineering, <a className="career-project-link" href={aiAdvantageUrl} target="_blank" rel="noopener noreferrer" aria-label="AI Advantage (opens in a new tab)">AI Advantage</a></> : exp.role}</p></div>
        <ul className="career-details">{exp.details.slice(0, 2).map((item, idx) => <li key={idx}>{item}</li>)}</ul>
        {exp.details.length > 2 && <details className="career-more"><summary>More from this chapter <span aria-hidden="true">+</span></summary><ul className="career-details">{exp.details.slice(2).map((item, idx) => <li key={idx}>{item}</li>)}</ul></details>}
        {exp.scale && <CompanyScale {...exp.scale} />}
        {exp.id === "apc" && <div className="career-metrics"><span><strong>800+</strong>HOSTING CLIENTS</span><span><strong>14</strong>AGE AT FOUNDING</span></div>}
        {exp.id === "brokr" && <div className="career-metrics"><span><strong>$2M</strong>APPROX. MONTHLY LEAD VOLUME</span><span><strong>1M+</strong>DATABASE POINTS</span></div>}
      </div>
    </article>)}</div>
    <div className="career-end"><span>THE NEXT CHAPTER IS STILL BEING WRITTEN.</span><a href="#contact">Let’s talk ↗</a></div>
  </div>;
}
