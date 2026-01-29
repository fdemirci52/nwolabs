"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Character set presets
const CHARACTER_SETS = {
  default: {
    name: "Default",
    chars: " .`'^,:;l!i><~+_-?]0[}{1|/*#•—%x⁰⁴⁷—⁺⁻⁼₀₁₃₊$&☐‡°®",
  },
  blocks: {
    name: "Blocks",
    chars: " ░▒▓█",
  },
  simple: {
    name: "Simple",
    chars: " .-:=+*#%@",
  },
  binary: {
    name: "Binary",
    chars: " 01",
  },
  matrix: {
    name: "Matrix",
    chars: " ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ",
  },
  dots: {
    name: "Dots",
    chars: " ·∘○◎●◉⬤",
  },
};

interface VideoAsciiArtProps {
  onBgColorChange?: (color: string) => void;
}

export default function VideoAsciiArt({ onBgColorChange }: VideoAsciiArtProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ascii, setAscii] = useState<string>("");
  const [asciiColors, setAsciiColors] = useState<string[][]>([]);
  const [dimensions, setDimensions] = useState({ cols: 0, rows: 0 });
  const [isVideoReady, setIsVideoReady] = useState(false);
  const animationRef = useRef<number>(0);

  // Control panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [darkThreshold, setDarkThreshold] = useState(17);
  const [contrast, setContrast] = useState(1.0);
  const [invert, setInvert] = useState(false);
  const [charSetKey, setCharSetKey] = useState<keyof typeof CHARACTER_SETS>("default");
  const [colored, setColored] = useState(false);
  const [fontSize, setFontSize] = useState(10);
  const [lineHeight, setLineHeight] = useState(14);
  const [bgColor, setBgColor] = useState("#060606");
  const [reversed, setReversed] = useState(false);

  // Refs for current settings (to avoid stale closures)
  const darkThresholdRef = useRef(darkThreshold);
  const contrastRef = useRef(contrast);
  const invertRef = useRef(invert);
  const charSetRef = useRef(CHARACTER_SETS[charSetKey].chars);
  const coloredRef = useRef(colored);
  const fontSizeRef = useRef(fontSize);
  const lineHeightRef = useRef(lineHeight);
  const reversedRef = useRef(reversed);
  const lastTimeRef = useRef(0);

  // Update refs when state changes
  useEffect(() => {
    darkThresholdRef.current = darkThreshold;
  }, [darkThreshold]);

  useEffect(() => {
    contrastRef.current = contrast;
  }, [contrast]);

  useEffect(() => {
    invertRef.current = invert;
  }, [invert]);

  useEffect(() => {
    charSetRef.current = CHARACTER_SETS[charSetKey].chars;
  }, [charSetKey]);

  useEffect(() => {
    coloredRef.current = colored;
  }, [colored]);

  useEffect(() => {
    fontSizeRef.current = fontSize;
  }, [fontSize]);

  useEffect(() => {
    lineHeightRef.current = lineHeight;
  }, [lineHeight]);

  useEffect(() => {
    reversedRef.current = reversed;
  }, [reversed]);

  // Handle reverse playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoReady) return;

    if (reversed) {
      video.pause();
    } else {
      video.play();
    }
  }, [reversed, isVideoReady]);

  // Notify parent when bg color changes
  useEffect(() => {
    onBgColorChange?.(bgColor);
  }, [bgColor, onBgColorChange]);

  // Character aspect ratio compensation (characters are taller than wide)
  // Dynamically calculated based on font size and line height
  const charWidth = fontSize * 0.6;
  const charAspectRatio = charWidth / lineHeight;

  // Calculate dimensions based on container size using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    // Approximate char width based on font size (monospace ratio ~0.6)
    const effectiveCharWidth = fontSize * 0.6;
    const charHeight = lineHeight;

    const updateDimensions = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;

      const cols = Math.floor(width / effectiveCharWidth);
      // Use ceil + 1 to ensure we fill the entire container (overflow is hidden)
      const rows = Math.ceil(height / charHeight) + 1;

      setDimensions({ cols, rows });
    };

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [fontSize, lineHeight]);

  // Convert brightness (0-255) to ASCII character
  const brightnessToAscii = useCallback((brightness: number): string => {
    const chars = charSetRef.current;
    const threshold = darkThresholdRef.current;
    const contrastVal = contrastRef.current;
    const shouldInvert = invertRef.current;

    // Apply invert
    let adjustedBrightness = shouldInvert ? 255 - brightness : brightness;

    // Apply contrast (centered at 128)
    adjustedBrightness = ((adjustedBrightness - 128) * contrastVal) + 128;
    adjustedBrightness = Math.max(0, Math.min(255, adjustedBrightness));

    // Return space for dark areas
    if (adjustedBrightness < threshold) {
      return " ";
    }

    // Map remaining brightness range to ASCII characters
    const normalized = (adjustedBrightness - threshold) / (255 - threshold);
    const index = Math.floor(normalized * (chars.length - 1));
    return chars[Math.min(index, chars.length - 1)];
  }, []);

  // Process video frame and convert to ASCII
  const processFrame = useCallback((timestamp: number) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });

    if (!video || !canvas || !ctx || !isVideoReady) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // Handle reverse playback
    if (reversedRef.current) {
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      
      // Move backwards at normal playback speed
      if (deltaTime > 0 && deltaTime < 0.1) {
        video.currentTime = Math.max(0, video.currentTime - deltaTime);
        // Loop back to end when reaching start
        if (video.currentTime <= 0) {
          video.currentTime = video.duration;
        }
      }
    }

    const { cols, rows } = dimensions;
    if (cols === 0 || rows === 0) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // Set canvas size to match ASCII grid
    // Compensate for character aspect ratio
    const sampleWidth = cols;
    const sampleHeight = Math.floor(rows / charAspectRatio);

    canvas.width = sampleWidth;
    canvas.height = sampleHeight;

    // Calculate "cover" style cropping
    // Video should fill the container while maintaining aspect ratio
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const videoAspect = videoWidth / videoHeight;
    const canvasAspect = sampleWidth / sampleHeight;

    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = videoWidth;
    let sourceHeight = videoHeight;

    if (videoAspect > canvasAspect) {
      // Video is wider than canvas - crop sides
      sourceWidth = videoHeight * canvasAspect;
      sourceX = (videoWidth - sourceWidth) / 2;
    } else {
      // Video is taller than canvas - crop top/bottom
      sourceHeight = videoWidth / canvasAspect;
      sourceY = (videoHeight - sourceHeight) / 2;
    }

    // Draw cropped video frame to canvas (cover style)
    ctx.drawImage(
      video,
      sourceX, sourceY, sourceWidth, sourceHeight,  // Source rectangle
      0, 0, sampleWidth, sampleHeight               // Destination rectangle
    );

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
    const pixels = imageData.data;

    let result = "";
    const colors: string[][] = [];
    const isColored = coloredRef.current;

    for (let y = 0; y < rows; y++) {
      const rowColors: string[] = [];
      for (let x = 0; x < cols; x++) {
        // Map ASCII grid position to sample position
        const sampleY = Math.floor((y / rows) * sampleHeight);
        const sampleX = x;

        // Get pixel index (4 values per pixel: R, G, B, A)
        const pixelIndex = (sampleY * sampleWidth + sampleX) * 4;

        const r = pixels[pixelIndex];
        const g = pixels[pixelIndex + 1];
        const b = pixels[pixelIndex + 2];

        // Calculate perceived brightness using luminosity method
        // Human eye is more sensitive to green, less to blue
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

        // Convert to ASCII character
        const char = brightnessToAscii(brightness);
        result += char;

        // Store color for this character if colored mode is enabled
        if (isColored && char !== " ") {
          rowColors.push(`rgb(${r},${g},${b})`);
        } else {
          rowColors.push("");
        }
      }
      colors.push(rowColors);
      if (y < rows - 1) result += "\n";
    }

    setAscii(result);
    if (isColored) {
      setAsciiColors(colors);
    }
    animationRef.current = requestAnimationFrame(processFrame);
  }, [dimensions, isVideoReady, brightnessToAscii]);

  // Start processing when video is ready
  useEffect(() => {
    if (isVideoReady && dimensions.cols > 0 && dimensions.rows > 0) {
      animationRef.current = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVideoReady, dimensions, processFrame]);

  // Handle video events
  const handleVideoReady = () => {
    setIsVideoReady(true);
  };

  // Reset to defaults
  const handleReset = () => {
    setDarkThreshold(17);
    setContrast(1.0);
    setInvert(false);
    setCharSetKey("default");
    setColored(false);
    setFontSize(10);
    setLineHeight(14);
    setBgColor("#060606");
    setReversed(false);
  };

  // Render ASCII with or without colors
  const renderAscii = () => {
    if (!ascii) return "Loading...";

    if (!colored) {
      return ascii;
    }

    // Colored mode - render each character with its color
    const lines = ascii.split("\n");
    return lines.map((line, y) => (
      <span key={y}>
        {line.split("").map((char, x) => {
          const color = asciiColors[y]?.[x];
          if (color && char !== " ") {
            return (
              <span key={x} style={{ color }}>
                {char}
              </span>
            );
          }
          return char;
        })}
        {y < lines.length - 1 ? "\n" : ""}
      </span>
    ));
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden select-none relative"
    >
      {/* Hidden video element */}
      <video
        ref={videoRef}
        src="/video.mp4"
        autoPlay
        loop
        muted
        playsInline
        onCanPlay={handleVideoReady}
        onLoadedData={handleVideoReady}
        className="absolute opacity-0 pointer-events-none"
        style={{ width: 1, height: 1 }}
      />

      {/* Hidden canvas for processing */}
      <canvas
        ref={canvasRef}
        className="absolute opacity-0 pointer-events-none"
      />

      {/* ASCII output - anchored to bottom */}
      <pre 
        className="absolute bottom-0 left-0 right-0 font-light whitespace-pre mb-1 p-0 text-[#888]"
        style={{ fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px` }}
      >
        {renderAscii()}
      </pre>

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
            <span className="text-white font-normal">VIDEO ASCII</span>
            <button
              onClick={handleReset}
              className="px-2 py-1 text-white hover:opacity-70 transition-opacity cursor-pointer"
            >
              [RESET]
            </button>
          </div>

          {/* Character Sets */}
          <div className="mb-4">
            <div className="text-[#999] mb-2">CHARACTER SET</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(CHARACTER_SETS).map(([key, set]) => {
                const isActive = charSetKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => setCharSetKey(key as keyof typeof CHARACTER_SETS)}
                    className={`px-2 py-1 transition-colors cursor-pointer ${
                      isActive 
                        ? "bg-white text-[#1b1b1b]" 
                        : "text-[#ccc] hover:text-white hover:bg-[#333]"
                    }`}
                  >
                    [{set.name}]
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dark Threshold */}
          <div className="mb-3">
            <div className="flex justify-between text-[#999] mb-1">
              <span>THRESHOLD</span>
              <span className="text-white">{darkThreshold}</span>
            </div>
            <input
              type="range"
              min="0"
              max="128"
              value={darkThreshold}
              onChange={(e) => setDarkThreshold(Number(e.target.value))}
              className="w-full h-1 bg-[#444] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Contrast */}
          <div className="mb-3">
            <div className="flex justify-between text-[#999] mb-1">
              <span>CONTRAST</span>
              <span className="text-white">{contrast.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full h-1 bg-[#444] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Font Size */}
          <div className="mb-3">
            <div className="flex justify-between text-[#999] mb-1">
              <span>FONT SIZE</span>
              <span className="text-white">{fontSize}px</span>
            </div>
            <input
              type="range"
              min="6"
              max="24"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full h-1 bg-[#444] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Line Height */}
          <div className="mb-3">
            <div className="flex justify-between text-[#999] mb-1">
              <span>LINE HEIGHT</span>
              <span className="text-white">{lineHeight}px</span>
            </div>
            <input
              type="range"
              min="8"
              max="32"
              value={lineHeight}
              onChange={(e) => setLineHeight(Number(e.target.value))}
              className="w-full h-1 bg-[#444] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Background Color */}
          <div className="mb-3">
            <div className="flex justify-between items-center text-[#999] mb-1">
              <span>BG COLOR</span>
              <span className="text-white uppercase">{bgColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-8 h-8 bg-transparent border border-[#444] cursor-pointer"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(
                  (parseInt(bgColor.slice(1, 3), 16) +
                    parseInt(bgColor.slice(3, 5), 16) +
                    parseInt(bgColor.slice(5, 7), 16)) /
                    7.65
                )}
                onChange={(e) => {
                  const val = Math.round((Number(e.target.value) / 100) * 255);
                  const hex = val.toString(16).padStart(2, "0");
                  setBgColor(`#${hex}${hex}${hex}`);
                }}
                className="flex-1 h-1 bg-[#444] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-[#444] space-y-2">
            {/* Invert Toggle */}
            <div className="flex justify-between items-center">
              <span className="text-[#999]">INVERT</span>
              <button
                onClick={() => setInvert(!invert)}
                className={`px-2 py-1 transition-colors cursor-pointer ${
                  invert 
                    ? "bg-white text-[#1b1b1b]" 
                    : "text-white hover:opacity-70"
                }`}
              >
                [{invert ? "ON" : "OFF"}]
              </button>
            </div>

            {/* Colored Toggle */}
            <div className="flex justify-between items-center">
              <span className="text-[#999]">COLORED</span>
              <button
                onClick={() => setColored(!colored)}
                className={`px-2 py-1 transition-colors cursor-pointer ${
                  colored 
                    ? "bg-white text-[#1b1b1b]" 
                    : "text-white hover:opacity-70"
                }`}
              >
                [{colored ? "ON" : "OFF"}]
              </button>
            </div>

            {/* Reverse Toggle */}
            <div className="flex justify-between items-center">
              <span className="text-[#999]">REVERSE</span>
              <button
                onClick={() => setReversed(!reversed)}
                className={`px-2 py-1 transition-colors cursor-pointer ${
                  reversed 
                    ? "bg-white text-[#1b1b1b]" 
                    : "text-white hover:opacity-70"
                }`}
              >
                [{reversed ? "ON" : "OFF"}]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
