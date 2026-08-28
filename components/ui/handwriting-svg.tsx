"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { HIREMIND_FONTS } from "@/components/ui/font-data";

export interface HandwritingSvgProps {
  className?: string;
  strokeClassName?: string;
  duration?: number;
  pauseDelay?: number;
  onFontChange?: (fontName: string) => void;
}

export function HandwritingSvg({
  className,
  strokeClassName,
  duration = 1.5,
  pauseDelay = 1.5,
  onFontChange,
}: HandwritingSvgProps) {
  const [fontIndex, setFontIndex] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);

  const currentFont = HIREMIND_FONTS[fontIndex];

  useEffect(() => {
    // Total cycle time: duration (1.5s) + pause delay (1.5s)
    const totalCycleMs = (duration + pauseDelay) * 1000;

    const timer = setTimeout(() => {
      setFontIndex((prev) => {
        const next = (prev + 1) % HIREMIND_FONTS.length;
        if (onFontChange) onFontChange(HIREMIND_FONTS[next].name);
        return next;
      });
      setCycleKey((prev) => prev + 1);
    }, totalCycleMs);

    return () => clearTimeout(timer);
  }, [cycleKey, duration, pauseDelay, onFontChange]);

  const glyphCount = currentFont.glyphs.length || 8;
  const staggerStep = (duration * 0.5) / Math.max(1, glyphCount - 1);
  const strokeDur = duration * 0.35;
  const fillDur = duration * 0.25;

  return (
    <div className="flex flex-col items-center justify-center w-full select-none text-center">
      {/* Center-aligned SVG container with fixed bounds to guarantee zero layout shift */}
      <div className="relative flex items-center justify-center w-full max-w-[480px] h-[130px] mx-auto overflow-visible">
        <AnimatePresence mode="wait">
          <motion.div
            key={cycleKey}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex items-center justify-center w-full h-full"
          >
            <svg
              viewBox={currentFont.viewBox}
              preserveAspectRatio="xMidYMid meet"
              className={cn("w-full h-full max-h-[120px] text-[#141414]", className)}
              aria-hidden={true}
              style={{ overflow: "visible" }}
            >
              <title>{`HireMind in ${currentFont.name}`}</title>
              {currentFont.glyphs.map((glyph, idx) => {
                const startDelay = idx * staggerStep;
                const fillStartDelay = startDelay + strokeDur * 0.5;

                return (
                  <motion.path
                    key={`${currentFont.name}-${idx}-${glyph.char}`}
                    d={glyph.path}
                    stroke="currentColor"
                    strokeWidth={currentFont.strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={strokeClassName}
                    initial={{
                      pathLength: 0,
                      fill: "rgba(20, 20, 20, 0)",
                    }}
                    animate={{
                      pathLength: 1,
                      fill: "rgba(20, 20, 20, 1)",
                    }}
                    transition={{
                      pathLength: {
                        duration: strokeDur,
                        delay: startDelay,
                        ease: "easeInOut",
                      },
                      fill: {
                        duration: fillDur,
                        delay: fillStartDelay,
                        ease: "easeOut",
                      },
                    }}
                  />
                );
              })}
            </svg>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default HandwritingSvg;
