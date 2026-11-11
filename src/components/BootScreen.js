import { useEffect, useRef, useState } from "react";

const steps = ["Initializing a little curiosity…", "Mounting experience & experiments…", "Opening your personal desktop…"];
export default function BootScreen({ onFinish }) {
  const [step, setStep] = useState(0);
  const buttonRef = useRef(null);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  useEffect(() => {
    buttonRef.current?.focus();
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const timers = [setTimeout(() => setStep(1), 450), setTimeout(() => setStep(2), 900), setTimeout(() => finishRef.current(), reduced?.matches ? 0 : 1600)];
    const skip = (event) => { if (event.key === "Escape" || event.key === "Enter") { event.preventDefault(); finishRef.current(); } };
    window.addEventListener("keydown", skip);
    return () => { timers.forEach(clearTimeout); window.removeEventListener("keydown", skip); };
  }, []);
  return <div className="boot-screen" role="dialog" aria-modal="true" aria-label="Desktop startup">
    <div className="boot-terminal">
      <div className="boot-topline"><span>AC/OS</span><span>PERSONAL COMPUTER SYSTEM</span></div>
      <div className="boot-monogram" aria-hidden="true">ac<span>_</span></div>
      <p className="boot-version">ALEX CASTRO / DESKTOP EDITION 26.1</p>
      <div className="boot-log" aria-hidden="true">{steps.map((line, index) => <div key={line} className={index <= step ? "boot-visible" : ""}><span>[ OK ]</span>{line}</div>)}</div>
      <div className="boot-progress" aria-hidden="true"><span style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>
      <div className="boot-bottom"><span>Your desktop is ready in a moment.</span><button ref={buttonRef} onClick={onFinish}>Skip intro ↵</button></div>
    </div>
  </div>;
}
