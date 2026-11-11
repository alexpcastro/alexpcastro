

import "../styles.css";

export default function About() {
  return (
    <div className="page-container">
      <p className="eyebrow">ABOUT / ALEX CASTRO</p>
      <h1>About me</h1>
      <div className="fade-in" style={{ animationDelay: "0.3s" }}>
        <p>
          I'm an accomplished software engineer with a BS and MS in Computer Science from Fordham University,
          where I completed dual specializations in Artificial Intelligence and Data Science.
        </p>
      </div>
      <div className="fade-in" style={{ animationDelay: "0.6s" }}>
        <p>
          I’m Head of Engineering for Deloitte AI Advantage, leading a core team of 15 engineers and owning
          end-to-end AI development and delivery, from client discussions through production and hypercare.
        </p>
      </div>
      <div className="fade-in" style={{ animationDelay: "0.9s" }}>
        <p>
          I’m a hands-on player-coach and former startup CTO, working with React, Python, FastAPI, and AWS for AI in finance.
          I own product architecture and technical decisions, lead frontend and design, and support global delivery teams.
        </p>
      </div>
      <div className="fade-in" style={{ animationDelay: "1.2s" }}>
        <p>
          My academic foundation provides a strong understanding of core computer science principles, including data structures and
          algorithms, systems design, theory of computation, database systems, distributed computing, and blockchain technologies.
        </p>
      </div>
      <div className="fade-in" style={{ animationDelay: "1.5s" }}>
        <p>
          I'm also the co-author of an IEEE-published paper introducing ScreenCoin, a blockchain-enabled decentralized ad network.
          Proud Hispanic, born in the United States and a U.S. citizen, fluent in English and Spanish, with an international background that includes attending high school in Barcelona.
        </p>
      </div>
      <div className="fade-in d-flex align-items-center" style={{ animationDelay: "1.8s", marginTop: "16px" }}>
        <img src="https://flagcdn.com/us.svg" height="20" alt="United States" /> +
        <img src="https://flagcdn.com/es.svg" height="20" alt="Spain" />
      </div>
    </div>
  );
}