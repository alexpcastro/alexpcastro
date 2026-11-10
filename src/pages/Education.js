import TerminalType from "../components/TerminalType";
import "../styles.css";

export default function Education() {
  const education = [
    {
      school: "Fordham University",
      degree: "MS in Computer Science",
      date: "Grad. Fall 2022",
      details: [
        "Machine learning, data modeling, data preparation, classification, regression, clustering, association rules mining, and visualization.",
        <>
          Co-authored <a href="https://ieeexplore.ieee.org/document/9854976" target="_blank" rel="noopener noreferrer">ScreenCoin: A Blockchain-Enabled Decentralized Ad Network</a>, published at IEEE COINS 2022.
        </>
      ]
    },
    {
      school: "Fordham University",
      degree: "BS in Computer Science",
      date: "Grad. Spring 2017",
      details: ["American Studies Honors Program", "Sigma Xi Nominee"]
    },
    {
      school: "Esade - Ramon Llull University",
      degree: "College Courses",
      date: "Summer 2014",
      details: []
    },
    {
      school: "University of Oxford",
      degree: "IB® Courses",
      date: "Winter 2013",
      details: []
    },
    {
      school: "American School of Barcelona",
      degree: "High School",
      date: "Grad. Spring 2013",
      details: ["International Baccalaureate® (IB) Diploma", "American High School Diploma"]
    }
  ];

  return (
    <div className="page-container">
      <TerminalType typedText="Education" hideCursorOnFinish />
      {education.map((edu, i) => (
        <div
          key={edu.school}
          className="titleBox fade-in"
          style={{ animationDelay: `${(i + 1) * 0.3}s` }}
        >
          <h3>{edu.school}</h3>
          <div className="description">
            <span>{edu.degree}</span>
            <span className="date">{edu.date}</span>
          </div>
          {edu.details.length > 0 && (
            <ul>
              {edu.details.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}