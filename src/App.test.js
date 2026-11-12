import React, { act } from "react";
import fs from "fs";
import path from "path";
import { createRoot } from "react-dom/client";
import App from "./App";

let container, root, originalMatchMedia;
const renderApp = () => act(() => root.render(<App />));
const tick = (ms = 100) => act(() => jest.advanceTimersByTime(ms));
const main = () => container.querySelector("main");
const entries = () => [...container.querySelectorAll(".portfolio-entry")];
const entry = name => entries().find(item => item.querySelector(".portfolio-company").textContent === name);
const companies = ["AI Advantage, Deloitte", "Disability Data Initiative, Fordham University", "Tow Center Research, Columbia University", "BROKR.com LLC", "Pure Digital", "APC Technology Group"];
const navigate = hash => {
  act(() => { window.location.hash = hash; });
  tick();
};
const expectFullPortfolio = () => {
  expect(entries().map(item => item.querySelector(".portfolio-company").textContent)).toEqual(companies);
  expect(container.querySelector("#education")).not.toBeNull();
  expect(container.querySelector("#contact")).not.toBeNull();
  expect(container.querySelectorAll('.experience-card.is-active')).toHaveLength(1);
  expect(container.querySelectorAll('button.gallery-picture[aria-expanded="true"]')).toHaveLength(1);
  entries().forEach(item => expect(item.closest('[inert], details')).toBeNull());
};

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
  jest.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  jest.useFakeTimers();
  window.history.replaceState(null, "", "/");
  sessionStorage.clear();
  originalMatchMedia = window.matchMedia;
  window.matchMedia = jest.fn(() => ({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
  window.matchMedia = originalMatchMedia;
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

test("opens directly into one concise portfolio with Deloitte first and no desktop or startup", () => {
  renderApp();
  expectFullPortfolio();
  expect(container.querySelectorAll("h1")).toHaveLength(1);
  const heading = container.querySelector("h1.intro-statement");
  expect(heading.textContent).toBe("I’m Alex Castro, an engineering leader at Deloitte.");
  expect(heading.querySelector(".deloitte-brand.is-ready")).not.toBeNull();
  expect(heading.querySelector(".deloitte-letters").textContent).toBe("Deloitte");
  expect(heading.querySelector(".deloitte-dot").getAttribute("aria-hidden")).toBe("true");
  expect(heading.querySelector(".deloitte-dot").textContent).toBe("");
  expect(container.querySelector(".portfolio-intro img, .portfolio-intro svg, .portfolio-hero-art")).toBeNull();
  expect(container.querySelector(".desktop-illustration")).toBeNull();
  expect(container.querySelector('.window, .window-chrome, .window-toolbar, .desktop-nav, .desktop-shortcut, .sidebar, .document-close, [role="dialog"], #about, .about-copy')).toBeNull();
  expect(main().querySelectorAll(":scope > section")).toHaveLength(5);
  expect(main().textContent).not.toMatch(/Sudoku Game Generator|More from this chapter|Skip intro|former startup CTO/);
  expect(document.title).toBe("Alex Castro · Engineering Leadership");
});

test("all six roles keep short summaries, correct dates and distinct research work", () => {
  renderApp();
  expect(entries().map(item => item.querySelector("h3").textContent)).toEqual([
    "Head of Engineering", "Research Assistant", "Research Assistant", "Co-Owner & CTO", "Account Manager & Lead Developer", "Founder",
  ]);
  entries().forEach(item => {
    expect(item.querySelectorAll(".portfolio-summary")).toHaveLength(1);
    expect(item.querySelector(".portfolio-summary").textContent.length).toBeLessThan(250);
  });
  expect(entry("APC Technology Group").querySelector(".portfolio-date").textContent).toBe("August 2009 – April 2015");
  expect(entry("Pure Digital").querySelector(".portfolio-date").textContent).toBe("April 2015 – March 2017");
  expect(entry("Disability Data Initiative, Fordham University").textContent).toContain("March 2020 – December 2021");
  expect(entry("Disability Data Initiative, Fordham University").textContent).toContain("Global Disability Data Initiative");
  expect(entry("Tow Center Research, Columbia University").textContent).toContain("October 2020 – December 2020");
  expect(entry("Tow Center Research, Columbia University").textContent).toContain("Tow Center for Digital Journalism");
  expect(entry("BROKR.com LLC").textContent).toContain("approximately $2M in monthly lead volume");
  expect(entry("BROKR.com LLC").textContent).not.toMatch(/revenue|commission|closed transactions/i);
  expect(main().textContent).not.toMatch(/\$1\.5M|\$20M|1,300|10M\+/);
});

test("career links retain verified external destinations without fallback contact links", () => {
  renderApp();
  const external = [
    ["AI Advantage, Deloitte", "https://www.deloitte.com/global/en/about/press-room/deloitte-launches-ai-advantage-for-cfos.html"],
    ["Disability Data Initiative, Fordham University", "https://www.disabilitydatainitiative.org/reports/disability-data-initiative-2021-report/"],
    ["Tow Center Research, Columbia University", "https://towcenter.columbia.edu/content/research-projects-0"],
    ["Pure Digital", "https://puredigitalco.com/"],
  ];
  external.forEach(([company, href]) => {
    const link = entry(company).querySelector(".portfolio-work-link");
    expect(link.getAttribute("href")).toBe(href);
    expect(link.getAttribute("aria-label")).toContain("opens in a new tab");
    expect(link.tabIndex).toBe(0);
  });
  container.querySelectorAll('a[target="_blank"]').forEach(link => {
    expect(link.getAttribute("rel").split(/\s+/)).toEqual(expect.arrayContaining(["noopener", "noreferrer"]));
  });
  ["BROKR.com LLC", "APC Technology Group"].forEach(company => {
    expect(entry(company).querySelector(".portfolio-work-link")).toBeNull();
  });
});

test("all six experiences use distinct local career illustrations with accessible descriptions", () => {
  renderApp();
  const kinds = ["deloitte", "fordham", "columbia", "brokr", "pure-digital", "apc"];
  const pictures = [...container.querySelectorAll(".gallery-track .portfolio-art img.career-scene")];
  expect(pictures).toHaveLength(6);
  pictures.forEach((img, index) => {
    expect(img.classList.contains(`career-scene--${kinds[index]}`)).toBe(true);
    expect(img.closest(`.portfolio-art--${kinds[index]}`)).not.toBeNull();
    expect(img.getAttribute("src")).toBe(`/artwork/${kinds[index]}-neon-1280.jpg`);
    expect(img.getAttribute("srcset")).toContain(`/artwork/${kinds[index]}-neon-640.jpg 640w`);
    expect(img.getAttribute("alt")).toMatch(/^Color-treated AI-generated illustration: /);
    expect(Number(img.getAttribute("width"))).toBeGreaterThan(0);
    expect(Number(img.getAttribute("height"))).toBeGreaterThan(0);
    expect(img.getAttribute("loading")).toBe(index === 0 ? "eager" : "lazy");
    expect(img.getAttribute("fetchpriority")).toBe(index === 0 ? "high" : "auto");
    expect(img.getAttribute("decoding")).toBe("async");
  });
  expect(new Set(pictures.map(img => img.src)).size).toBe(6);
  expect(container.querySelector(".career-artwork, .portfolio-intro img, .portfolio-intro svg")).toBeNull();
  const video = container.querySelector("video");
  expect(container.querySelectorAll("video")).toHaveLength(1);
  expect(video.getAttribute("src")).toBe("/artwork/video/deloitte-immersive-5s.mp4");
  expect(video.getAttribute("poster")).toBe("/artwork/deloitte-neon-1280.jpg");
  expect(video.loop).toBe(true);
  expect(fs.existsSync(path.join(process.cwd(), "public", video.getAttribute("src")))).toBe(true);
});

test("decorative frames are curved, distinct and hidden from assistive technology", () => {
  renderApp();
  const frames = [...container.querySelectorAll(".gallery-track .portfolio-art > svg.organic-frame")];
  expect(frames).toHaveLength(6);
  frames.forEach(frame => {
    expect(frame.getAttribute("aria-hidden")).toBe("true");
    expect(frame.getAttribute("focusable")).toBe("false");
    expect(frame.getAttribute("viewBox")).toBe("0 0 1000 610");
    expect(frame.querySelector("path").getAttribute("d")).toMatch(/^M.*C.* Z$/);
    expect(frame.querySelector("path").getAttribute("d")).not.toMatch(/NaN|Infinity/);
  });
  expect(new Set(frames.map(frame => frame.querySelector("path").getAttribute("d"))).size).toBe(6);
});

test("one selected chapter opens with all six framed images retained", () => {
  renderApp();
  const tabs = [...container.querySelectorAll('button.gallery-picture')];
  expect(tabs).toHaveLength(6);
  expect(tabs.map(tab => tab.tabIndex)).toEqual([0, -1, -1, -1, -1, -1]);
  entries().forEach((item, index) => {
    expect(item.tagName).toBe("ARTICLE");
    expect(item.hasAttribute("aria-hidden")).toBe(false);
    expect(item.querySelector(".experience-story").hidden).toBe(index !== 0);
    expect(tabs[index].getAttribute("aria-controls")).toBe(item.querySelector(".experience-story").id);
    expect(item.getAttribute("aria-labelledby")).toBe(tabs[index].id);
  });
});

test("clicks, repeated clicks and tap-style pointer events select without resetting or navigating", () => {
  renderApp();
  const tabs = [...container.querySelectorAll('button.gallery-picture')];
  [3, 3, 5, 0, 2].forEach(index => {
    act(() => tabs[index].click());
    expect(entries()[index].classList.contains("is-active")).toBe(true);
    expect(entries().filter(item => !item.querySelector(".experience-story").hidden)).toHaveLength(1);
    expect(tabs[index].getAttribute("aria-expanded")).toBe("true");
    expect(entries()[index].querySelector("img").getAttribute("loading")).toBe("eager");
    expect(window.location.hash).toBe("");
  });
  act(() => tabs[4].click());
  expect(entries()[4].classList.contains("is-active")).toBe(true);
});

test("arrow keys wrap, Home and End select chapters, and focus follows selection", () => {
  renderApp();
  const tabs = [...container.querySelectorAll('button.gallery-picture')];
  act(() => tabs[0].focus());
  const press = (key, expected) => {
    act(() => document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })));
    expect(document.activeElement).toBe(tabs[expected]);
    expect(tabs[expected].getAttribute("aria-expanded")).toBe("true");
    expect(entries()[expected].querySelector(".experience-story").hidden).toBe(false);
  };
  press("ArrowLeft", 5);
  press("ArrowRight", 0);
  press("End", 5);
  press("Home", 0);
  press("ArrowRight", 1);
  expect(tabs.map(tab => tab.tabIndex)).toEqual([-1, 0, -1, -1, -1, -1]);
});

