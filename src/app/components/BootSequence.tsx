"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const bootLines = [
  { text: "> WAYNE ENTERPRISES PRIVATE NETWORK", delay: 200 },
  { text: "> ESTABLISHING ENCRYPTED TUNNEL .......", delay: 400 },
  { text: "> INITIALIZING BATCAVE SYSTEMS", delay: 300 },
  { text: "> THREAT ARRAY ................. ONLINE", delay: 350 },
  { text: "> ENVIRONMENT SENSORS .......... ONLINE", delay: 300 },
  { text: "> COMMAND INTERFACE ............. READY", delay: 350 },
  { text: "", delay: 200 },
  { text: "> WELCOME BACK, SIR.", delay: 500 },
];

function BatLogo() {
  return (
    <motion.svg
      viewBox="0 0 187.059 187.059"
      fill="none"
      className="mb-10 w-56"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.path
        d="M94.406,146.118c0,0,20.569-43.123,58.889-46.039c-0.262-3.715,3.373-32.008,33.765-59.02c-5.286,1.589-50.687,18.194-50.687,18.194s-9.511,21.711-20.618,35.217c-1.193,1.649-6.637,3.659-8.086,0.262c-1.114-2.569-3.057-19.004-3.057-22.983c0.268,0.268-10.261,22.533-20.298-0.055c0.262,3.44-1.404,16.392-2.643,20.919c-1.814,6.649-6.08,4.238-8.187,1.583c-2.116-2.648-17.598-17.813-20.77-36.352C47.425,56.255,0,40.94,0,40.94s33.177,30.188,32.385,59.053C34.501,100.261,67.982,101.089,94.406,146.118z"
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
  }, [visibleLines, showLogo, onComplete, bootLines]);

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
