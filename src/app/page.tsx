"use client";

import { useState } from "react";
import VideoAsciiArt from "@/components/VideoAsciiArt";
import AnimatedAsciiArt from "@/components/AnimatedAsciiArt";

type AsciiMode = "video" | "animated";

export default function Home() {
  const [mode, setMode] = useState<AsciiMode>("video");

  const toggleMode = () => {
    setMode((m) => (m === "video" ? "animated" : "video"));
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* ASCII Art Background */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-0 ${
          mode === "video" ? "h-[calc(100vh-235px)]" : "h-screen"
        }`}
      >
        {mode === "video" ? <VideoAsciiArt /> : <AnimatedAsciiArt />}
      </div>

      {/* Content Layer */}
      <div className="grid-container relative z-10 pointer-events-none">
        {/* Header Row */}
        <header className="col-span-8 flex justify-between items-start pointer-events-auto">
          <div className="font-light">NWO LABS</div>
          <nav className="flex gap-[20px]">
            <button
              onClick={toggleMode}
              className="hover:opacity-70 transition-opacity"
            >
              [TOGGLE]
            </button>
            <a href="#about" className="hover:opacity-70 transition-opacity">[ABOUT]</a>
            <a href="#apps" className="hover:opacity-70 transition-opacity">[APPS]</a>
          </nav>
        </header>

        {/* Main Content */}
        <main className="col-span-8 flex flex-col pointer-events-auto">
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