const pointAt = (element, pointerType = "mouse") => {
  const event = new Event("pointerover", { bubbles: true });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  act(() => element.dispatchEvent(event));
};

test("deliberate mouse hover expands a chapter, but touch and coarse pointers do not", () => {
  renderApp();
  pointAt(entries()[1]);
  tick(150);
  expect(entries()[0].classList.contains("is-active")).toBe(true);
  window.matchMedia.mockReturnValue({ matches: true });
  pointAt(entries()[2], "touch");
  tick(150);
  expect(entries()[0].classList.contains("is-active")).toBe(true);
  pointAt(entries()[2]);
  tick(119);
  expect(entries()[0].classList.contains("is-active")).toBe(true);
  tick(1);
  expect(entries()[2].classList.contains("is-active")).toBe(true);
});

test("brief pointer crossings cancel and clicking a different chapter cancels pending hover", () => {
  renderApp();
  window.matchMedia.mockReturnValue({ matches: true });
  pointAt(entries()[1]);
  act(() => entries()[1].dispatchEvent(new Event("pointerout", { bubbles: true })));
  tick(200);
  expect(entries()[0].classList.contains("is-active")).toBe(true);
  pointAt(entries()[2]);
  act(() => container.querySelectorAll('button.gallery-picture')[4].click());
  tick(200);
  expect(entries()[4].classList.contains("is-active")).toBe(true);
});

