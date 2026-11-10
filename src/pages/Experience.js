import TerminalType from "../components/TerminalType";
import "../styles.css";

export default function Experience() {
  const experiences = [
    {
      company: "Deloitte",
      role: "Head of Engineering, AI Advantage",
      date: "March 2022 – Present",
      details: [
        "Lead engineering for Deloitte AI Advantage, owning product architecture, technical direction, and end-to-end AI development and delivery.",
        "Work hands-on across React, Python, FastAPI, and AWS while leading frontend and design and improving AI development practices, guardrails, and evaluations."
      ]
    },
    {
      company: "APC Technology Group, Inc.",
      role: "Founder, Lead Developer",
      date: "2009 - Present",
      details: [
        "Sold web, voice, and game server hosting to over 800 clients on a cluster of Linux and Windows dedicated servers in IBM datacenters.",
        "Pitched, closed, and developed webpages for clients including Pedro Pierluisi (Governor of PR), Amigo.com (Walmart), liftefoils.com, ColumbiaHeights.co, Lavanderiapr.com, node-living.com, EmpireCapitalHoldings.com, VCPRE.com.",
        "Grew personal network of websites to over 10 million unique visitors, currently hosted on Google Cloud, including Minecraft-Seeds.net."
      ]
    },
    {
      company: "BROKR.com LLC",
      role: "Co-Owner, CTO",
      date: "March 2017 - March 2020",
      details: [
        "Developed and owned high-quality code across all levels of the stack from investigation to implementation to testing to release.",
        "Built and operated robust and performant CRM, driving $1.5M in monthly rental leads and managing business operations, built using HTML, PHP, MySQL, JavaScript, JQuery, JSON, XML, and RESTful API integrations. Designed relational database with >1M datapoints.",
        "Translated designs and wireframes into high-quality code and pixel-perfect, reliable, and trustworthy UIs on web and mobile interfaces.",
        "Application and API optimization and testing to improve response times and stability using Postman, JMeter.",
        "Designed and built back-end systems, services, and tools to consume HTTP APIs, access databases, process data, and format output."
      ]
    },
    {
      company: "Pure Digital",
      role: "Account Manager, Lead Developer",
      date: "April 2015 – March 2017",
      details: [
        "Joined as employee #4 and participated in growth to 16 full-time in-house employees, lead of SEO and software development projects.",
        "Pitched, closed, and developed SEO campaigns, new webpages, and scripts with PHP, SQL, HTML, CSS, and JavaScript for standalone, WordPress, Magento, and Shopify pages: Guardian Life Insurance, First American Corporation, EdgarAgents, PetWellbeing, Sextoy.com.",
        "Built, tested, shipped, and iterated on webpage improvements to increase client acquisitions, conversions, retention, and lower costs.",
        "Lead SEO department of 3, performed deep audits of website code and organic search behavior to grow client search market share."
      ]
    }
  ];

  return (
    <div className="page-container">
      <TerminalType typedText="My Experience" hideCursorOnFinish />
      <p className="fade-in" style={{ animationDelay: "0.3s" }}>
        Explore where I've worked and grown.
      </p>
      {experiences.map((exp, i) => (
        <div
          key={exp.company}
          className="titleBox fade-in"
          style={{ animationDelay: `${(i + 2) * 0.3}s` }}
        >
          <h3>{exp.company}</h3>
          <div className="description">
            <span>{exp.role}</span>
            <span className="date">{exp.date}</span>
          </div>
          <ul>
            {exp.details.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
      <figure className="fade-in" style={{ animationDelay: `${(experiences.length + 2) * 0.3}s` }}>
        <blockquote>The only source of knowledge is experience.</blockquote>
        <figcaption>- Albert Einstein</figcaption>
      </figure>
    </div>
  );
}