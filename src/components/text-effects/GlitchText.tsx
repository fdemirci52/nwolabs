"use client";

import { useRef, useEffect, useCallback } from "react";

const ASCII_CHARS = "._:";

interface GlitchTextProps {
  children: string;
  className?: string;
  glitchRadius?: number; // Radius in pixels around mouse to affect
  intensity?: number; // How aggressive the glitch is (0-1)
  onClick?: () => void;
  as?: "span" | "button" | "a";
  href?: string;
}

export default function GlitchText({
  children,
  className = "",
  glitchRadius = 80, // pixels
  intensity = 0.6,
  onClick,
  as = "span",
  href,
}: GlitchTextProps) {
  const containerRef = useRef<HTMLElement>(null);
  const charsRef = useRef<HTMLSpanElement[]>([]);
  const originalChars = useRef<string[]>([]);
  const animationRef = useRef<number | null>(null);
  const mousePos = useRef({ x: -1000, y: -1000 });
  const lastUpdateTime = useRef(0);
  const updateInterval = 50; // ms between updates (lower = faster)

  // Initialize character refs
  useEffect(() => {
    originalChars.current = children.split("");
  }, [children]);

  const getRandomChar = () => {
    return ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
  };

  const animate = useCallback((timestamp: number) => {
    // Throttle updates
    if (timestamp - lastUpdateTime.current < updateInterval) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    lastUpdateTime.current = timestamp;

    charsRef.current.forEach((span, index) => {
      if (!span) return;

      const charRect = span.getBoundingClientRect();
      const charCenterX = charRect.left + charRect.width / 2;
      const charCenterY = charRect.top + charRect.height / 2;

      // Calculate distance from mouse to character center
      const distance = Math.sqrt(
        Math.pow(mousePos.current.x - charCenterX, 2) +
          Math.pow(mousePos.current.y - charCenterY, 2)
      );

      if (distance < glitchRadius) {
        // Character is within glitch radius
        const glitchProbability = (1 - distance / glitchRadius) * intensity;

        if (Math.random() < glitchProbability) {
          span.textContent = getRandomChar();
          span.style.opacity = "1";
          span.style.color = "white";
        }
      } else {
        // Reset character if outside radius
        if (span.textContent !== originalChars.current[index]) {
          span.textContent = originalChars.current[index];
          span.style.opacity = "";
          span.style.color = "";
        }
      }
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [glitchRadius, intensity]);

  // Listen to global mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove);
    
    // Start animation loop
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  const charElements = children.split("").map((char, index) => (
    <span
      key={index}
      ref={(el) => {
        if (el) charsRef.current[index] = el;
      }}
      className="inline-block"
      style={{ 
        whiteSpace: char === " " ? "pre" : "normal",
        minWidth: char === " " ? "0.5em" : undefined,
      }}
    >
      {char}
    </span>
  ));

  const baseClass = `inline-block cursor-default ${className}`;

  if (as === "button") {
    return (
      <button
        ref={containerRef as React.RefObject<HTMLButtonElement | null>}
        className={baseClass}
        onClick={onClick}
      >
        {charElements}
      </button>
    );
  }

  if (as === "a" && href) {
    return (
      <a
        ref={containerRef as React.RefObject<HTMLAnchorElement | null>}
        className={baseClass}
        href={href}
      >
        {charElements}
      </a>
    );
  }

  return (
    <span
      ref={containerRef as React.RefObject<HTMLSpanElement | null>}
      className={baseClass}
    >
      {charElements}
    </span>
  );
}
