import React, { useId } from "react";
import "./CareerArtwork.css";

// SIGNAL / FORM: original, deterministic vector sculptures. No remote images,
// canvas, timers or runtime dependencies. These are interpretations, not products.
const TAU = Math.PI * 2;
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = a => { const length = Math.hypot(...a) || 1; return a.map(v => v / length); };
const sub = (a, b) => a.map((v, i) => v - b[i]);
const rotate = ([x, y, z], [a, b, c]) => {
  [y, z] = [y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
  [x, z] = [x * Math.cos(b) + z * Math.sin(b), -x * Math.sin(b) + z * Math.cos(b)];
  return [x * Math.cos(c) - y * Math.sin(c), x * Math.sin(c) + y * Math.cos(c), z];
};
const materials = { chrome: [194, 190, 216], violet: [149, 105, 239], lime: [204, 236, 88], coral: [246, 111, 112] };
function metal(normal, material) {
  const base = materials[material];
  const light = Math.abs(normal[0] * -.36 + normal[1] * -.6 + normal[2] * .71);
  const sheen = Math.pow(light, 9);
  const edge = Math.pow(1 - Math.abs(normal[2]), 3);
  return `rgb(${base.map((v, i) => Math.round(Math.min(255, 12 + v * (.15 + light * .63) + sheen * 94 + edge * [34, 17, 50][i]))).join(",")})`;
}
function sculpture(surface, { u = 80, v = 14, rotation = [.5, -.3, -.25], scale = 75, center = [300, 200], material = "chrome" } = {}) {
  const point = (i, j) => rotate(surface(i / u, j / v), rotation);
  const project = p => `${(center[0] + p[0] * scale).toFixed(2)},${(center[1] + p[1] * scale).toFixed(2)}`;
  const faces = [];
  for (let i = 0; i < u; i++) for (let j = 0; j < v; j++) {
    const a = point(i, j), b = point(i + 1, j), c = point(i + 1, j + 1), d = point(i, j + 1);
    const normal = unit(cross(sub(b, a), sub(d, a)));
    faces.push({ points: [a, b, c, d].map(project).join(" "), depth: (a[2] + b[2] + c[2] + d[2]) / 4, color: metal(normal, material) });
  }
  return faces.sort((a, b) => a.depth - b.depth);
}
const knotCenter = t => [(2 + Math.cos(3 * t)) * Math.cos(2 * t) * .62, (2 + Math.cos(3 * t)) * Math.sin(2 * t) * .62, Math.sin(3 * t) * .68];
const knot = (u, v) => {
  const t = u * TAU, p = knotCenter(t), tangent = unit(sub(knotCenter(t + .001), p));
  const normal = unit(cross(tangent, [0, 0, 1])), binormal = cross(tangent, normal);
  return p.map((x, i) => x + .31 * (normal[i] * Math.cos(v * TAU) + binormal[i] * Math.sin(v * TAU)));
};
const torus = (u, v) => [(1.55 + .48 * Math.cos(v * TAU)) * Math.cos(u * TAU), (1.55 + .48 * Math.cos(v * TAU)) * Math.sin(u * TAU), .48 * Math.sin(v * TAU)];
const wave = (u, v) => { const x = (u - .5) * 4.4, y = (v - .5) * 3.3; return [x, y, .58 * Math.sin(x * 1.6 + y) + .32 * Math.cos(y * 2.5)]; };
const mobius = (u, v) => { const t = u * TAU, w = (v - .5) * 1.55; return [(1.65 + w * Math.cos(t / 2)) * Math.cos(t), (1.65 + w * Math.cos(t / 2)) * Math.sin(t), w * Math.sin(t / 2)]; };
const meshes = {
  hero: sculpture(knot, { u: 132, v: 14, rotation: [.48, -.32, -.4], scale: 91, center: [300, 205] }),
  deloitte: sculpture(torus, { u: 100, v: 20, rotation: [1.0, -.3, -.55], scale: 101, center: [307, 197] }),
  fordham: sculpture(wave, { u: 58, v: 30, rotation: [.9, .25, -.48], scale: 83, center: [301, 203], material: "violet" }),
  "pure-digital": sculpture(mobius, { u: 120, v: 14, rotation: [.65, -.42, -.55], scale: 83, center: [299, 203], material: "coral" }),
};
const editions = {
  hero: { number: "00", name: "HUMAN × MACHINE", sub: "A STUDY IN CONNECTION", label: "Original abstract chrome trefoil sculpture with lime orbital rings" },
  deloitte: { number: "01", name: "SYNTHETIC INTELLIGENCE", sub: "SYSTEMS / ORCHESTRATION", label: "Original abstract chrome torus surrounding a luminous AI core" },
  fordham: { number: "02", name: "HUMAN LANDSCAPES", sub: "RESEARCH / PATTERNS", label: "Original abstract violet data landscape with chartreuse contour lines" },
  columbia: { number: "03", name: "SIGNAL EXTRACTION", sub: "MEDIA / DISCOVERY", label: "Original abstract silver and coral portals receding into a video signal" },
  brokr: { number: "04", name: "NETWORK EFFECT", sub: "CONNECTION / GROWTH", label: "Original abstract twisting violet tower inside a chartreuse orbital network" },
  "pure-digital": { number: "05", name: "CONTINUOUS REINVENTION", sub: "DESIGN / TECHNOLOGY", label: "Original abstract coral Möbius ribbon with violet and lime light trails" },
  apc: { number: "06", name: "FIRST PRINCIPLES", sub: "INFRASTRUCTURE / ORIGIN", label: "Original abstract suspended crystal core and orbital infrastructure" },
};
function Mesh({ kind }) { return <g>{meshes[kind].map((face, i) => <polygon key={i} points={face.points} fill={face.color} stroke={face.color} strokeWidth=".45" strokeLinejoin="round" />)}</g>; }
function Star({ x, y, size = 13, color = "#dcff72" }) { return <path d={`M${x - size} ${y}h${size * 2}M${x} ${y - size}v${size * 2}`} fill="none" stroke={color} strokeWidth="1.3" />; }
function Orb({ x, y, r, id }) { return <circle cx={x} cy={y} r={r} fill={`url(#${id}-orb)`} stroke="#e9e5ff" strokeOpacity=".35" strokeWidth=".5" />; }
function Grid({ id }) {
  return <>
    <rect width="600" height="400" fill="#16131f" />
    <rect width="600" height="400" fill={`url(#${id}-atmosphere)`} />
    <path d="M0 320H600M0 343H600M0 374H600M300 278 30 400M300 278 160 400M300 278 440 400M300 278 570 400" stroke="#b0a0e1" strokeOpacity=".13" fill="none" />
    <g fill="#c9bde8" opacity=".3">{Array.from({ length: 24 }, (_, i) => <circle key={i} cx={36 + (i * 89) % 533} cy={55 + (i * 67) % 267} r={i % 4 === 0 ? 1.1 : .6} />)}</g>
    <path d="M24 44V24H44M556 24H576V44M24 356V376H44M556 376H576V356" fill="none" stroke="#b0a0d1" strokeOpacity=".48" strokeWidth=".8" />
  </>;
}
function Portals({ id }) {
  return <>
    <circle cx="319" cy="203" r="112" fill={`url(#${id}-warm)`} />
    {Array.from({ length: 12 }, (_, i) => {
      const size = 238 - i * 16, x = 300 - size / 2 + i * 2.7, y = 199 - size / 2;
      return <g key={i} transform={`rotate(${-24 + i * 5.4} ${300 + i * 2.7} 199)`}>
        <rect x={x + 5} y={y + 7} width={size} height={size} rx="3" fill="none" stroke="#06050d" strokeWidth="12" />
        <rect x={x} y={y} width={size} height={size} rx="3" fill="none" stroke={`url(#${id}-metal)`} strokeWidth="9" />
        <path d={`M${x} ${y + size * .7}V${y}H${x + size * .35}`} fill="none" stroke={i % 3 === 0 ? "#dcff72" : "#efb3bd"} strokeWidth="1.4" />
      </g>;
    })}
    <path d="M74 304 466 89M70 314 473 99" stroke="#fa8d90" strokeWidth="1.2" opacity=".65" />
    <Orb x={130} y={113} r={21} id={id} /><Star x={482} y={277} />
  </>;
}
function NetworkTower({ id }) {
  return <>
    <ellipse cx="302" cy="202" rx="202" ry="123" transform="rotate(-31 302 202)" fill="none" stroke="#dcff72" strokeWidth="1.3" />
    <ellipse cx="302" cy="202" rx="212" ry="129" transform="rotate(-31 302 202)" fill="none" stroke="#dcff72" strokeOpacity=".22" />
    {Array.from({ length: 17 }, (_, i) => {
      const width = 83 + Math.sin(i * .35) * 30, x = 300 + Math.sin(i * .24) * 28, y = 306 - i * 13;
      return <g key={i} transform={`rotate(${Math.sin(i * .24) * 12} ${x} ${y})`}>
        <path d={`M${x - width} ${y}v8a${width} 28 0 0 0 ${width * 2} 0v-8`} fill={`url(#${id}-metal)`} stroke="#84729c" strokeWidth=".5" />
        <ellipse cx={x} cy={y} rx={width} ry="28" fill={i === 16 ? `url(#${id}-orb)` : "#342544"} stroke={i % 5 === 0 ? "#d4f76e" : "#baa0ef"} strokeWidth={i % 5 === 0 ? 1.6 : .7} />
        <ellipse cx={x} cy={y} rx={width * .59} ry="17" fill="none" stroke="#8b6cbe" strokeWidth=".7" />
      </g>;
    })}
    <Orb x={124} y={273} r={24} id={id} /><Orb x={480} y={125} r={13} id={id} />
    <Star x={121} y={102} size={8} /><path d="M435 304h40m-20-20v40" stroke="#b398e4" strokeWidth=".6" />
  </>;
}
function Crystal({ id }) {
  const top = [301, 71], bottom = [301, 328], ring = [[189, 163], [262, 133], [381, 155], [417, 224], [310, 258], [202, 228]];
  return <>
    {[0, 60, -60].map(angle => <ellipse key={angle} cx="301" cy="201" rx="207" ry="76" transform={`rotate(${angle} 301 201)`} fill="none" stroke={angle === 0 ? "#dcff72" : "#9d83e8"} strokeOpacity={angle === 0 ? .9 : .5} strokeWidth="1.1" />)}
    <g stroke="#b4a2e3" strokeWidth=".8">{ring.map((p, i) => {
      const next = ring[(i + 1) % ring.length];
      return <g key={i}><polygon points={[top, p, next].map(x => x.join(",")).join(" ")} fill={["#362c54", "#9a85c0", "#d8cde6", "#655086", "#23172f", "#554265"][i]} /><polygon points={[bottom, p, next].map(x => x.join(",")).join(" ")} fill={["#1d1926", "#493858", "#9c86ac", "#30263d", "#645178", "#30203e"][i]} /></g>;
    })}</g>
    <path d="m301 71 9 187-108-30 60-95 155 91-116 104" fill="none" stroke="#f3e3ff" strokeWidth="1.1" opacity=".72" />
    <circle cx="308" cy="197" r="51" fill={`url(#${id}-energy)`} />
    <path d="M301 30v340" stroke="#dcff72" strokeWidth="1.1" />
    <Orb x={116} y={235} r={16} id={id} /><Orb x={463} y={252} r={9} id={id} /><Star x={462} y={92} />
  </>;
}
function Scene({ kind, id }) {
  if (kind === "columbia") return <Portals id={id} />;
  if (kind === "brokr") return <NetworkTower id={id} />;
  if (kind === "apc") return <Crystal id={id} />;
  return <>
    {kind === "hero" && <>
      <ellipse cx="301" cy="205" rx="248" ry="103" transform="rotate(-28 301 205)" fill="none" stroke="#dcff72" strokeWidth="1.4" />
      <ellipse cx="301" cy="205" rx="258" ry="108" transform="rotate(-28 301 205)" fill="none" stroke="#dcff72" strokeOpacity=".2" />
      <circle cx="301" cy="205" r="165" fill="none" stroke="#9682bd" strokeOpacity=".35" strokeDasharray="1 7" />
    </>}
    {kind === "deloitte" && <>
      <circle cx="307" cy="197" r="171" fill="none" stroke="#b39ecf" strokeOpacity=".2" />
      <circle cx="307" cy="197" r="177" fill="none" stroke="#b39ecf" strokeOpacity=".25" strokeDasharray="1 7" />
      <circle cx="307" cy="197" r="79" fill={`url(#${id}-energy)`} />
      <Orb x={307} y={197} r={50} id={id} />
      <path d="M307 63v268M171 197h270" stroke="#dcff72" strokeOpacity=".4" strokeWidth=".6" />
    </>}
    {kind === "fordham" && <>
      <circle cx="301" cy="202" r="147" fill="none" stroke="#c5b6e7" strokeOpacity=".3" />
      <path d="M87 271 437 79M119 310 467 118" stroke="#dcff72" opacity=".45" strokeWidth=".7" />
    </>}
    {kind === "pure-digital" && <>
      <ellipse cx="299" cy="203" rx="225" ry="87" transform="rotate(-35 299 203)" fill="none" stroke="#dcff72" strokeWidth="1.1" />
      <ellipse cx="299" cy="203" rx="222" ry="111" transform="rotate(24 299 203)" fill="none" stroke="#b49bf6" strokeOpacity=".6" />
    </>}
    <Mesh kind={kind} />
    {kind === "hero" && <><Orb x={108} y={294} r={21} id={id} /><Orb x={487} y={99} r={12} id={id} /><Star x={485} y={292} /><Star x={111} y={103} size={7} color="#bca8e7" /></>}
    {kind === "deloitte" && <><ellipse cx="307" cy="197" rx="221" ry="62" transform="rotate(28 307 197)" fill="none" stroke="#dcff72" strokeWidth="1.2" /><Orb x={124} y={104} r={17} id={id} /><Star x={474} y={300} size={10} /></>}
    {kind === "fordham" && <><ellipse cx="301" cy="202" rx="216" ry="62" transform="rotate(-28 301 202)" fill="none" stroke="#dcff72" strokeWidth="1.5" /><Orb x={438} y={96} r={23} id={id} /><Star x={116} y={125} size={10} /></>}
    {kind === "pure-digital" && <><Orb x={152} y={290} r={28} id={id} /><Star x={464} y={102} size={17} /><path d="M452 288h31m-15-15v31" stroke="#f297a3" strokeWidth=".7" /></>}
  </>;
}
export default function CareerArtwork({ kind = "deloitte", className = "" }) {
  const id = `sculpture-${useId().replace(/:/g, "")}`;
  const validKind = Object.prototype.hasOwnProperty.call(editions, kind) ? kind : "deloitte";
  const edition = editions[validKind];
  return <svg className={`career-artwork career-artwork--${validKind} ${className}`.trim()} viewBox="0 0 600 400" role="img" aria-labelledby={`${id}-title`} focusable="false" xmlns="http://www.w3.org/2000/svg">
    <title id={`${id}-title`}>{edition.label}</title>
    <defs>
      <radialGradient id={`${id}-atmosphere`} cx="53%" cy="42%" r="65%"><stop stopColor="#443054" stopOpacity=".9" /><stop offset=".65" stopColor="#211a2e" stopOpacity=".6" /><stop offset="1" stopColor="#121018" /></radialGradient>
      <linearGradient id={`${id}-metal`} x1="0" y1="0" x2=".85" y2="1"><stop stopColor="#e4dce9" /><stop offset=".22" stopColor="#a591bc" /><stop offset=".44" stopColor="#2c223b" /><stop offset=".56" stopColor="#f6f1e9" /><stop offset=".67" stopColor="#8b729e" /><stop offset="1" stopColor="#231c31" /></linearGradient>
      <radialGradient id={`${id}-orb`} cx="30%" cy="23%" r="76%"><stop stopColor="#f4ffdc" /><stop offset=".22" stopColor="#d9f67b" /><stop offset=".57" stopColor="#849d43" /><stop offset=".81" stopColor="#26351e" /><stop offset="1" stopColor="#171822" /></radialGradient>
      <radialGradient id={`${id}-energy`}><stop stopColor="#e9ffac" stopOpacity=".7" /><stop offset=".4" stopColor="#c2ed66" stopOpacity=".26" /><stop offset="1" stopColor="#a7cc52" stopOpacity="0" /></radialGradient>
      <radialGradient id={`${id}-warm`}><stop stopColor="#ff9b8c" /><stop offset=".3" stopColor="#cc656d" stopOpacity=".6" /><stop offset="1" stopColor="#8e3b64" stopOpacity="0" /></radialGradient>
    </defs>
    <Grid id={id} />
    <g className="career-artwork__scene"><Scene kind={validKind} id={id} /></g>
    <g aria-hidden="true" className="career-artwork__type" fill="#c6badb">
      <text x="39" y="45" fontSize="8.5" letterSpacing="1.6">SIGNAL / FORM</text>
      <text x="560" y="45" textAnchor="end" fontSize="8.5" letterSpacing="1.6">{edition.number}</text>
      <text x="39" y="350" fontSize="10" fill="#e6e0ed" letterSpacing="1.3">{edition.name}</text>
      <text x="39" y="367" fontSize="6.9" letterSpacing="1.1" fill="#a598b8">{edition.sub}</text>
      <g stroke="#b5a7c8" strokeWidth="1">{Array.from({ length: 17 }, (_, i) => <path key={i} d={`M${495 + i * 3.6} ${i % 3 === 0 ? 350 : 356}v11`} />)}</g>
    </g>
  </svg>;
}
