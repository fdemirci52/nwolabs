"use client";

import { useState, useEffect } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"cursor" | "waiting" | "done">("cursor");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [cursorBlinks, setCursorBlinks] = useState(0);

  // Handle cursor blinking (0.175s per toggle = 0.35s full cycle)
  useEffect(() => {
    if (phase === "cursor") {
      const interval = setInterval(() => {
        setCursorVisible((v) => !v);
        setCursorBlinks((prev) => prev + 1);
      }, 175); // 0.175s for on/off toggle = 0.35s full cycle

      return () => clearInterval(interval);
    }
  }, [phase]);

  // After 7 toggles (~1.2 seconds), go to waiting phase
  useEffect(() => {
    if (cursorBlinks >= 7) {
      setPhase("waiting");
    }
  }, [cursorBlinks]);

  // Wait 0.4s on empty screen then complete
  useEffect(() => {
    if (phase === "waiting") {
      const timeout = setTimeout(() => {
        setPhase("done");
        onComplete();
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [phase, onComplete]);

  if (phase === "done") {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-start select-none"
      style={{ backgroundColor: "#1b1b1b" }}
    >
      {/* Cursor phase - blinking cursor only */}
      {phase === "cursor" && (
        <div className="absolute" style={{ top: "var(--grid-margin)", left: "var(--grid-margin)" }}>
          <span
            style={{ opacity: cursorVisible ? 1 : 0 }}
          >
            ▍
          </span>
        </div>
      )}
    </div>
  );
}
