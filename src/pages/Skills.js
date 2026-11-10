import TerminalType from "../components/TerminalType";
import "../styles.css";

export default function Skills() {
  const skillSections = [
    {
      title: "AI & Agentic Systems",
      skills: [
        "LLMs", "AI agents", "RAG", "Prompt engineering", "MCP",
        "LLM evaluations", "Amazon Bedrock", "Amazon Bedrock AgentCore",
        "Strands Agents", "OpenAI Codex", "GitHub Copilot"
      ]
    },
    {
      title: "Full-Stack Development",
      skills: [
        "React", "Python", "FastAPI", "JavaScript", "TypeScript", "Node.js",
        "SQL", "RESTful APIs", "GraphQL", "WebSocket streaming",
        "OAuth", "Accessibility"
      ]
    },
    {
      title: "Cloud & Infrastructure",
      skills: [
        "AWS", "Google Cloud (GCP)", "Cloud Run", "Cloud Build",
        "Terraform", "Docker", "Linux", "Snowflake",
        "Vector databases", "Observability"
      ]
    },
    {
      title: "Engineering Leadership & Delivery",
      skills: [
        "Technical strategy", "System architecture design", "Event-driven systems",
        "CI/CD pipelines", "Git", "GitHub Actions", "Agile delivery", "Figma", "Semgrep"
      ]
    }
  ];

  return (
    <div className="page-container">
      <TerminalType typedText="Skills" hideCursorOnFinish />
      {skillSections.map((section, i) => (
        <div 
          key={section.title} 
          className="titleBox fade-in" 
          style={{ animationDelay: `${(i + 1) * 0.3}s` }}
        >
          <h3>{section.title}</h3>
          <ul className="skillsList">
            {section.skills.map((skill, idx) => (
              <li key={idx}>{skill}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}