"use client";

import { useRef, useEffect, useCallback, useState } from "react";

const GLITCH_CHARS = "._:";

interface HoverRevealTextProps {
  children: string;
  revealText: string;
  className?: string;
  glitchRadius?: number; // Radius in pixels around mouse
  intensity?: number;
}

export default function HoverRevealText({
  children,
  revealText,
  className = "",
  glitchRadius = 80,
  intensity = 0.6,
}: HoverRevealTextProps) {
  const originalText = children;
  const targetText = revealText;
  
  // Pad shorter text with spaces to match length
  const maxLength = Math.max(originalText.length, targetText.length);
  const paddedOriginal = originalText.padEnd(maxLength, " ");
  const paddedTarget = targetText.padEnd(maxLength, " ");
  
  const charsRef = useRef<HTMLSpanElement[]>([]);
  const animationRef = useRef<number | null>(null);
  const mousePos = useRef({ x: -1000, y: -1000 });
  const lastUpdateTime = useRef(0);
  const updateInterval = 50;
  
  // Track which chars are currently showing target
  const [revealedChars, setRevealedChars] = useState<boolean[]>(
    new Array(maxLength).fill(false)
  );

  const getRandomGlitchChar = () => {
    return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
  };

  const animate = useCallback((timestamp: number) => {
    // Throttle updates
    if (timestamp - lastUpdateTime.current < updateInterval) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    lastUpdateTime.current = timestamp;

    const newRevealed = [...revealedChars];
    let hasChanges = false;

    charsRef.current.forEach((span, index) => {
      if (!span) return;

      const charRect = span.getBoundingClientRect();
      const charCenterX = charRect.left + charRect.width / 2;
      const charCenterY = charRect.top + charRect.height / 2;

      const distance = Math.sqrt(
        Math.pow(mousePos.current.x - charCenterX, 2) +
          Math.pow(mousePos.current.y - charCenterY, 2)
      );

      if (distance < glitchRadius) {
        // Character is within radius - show target
        const glitchProbability = (1 - distance / glitchRadius) * intensity;

        if (!newRevealed[index] && Math.random() < glitchProbability) {
          // Show glitch briefly then target
          span.textContent = getRandomGlitchChar();
          setTimeout(() => {
            if (charsRef.current[index]) {
              charsRef.current[index].textContent = paddedTarget[index];
            }
          }, 30);
          newRevealed[index] = true;
          hasChanges = true;
        } else if (newRevealed[index]) {
          span.textContent = paddedTarget[index];
        }
      } else {
        // Outside radius - show original
        if (newRevealed[index]) {
          // Glitch back to original
          span.textContent = getRandomGlitchChar();
          setTimeout(() => {
            if (charsRef.current[index]) {
              charsRef.current[index].textContent = paddedOriginal[index];
            }
          }, 30);
          newRevealed[index] = false;
          hasChanges = true;
        } else {
          span.textContent = paddedOriginal[index];
        }
      }
    });

    if (hasChanges) {
      setRevealedChars(newRevealed);
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [glitchRadius, intensity, paddedOriginal, paddedTarget, revealedChars]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  return (
    <div className={`inline-block cursor-default ${className}`}>
      {paddedOriginal.split("").map((char, index) => (
        <span
          key={index}
          ref={(el) => {
            if (el) charsRef.current[index] = el;
          }}
          className="inline-block"
          style={{
            whiteSpace: char === " " || paddedTarget[index] === " " ? "pre" : "normal",
            minWidth: char === " " || paddedTarget[index] === " " ? "0.5em" : undefined,
          }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}
