"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Matrix Digital Rain characters (Latin + Numbers + Symbols)
const MATRIX_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~";

interface Stream {
  x: number;
  y: number;
  speed: number;
}

interface Cell {
  char: string;
  value: number; // 0.0 to 1.0 (opacity)
}

export default function AnimatedAsciiArt() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Grid state
  const gridRef = useRef<Cell[][]>([]);
  const streamsRef = useRef<Stream[]>([]);
  const animationRef = useRef<number>(0);
  
  // Dimensions
  const dimsRef = useRef({ width: 0, height: 0, cols: 0, rows: 0, charWidth: 0, charHeight: 0 });

  // Initialize system
  const initSystem = useCallback((width: number, height: number) => {
    // Font metrics
    // We need to measure char width accurately
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.font = "14px 'IBM Plex Mono', monospace";
    const metrics = ctx.measureText("A");
    const charWidth = metrics.width;
    const charHeight = 21; // Approximate line height for 14px font

    const cols = Math.floor(width / charWidth);
    const rows = Math.ceil(height / charHeight) + 1;

    // Save dimensions
    dimsRef.current = { width, height, cols, rows, charWidth, charHeight };

    // Resize canvas
    // Use device pixel ratio for sharp text
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    ctx.font = "14px 'IBM Plex Mono', monospace"; // Re-set font after resize

    // Init grid
    const grid: Cell[][] = [];
    for (let y = 0; y < rows; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < cols; x++) {
        row.push({ char: "", value: 0 });
      }
      grid.push(row);
    }
    gridRef.current = grid;

    // Init streams
    const streams: Stream[] = [];
    for (let i = 0; i < cols; i++) {
        streams.push({
          x: i,
          y: Math.random() * -rows, 
          speed: Math.random() * 0.1 + 0.05 // Slower speed (was 0.2 + 0.1)
        });
    }
    streamsRef.current = streams;
  }, []);

  // Handle resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      
      // Only re-init if significant change to avoid jitter
      if (Math.abs(width - dimsRef.current.width) > 5 || Math.abs(height - dimsRef.current.height) > 5) {
        initSystem(width, height);
      }
    };

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [initSystem]);

  // Animation Loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { cols, rows, charWidth, charHeight, width, height } = dimsRef.current;
    if (cols === 0 || rows === 0) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const grid = gridRef.current;
    const streams = streamsRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // 1. Fade out and flicker cells
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y] && grid[y][x].value > 0) {
          grid[y][x].value -= 0.005; // Slower fade speed (was 0.01)
          
          if (grid[y][x].value <= 0) {
            grid[y][x].value = 0;
            grid[y][x].char = "";
          } else {
             // Randomly flicker character
             if (grid[y][x].value > 0.5 && Math.random() < 0.01) {
                grid[y][x].char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
             }
          }
        }
      }
    }

    // 2. Update streams
    streams.forEach(stream => {
      stream.y += stream.speed;
      const headY = Math.floor(stream.y);
      
      if (headY >= 0 && headY < rows) {
        if (grid[headY] && grid[headY][stream.x]) {
             // New character at head
             grid[headY][stream.x].char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
             grid[headY][stream.x].value = 1.0; // Max opacity
        }
      }

      if (stream.y > rows + 10) {
        stream.y = Math.random() * -10;
        stream.speed = Math.random() * 0.1 + 0.05; // Slower speed (was 0.2 + 0.1)
      }
    });

    // 3. Render grid to Canvas
    ctx.font = "300 14px 'IBM Plex Mono', monospace";
    ctx.textBaseline = "top";
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = grid[y][x];
        if (cell.value > 0) {
            const xPos = x * charWidth;
            const yPos = y * charHeight;

            // Opacity logic
            // Head (value ~ 1.0) is bright white/light gray
            // Tail (value < 1.0) fades to #888 then to transparent
            
            // Base color is #888 (136, 136, 136)
            // But for head we might want it brighter?
            // User asked for "char opacity lower", so let's stick to #888 but with alpha
            
            // If value is very high (head), maybe make it brighter (white)
            if (cell.value > 0.9) {
                ctx.fillStyle = `rgba(255, 255, 255, ${cell.value})`; 
                // Or if we want strict #888: `rgba(136, 136, 136, ${cell.value})`
                // But usually Matrix head is white. Let's use #BBB for head to make it pop slightly
                ctx.fillStyle = `rgba(187, 187, 187, ${cell.value})`;
            } else {
                ctx.fillStyle = `rgba(136, 136, 136, ${cell.value})`;
            }

            ctx.fillText(cell.char, xPos, yPos);
        }
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  // Start animation
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [animate]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden select-none relative"
    >
      <canvas 
        ref={canvasRef}
        className="block"
      />
    </div>
  );
}
