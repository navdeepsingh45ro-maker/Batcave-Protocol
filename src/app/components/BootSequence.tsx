"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const bootLines = [
  { text: "> WAYNE ENTERPRISES PRIVATE NETWORK", delay: 200 },
  { text: "> ESTABLISHING ENCRYPTED TUNNEL .......", delay: 400 },
  { text: "> INITIALIZING BATCAVE SYSTEMS", delay: 300 },
  { text: "> THREAT ARRAY ................. ONLINE", delay: 350 },
  { text: "> MISSION CONTROL .............. ONLINE", delay: 300 },
  { text: "> ENVIRONMENT SENSORS .......... ONLINE", delay: 300 },
  { text: "> COMMAND INTERFACE ............. READY", delay: 350 },
  { text: "", delay: 200 },
  { text: "> WELCOME BACK, SIR.", delay: 500 },
];

function BatLogo() {
  return (
    <motion.svg
      viewBox="0 0 120 60"
      fill="none"
      className="mb-10 w-48"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.path
        d="M60 5 C55 5 50 12 45 18 C40 14 30 10 20 12 C25 18 28 25 30 30 C20 28 10 30 2 38 C12 36 22 38 32 42 C28 48 24 52 20 55 C30 50 40 48 50 46 C53 50 56 54 60 58 C64 54 67 50 70 46 C80 48 90 50 100 55 C96 52 92 48 88 42 C98 38 108 36 118 38 C110 30 100 28 90 30 C92 25 95 18 100 12 C90 10 80 14 75 18 C70 12 65 5 60 5Z"
        fill="rgba(255,42,42,0.85)"
        initial={{ pathLength: 0, fillOpacity: 0 }}
        animate={{ pathLength: 1, fillOpacity: 1 }}
        transition={{
          pathLength: { duration: 1.2, ease: "easeInOut" },
          fillOpacity: { duration: 0.6, delay: 0.8 },
        }}
        stroke="rgba(255,42,42,0.6)"
        strokeWidth="0.5"
      />
      <motion.text
        x="60"
        y="72"
        textAnchor="middle"
        fill="rgba(215,224,231,0.6)"
        fontSize="6"
        fontFamily="var(--font-display)"
        letterSpacing="6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.5 }}
      >
        BATCAVE
      </motion.text>
    </motion.svg>
  );
}

export default function BootSequence({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [showLogo, setShowLogo] = useState(true);

  useEffect(() => {
    // Show logo for 1.5s, then start text
    const logoTimer = setTimeout(() => {
      setShowLogo(false);
    }, 1800);

    return () => clearTimeout(logoTimer);
  }, []);

  useEffect(() => {
    if (showLogo) return;

    if (visibleLines >= bootLines.length) {
      const exitTimer = setTimeout(onComplete, 800);
      return () => clearTimeout(exitTimer);
    }

    const totalDelay = bootLines
      .slice(0, visibleLines)
      .reduce((sum, line) => sum + line.delay, 0);

    const nextDelay =
      visibleLines === 0 ? 300 : bootLines[visibleLines - 1]?.delay ?? 300;

    const timer = setTimeout(() => {
      setVisibleLines((prev) => prev + 1);
    }, nextDelay);

    return () => clearTimeout(timer);
  }, [visibleLines, showLogo, onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="boot-overlay"
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {showLogo ? (
          <BatLogo />
        ) : (
          <motion.div
            className="w-full max-w-xl px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-2">
              {bootLines.slice(0, visibleLines).map((line, i) => (
                <div
                  key={i}
                  className="boot-text-line font-mono text-xs tracking-wider sm:text-sm"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    color:
                      i === bootLines.length - 1
                        ? "rgba(255,42,42,0.9)"
                        : "rgba(215,224,231,0.55)",
                  }}
                >
                  {line.text}
                </div>
              ))}
              {visibleLines < bootLines.length && (
                <span className="boot-cursor" />
              )}
            </div>
          </motion.div>
        )}

        {/* Ambient particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-px w-px rounded-full bg-signal/40"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 0.6, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                delay: Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
