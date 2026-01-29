"use client";

import { useState, useEffect } from "react";
import VideoAsciiArt from "@/components/ascii/VideoAsciiArt";
import TypewriterText from "@/components/text-effects/TypewriterText";
import HoverRevealText from "@/components/text-effects/HoverRevealText";
import SplashScreen from "@/components/SplashScreen";

// Typing speed (characters per second)
const CHARS_PER_SECOND = 18;
// Stagger delay between each line (ms)
const STAGGER_DELAY = 120;

// Nav items for typewriter effect (text without brackets)
const NAV_ITEMS = [
  { text: "ABOUT", href: "#about" },
];

export default function Home() {
  const [headerTypingComplete, setHeaderTypingComplete] = useState(false);
  const [showSplash, setShowSplash] = useState<boolean | null>(null);
  const [bgColor, setBgColor] = useState("#060606");

  // Show splash only on new tab (not on refresh or URL re-entry)
  // sessionStorage is cleared when tab closes, so new tab = empty storage
  useEffect(() => {
    const splashShown = sessionStorage.getItem("nwo_splash_shown");
    if (splashShown) {
      setShowSplash(false);
    } else {
      setShowSplash(true);
      sessionStorage.setItem("nwo_splash_shown", "true");
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Calculate delay for nav items (start after NWO LABS with stagger)
  const getNavDelay = (index: number) => {
    const headerDuration = ("NWO LABS".length / CHARS_PER_SECOND) * 1000;
    return headerDuration + (index * STAGGER_DELAY);
  };

  // Show empty screen while checking sessionStorage
  if (showSplash === null) {
    return <div className="h-screen w-full" style={{ backgroundColor: bgColor }} />;
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Main content - only render after splash completes */}
      {!showSplash && (
        <div 
          className="relative h-screen w-full overflow-hidden transition-colors duration-300"
          style={{ backgroundColor: bgColor }}
        >
          {/* ASCII Art Background - Full Height */}
          <div className="absolute inset-0 z-0">
            <VideoAsciiArt onBgColorChange={setBgColor} />
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
                          disableGlitch
                          hideCursor
                        >
                          {fullLabel}
                        </TypewriterText>
                      </span>
                    </span>
                  );

                  return (
                    <a
                      key={item.text}
                      href={item.href}
                      className="whitespace-nowrap transition-colors duration-300 ease-in-out hover:text-white text-white/50 hover:text-white"
                    >
                      {innerContent}
                    </a>
                  );
                })}
              </nav>
            </header>
          </div>
        </div>
      )}
    </>
  );
}
