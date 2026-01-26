"use client";

import { useState } from "react";
import VideoAsciiArt from "@/components/VideoAsciiArt";
import AnimatedAsciiArt from "@/components/AnimatedAsciiArt";
import GameOfLifeAsciiArt from "@/components/GameOfLifeAsciiArt";
import FlameAsciiArt from "@/components/FlameAsciiArt";
import TypewriterText from "@/components/TypewriterText";
import HoverRevealText from "@/components/HoverRevealText";

type AsciiMode = "video" | "animated" | "gameoflife" | "flame";

const SERVICES = [
  "MOBILE APPS",
  "WEB APPS",
  "DESIGN & DEVELOPMENT",
  "NEXT.JS",
  "VERCEL",
  "SUPABASE",
];

// Typing speed (characters per second)
const CHARS_PER_SECOND = 18;
// Stagger delay between each line (ms)
const STAGGER_DELAY = 120;

// Nav items for typewriter effect (text without brackets)
const NAV_ITEMS = [
  { text: "VIDEO", id: "video" as const },
  { text: "MATRIX", id: "animated" as const },
  { text: "LIFE", id: "gameoflife" as const },
  { text: "FLAME", id: "flame" as const },
  { text: "ABOUT", href: "#about" },
  { text: "APPS", href: "#apps" },
];

export default function Home() {
  const [mode, setMode] = useState<AsciiMode>("flame");
  const [headerTypingComplete, setHeaderTypingComplete] = useState(false);

  // Calculate delay for each service based on previous lines
  const getServiceDelay = (index: number) => {
    // Header "NWO LABS" starts at 0, takes some time
    const headerDuration = ("NWO LABS".length / CHARS_PER_SECOND) * 1000;
    // Base delay after header
    let totalDelay = headerDuration + STAGGER_DELAY;
    
    // Add stagger for each previous service
    for (let i = 0; i < index; i++) {
      totalDelay += STAGGER_DELAY;
    }
    
    return totalDelay;
  };

  // Calculate delay for nav items (start after NWO LABS with stagger)
  const getNavDelay = (index: number) => {
    const headerDuration = ("NWO LABS".length / CHARS_PER_SECOND) * 1000;
    return headerDuration + (index * STAGGER_DELAY);
  };

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
          <div className="font-light">
            {headerTypingComplete ? (
              <HoverRevealText revealText="NEW WORLD ORDER">
                NWO LABS
              </HoverRevealText>
            ) : (
              <TypewriterText
                delay={0}
                charsPerSecond={CHARS_PER_SECOND}
                disableGlitch
                onComplete={() => setHeaderTypingComplete(true)}
              >
                NWO LABS
              </TypewriterText>
            )}
          </div>
          <nav className="flex gap-[20px] pointer-events-auto">
            {NAV_ITEMS.map((item, index) => {
              const modeId = "id" in item ? item.id : null;
              const isActive = modeId !== null && mode === modeId;
              const isLink = "href" in item;
              const fullLabel = `[${item.text}]`;
              
              const innerContent = (
                <span className="relative inline-block">
                  {/* Invisible placeholder for width */}
                  <span className="invisible">{fullLabel}</span>
                  {/* Visible typing content */}
                  <span className="absolute left-0 top-0">
                    <TypewriterText
                      delay={getNavDelay(index)}
                      charsPerSecond={CHARS_PER_SECOND}
                      glitchRadius={80}
                      glitchIntensity={0.6}
                      hideCursor
                    >
                      {fullLabel}
                    </TypewriterText>
                  </span>
                </span>
              );

              const baseClass = `hover:opacity-70 transition-opacity whitespace-nowrap ${
                isActive ? "opacity-100" : "opacity-50"
              }`;

              if (isLink) {
                return (
                  <a
                    key={item.text}
                    href={item.href}
                    className={baseClass}
                  >
                    {innerContent}
                  </a>
                );
              }

              return (
                <button
                  key={item.text}
                  onClick={() => modeId && setMode(modeId)}
                  className={`${baseClass} cursor-pointer`}
                >
                  {innerContent}
                </button>
              );
            })}
          </nav>
        </header>

        {/* Main Content */}
        <main className="col-span-8 flex flex-col">
          {/* Services List */}
          <ul className="flex flex-col gap-0">
            {SERVICES.map((service, index) => (
              <li key={service}>
                <TypewriterText
                  delay={getServiceDelay(index)}
                  charsPerSecond={CHARS_PER_SECOND}
                  glitchRadius={100}
                  glitchIntensity={0.7}
                >
                  {service}
                </TypewriterText>
              </li>
            ))}
          </ul>
        </main>
      </div>
    </div>
  );
}
