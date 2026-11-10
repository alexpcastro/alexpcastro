import "./styles.css";
import { useState, useEffect } from "react";
import Clock from "react-clock";
import LiveClock from "./components/LiveClock";
import "react-clock/dist/Clock.css";
import TerminalType from "./components/TerminalType";
import About from "./pages/About";
import Skills from "./pages/Skills";
import Projects from "./pages/Projects";
import Education from "./pages/Education";
import Experience from "./pages/Experience";
import Contact from "./pages/Contact";

// Inline BackButton component for self-contained usage
const BackButton = ({ onClick }) => (
  <button className="backBtn" onClick={onClick}>
    &lsaquo;Go back
  </button>
);

export default function App() {
  const [content, setContent] = useState(false);
  const [value, setValue] = useState(new Date());
  const [showButtons, setShowButtons] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [lastPage, setLastPage] = useState(null);
  const [completedPages, setCompletedPages] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => setValue(new Date()), 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Modular, maintainable homeContent and button logic
  const pageButtons = [
    { label: "About", content: <About /> },
    { label: "Skills", content: <Skills /> },
    { label: "Projects", content: <Projects /> },
    { label: "Experience", content: <Experience /> },
    { label: "Education", content: <Education /> },
    { label: "Get in Touch", content: <Contact /> }
  ];

  const returnMessages = {
    About: "Hope you enjoyed learning more about me.",
    Skills: "Pretty cool skills, right?",
    Projects: "Some fun projects, huh?",
    Experience: "Quite the journey, don't you think?",
    Education: "Back from my academic roots!",
    Contact: "Ready to connect anytime."
  };

  const homeIntroText = isReturning 
    ? (returnMessages[lastPage] || "Welcome back.")
    : `Welcome.\n\nI'm Alex Castro, an engineer and designer based in Denver, Colorado.\n\nExplore my work, background, and experience.`;

  // Reset buttons when home intro changes
  useEffect(() => {
    console.log("Intro text changed, resetting buttons...");
    setShowButtons(false);
  }, [homeIntroText]);

  useEffect(() => {
    if (!showButtons) {
      const timer = setTimeout(() => {
        console.log("Fallback triggered: Forcing buttons to show.");
        setShowButtons(true);
      }, (homeIntroText.length * 80) + 1000);
      return () => clearTimeout(timer);
    }
  }, [homeIntroText, showButtons]);

  const handleButtonClick = (label, contentBlock) => {
    setLastPage(label);
    setContent(contentBlock);
    if (!completedPages.includes(label)) {
      setCompletedPages([...completedPages, label]);
    }
  };

  const homeContent = (
    <div key={homeIntroText} className="home-container">
      <div className={`home-inner ${showButtons ? 'expanded' : ''}`}>
        <TerminalType 
          typedText={homeIntroText} 
          hideCursorOnFinish 
          onComplete={() => {
            console.log("Typing complete, showing buttons.");
            setShowButtons(true);
          }} 
        />
        {showButtons && (
          <ul id="nav" className="button-grid" style={{ marginTop: '24px' }}>
            {pageButtons.map((btn, index) => (
              <li
                key={btn.label}
                className={`fade-in${completedPages.includes(btn.label) ? ' completed' : ''}`}
                style={{ animationDelay: `${index * 0.3}s` }}
              >
                <button onClick={() => handleButtonClick(btn.label, btn.content)}>
                  {btn.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  let title = "<AlexCastro/>";
  
  return (
    <div id="app">
      <div id="header">
        <h1 className="highlighted">{title}</h1>
        <span id="time">
        <Clock 
          value={value}
          size={15}
          hourHandWidth={1.5}
          minuteHandWidth={0.8}
          secondHandWidth={1.1}
          renderNumbers={false}
        />
          <LiveClock className="analogClock" date={value} />
        </span>
        {new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}
      </div>
      <div id="body">
        <div>
          {content ? <BackButton onClick={() => { 
            setContent(false); 
            setIsReturning(true);
          }} /> : ""}
          {content ? content : homeContent}
        </div>
      </div>
      <div id="footer">&copy; 2025 Alex Castro</div>
    </div>
  );
}
