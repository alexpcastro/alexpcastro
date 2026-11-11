import React, { act } from "react";
import { createRoot } from "react-dom/client";
import CompanyScale from "./CompanyScale";
let container;
let root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
const render = props => act(() => root.render(<CompanyScale {...props} />));
const pure = { name: "Pure Digital", joinCount: 4, joinOrdinal: 4, laterCount: 16 };

test.each([["Pure Digital", 4, 16, "4th"], ["BROKR", 3, 21, "3rd"]])("%s has one compact grid, exact early cohort, and distinctive Alex", (name, joinCount, laterCount, ordinal) => {
  render({ name, joinCount, joinOrdinal: joinCount, laterCount });
  const groups = container.querySelectorAll(".company-scale-people");
  expect(groups).toHaveLength(1);
  expect(groups[0].children).toHaveLength(laterCount);
  expect(groups[0].querySelectorAll(".is-early")).toHaveLength(joinCount);
  expect(groups[0].querySelectorAll(".is-alex")).toHaveLength(1);
  expect(groups[0].children[joinCount - 1].classList.contains("is-alex")).toBe(true);
  expect(groups[0].querySelector(".company-scale-star")).not.toBeNull();
  expect(groups[0].querySelector(".company-scale-outline")).not.toBeNull();
  expect(container.querySelector(".company-scale-position").textContent).toBe(`Alex · ${ordinal} person`);
});

test("AI Advantage is approximate, 100+, and explicitly organization rather than direct reports", () => {
  const scopeNote = "AI Advantage organization size, not direct reports or the core engineering team.";
  render({ name: "AI Advantage", joinCount: 12, joinOrdinal: 12, approximateJoin: true, laterCount: 100, laterPlus: true, scopeNote });
  const group = container.querySelector(".company-scale-people");
  expect(group.children).toHaveLength(100);
  expect(group.querySelectorAll(".is-early")).toHaveLength(12);
  expect(group.querySelectorAll(".is-alex")).toHaveLength(1);
  expect(container.textContent).toContain("Around 12");
  expect(container.textContent).not.toContain("12th");
  expect(container.querySelector(".company-scale-plus").textContent).toBe("+");
  expect(container.querySelector(".company-scale-scope").textContent).toBe(scopeNote);
});

test("accessible description conveys the entire visual without focus targets", () => {
  render(pure);
  const figure = container.querySelector("figure");
  expect(document.getElementById(figure.getAttribute("aria-labelledby")).textContent).toContain("Pure Digital");
  const description = document.getElementById(figure.getAttribute("aria-describedby")).textContent;
  expect(description).toContain("as the 4th person, with 4 people");
  expect(description).toContain("later reached 16 people");
  expect(description).toContain("Filled figures show the group when Alex joined; outlined figures show later additions");
  expect(description).toContain("starred figure is Alex");
  expect(container.querySelector(".company-scale-legend").textContent).toContain("1 symbol = 1 person");
  expect(container.querySelectorAll("a, button, input, [tabindex]")).toHaveLength(0);
  container.querySelectorAll("svg").forEach(svg => {
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("focusable")).toBe("false");
  });
});

test("multiple figures have unique accessible labels", () => {
  act(() => root.render(<><CompanyScale {...pure} /><CompanyScale {...pure} name="BROKR" /></>));
  const figures = container.querySelectorAll("figure");
  expect(figures[0].getAttribute("aria-labelledby")).not.toBe(figures[1].getAttribute("aria-labelledby"));
  expect(figures[0].getAttribute("aria-describedby")).not.toBe(figures[1].getAttribute("aria-describedby"));
});

test("rerender replaces the entire cohort and Alex marker", () => {
  render(pure);
  render({ name: "BROKR", joinCount: 3, joinOrdinal: 3, laterCount: 21 });
  expect(container.querySelectorAll(".company-scale-people svg")).toHaveLength(21);
  expect(container.querySelectorAll(".company-scale-people .is-early")).toHaveLength(3);
  expect(container.querySelectorAll(".company-scale-people .is-alex")).toHaveLength(1);
  expect(container.querySelector(".company-scale-plus")).toBeNull();
});

test("only counts above forty use twenty desktop columns", () => {
  render({ name: "AI Advantage", joinCount: 12, approximateJoin: true, laterCount: 100, laterPlus: true });
  const group = container.querySelector(".company-scale-people");
  expect(group.classList.contains("is-dense")).toBe(true);
  expect(group.style.getPropertyValue("--people-columns")).toBe("20");
  expect(group.style.getPropertyValue("--people-width")).toBe("397px");
  render({ name: "Boundary", joinCount: 12, laterCount: 40 });
  expect(container.querySelectorAll(".company-scale-people.is-dense")).toHaveLength(0);
});
