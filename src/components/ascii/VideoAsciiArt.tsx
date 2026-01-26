"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ASCII characters from sparse to dense (for dark background)
// Dark pixels = empty space, bright pixels = dense characters
const ASCII_CHARS = " .`'^,:;l!i><~+_-?]0[}{1|/*#•—%x⁰⁴⁷—⁺⁻⁼₀₁₃₊$&☐‡°®";

interface VideoAsciiArtProps {
  videoSrc?: string;
}

export default function VideoAsciiArt({ videoSrc = "/web-promo.mp4" }: VideoAsciiArtProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ascii, setAscii] = useState<string>("");
  const [dimensions, setDimensions] = useState({ cols: 0, rows: 0 });
  const [isVideoReady, setIsVideoReady] = useState(false);
  const animationRef = useRef<number>(0);

  // Character aspect ratio compensation (characters are taller than wide)
  const charAspectRatio = 0.5;

  // Calculate dimensions based on container size using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const charWidth = 6; // IBM Plex Mono 10px approximate char width
    const charHeight = 14; // Line height

    const updateDimensions = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;

      const cols = Math.floor(width / charWidth);
      // Use ceil + 1 to ensure we fill the entire container (overflow is hidden)
      const rows = Math.ceil(height / charHeight) + 1;

      setDimensions({ cols, rows });
    };

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Convert brightness (0-255) to ASCII character
  // Darkness threshold: pixels below this become empty (0-255, higher = more empty space)
  const DARK_THRESHOLD = 30;
  
  const brightnessToAscii = useCallback((brightness: number): string => {
    // Return space for dark/gray areas
    if (brightness < DARK_THRESHOLD) {
      return " ";
    }
    // Map remaining brightness range to ASCII characters
    const adjusted = (brightness - DARK_THRESHOLD) / (255 - DARK_THRESHOLD);
    const index = Math.floor(adjusted * (ASCII_CHARS.length - 1));
    return ASCII_CHARS[index];
  }, []);

  // Process video frame and convert to ASCII
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });

    if (!video || !canvas || !ctx || !isVideoReady) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
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

    for (let y = 0; y < rows; y++) {
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
        result += brightnessToAscii(brightness);
      }
      if (y < rows - 1) result += "\n";
    }

    setAscii(result);
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

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden select-none relative"
    >
      {/* Hidden video element */}
      <video
        ref={videoRef}
        src={videoSrc}
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
      <pre className="absolute bottom-0 left-0 right-0 text-[10px] leading-[14px] font-light whitespace-pre mb-1 p-0 text-[#888]">
        {ascii || "Loading..."}
      </pre>
    </div>
  );
}