test("hover never replaces a focused link or a keyboard user's selected chapter", () => {
  renderApp();
  window.matchMedia.mockReturnValue({ matches: true });
  act(() => entries()[0].querySelector("a").focus());
  pointAt(entries()[2]);
  tick(200);
  expect(entries()[0].classList.contains("is-active")).toBe(true);
  const tabs = [...container.querySelectorAll('button.gallery-picture')];
  act(() => { tabs[0].focus(); tabs[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); });
  pointAt(entries()[4]);
  tick(200);
  expect(entries()[1].classList.contains("is-active")).toBe(true);
  expect(document.activeElement).toBe(tabs[1]);
});


test("each experience item ends with its description and keeps any project link above it", () => {
  renderApp();
  expect(entries()).toHaveLength(6);
  expect(container.querySelector(".company-scale")).toBeNull();
  entries().forEach(item => {
    const story = item.querySelector(".portfolio-story");
    const summary = story.querySelector(".portfolio-summary");
    const link = story.querySelector(".portfolio-work-link");
    expect(summary).not.toBeNull();
    expect(story.querySelector('a[href="#contact"]')).toBeNull();
    expect(story.textContent).not.toContain("Ask me about this work");
    expect(story.lastElementChild).toBe(summary);
    expect(summary.nextSibling).toBeNull();
    if (link) expect(link.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

test("education and contacts end the page with the resume area left blank and no public PDF", () => {
  renderApp();
  const sections = [...main().children].map(element => element.id);
  expect(sections).toEqual(["home", "experience", "skills", "education", "contact"]);
  const education = container.querySelector("#education");
  expect(education.textContent).toContain("MS, Computer Science · 2022");
  expect(education.textContent).toContain("BS, Computer Science · 2017");
  expect(education.textContent.length).toBeLessThan(500);
  const contact = container.querySelector("#contact");
  ["mailto:alexpcastro95@gmail.com", "https://linkedin.com/in/alexpcastro", "https://github.com/alexpcastro"].forEach(href => {
    expect(contact.querySelector(`a[href="${href}"]`)).not.toBeNull();
  });
  expect(contact.querySelector("a[download]")).toBeNull();
  expect(contact.querySelector(".portfolio-download").innerHTML).toBe("");
  expect(contact.textContent).not.toMatch(/résumé|resume|cover letter|PDF/i);
  expect(fs.existsSync(path.join(__dirname, "../public/downloads/Alex-Castro-Cover-Letter-and-Resume.pdf"))).toBe(false);
});

test.each(["home", "experience", "skills", "education", "contact"])("#%s focuses its section without hiding other content", id => {
  renderApp();
  navigate(`#${id}`);
  expect(document.activeElement).toBe(container.querySelector(`#${id}`));
  expectFullPortfolio();
});

test.each([["projects", "experience"], ["about", "contact"]])("legacy #%s redirects to #%s on direct load and later navigation", (legacy, target) => {
  window.history.replaceState(null, "", `/#${legacy}`);
  renderApp();
  expect(window.location.hash).toBe(`#${target}`);
  expect(document.activeElement).toBe(container.querySelector(`#${target}`));
  expectFullPortfolio();
  navigate("#education");
  navigate(`#${legacy}`);
  expect(window.location.hash).toBe(`#${target}`);
  expect(document.activeElement).toBe(container.querySelector(`#${target}`));
  expectFullPortfolio();
});

test("unknown hashes leave the full portfolio available", () => {
  window.history.replaceState(null, "", "/#missing");
  renderApp();
  expectFullPortfolio();
  navigate("#another-missing");
  expectFullPortfolio();
  expect(container.querySelector("h1")).not.toBeNull();
});

test("browser back and forward restore section focus without remounting the portfolio", () => {
  renderApp();
  const firstEntry = entries()[0];
  navigate("#experience");
  navigate("#contact");
  act(() => window.history.back());
  tick();
  expect(window.location.hash).toBe("#experience");
  expect(document.activeElement).toBe(container.querySelector("#experience"));
  act(() => window.history.forward());
  tick();
  expect(window.location.hash).toBe("#contact");
  expect(document.activeElement).toBe(container.querySelector("#contact"));
  expect(entries()[0]).toBe(firstEntry);
  expectFullPortfolio();
});

test("skip link focuses main without changing the section URL", () => {
  renderApp();
  navigate("#contact");
  act(() => container.querySelector(".skip-link").click());
  expect(document.activeElement).toBe(main());
  expect(window.location.hash).toBe("#contact");
});


test("pending hover is cancelled on unmount", () => {
  renderApp();
  window.matchMedia.mockReturnValue({ matches: true });
  pointAt(entries()[2]);
  expect(jest.getTimerCount()).toBeGreaterThan(0);
  act(() => root.render(null));
  expect(jest.getTimerCount()).toBe(0);
});


test("tabbing into the selector protects keyboard focus before any arrow key is pressed", () => {
  renderApp();
  window.matchMedia.mockReturnValue({ matches: true });
  const tab = container.querySelector('button.gallery-picture');
  jest.spyOn(tab, "matches").mockImplementation(selector => selector === ":focus-visible");
  act(() => tab.focus());
  pointAt(entries()[3]);
  tick(200);
  expect(entries()[0].classList.contains("is-active")).toBe(true);
  expect(document.activeElement).toBe(tab);
});


test("phones keep the six original cards in order with one expanded story", () => {
  window.matchMedia.mockImplementation(query => ({ matches: query === "(max-width: 760px)", addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  renderApp();
  const controls = [...container.querySelectorAll('button.gallery-picture')];
  expect(controls).toHaveLength(6);
  expect(container.querySelector('.mobile-chapter-nav, [role="tablist"]')).toBeNull();
  expect(container.querySelectorAll('img.career-scene')).toHaveLength(6);
  controls.forEach((button, index) => {
    expect(button.querySelector('svg.organic-frame')).not.toBeNull();
    expect(button.querySelector('img')).not.toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe(String(index === 0));
    expect(button.getAttribute('aria-controls')).toBe(entries()[index].querySelector('.experience-story').id);
    expect(entries()[index].hidden).toBe(false);
    expect(button.tabIndex).toBe(index === 0 ? 0 : -1);
  });
  [3, 3, 5, 1, 0].forEach(index => {
    act(() => controls[index].click());
    expect(controls[index].getAttribute('aria-expanded')).toBe('true');
    expect(entries().filter(item => item.classList.contains('is-active'))).toHaveLength(1);
    expect(entries()[index].querySelector('.experience-story').hidden).toBe(false);
    expect(entries().map(item => item.id)).toEqual(['experience-deloitte', 'experience-fordham', 'experience-columbia', 'experience-brokr', 'experience-pure-digital', 'experience-apc']);
    entries().forEach((item, i) => expect(item.querySelector('.experience-story').getAttribute('aria-hidden')).toBe(String(i !== index)));
    expect(container.querySelectorAll('video')).toHaveLength(1);
    expect(container.querySelector('video').closest('.experience-card')).toBe(entries()[index]);
  });
  act(() => { controls[0].focus(); controls[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); });
  expect(document.activeElement).toBe(controls[1]);
  expect(controls[1].getAttribute('aria-expanded')).toBe('true');
  act(() => controls[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
  expect(document.activeElement).toBe(controls[2]);
  expect(controls[2].getAttribute('aria-expanded')).toBe('true');
});


test("gallery has a visible Experience title and no extra chips or instructions", () => {
  renderApp();
  expect(container.querySelector(".gallery-tabs, .gallery-heading, .gallery-count")).toBeNull();
  expect(container.querySelector("#work-heading").classList.contains("visually-hidden")).toBe(false);
  expect(container.querySelector("#work-heading").textContent).toBe("Experience");
  expect(container.querySelector("#experience").getAttribute("aria-labelledby")).toBe("work-heading");
  expect(container.querySelector("#gallery-help").classList.contains("visually-hidden")).toBe(true);
  expect(container.querySelectorAll("button.gallery-picture")).toHaveLength(6);
});


test("each open experience plays only its own local immersive video", () => {
  renderApp();
  const kinds = ["deloitte", "fordham", "columbia", "brokr", "pure-digital", "apc"];
  const controls = container.querySelectorAll("button.gallery-picture");
  const seen = new Set();
  kinds.forEach((kind, index) => {
    const previous = container.querySelector("video");
    act(() => controls[index].click());
    const video = container.querySelector("video");
    expect(container.querySelectorAll("video")).toHaveLength(1);
    expect(video.closest(".experience-card").classList.contains("is-active")).toBe(true);
    expect(video.getAttribute("src")).toBe(`/artwork/video/${kind}-immersive-5s.mp4`);
    expect(video.getAttribute("poster")).toBe(`/artwork/${kind}-neon-1280.jpg`);
    expect(video.loop).toBe(true);
    expect(video.muted).toBe(true);
    expect(video.playsInline).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), "public", video.getAttribute("src")))).toBe(true);
    if (index > 0) expect(previous.isConnected).toBe(false);
    seen.add(video.getAttribute("src"));
  });
  expect(seen.size).toBe(6);
  expect(container.querySelectorAll("img.career-scene")).toHaveLength(6);
  act(() => controls[0].click());
  expect(container.querySelectorAll("video")).toHaveLength(1);
  expect(container.querySelector("video").getAttribute("src")).toBe("/artwork/video/deloitte-immersive-5s.mp4");
});

test("all experience videos stay as stills for reduced-motion visitors", () => {
  window.matchMedia.mockImplementation(query => ({ matches: query === "(prefers-reduced-motion: reduce)", addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  renderApp();
  container.querySelectorAll("button.gallery-picture").forEach(control => {
    act(() => control.click());
    expect(container.querySelector("video, .gallery-motion-control")).toBeNull();
    expect(container.querySelectorAll("img.career-scene")).toHaveLength(6);
  });
});
