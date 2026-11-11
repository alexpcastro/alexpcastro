import { useEffect, useId, useRef, useState } from "react";

const motionQuery = "(prefers-reduced-motion: reduce)";
const keyboardKeys = Array.from({ length: 18 }, (_, index) => ({
  x: 73 + (index % 6) * 15 + Math.floor(index / 6) * 9,
  y: 228 - (index % 6) * 1.4 + Math.floor(index / 6) * 6,
}));

// Incommensurate waves produce a continuous signal rather than a resetting clip.
function chartHeight(position) {
  return 43 + Math.sin(position * .085) * 12
    + Math.sin(position * .085 * Math.SQRT2 + 1.4) * 6
    + Math.sin(position * .085 * Math.sqrt(3) + 3.8) * 3;
}

export default function DesktopWorkstation() {
  const sceneRef = useRef(null);
  const elapsed = useRef(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.(motionQuery).matches ?? false);
  const screenId = useId().replace(/:/g, "");

  useEffect(() => {
    const preference = window.matchMedia?.(motionQuery);
    const update = () => setReducedMotion(preference?.matches ?? false);
    preference?.addEventListener?.("change", update);
    return () => preference?.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return undefined;
    const scene = sceneRef.current;
    if (!scene) return undefined;
    const find = (name) => scene.querySelector(`[data-part="${name}"]`);
    const monitor = find("monitor"), keyboard = find("keyboard"), mouse = find("mouse");
    const cable = find("cable"), shadow = find("shadow"), power = find("power");
    const chart = find("chart"), chartFill = find("chart-fill"), chartTip = find("chart-tip");
    const reflection = find("reflection"), cursor = find("cursor");
    const lines = [...scene.querySelectorAll("[data-terminal-line]")];
    const keys = [...scene.querySelectorAll("[data-key]")];
    const accents = [...scene.querySelectorAll("[data-accent]")];
    let frame = 0, lastTime = null, lastPaint = 0, intersecting = true, disposed = false;

    const visible = () => !document.hidden && intersecting;
    const draw = (t) => {
      const float = Math.sin(t * .47) * 2.1 + Math.sin(t * .47 * Math.SQRT2 + .8) * .8;
      const sway = Math.sin(t * .29 + .3) * .7;
      monitor.setAttribute("transform", `translate(${sway.toFixed(2)} ${float.toFixed(2)})`);
      keyboard.setAttribute("transform", `translate(0 ${(Math.sin(t * .53 + 2) * .8).toFixed(2)})`);
      const mouseX = Math.sin(t * .37) * 2.3 + Math.sin(t * .37 * Math.sqrt(3)) * .9;
      const mouseY = Math.sin(t * .43 + .8) * 1.1;
      mouse.setAttribute("transform", `translate(${mouseX.toFixed(2)} ${mouseY.toFixed(2)}) rotate(${(Math.sin(t * .31) * 2).toFixed(2)} 257 237)`);
      cable.setAttribute("d", `M${(259 + mouseX).toFixed(2)} ${(229 + mouseY).toFixed(2)} C${(281 + mouseX).toFixed(2)} 205 284 ${(206 + float).toFixed(2)} ${(261 + sway).toFixed(2)} ${(199 + float).toFixed(2)}`);
      shadow.setAttribute("rx", (123 - float * .8).toFixed(2));
      shadow.setAttribute("opacity", (.5 + float * .012).toFixed(3));
      power.setAttribute("r", (2.4 + Math.sin(t * .7) * .15).toFixed(2));
      power.setAttribute("opacity", (.85 + Math.sin(t * .7) * .12).toFixed(3));

      const points = Array.from({ length: 36 }, (_, i) => {
        const x = 11 + i * 3;
        return `${i ? "L" : "M"}${x} ${chartHeight(t * 9 + x).toFixed(2)}`;
      }).join(" ");
      chart.setAttribute("d", points);
      chartFill.setAttribute("d", `${points} L116 69 L11 69Z`);
      chartTip.setAttribute("cy", chartHeight(t * 9 + 116).toFixed(2));
      reflection.setAttribute("transform", `translate(0 ${(Math.sin(t * .18) * 30 + 43).toFixed(2)})`);
      cursor.setAttribute("opacity", (.55 + Math.sin(t * 1.7 + Math.sin(t * .31)) * .25).toFixed(3));
      lines.forEach((line, index) => {
        line.setAttribute("x2", (25 + index * 13 + (Math.sin(t * (.31 + index * .07) + index * 2) + 1) * 19).toFixed(2));
      });
      keys.forEach((key, index) => {
        const press = Math.pow(Math.max(0, Math.sin(t * (1.07 + index * .071) + index * 2.39)), 18);
        key.setAttribute("transform", `translate(0 ${(press * 1.25).toFixed(2)})`);
        key.setAttribute("fill", `rgb(${Math.round(223 - press * 36)},${Math.round(225 - press * 29)},${Math.round(198 - press * 45)})`);
      });
      accents.forEach((accent, index) => {
        const dx = Math.sin(t * (.23 + index * .041) + index * 2.1) * 2;
        const dy = Math.sin(t * (.31 + index * .033) + index) * 2.5;
        accent.setAttribute("transform", `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`);
      });
    };
    const schedule = () => {
      if (!frame && !disposed && visible()) frame = window.requestAnimationFrame(tick);
    };
    function tick(timestamp) {
      frame = 0;
      if (disposed || !visible()) { lastTime = null; return; }
      if (lastTime !== null) elapsed.current += Math.min((timestamp - lastTime) / 1000, .05);
      lastTime = timestamp;
      // DOM writes are capped at 30fps; no layout reads or React renders per frame.
      if (timestamp - lastPaint >= 1000 / 30) { draw(elapsed.current); lastPaint = timestamp; }
      schedule();
    }
    const syncVisibility = () => {
      lastTime = null;
      if (!visible()) { window.cancelAnimationFrame(frame); frame = 0; }
      else schedule();
    };
    document.addEventListener("visibilitychange", syncVisibility);
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      syncVisibility();
    }, { threshold: .05 });
    observer?.observe(scene);
    schedule();
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, [paused, reducedMotion]);

  return <div className="desktop-illustration workstation" data-motion={reducedMotion ? "reduced" : paused ? "paused" : "playing"}>
    <svg ref={sceneRef} viewBox="0 0 320 300" aria-hidden="true" role="presentation">
      <defs>
        <linearGradient id={`${screenId}-shell`} x1="0" y1="0" x2=".75" y2="1"><stop stopColor="#f1edda" /><stop offset=".55" stopColor="#dddcc5" /><stop offset="1" stopColor="#c5cbb0" /></linearGradient>
        <linearGradient id={`${screenId}-side`} x1="0" y1="0" x2="1" y2=".7"><stop stopColor="#b7c2a4" /><stop offset="1" stopColor="#82977c" /></linearGradient>
        <linearGradient id={`${screenId}-base`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#cbd1b9" /><stop offset="1" stopColor="#95a68a" /></linearGradient>
        <radialGradient id={`${screenId}-screen`} cx=".45" cy=".35" r=".85"><stop stopColor="#294b3b" /><stop offset=".65" stopColor="#18382e" /><stop offset="1" stopColor="#102a24" /></radialGradient>
        <radialGradient id={`${screenId}-shadow`}><stop stopColor="#10291f" stopOpacity=".8" /><stop offset="1" stopColor="#10291f" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${screenId}-glow`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#bfdc87" stopOpacity=".2" /><stop offset="1" stopColor="#bfdc87" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${screenId}-glass`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#dbe6bf" stopOpacity="0" /><stop offset=".5" stopColor="#dbe6bf" stopOpacity=".055" /><stop offset="1" stopColor="#dbe6bf" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${screenId}-reflection`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#edeee0" stopOpacity=".13" /><stop offset=".55" stopColor="#edeee0" stopOpacity="0" /></linearGradient>
        <pattern id={`${screenId}-dots`} width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".45" fill="#b7ce97" opacity=".2" /></pattern>
        <pattern id={`${screenId}-scanlines`} width="128" height="3" patternUnits="userSpaceOnUse"><path d="M0 1.5H128" stroke="#061b17" strokeOpacity=".12" strokeWidth=".5" /></pattern>
        <clipPath id={`${screenId}-clip`}><rect width="128" height="86" rx="4" /></clipPath>
      </defs>
      <ellipse data-part="shadow" cx="170" cy="263" rx="123" ry="26" fill={`url(#${screenId}-shadow)`} opacity=".5" />
      <ellipse cx="158" cy="253" rx="70" ry="9" fill="#10291f" opacity=".12" />
      <g data-part="monitor" strokeLinejoin="round" strokeLinecap="round">
        {/* The stand sits behind the case, with separate top, neck and foot planes. */}
        <path d="m132 191 54-5 9 42-27 13-39-10Z" fill={`url(#${screenId}-base)`} stroke="#314d3d" strokeWidth="1.5" />
        <path d="m148 197 28-3 7 32-16 7-17-7Z" fill="#a3b294" />
        <path d="m118 231 49-8 37 10-31 13-55-9Z" fill="#d3d8bf" stroke="#314d3d" strokeWidth="1.5" />
        <path d="m118 237 55 9 31-13v5l-31 13-55-9Z" fill="#8d9f82" stroke="#314d3d" strokeWidth="1.5" />
        <path d="m125 232 42-6 28 8-23 9Z" fill="#e4e4cf" opacity=".6" />

        {/* Rounded CRT shell: one light source, chamfered edges, a recessed screen. */}
        <path d="M65 60 215 45Q221 44 227 48l33 24q6 4 6 11v111q0 6-6 8L99 219q-6 1-11-3l-29-23q-4-3-4-9V71q0-10 10-11Z" fill={`url(#${screenId}-base)`} stroke="#2d4839" strokeWidth="1.8" />
        <path d="m219 47 41 27q6 4 6 10v108q0 6-5 7l-42-27Z" fill={`url(#${screenId}-side)`} stroke="#46604a" strokeWidth="1.2" />
        <path d="m228 62 28 20q3 2 3 7v94" fill="none" stroke="#d1d8bd" strokeWidth="1.2" opacity=".6" />
        <path d="m61 187 156-16 44 28-162 17q-5 1-9-2Z" fill="#aab89b" stroke="#526b50" strokeWidth="1.1" />
        <path d="m67 193 147-15 36 22-150 15Z" fill="#bdc6ac" opacity=".55" />
        <path d="m235 96 18 12m-18-6 18 12m-18-6 18 12m-18-6 18 12m-18-6 18 12m-18-6 18 12" stroke="#647f62" strokeWidth="2" />
        <path d="m236 95 17 11m-17-5 17 11m-17-5 17 11m-17-5 17 11m-17-5 17 11m-17-5 17 11" stroke="#c4ceb0" strokeWidth=".6" opacity=".6" />
        <circle cx="255" cy="184" r="1.7" fill="#617c61" /><path d="m254 183 2 2" stroke="#a7b697" strokeWidth=".7" />
        <path d="M65 60 215 45q8-1 8 7v118q0 7-8 8L64 193q-9 1-9-8V71q0-10 10-11Z" fill={`url(#${screenId}-shell)`} stroke="#314b3b" strokeWidth="1.6" />
        <path d="m64 65 151-15q3 0 3 4v113" fill="none" stroke="#fff8e2" strokeWidth="1.7" opacity=".8" />
        <path d="m59 74 1 111q0 3 4 3l150-15" fill="none" stroke="#a6b393" strokeWidth="1" />
        <path d="M72 72 204 59q8-1 8 7v91q0 7-7 8L72 178q-7 1-7-6V80q0-7 7-8Z" fill="#98a58a" stroke="#b7bfa2" strokeWidth="1" />
        <path d="m75 77 126-12q5 0 5 6v84q0 4-5 5L75 173q-5 0-5-5V83q0-5 5-6Z" fill="#10271f" stroke="#607759" strokeWidth="2" />
        <path d="m73 173 130-13q5-1 5-6" fill="none" stroke="#eee9cf" strokeOpacity=".75" strokeWidth="1.2" />
        <g transform="matrix(1 -.094 0 1 75 80)">
          <g clipPath={`url(#${screenId}-clip)`}>
            <rect width="128" height="86" fill={`url(#${screenId}-screen)`} />
            <rect width="128" height="86" fill={`url(#${screenId}-dots)`} />
            <path d="M11 28h105M11 49h105M11 69h105M32 25v44M53 25v44M74 25v44M95 25v44" stroke="#7b9c68" strokeOpacity=".14" strokeWidth=".5" />
            <path data-part="chart-fill" d="M11 56 30 34 51 50 77 20 116 44V69H11Z" fill={`url(#${screenId}-glow)`} />
            <path data-part="chart" d="M11 56 30 34 51 50 77 20 116 44" fill="none" stroke="#c7e49b" strokeWidth="1.5" strokeLinejoin="round" />
            <circle data-part="chart-tip" cx="116" cy="44" r="1.8" fill="#eff4c5" />
            <path d="m11 9 6 4-6 5" fill="none" stroke="#d8e8b3" strokeWidth="1.3" /><rect data-part="cursor" x="21" y="16" width="7" height="1.5" fill="#d8e8b3" />
            <path d="M10 22h107" stroke="#91ae7d" strokeOpacity=".25" strokeWidth=".6" />
            <circle cx="110" cy="12" r="1.3" fill="#89b36c" /><circle cx="116" cy="12" r="1.3" fill="#cf9364" opacity=".7" />
            <line data-terminal-line="0" x1="11" y1="76" x2="68" y2="76" stroke="#668e63" strokeWidth=".8" />
            <line data-terminal-line="1" x1="11" y1="82" x2="43" y2="82" stroke="#527a53" strokeWidth=".8" />
            <rect width="128" height="86" fill={`url(#${screenId}-scanlines)`} />
            <path d="M0 0H98L28 86H0Z" fill={`url(#${screenId}-reflection)`} />
            <rect data-part="reflection" y="-12" width="128" height="24" fill={`url(#${screenId}-glass)`} />
            <rect x=".5" y=".5" width="127" height="85" rx="4" fill="none" stroke="#0b211c" strokeOpacity=".7" />
          </g>
        </g>
        <path d="m74 183 19-2m-19 4 19-2" stroke="#8c9f7f" strokeWidth="1" />
        <rect x="99" y="179" width="7" height="3" rx="1" fill="#b7c1a3" transform="rotate(-5 99 179)" />
        <circle cx="191" cy="176" r="4.2" fill="#819477" stroke="#eef0d5" strokeWidth=".8" />
        <circle data-part="power" cx="191" cy="176" r="2.4" fill="#dba171" /><circle cx="190.3" cy="175.3" r=".7" fill="#f6d6a1" opacity=".75" />
        <path d="m201 174 4-.4" stroke="#a6b393" strokeWidth="2" />
      </g>
      <g data-part="keyboard" strokeLinejoin="round">
        <path d="m58 224 114-11q3 0 6 2l54 27q3 2 2 5v6l-128 16-51-25v-14q0-4 3-6Z" fill="#a1b18f" stroke="#304b39" strokeWidth="1.5" />
        <path d="m58 224 114-11 62 30-128 17-51-25v-7Z" fill={`url(#${screenId}-shell)`} stroke="#516d50" strokeWidth="1.2" />
        <path d="m61 226 110-10 55 27-119 14-46-23Z" fill="#f0edd8" />
        <path d="m65 226 107-10 45 24-109 14-43-21Z" fill="#aebca0" stroke="#9aaa8c" strokeWidth=".6" />
        {Array.from({ length: 6 }, (_, index) => <path key={`function-${index}`} d={`M${70 + index * 15} ${223 - index * 1.4}l12-1 5 3-12 1Z`} fill={index === 0 ? "#c8956c" : "#9eaf8d"} stroke="#7f9474" strokeWidth=".6" />)}
        {keyboardKeys.map(({ x, y }, index) => <g key={index}>
          <path d={`M${x} ${y + 1.6}l12-1 7 4-12 1Z`} fill="#879d79" stroke="#829574" strokeWidth=".7" />
          <path data-key={index} d={`M${x} ${y}l12-1 7 4-12 1Z`} fill="#dfe1c6" stroke="#9aa98b" strokeWidth=".65" />
          <path d={`m${x + 2} ${y + .2} 8-.7`} fill="none" stroke="#f5f0d9" strokeOpacity=".7" strokeWidth=".6" />
        </g>)}
        <path d="m111 249 72-8 8 4v2l-72 8-8-4Z" fill="#8a9f7d" stroke="#7e9472" strokeWidth=".6" />
        <path d="m111 249 72-8 8 4-72 8Z" fill="#c4d0ad" stroke="#9aaa8b" strokeWidth=".6" />
        <path d="m115 249 66-7" fill="none" stroke="#edf0ce" strokeWidth=".7" />
        <path d="m58 236 49 24 123-16" fill="none" stroke="#edf0d5" strokeWidth="1" />
        <path d="m111 264 117-15" fill="none" stroke="#7c9472" strokeWidth=".8" />
      </g>
      <path data-part="cable" d="M259 229c22-24 23-23 2-30" fill="none" stroke="#86997b" strokeWidth="1.5" strokeLinecap="round" />
      <g data-part="mouse" strokeLinejoin="round">
        <path d="M246 232c16-7 39 6 30 16-10 11-41-4-33-13Z" fill="#849a79" stroke="#314d39" strokeWidth="1.2" />
        <path d="M246 229c15-6 38 7 29 15-11 10-40-4-32-12Z" fill={`url(#${screenId}-shell)`} stroke="#647e5e" strokeWidth="1" />
        <path d="M246 231c10-5 26 3 28 8" fill="none" stroke="#f7efd8" strokeWidth="1.1" opacity=".8" />
        <path d="m257 229 5 9m-15-4 23-1" fill="none" stroke="#95a687" strokeWidth=".8" />
        <path d="m255 232 4 1" stroke="#7b9472" strokeWidth="1.8" strokeLinecap="round" />
      </g>
      <g fill="none" stroke="#afbf9b" strokeWidth=".9" opacity=".7">
        <path data-accent="0" d="M34 153h10m-5-5v10" />
        <path data-accent="1" d="M282 72h10m-5-5v10" />
        <circle data-accent="2" cx="36" cy="205" r="2" stroke="#c7956e" />
        <path data-accent="3" d="M284 119h3m5 0h3" stroke="#c7956e" />
      </g>
    </svg>
    {!reducedMotion && <button className="workstation-motion-toggle" onClick={() => setPaused(value => !value)} aria-label={paused ? "Play workstation animation" : "Pause workstation animation"} aria-pressed={paused} title={paused ? "Play animation" : "Pause animation"}>
      <svg viewBox="0 0 20 20" aria-hidden="true">{paused ? <path d="m7 4 9 6-9 6Z" fill="currentColor" /> : <path d="M7 4v12M13 4v12" fill="none" stroke="currentColor" strokeWidth="2" />}</svg>
    </button>}
  </div>;
}
