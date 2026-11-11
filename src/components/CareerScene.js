import React from "react";
import { careerScenes } from "../data/careerScenes";
import { careerVideos } from "../data/careerVideos";
import CareerVideo from "./CareerVideo";
import "./CareerScene.css";

// Keep the exact still visible until a real, generated video is playing.
export default function CareerScene({ kind = "deloitte", className = "", active = false, allowMotion = false, motionPaused = false }) {
  const item = careerScenes[kind];
  if (!item) return null;
  const first = kind === "deloitte";
  const still = <img className={`career-scene career-scene--${kind} ${className}`.trim()}
    src={item.src} srcSet={`/artwork/${kind}-neon-640.jpg 640w, ${item.src} 1280w`}
    sizes="(max-width: 480px) calc(100vw - 40px), (max-width: 760px) calc(100vw - 48px), (max-width: 1000px) calc((100vw - 88px) * .65), (max-width: 1140px) calc((100vw - 88px) * .38), 402px"
    width={item.width} height={item.height} alt={item.alt}
    loading={first || active ? "eager" : "lazy"} decoding="async" fetchPriority={first ? "high" : "auto"} />;
  const clip = careerVideos[kind];
  if (!clip) return still;
  return <span className="career-media">{still}
    {active && allowMotion && <CareerVideo key={clip.src} id={`video-${kind}`} src={clip.src} poster={item.src} paused={motionPaused} />}
  </span>;
}
