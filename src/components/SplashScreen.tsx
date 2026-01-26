"use client";

import { useState, useEffect, useMemo } from "react";
import TypewriterText from "./text-effects/TypewriterText";

interface SplashScreenProps {
  onComplete: () => void;
}

// Each line split into prefix and status, with random pause between them
const SPLASH_LINES = [
  { prefix: "INITIALIZING AI AGENTS... ", status: "[SUCCESS]" },
  { prefix: "VERIFYING HUMAN CONSCIOUSNESS... ", status: "[PENDING]" },
  { prefix: "OPTIMIZING WORLDCHAIN NODES... ", status: "[OK]" },
  { prefix: "LOADING TASTE.EXE... ", status: "[CRITICAL_SUCCESS]" },
];

// Typing speed (characters per second)
const CHARS_PER_SECOND = 45;
// Stagger delay between each line (ms)
const STAGGER_DELAY = 50;
// Random pause range before status (ms)
const MIN_PAUSE = 100;
const MAX_PAUSE = 600;

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [typingComplete, setTypingComplete] = useState(false);
  const [phase, setPhase] = useState<"typing" | "cursor" | "waiting" | "done">("typing");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [cursorBlinks, setCursorBlinks] = useState(0);

  // Generate random pause delays for each line (memoized to stay consistent)
  const pauseDelays = useMemo(() => 
    SPLASH_LINES.map(() => MIN_PAUSE + Math.random() * (MAX_PAUSE - MIN_PAUSE)),
    []
  );

  // Calculate delay for prefix of each line
  const getPrefixDelay = (index: number) => {
    let totalDelay = 0;
    for (let i = 0; i < index; i++) {
      const prefixDuration = (SPLASH_LINES[i].prefix.length / CHARS_PER_SECOND) * 1000;
      const statusDuration = (SPLASH_LINES[i].status.length / CHARS_PER_SECOND) * 1000;
      totalDelay += prefixDuration + pauseDelays[i] + statusDuration + STAGGER_DELAY;
    }
    return totalDelay;
  };

  // Calculate delay for status of each line (after prefix + pause)
  const getStatusDelay = (index: number) => {
    const prefixDelay = getPrefixDelay(index);
    const prefixDuration = (SPLASH_LINES[index].prefix.length / CHARS_PER_SECOND) * 1000;
    return prefixDelay + prefixDuration + pauseDelays[index];
  };

  // When last line completes, wait 1s then switch to cursor phase
  useEffect(() => {
    if (typingComplete) {
      const timeout = setTimeout(() => {
        setPhase("cursor");
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [typingComplete]);

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
      className="fixed inset-0 z-50 flex items-start justify-start"
      style={{ backgroundColor: "#1b1b1b" }}
    >
      {/* Typing phase - show lines (hidden instantly when cursor phase starts) */}
      {phase === "typing" && (
        <div style={{ padding: "var(--grid-margin)" }}>
          <div className="flex flex-col gap-0">
            {SPLASH_LINES.map((line, index) => (
              <div key={index}>
                {/* Prefix part - show cursor while typing */}
                <TypewriterText
                  delay={getPrefixDelay(index)}
                  charsPerSecond={CHARS_PER_SECOND}
                  disableGlitch
                >
                  {line.prefix}
                </TypewriterText>
                {/* Status part (after random pause) */}
                <TypewriterText
                  delay={getStatusDelay(index)}
                  charsPerSecond={CHARS_PER_SECOND}
                  disableGlitch
                  onComplete={index === SPLASH_LINES.length - 1 ? () => setTypingComplete(true) : undefined}
                >
                  {line.status}
                </TypewriterText>
              </div>
            ))}
          </div>
        </div>
      )}

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
