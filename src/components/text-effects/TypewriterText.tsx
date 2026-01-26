"use client";

import { useState, useEffect, useRef } from "react";
import GlitchText from "./GlitchText";

interface TypewriterTextProps {
  children: string;
  className?: string;
  delay?: number; // Delay before starting (ms)
  charsPerSecond?: number; // Typing speed
  glitchRadius?: number;
  glitchIntensity?: number;
  cursor?: string;
  hideCursor?: boolean; // Hide the typing cursor
  onClick?: () => void;
  as?: "span" | "button" | "a";
  href?: string;
  onComplete?: () => void; // Callback when typing is complete
  disableGlitch?: boolean; // Don't show GlitchText after typing
}

export default function TypewriterText({
  children,
  className = "",
  delay = 0,
  charsPerSecond = 30,
  glitchRadius = 100,
  glitchIntensity = 0.7,
  cursor = "_",
  hideCursor = false,
  onClick,
  as = "span",
  href,
  onComplete,
  disableGlitch = false,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cursorBlinkRef = useRef<NodeJS.Timeout | null>(null);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const charInterval = 1000 / charsPerSecond;
    let currentIndex = 0;

    // Wait for delay before starting
    const delayTimeout = setTimeout(() => {
      // Show cursor immediately when typing starts
      setShowCursor(true);
      
      // Start cursor blink
      cursorBlinkRef.current = setInterval(() => {
        setCursorVisible((v) => !v);
      }, 530);
      
      // Start typing
      intervalRef.current = setInterval(() => {
        if (currentIndex < children.length) {
          setDisplayedText(children.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          // Typing complete - hide cursor immediately
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          if (cursorBlinkRef.current) {
            clearInterval(cursorBlinkRef.current);
          }
          setShowCursor(false);
          setIsTypingComplete(true);
          onComplete?.();
        }
      }, charInterval);
    }, delay);

    return () => {
      clearTimeout(delayTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (cursorBlinkRef.current) clearInterval(cursorBlinkRef.current);
    };
  }, [children, delay, charsPerSecond, onComplete]);

  const content = (
    <>
      {displayedText.split("").map((char, index) => (
        <span
          key={index}
          className="inline-block"
          style={{
            whiteSpace: char === " " ? "pre" : "normal",
            minWidth: char === " " ? "0.5em" : undefined,
          }}
        >
          {char}
        </span>
      ))}
      {showCursor && !hideCursor && (
        <span
          className="inline-block"
          style={{ opacity: cursorVisible ? 1 : 0 }}
        >
          {cursor}
        </span>
      )}
    </>
  );

  // Show GlitchText after typing is complete (unless disabled)
  if (isTypingComplete && !disableGlitch) {
    return (
      <GlitchText
        className={className}
        glitchRadius={glitchRadius}
        intensity={glitchIntensity}
        onClick={onClick}
        as={as}
        href={href}
      >
        {children}
      </GlitchText>
    );
  }
  
  // If glitch is disabled and typing complete, just show static text
  if (isTypingComplete && disableGlitch) {
    const baseClass = `inline-block ${className}`;
    return <span className={baseClass}>{children}</span>;
  }

  const baseClass = `inline-block ${className}`;

  if (as === "button") {
    return (
      <button className={baseClass} onClick={onClick}>
        {content}
      </button>
    );
  }

  if (as === "a" && href) {
    return (
      <a className={baseClass} href={href}>
        {content}
      </a>
    );
  }

  return (
    <span className={baseClass}>
      {content}
    </span>
  );
}
