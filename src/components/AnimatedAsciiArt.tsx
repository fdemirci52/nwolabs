"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ASCII characters from sparse to dense for fading effect
// Low opacity = sparse char, high opacity = dense char
const DENSITY_CHARS = " .:-=+*#%@";
const MATRIX_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~";

interface Stream {
  x: number;
  y: number;
  speed: number;
}

interface Cell {
  char: string;
  value: number; // 0.0 to 1.0 (opacity/brightness simulation)
}

export default function AnimatedAsciiArt() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ascii, setAscii] = useState<string>("");
  const [dimensions, setDimensions] = useState({ cols: 0, rows: 0 });
  const animationRef = useRef<number>(0);
  
  // Grid state to maintain persistence between frames
  const gridRef = useRef<Cell[][]>([]);
  const streamsRef = useRef<Stream[]>([]);
  const frameCountRef = useRef<number>(0);

  // Initialize streams and grid
  const initSystem = useCallback((cols: number, rows: number) => {
    // Init grid
    const grid: Cell[][] = [];
    for (let y = 0; y < rows; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < cols; x++) {
        row.push({ char: " ", value: 0 });
      }
      grid.push(row);
    }
    gridRef.current = grid;

    // Init streams
    const streams: Stream[] = [];
    for (let i = 0; i < cols; i++) {
        // Start randomly positioned
        streams.push({
          x: i,
          y: Math.random() * -rows, 
          speed: Math.random() * 0.15 + 0.05 // Slower speed (was 0.3 + 0.1)
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

      setDimensions(prev => {
        if (prev.cols !== cols || prev.rows !== rows) {
          initSystem(cols, rows);
          return { cols, rows };
        }
        return prev;
      });
    };

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [initSystem]);

  // Generate animated ASCII frame
  const generateFrame = useCallback(() => {
    const { cols, rows } = dimensions;
    if (cols === 0 || rows === 0 || gridRef.current.length === 0) {
      animationRef.current = requestAnimationFrame(generateFrame);
      return;
    }

    const grid = gridRef.current;
    const streams = streamsRef.current;

    // 1. Fade out all cells
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y] && grid[y][x].value > 0) {
          grid[y][x].value -= 0.015; // Slower fade for longer trails (was 0.03)
          
          // Randomly flicker character while active
          if (grid[y][x].value > 0.5 && Math.random() < 0.05) {
            grid[y][x].char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
          }

          if (grid[y][x].value <= 0) {
            grid[y][x].value = 0;
            grid[y][x].char = " ";
          }
        }
      }
    }

    // 2. Update streams and active cells
    streams.forEach(stream => {
      stream.y += stream.speed;

      const headY = Math.floor(stream.y);
      
      // If head is within bounds, activate that cell
      if (headY >= 0 && headY < rows) {
        // Only update if we moved to a new cell
        if (grid[headY] && grid[headY][stream.x]) {
             // Pick a random char for the head
             grid[headY][stream.x].char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
             grid[headY][stream.x].value = 1.0; // Max brightness
        }
      }

      // Reset stream if trail is gone
      if (stream.y > rows + 20) {
        stream.y = Math.random() * -10;
        stream.speed = Math.random() * 0.15 + 0.05; // Maintain slow speed on respawn
      }
    });

    // 3. Render grid to string
    let result = "";
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = grid[y][x];
        if (cell.value > 0) {
            // Use opacity value to determine character density
            if (cell.value > 0.8) {
                // Head / Very bright: Use the assigned matrix char
                result += cell.char;
            } else {
                // Tail: Fade out using density chars
                // Map 0.0-0.8 range to density chars
                // We want high value -> high index (dense char)
                // We want low value -> low index (sparse char)
                
                const normalizedVal = cell.value / 0.8;
                const index = Math.floor(normalizedVal * (DENSITY_CHARS.length - 1));
                // Clamp index to be safe
                const safeIndex = Math.max(0, Math.min(index, DENSITY_CHARS.length - 1));
                result += DENSITY_CHARS[safeIndex];
            }
        } else {
            result += " ";
        }
      }
      if (y < rows - 1) result += "\n";
    }

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
