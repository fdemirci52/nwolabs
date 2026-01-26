"use client";

import { useEffect, useRef, useState } from "react";

// Görseldeki karakterler - çok seyrek
const FLAME_CHARS = "            ..:,/\\|+*#@WM&";

interface FlameAsciiArtProps {
  speed?: number;
}

export default function FlameAsciiArt({ speed = 1 }: FlameAsciiArtProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ascii, setAscii] = useState<string>("");
  const [dimensions, setDimensions] = useState({ cols: 0, rows: 0 });
  const animationRef = useRef<number>(0);
  
  // Fire buffer - Doom fire algoritması için
  const fireBufferRef = useRef<Uint8Array | null>(null);
  const fireWidth = useRef(0);
  const fireHeight = useRef(0);

  // Calculate dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const charWidth = 8.4;
    const charHeight = 21;

    const updateDimensions = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      const cols = Math.floor(width / charWidth);
      const rows = Math.ceil(height / charHeight) + 1;

      setDimensions({ cols, rows });
      
      // Fire buffer'ı initialize et
      fireWidth.current = cols;
      fireHeight.current = rows;
      const bufferSize = cols * rows;
      fireBufferRef.current = new Uint8Array(bufferSize);
      
      // En alt satırı maksimum ateşle doldur
      for (let x = 0; x < cols; x++) {
        fireBufferRef.current[(rows - 1) * cols + x] = FLAME_CHARS.length - 1;
      }
    };

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Doom Fire spread algoritması - orta yükseklik
  const spreadFire = (src: number) => {
    const buffer = fireBufferRef.current;
    const width = fireWidth.current;
    
    if (!buffer || src < width) return;
    
    // Rastgele yayılma
    const rand = Math.round(Math.random() * 3) & 3;
    const dst = src - rand + 1;
    
    // Orta decay - ne çok yüksek ne çok kısa
    const decay = Math.random() > 0.45 ? 1 : 0;
    
    const dstIndex = dst - width;
    if (dstIndex >= 0 && dstIndex < buffer.length) {
      buffer[dstIndex] = Math.max(0, buffer[src] - decay);
    }
  };

  // Ana render döngüsü
  useEffect(() => {
    const { cols, rows } = dimensions;
    if (cols === 0 || rows === 0) return;

    let frameCount = 0;
    
    const renderFrame = () => {
      const buffer = fireBufferRef.current;
      const width = fireWidth.current;
      const height = fireHeight.current;
      
      if (!buffer) {
        animationRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      frameCount++;
      
      // Çok yavaş animasyon - her 8 frame'de bir güncelle
      if (frameCount % 8 !== 0) {
        // Sadece render, güncelleme yapma
      } else {
        // Alt satırda orta yoğunlukta ateş başlat
        for (let x = 0; x < width; x++) {
          const bottomIndex = (height - 1) * width + x;
          // Seyrek ateş
          if (Math.random() > 0.5) {
            buffer[bottomIndex] = FLAME_CHARS.length - 1 - Math.floor(Math.random() * 3);
          } else if (Math.random() > 0.4) {
            buffer[bottomIndex] = FLAME_CHARS.length - 1 - Math.floor(Math.random() * 6);
          } else {
            buffer[bottomIndex] = Math.floor(Math.random() * 10);
          }
        }
        
        // Ateşi yukarı yay
        for (let x = 0; x < width; x++) {
          for (let y = 1; y < height; y++) {
            spreadFire(y * width + x);
          }
        }
      }

      // Buffer'ı ASCII'ye çevir
      let result = "";
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const intensity = buffer[y * width + x];
          result += FLAME_CHARS[intensity] || " ";
        }
        if (y < height - 1) result += "\n";
      }

      setAscii(result);
      animationRef.current = requestAnimationFrame(renderFrame);
    };

    animationRef.current = requestAnimationFrame(renderFrame);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, speed]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden select-none relative"
    >
      <pre className="absolute bottom-0 left-0 right-0 text-[14px] leading-[21px] font-light whitespace-pre mb-1 p-0 text-[#888]">
        {ascii || " "}
      </pre>
    </div>
  );
}
