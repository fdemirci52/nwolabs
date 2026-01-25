"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Matrix Digital Rain characters (Latin + Numbers)
// Removed Katakana temporarily to prevent horizontal jitter if font doesn't support monospaced half-width perfectly
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~";

interface Stream {
  x: number;
  y: number;
  speed: number;
  length: number;
  chars: string[];
}

export default function AnimatedAsciiArt() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ascii, setAscii] = useState<string>("");
  const [dimensions, setDimensions] = useState({ cols: 0, rows: 0 });
  const animationRef = useRef<number>(0);
  
  // Store streams in ref to avoid re-renders
  const streamsRef = useRef<Stream[]>([]);
  const frameCountRef = useRef<number>(0);

  // Initialize streams
  const initStreams = useCallback((cols: number, rows: number) => {
    const streams: Stream[] = [];
    for (let i = 0; i < cols; i++) {
      const length = Math.floor(Math.random() * (rows / 2)) + 5;
      const chars: string[] = [];
      for (let j = 0; j < length; j++) {
        chars.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
      }
      
      streams.push({
        x: i,
        y: Math.random() * -rows * 2, // Start above viewport with random offset
        speed: Math.random() * 0.5 + 0.2, // Random speed
        length,
        chars
      });
    }
    streamsRef.current = streams;
  }, []);

  // Calculate dimensions based on container size using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const charWidth = 8.4; // IBM Plex Mono 14px approximate char width
    const charHeight = 21; // Line height

    const updateDimensions = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;

      const cols = Math.floor(width / charWidth);
      const rows = Math.ceil(height / charHeight) + 1;

      // Only re-init streams if dimensions changed significantly
      setDimensions(prev => {
        if (prev.cols !== cols || prev.rows !== rows) {
          initStreams(cols, rows);
          return { cols, rows };
        }
        return prev;
      });
    };

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [initStreams]);

  // Generate animated ASCII frame
  const generateFrame = useCallback(() => {
    const { cols, rows } = dimensions;
    if (cols === 0 || rows === 0) {
      animationRef.current = requestAnimationFrame(generateFrame);
      return;
    }

    const streams = streamsRef.current;
    const grid: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(" "));
    
    // Update and draw streams
    streams.forEach(stream => {
      // Update position
      stream.y += stream.speed;
      
      // Reset if fully off screen
      if (stream.y - stream.length > rows) {
        stream.y = Math.random() * -10;
        stream.speed = Math.random() * 0.5 + 0.2;
        stream.length = Math.floor(Math.random() * (rows / 2)) + 5;
        // Regenerate characters
        stream.chars = [];
        for (let i = 0; i < stream.length; i++) {
          stream.chars.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
        }
      }

      // Randomly flicker characters
      if (frameCountRef.current % 3 === 0) { // Flicker every few frames
        stream.chars.forEach((_, idx) => {
          if (Math.random() < 0.05) { // 5% chance
            stream.chars[idx] = CHARS[Math.floor(Math.random() * CHARS.length)];
          }
        });
      }

      // Draw stream to grid
      const headY = Math.floor(stream.y);
      for (let i = 0; i < stream.length; i++) {
        const charY = headY - i;
        // Only draw if within bounds
        if (charY >= 0 && charY < rows) {
          // Use the character from the stream's array
          // To simulate fading, we use characters with less visual weight at the tail
          // or just standard characters since we can't change opacity
          let char = stream.chars[i % stream.chars.length];
          
          // Optional: Add some empty spaces in the tail to simulate "breaking up"
          if (i > stream.length * 0.7 && Math.random() > 0.5) {
             char = " "; // Glitch/fade effect at the tail
          }
          
          grid[charY][stream.x] = char;
        }
      }
    });

    // Convert grid to string
    const result = grid.map(row => row.join("")).join("\n");

    setAscii(result);
    frameCountRef.current++;
    animationRef.current = requestAnimationFrame(generateFrame);
  }, [dimensions]);

  // Start animation loop
  useEffect(() => {
    if (dimensions.cols > 0 && dimensions.rows > 0) {
      animationRef.current = requestAnimationFrame(generateFrame);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, generateFrame]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden select-none relative"
    >
      {/* ASCII output - anchored to bottom */}
      <pre className="absolute bottom-0 left-0 right-0 text-[14px] leading-[21px] font-light whitespace-pre mb-1 p-0 text-[#888]">
        {ascii || "Loading..."}
      </pre>
    </div>
  );
}
