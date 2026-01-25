"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ASCII characters for alive cells
const ASCII_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~@";

// Default Conway rules (B3/S23)
const DEFAULT_BIRTH = [3];
const DEFAULT_SURVIVAL = [2, 3];

// Preset rule configurations
const PRESETS = {
  conway: { name: "Conway", birth: [3], survival: [2, 3] },
  daynight: { name: "Day & Night", birth: [3, 6, 7, 8], survival: [3, 4, 6, 7, 8] },
  highlife: { name: "HighLife", birth: [3, 6], survival: [2, 3] },
  maze: { name: "Maze", birth: [3], survival: [1, 2, 3, 4, 5] },
  coral: { name: "Coral", birth: [3], survival: [4, 5, 6, 7, 8] },
  seeds: { name: "Seeds", birth: [2], survival: [] },
  diamoeba: { name: "Diamoeba", birth: [3, 5, 6, 7, 8], survival: [5, 6, 7, 8] },
};

// Font size for ASCII characters
const FONT_SIZE = 14;
const LINE_HEIGHT = 21;

// Square cell size (perfect square)
const CELL_SIZE = 10;

interface Cell {
  alive: boolean;
  nextState: boolean;
  previousState: boolean;
  char: string;
}

const getRandomChar = () => ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];

export default function GameOfLifeAsciiArt() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Grid state
  const gridRef = useRef<Cell[][]>([]);
  const animationRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  
  // Mouse state
  const [mousePos, setMousePos] = useState<{ col: number; row: number } | null>(null);
  const mouseIsDownRef = useRef<boolean>(false);
  const lastPaintedCellRef = useRef<{ col: number; row: number } | null>(null);
  
  // Dimensions
  const dimsRef = useRef({ width: 0, height: 0, cols: 0, rows: 0, charWidth: 0, cellSize: CELL_SIZE });

  // Control panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [birthNeighbors, setBirthNeighbors] = useState<number[]>(DEFAULT_BIRTH);
  const [survivalNeighbors, setSurvivalNeighbors] = useState<number[]>(DEFAULT_SURVIVAL);
  const [updateInterval, setUpdateInterval] = useState(100);
  const [useSquare, setUseSquare] = useState(true);
  const [initialDensity, setInitialDensity] = useState(0.1);
  const [resetTrigger, setResetTrigger] = useState(0);

  // Refs for current settings (to avoid stale closures)
  const birthRef = useRef(new Set(birthNeighbors));
  const survivalRef = useRef(new Set(survivalNeighbors));
  const intervalRef = useRef(updateInterval);
  const useSquareRef = useRef(useSquare);

  // Update refs when state changes
  useEffect(() => {
    birthRef.current = new Set(birthNeighbors);
  }, [birthNeighbors]);

  useEffect(() => {
    survivalRef.current = new Set(survivalNeighbors);
  }, [survivalNeighbors]);

  useEffect(() => {
    intervalRef.current = updateInterval;
  }, [updateInterval]);

  useEffect(() => {
    useSquareRef.current = useSquare;
  }, [useSquare]);

  // Count alive neighbors
  const countNeighbors = useCallback((grid: Cell[][], row: number, col: number, rows: number, cols: number): number => {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dy === 0 && dx === 0) continue;
        const ny = row + dy;
        const nx = col + dx;
        if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
          if (grid[ny] && grid[ny][nx] && grid[ny][nx].alive) count++;
        }
      }
    }
    return count;
  }, []);

  // Prepare update
  const prepareUpdate = useCallback(() => {
    const { cols, rows } = dimsRef.current;
    const grid = gridRef.current;
    if (cols === 0 || rows === 0 || grid.length === 0) return;

    const birth = birthRef.current;
    const survival = survivalRef.current;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = grid[y]?.[x];
        if (!cell) continue;

        const neighbors = countNeighbors(grid, y, x, rows, cols);
        let nextState: boolean;
        
        if (cell.alive) {
          nextState = survival.has(neighbors);
        } else {
          nextState = birth.has(neighbors);
        }

        cell.nextState = nextState;
      }
    }
  }, [countNeighbors]);

  // Apply update
  const applyUpdate = useCallback(() => {
    const { cols, rows } = dimsRef.current;
    const grid = gridRef.current;
    if (cols === 0 || rows === 0 || grid.length === 0) return;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = grid[y]?.[x];
        if (!cell) continue;
        
        cell.previousState = cell.alive;
        cell.alive = cell.nextState;
        
        if (cell.alive && Math.random() < 0.1) {
          cell.char = getRandomChar();
        }
      }
    }
  }, []);

  // Update Game of Life state
  const updateGameOfLife = useCallback(() => {
    if (mouseIsDownRef.current) return;
    
    prepareUpdate();
    applyUpdate();
  }, [prepareUpdate, applyUpdate]);

  // Set cell alive helper
  const setCellAlive = useCallback((row: number, col: number) => {
    const grid = gridRef.current;
    const { rows, cols } = dimsRef.current;
    if (row >= 0 && row < rows && col >= 0 && col < cols && grid[row] && grid[row][col]) {
      grid[row][col].alive = true;
      grid[row][col].nextState = true;
      grid[row][col].char = getRandomChar();
    }
  }, []);

  // Initialize system
  const initSystem = useCallback((width: number, height: number, density: number = 0.1, isSquare: boolean = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.font = `${FONT_SIZE}px 'IBM Plex Mono', monospace`;
    const metrics = ctx.measureText("W");
    const charWidth = metrics.width;

    // Use CELL_SIZE for square mode, charWidth/LINE_HEIGHT for ASCII mode
    const cellWidth = isSquare ? CELL_SIZE : charWidth;
    const cellHeight = isSquare ? CELL_SIZE : LINE_HEIGHT;

    const cols = Math.floor(width / cellWidth);
    const rows = Math.floor(height / cellHeight);

    dimsRef.current = { width, height, cols, rows, charWidth, cellSize: CELL_SIZE };

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Init grid with random cells based on density
    const grid: Cell[][] = [];
    for (let y = 0; y < rows; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < cols; x++) {
        const alive = Math.random() < density;
        row.push({ 
          alive, 
          nextState: alive,
          previousState: alive,
          char: getRandomChar()
        });
      }
      grid.push(row);
    }
    gridRef.current = grid;

  }, []);

  // Handle resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      
      if (Math.abs(width - dimsRef.current.width) > 5 || Math.abs(height - dimsRef.current.height) > 5) {
        initSystem(width, height, initialDensity, useSquareRef.current);
      }
    };

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [initSystem, initialDensity]);

  // Reset when trigger changes or useSquare changes
  useEffect(() => {
    if (dimsRef.current.width > 0) {
      initSystem(dimsRef.current.width, dimsRef.current.height, initialDensity, useSquare);
    }
  }, [resetTrigger, initSystem, initialDensity, useSquare]);

  // Get cell position from coordinates
  const getCellFromCoords = useCallback((x: number, y: number) => {
    const { cols, rows, charWidth, cellSize } = dimsRef.current;
    const isSquare = useSquareRef.current;
    
    const cellWidth = isSquare ? cellSize : charWidth;
    const cellHeight = isSquare ? cellSize : LINE_HEIGHT;
    
    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);

    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      return { col, row };
    }
    return null;
  }, []);

  // Paint line between two cells
  const paintLine = useCallback((from: { col: number; row: number }, to: { col: number; row: number }) => {
    let x0 = from.col;
    let y0 = from.row;
    const x1 = to.col;
    const y1 = to.row;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      setCellAlive(y0, x0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }, [setCellAlive]);

  // Handle cell click
  const handleCellClick = useCallback((row: number, col: number) => {
    if (lastPaintedCellRef.current) {
      paintLine(
        { col: lastPaintedCellRef.current.col, row: lastPaintedCellRef.current.row },
        { col, row }
      );
    } else {
      setCellAlive(row, col);
    }
    lastPaintedCellRef.current = { row, col };
  }, [paintLine, setCellAlive]);

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pos = getCellFromCoords(e.clientX - rect.left, e.clientY - rect.top);
    setMousePos(pos);
    if (mouseIsDownRef.current && pos) handleCellClick(pos.row, pos.col);
  }, [getCellFromCoords, handleCellClick]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    mouseIsDownRef.current = true;
    lastPaintedCellRef.current = null;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pos = getCellFromCoords(e.clientX - rect.left, e.clientY - rect.top);
    if (pos) handleCellClick(pos.row, pos.col);
  }, [getCellFromCoords, handleCellClick]);

  const handleMouseUp = useCallback(() => {
    mouseIsDownRef.current = false;
    lastPaintedCellRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos(null);
    lastPaintedCellRef.current = null;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    mouseIsDownRef.current = true;
    lastPaintedCellRef.current = null;
    const container = containerRef.current;
    if (!container || !e.touches.length) return;
    const rect = container.getBoundingClientRect();
    const pos = getCellFromCoords(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
    if (pos) handleCellClick(pos.row, pos.col);
  }, [getCellFromCoords, handleCellClick]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container || !e.touches.length) return;
    const rect = container.getBoundingClientRect();
    const pos = getCellFromCoords(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
    if (mouseIsDownRef.current && pos) handleCellClick(pos.row, pos.col);
  }, [getCellFromCoords, handleCellClick]);

  const handleTouchEnd = useCallback(() => {
    mouseIsDownRef.current = false;
    lastPaintedCellRef.current = null;
  }, []);

  // Animation Loop
  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { cols, rows, width, height, charWidth, cellSize } = dimsRef.current;
    if (cols === 0 || rows === 0) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    if (timestamp - lastUpdateRef.current >= intervalRef.current) {
      updateGameOfLife();
      lastUpdateRef.current = timestamp;
    }

    const grid = gridRef.current;
    ctx.clearRect(0, 0, width, height);
    
    ctx.font = `${FONT_SIZE}px 'IBM Plex Mono', monospace`;
    ctx.textBaseline = "top";
    
    const isSquare = useSquareRef.current;
    
    // Use cellSize for square mode, charWidth/LINE_HEIGHT for ASCII mode
    const cellWidth = isSquare ? cellSize : charWidth;
    const cellHeight = isSquare ? cellSize : LINE_HEIGHT;
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const xPos = x * cellWidth;
        const yPos = y * cellHeight;
        
        const cell = grid[y]?.[x];
        const isHovered = mousePos && mousePos.col === x && mousePos.row === y;
        
        if (cell?.alive) {
          ctx.fillStyle = "rgba(136, 136, 136, 1)";
          if (isSquare) {
            ctx.fillRect(xPos, yPos, cellSize, cellSize);
          } else {
            ctx.fillText(cell.char, xPos, yPos);
          }
        } else if (isHovered) {
          ctx.fillStyle = "rgba(136, 136, 136, 0.5)";
          if (isSquare) {
            ctx.fillRect(xPos, yPos, cellSize, cellSize);
          } else {
            ctx.fillText(cell?.char || getRandomChar(), xPos, yPos);
          }
        }
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [mousePos, updateGameOfLife]);

  // Start animation
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [animate]);

  // Toggle neighbor in birth/survival sets
  const toggleBirth = (n: number) => {
    setBirthNeighbors(prev => 
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n].sort()
    );
  };

  const toggleSurvival = (n: number) => {
    setSurvivalNeighbors(prev => 
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n].sort()
    );
  };

  // Apply preset
  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setBirthNeighbors([...preset.birth]);
    setSurvivalNeighbors([...preset.survival]);
  };

  // Check if a preset is currently active
  const isPresetActive = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    const birthMatch = preset.birth.length === birthNeighbors.length && 
      preset.birth.every(n => birthNeighbors.includes(n));
    const survivalMatch = preset.survival.length === survivalNeighbors.length && 
      preset.survival.every(n => survivalNeighbors.includes(n));
    return birthMatch && survivalMatch;
  };

  // Reset to Conway
  const handleReset = () => {
    setBirthNeighbors([...DEFAULT_BIRTH]);
    setSurvivalNeighbors([...DEFAULT_SURVIVAL]);
    setResetTrigger(prev => prev + 1);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden select-none relative cursor-default"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <canvas ref={canvasRef} className="block" />

      {/* Control Panel Toggle */}
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="absolute bottom-4 right-4 px-3 py-1 text-xs font-mono text-white hover:opacity-70 transition-opacity z-50 pointer-events-auto cursor-pointer"
      >
        [{isPanelOpen ? "CLOSE" : "CONTROLS"}]
      </button>

      {/* Control Panel */}
      {isPanelOpen && (
        <div 
          className="absolute bottom-12 right-4 w-72 bg-[#0a0a0a]/95 border border-[#444] p-4 font-mono text-xs text-[#ccc] z-50 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#444]">
            <span className="text-white font-normal">GAME OF LIFE</span>
            <button
              onClick={handleReset}
              className="px-2 py-1 text-white hover:opacity-70 transition-opacity cursor-pointer"
            >
              [RESET]
            </button>
          </div>

          {/* Presets */}
          <div className="mb-4">
            <div className="text-[#999] mb-2">PRESETS</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(PRESETS).map(([key, preset]) => {
                const isActive = isPresetActive(key as keyof typeof PRESETS);
                return (
                  <button
                    key={key}
                    onClick={() => applyPreset(key as keyof typeof PRESETS)}
                    className={`px-2 py-1 transition-colors cursor-pointer ${
                      isActive 
                        ? "bg-white text-[#1b1b1b]" 
                        : "text-[#ccc] hover:text-white hover:bg-[#333]"
                    }`}
                  >
                    [{preset.name}]
                  </button>
                );
              })}
            </div>
          </div>

          {/* Birth Rules */}
          <div className="mb-3">
            <div className="text-[#999] mb-1">BIRTH (B{birthNeighbors.join("")})</div>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <button
                  key={n}
                  onClick={() => toggleBirth(n)}
                  className={`w-6 h-6 flex items-center justify-center transition-colors cursor-pointer ${
                    birthNeighbors.includes(n) 
                      ? "bg-white text-black" 
                      : "bg-[#333] text-[#888] hover:bg-[#444] hover:text-white"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Survival Rules */}
          <div className="mb-4">
            <div className="text-[#999] mb-1">SURVIVAL (S{survivalNeighbors.join("")})</div>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <button
                  key={n}
                  onClick={() => toggleSurvival(n)}
                  className={`w-6 h-6 flex items-center justify-center transition-colors cursor-pointer ${
                    survivalNeighbors.includes(n) 
                      ? "bg-white text-black" 
                      : "bg-[#333] text-[#888] hover:bg-[#444] hover:text-white"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Speed */}
          <div className="mb-3">
            <div className="flex justify-between text-[#999] mb-1">
              <span>SPEED</span>
              <span className="text-white">{updateInterval}ms</span>
            </div>
            <input
              type="range"
              min="20"
              max="500"
              value={updateInterval}
              onChange={(e) => setUpdateInterval(Number(e.target.value))}
              className="w-full h-1 bg-[#444] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Initial Density */}
          <div className="mb-3">
            <div className="flex justify-between text-[#999] mb-1">
              <span>DENSITY</span>
              <span className="text-white">{Math.round(initialDensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={initialDensity}
              onChange={(e) => setInitialDensity(Number(e.target.value))}
              className="w-full h-1 bg-[#444] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Character Toggle */}
          <div className="flex justify-between items-center pt-2 border-t border-[#444]">
            <span className="text-[#999]">STYLE</span>
            <button
              onClick={() => setUseSquare(!useSquare)}
              className="px-2 py-1 text-white hover:opacity-70 transition-opacity cursor-pointer"
            >
              [{useSquare ? "SQUARE" : "ASCII"}]
            </button>
          </div>

          {/* New Game Button */}
          <button
            onClick={() => setResetTrigger(prev => prev + 1)}
            className="w-full mt-3 py-2 text-black bg-white hover:opacity-80 transition-opacity cursor-pointer"
          >
            [NEW GAME]
          </button>
        </div>
      )}
    </div>
  );
}
