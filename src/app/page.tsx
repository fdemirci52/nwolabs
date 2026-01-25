"use client";

import { useState } from "react";
import VideoAsciiArt from "@/components/VideoAsciiArt";
import AnimatedAsciiArt from "@/components/AnimatedAsciiArt";
import GameOfLifeAsciiArt from "@/components/GameOfLifeAsciiArt";
import FlameAsciiArt from "@/components/FlameAsciiArt";

type AsciiMode = "video" | "animated" | "gameoflife" | "flame";

const MODES: { id: AsciiMode; label: string }[] = [
  { id: "video", label: "VIDEO" },
  { id: "animated", label: "MATRIX" },
  { id: "gameoflife", label: "LIFE" },
  { id: "flame", label: "FLAME" },
];

export default function Home() {
  const [mode, setMode] = useState<AsciiMode>("gameoflife");

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* ASCII Art Background - Full Height */}
      <div className="absolute inset-0 z-0">
        {mode === "video" && <VideoAsciiArt />}
        {mode === "animated" && <AnimatedAsciiArt />}
        {mode === "gameoflife" && <GameOfLifeAsciiArt />}
        {mode === "flame" && <FlameAsciiArt />}
      </div>

      {/* Content Layer */}
      <div className="grid-container relative z-30 pointer-events-none select-none">
        {/* Header Row */}
        <header className="col-span-8 flex justify-between items-start">
          <div className="font-light">NWO LABS</div>
          <nav className="flex gap-[20px] pointer-events-auto">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`hover:opacity-70 transition-opacity cursor-pointer ${
                  mode === m.id ? "opacity-100" : "opacity-50"
                }`}
              >
                [{m.label}]
              </button>
            ))}
            <a href="#about" className="hover:opacity-70 transition-opacity">[ABOUT]</a>
            <a href="#apps" className="hover:opacity-70 transition-opacity">[APPS]</a>
          </nav>
        </header>

        {/* Main Content */}
        <main className="col-span-8 flex flex-col">
          {/* Services List */}
          <ul className="flex flex-col gap-0">
            <li>MOBILE APPS</li>
            <li>WEB APPS</li>
            <li>DESIGN & DEVELOPMENT</li>
            <li>NEXT.JS</li>
            <li>VERCEL</li>
            <li>SUPABASE</li>
          </ul>
        </main>
      </div>
    </div>
  );
}
