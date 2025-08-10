"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "framer-motion";

export default function RouteProgress() {
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReduced) return; // Respect reduced motion
    setVisible(true);
    setWidth(0);
    // start
    requestAnimationFrame(() => setWidth(60));
    // complete
    timerRef.current = window.setTimeout(() => {
      setWidth(100);
      window.setTimeout(() => setVisible(false), 300);
    }, 250);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [pathname, prefersReduced]);

  if (!visible || prefersReduced) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] pointer-events-none">
      <div
        style={{ width: `${width}%` }}
        className="h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-[width] duration-300"
      />
    </div>
  );
}
