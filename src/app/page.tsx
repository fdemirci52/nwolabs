"use client";

import { useState } from "react";
import VideoAsciiArt from "@/components/VideoAsciiArt";
import AnimatedAsciiArt from "@/components/AnimatedAsciiArt";
import GameOfLifeAsciiArt from "@/components/GameOfLifeAsciiArt";

type AsciiMode = "video" | "animated" | "gameoflife";

const MODE_ORDER: AsciiMode[] = ["video", "animated", "gameoflife"];
const MODE_LABELS: Record<AsciiMode, string> = {
  video: "VIDEO",
  animated: "MATRIX",
  gameoflife: "LIFE",
};

export default function Home() {
  const [mode, setMode] = useState<AsciiMode>("gameoflife");

  const toggleMode = () => {
    setMode((m) => {
      const currentIndex = MODE_ORDER.indexOf(m);
      const nextIndex = (currentIndex + 1) % MODE_ORDER.length;
      return MODE_ORDER[nextIndex];
    });
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* ASCII Art Background - Full Height */}
      <div className="absolute inset-0 z-0">
        {mode === "video" && <VideoAsciiArt />}
        {mode === "animated" && <AnimatedAsciiArt />}
        {mode === "gameoflife" && <GameOfLifeAsciiArt />}
      </div>

      {/* Content Layer */}
      <div className="grid-container relative z-30 pointer-events-none select-none">
        {/* Header Row */}
        <header className="col-span-8 flex justify-between items-start">
          <div className="font-light">NWO LABS</div>
          <nav className="flex gap-[20px] pointer-events-auto">
            <button
              onClick={toggleMode}
              className="hover:opacity-70 transition-opacity cursor-pointer"
            >
              [{MODE_LABELS[mode]}]
            </button>
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
