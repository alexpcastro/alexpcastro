import { useEffect, useRef, useState } from "react";

// Only the open chapter mounts this component. The still stays underneath
// until actual playback, and is the fallback for blocked/failed media.
export default function CareerVideo({ id, src, poster, paused = false, loop = true, onPlaybackStart, onPlaybackEnd }) {
  const layer = useRef(null);
  const player = useRef(null);
  const [inView, setInView] = useState(() => typeof IntersectionObserver === "undefined");
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState !== "hidden");
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const mounted = inView && pageVisible && !failed;

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(entries => {
      setInView(entries.some(entry => entry.isIntersecting && entry.intersectionRatio > 0));
    }, { threshold: 0.01 });
    observer.observe(layer.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    const video = player.current;
    if (!mounted || !video) { setPlaying(false); return undefined; }
    let cancelled = false;
    if (paused) video.pause();
    else {
      const attempt = video.play();
      attempt?.catch(() => { if (!cancelled) setPlaying(false); });
    }
    return () => { cancelled = true; video.pause(); };
  }, [mounted, paused]);

  return <span ref={layer} className="career-video-layer" aria-hidden="true">
    {mounted && <video ref={player} id={id} className={`career-video${playing ? " is-playing" : ""}`}
      src={src} poster={poster} muted playsInline loop={loop} preload="none"
      tabIndex={-1} aria-hidden="true" disablePictureInPicture
      onPlaying={() => { if (paused) player.current?.pause(); else { setPlaying(true); onPlaybackStart?.(); } }}
      onEnded={onPlaybackEnd}
      onError={() => { setPlaying(false); setFailed(true); }} />}
  </span>;
}
