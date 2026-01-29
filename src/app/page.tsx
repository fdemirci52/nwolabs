"use client";

import { useState, useEffect, useRef } from "react";
import VideoAsciiArt from "@/components/ascii/VideoAsciiArt";
import TypewriterText from "@/components/text-effects/TypewriterText";
import HoverRevealText from "@/components/text-effects/HoverRevealText";
import SplashScreen from "@/components/SplashScreen";

// Typing speed (characters per second)
const CHARS_PER_SECOND = 18;
// Fast typing for about section
const ABOUT_CHARS_PER_SECOND = 80;

// About text content
const ABOUT_TEXT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

export default function Home() {
  const [headerTypingComplete, setHeaderTypingComplete] = useState(false);
  const [showSplash, setShowSplash] = useState<boolean | null>(null);
  const [bgColor, setBgColor] = useState("#060606");
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [aboutHeight, setAboutHeight] = useState(0);
  const aboutRef = useRef<HTMLDivElement>(null);

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

  // Measure about section height when it opens
  useEffect(() => {
    if (isAboutOpen && aboutRef.current) {
      // Small delay to ensure text is rendered
      const measureHeight = () => {
        if (aboutRef.current) {
          // About section height + padding (28px top + bottom)
          const contentHeight = aboutRef.current.offsetHeight;
          setAboutHeight(contentHeight + 28); // Add top padding
        }
      };
      
      // Measure after a small delay and on resize
      const timeout = setTimeout(measureHeight, 50);
      const resizeObserver = new ResizeObserver(measureHeight);
      resizeObserver.observe(aboutRef.current);
      
      return () => {
        clearTimeout(timeout);
        resizeObserver.disconnect();
      };
    } else {
      setAboutHeight(0);
    }
  }, [isAboutOpen]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleAboutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAboutOpen(!isAboutOpen);
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
            <VideoAsciiArt onBgColorChange={setBgColor} bottomOffset={aboutHeight} />
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
                <button
                  onClick={handleAboutClick}
                  className={`whitespace-nowrap transition-colors duration-300 ease-in-out cursor-pointer ${
                    isAboutOpen ? "text-white" : "text-white/50 hover:text-white"
                  }`}
                >
                  [{isAboutOpen ? "CLOSE" : "ABOUT"}]
                </button>
              </nav>
            </header>

            {/* Spacer to push footer to bottom */}
            <div className="col-span-8 row-span-1" />

            {/* About Section - Bottom Left */}
            <footer className="col-span-8 self-end">
              <div 
                ref={aboutRef}
                className={`max-w-[600px] transition-opacity duration-300 ${
                  isAboutOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                style={{ 
                  fontSize: "14px", 
                  lineHeight: "21px",
                  paddingTop: "28px" // Match bottom padding from grid-container
                }}
              >
                {isAboutOpen && (
                  <TypewriterText
                    delay={0}
                    charsPerSecond={ABOUT_CHARS_PER_SECOND}
                    disableGlitch
                    hideCursor
                  >
                    {ABOUT_TEXT}
                  </TypewriterText>
                )}
              </div>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
