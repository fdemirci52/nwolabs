"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import gsap from "gsap";

interface LineRevealTextProps {
  children: string;
  isVisible: boolean;
  staggerDelay?: number; // Delay between each line
  lineDuration?: number; // Duration for each line's reveal
  className?: string;
  style?: React.CSSProperties;
}

export default function LineRevealText({
  children,
  isVisible,
  staggerDelay = 0.08,
  lineDuration = 0.5,
  className = "",
  style = {},
}: LineRevealTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement[]>([]);
  const [lines, setLines] = useState<string[]>([]);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Split text into lines based on container width
  useLayoutEffect(() => {
    if (!containerRef.current || !children) return;

    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    
    // Create a temporary span to measure text
    const measureSpan = document.createElement("span");
    measureSpan.style.cssText = `
      position: absolute;
      visibility: hidden;
      white-space: nowrap;
      font: inherit;
    `;
    container.appendChild(measureSpan);

    const words = children.split(" ");
    const calculatedLines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      measureSpan.textContent = testLine;
      
      if (measureSpan.offsetWidth > containerWidth && currentLine) {
        calculatedLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      calculatedLines.push(currentLine);
    }

    container.removeChild(measureSpan);
    setLines(calculatedLines);
  }, [children]);

  // Handle resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // Re-calculate lines on resize
      const container = containerRef.current;
      if (!container || !children) return;

      const containerWidth = container.offsetWidth;
      
      const measureSpan = document.createElement("span");
      measureSpan.style.cssText = `
        position: absolute;
        visibility: hidden;
        white-space: nowrap;
        font: inherit;
      `;
      container.appendChild(measureSpan);

      const words = children.split(" ");
      const calculatedLines: string[] = [];
      let currentLine = "";

      words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        measureSpan.textContent = testLine;
        
        if (measureSpan.offsetWidth > containerWidth && currentLine) {
          calculatedLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });

      if (currentLine) {
        calculatedLines.push(currentLine);
      }

      container.removeChild(measureSpan);
      setLines(calculatedLines);
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [children]);

  // GSAP Animation
  useEffect(() => {
    if (linesRef.current.length === 0) return;

    // Kill any existing timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    const tl = gsap.timeline();
    timelineRef.current = tl;

    if (isVisible) {
      // Reveal animation - staggered from top to bottom, each line left to right
      tl.fromTo(
        linesRef.current,
        {
          clipPath: "inset(0 100% 0 0)",
          opacity: 1,
        },
        {
          clipPath: "inset(0 0% 0 0)",
          duration: lineDuration,
          stagger: staggerDelay,
          ease: "power2.out",
        }
      );
    } else {
      // Hide animation - all lines fade out quickly
      tl.to(linesRef.current, {
        clipPath: "inset(0 100% 0 0)",
        duration: 0.2,
        stagger: 0.02,
        ease: "power2.in",
      });
    }

    return () => {
      tl.kill();
    };
  }, [isVisible, lines, staggerDelay, lineDuration]);

  return (
    <div ref={containerRef} className={className} style={style}>
      {lines.map((line, index) => (
        <div
          key={index}
          ref={(el) => {
            if (el) linesRef.current[index] = el;
          }}
          style={{
            clipPath: "inset(0 100% 0 0)",
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}
