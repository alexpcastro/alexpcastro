import React, { useId } from "react";
import "./CompanyScale.css";

function ordinal(number) {
  const remainder = number % 100;
  if (remainder >= 11 && remainder <= 13) return `${number}th`;
  return `${number}${({ 1: "st", 2: "nd", 3: "rd" })[number % 10] || "th"}`;
}

// Original pictogram. The enclosing outline and star identify Alex without color.
function Person({ alex = false, early = false }) {
  return <svg className={`company-scale-person${alex ? " is-alex" : ""}${early ? " is-early" : ""}`} viewBox="0 0 24 40" aria-hidden="true" focusable="false">
    {alex && <><rect className="company-scale-outline" x="1" y="1" width="22" height="38" rx="5" /><path className="company-scale-star" d="m12 3 1.1 2.2 2.5.4-1.8 1.7.4 2.5L12 8.6 9.8 9.8l.4-2.5-1.8-1.7 2.5-.4Z" /></>}
    <circle className="company-scale-body" cx="12" cy="15" r="3.5" />
    <path className="company-scale-body" d="M9 20h6c2 0 3 1.5 3 3.5V28h-3v8h-2.5v-8h-1v8H9v-8H6v-4.5C6 21.5 7 20 9 20Z" />
  </svg>;
}

function People({ count, alexIndex, joinCount }) {
  const dense = count > 40;
  const columns = Math.min(count, dense ? 20 : 10);
  return <div className={`company-scale-people${dense ? " is-dense" : ""}`} aria-hidden="true" style={{ "--people-columns": columns, "--people-width": `${columns * 20 - 3}px` }}>
    {Array.from({ length: count }, (_, index) => <Person key={index} alex={index === alexIndex} early={index < joinCount} />)}
  </div>;
}

/** Counts include Alex. For approximate joining counts, omit joinOrdinal. */
export default function CompanyScale({ name, joinCount, joinOrdinal, approximateJoin = false, laterCount, laterPlus = false, scopeNote }) {
  const id = useId();
  // An approximate headcount must never imply an exact hiring position.
  const exactOrdinal = !approximateJoin && joinOrdinal ? joinOrdinal : null;
  const alexIndex = exactOrdinal ? exactOrdinal - 1 : 0;
  const joined = `${approximateJoin ? "Around " : ""}${joinCount}`;
  const later = `${laterCount}${laterPlus ? "+" : ""}`;
  const description = `Alex joined ${name} ${exactOrdinal ? `as the ${ordinal(exactOrdinal)} person, with ${joinCount} people` : `when it had ${approximateJoin ? "around " : ""}${joinCount} people`}. It later reached ${laterPlus ? `${laterCount} or more` : laterCount} people. Each person symbol represents one person. Filled figures show the group when Alex joined; outlined figures show later additions. The starred figure is Alex.${laterPlus ? ` The graphic shows ${laterCount} symbols plus a plus sign.` : ""}${scopeNote ? ` ${scopeNote}` : ""}`;

  return <figure className="company-scale" aria-labelledby={`${id}-caption`} aria-describedby={`${id}-description`}>
    <figcaption id={`${id}-caption`} className="company-scale-sr-only">{name} organization scale</figcaption>
    <p id={`${id}-description`} className="company-scale-sr-only">{description}</p>
    <div className="company-scale-summary" aria-hidden="true">
      <span><strong>{joined}</strong> when I joined</span><span>→</span><span><strong>{later}</strong> later</span>
      <span className="company-scale-position">{exactOrdinal ? `Alex · ${ordinal(exactOrdinal)} person` : "Alex · early group"}</span>
    </div>
    <div className="company-scale-visual" aria-hidden="true">
      <People count={laterCount} joinCount={joinCount} alexIndex={alexIndex} />
      {laterPlus && <span className="company-scale-plus">+</span>}
    </div>
    <div className="company-scale-legend" aria-hidden="true"><span><Person early /> {approximateJoin ? "Around the time I joined" : "When I joined"}</span><span><Person /> Later additions</span><span><Person alex early /> Alex</span><span>1 symbol = 1 person</span></div>
    {scopeNote && <p className="company-scale-scope" aria-hidden="true">{scopeNote}</p>}
  </figure>;
}
