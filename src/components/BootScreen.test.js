import React, { act } from "react";
import { createRoot } from "react-dom/client";
import BootScreen from "./BootScreen";

let root;
let container;
let finish;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers();
  window.matchMedia = jest.fn(() => ({ matches: false }));
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  finish = jest.fn();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.clearAllTimers();
  jest.useRealTimers();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
const render = (callback = finish) => act(() => root.render(<BootScreen onFinish={callback} />));
const tick = (ms) => act(() => jest.advanceTimersByTime(ms));

test("provides an accessible dialog, focuses skip, and completes the timed sequence", () => {
  render();
  expect(container.querySelector('[role="dialog"]').getAttribute("aria-label")).toBe("Desktop startup");
  expect(container.querySelector('[role="dialog"]').getAttribute("aria-modal")).toBe("true");
  expect(document.activeElement).toBe(container.querySelector("button"));
  expect(container.querySelectorAll(".boot-visible")).toHaveLength(1);
  tick(450);
  expect(container.querySelectorAll(".boot-visible")).toHaveLength(2);
  tick(450);
  expect(container.querySelectorAll(".boot-visible")).toHaveLength(3);
  tick(699);
  expect(finish).not.toHaveBeenCalled();
  tick(1);
  expect(finish).toHaveBeenCalledTimes(1);
});

test.each(["Escape", "Enter"])("%s skips startup", (key) => {
  render();
  act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key })));
  expect(finish).toHaveBeenCalledTimes(1);
});

test("skip button completes startup", () => {
  render();
  act(() => container.querySelector("button").click());
  expect(finish).toHaveBeenCalledTimes(1);
});

test("reduced motion finishes without waiting for animation", () => {
  window.matchMedia = jest.fn(() => ({ matches: true }));
  render();
  tick(0);
  expect(finish).toHaveBeenCalledTimes(1);
});

test("uses the current callback after a render without restarting startup", () => {
  render();
  tick(900);
  const latest = jest.fn();
  render(latest);
  tick(700);
  expect(finish).not.toHaveBeenCalled();
  expect(latest).toHaveBeenCalledTimes(1);
});

test("unmount removes timers and keyboard listeners", () => {
  render();
  act(() => root.render(null));
  tick(2000);
  act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  expect(finish).not.toHaveBeenCalled();
});


test("repeated mounts restart startup cleanly with only the latest timer", () => {
  render();
  tick(900);
  act(() => root.render(null));
  render();
  expect(container.querySelectorAll(".boot-visible")).toHaveLength(1);
  tick(700);
  expect(finish).not.toHaveBeenCalled();
  tick(900);
  expect(finish).toHaveBeenCalledTimes(1);
});
