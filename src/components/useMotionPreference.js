import { useEffect, useState } from "react";

// A still image is the default for reduced-motion and data-saving visitors.
export default function useMotionPreference() {
  const [allowed, setAllowed] = useState(() =>
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches && !navigator.connection?.saveData);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = navigator.connection;
    const update = () => setAllowed(!media.matches && !connection?.saveData);
    media.addEventListener("change", update);
    connection?.addEventListener?.("change", update);
    update();
    return () => {
      media.removeEventListener("change", update);
      connection?.removeEventListener?.("change", update);
    };
  }, []);
  return allowed;
}
