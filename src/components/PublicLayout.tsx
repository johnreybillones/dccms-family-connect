import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLocation } from "@tanstack/react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

/** Scattered doodle SVG pattern used as the sitewide background. */
function DoodleBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      style={{ opacity: 0.055 }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <pattern
            id="doodle-pattern"
            x="0"
            y="0"
            width="220"
            height="220"
            patternUnits="userSpaceOnUse"
          >
            {/* Star */}
            <text x="14" y="34" fontSize="28" fill="#0369a1">
              ★
            </text>
            {/* Book */}
            <text x="110" y="28" fontSize="22" fill="#0e7490">
              📚
            </text>
            {/* Heart */}
            <text x="60" y="90" fontSize="24" fill="#e11d48">
              ♥
            </text>
            {/* Cloud */}
            <text x="150" y="95" fontSize="26" fill="#0284c7">
              ☁
            </text>
            {/* Crayon scribble (arc) */}
            <path
              d="M 10 140 Q 40 115 70 140 Q 100 165 130 140"
              stroke="#f59e0b"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            {/* Sun */}
            <text x="155" y="160" fontSize="22" fill="#f59e0b">
              ☀
            </text>
            {/* Small star */}
            <text x="30" y="185" fontSize="16" fill="#7c3aed">
              ✦
            </text>
            {/* Pencil */}
            <text x="95" y="198" fontSize="20" fill="#059669">
              ✏
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#doodle-pattern)" />
      </svg>
    </div>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const shouldReduce = useReducedMotion();

  return (
    <div className="min-h-screen flex flex-col bg-white relative">
      <DoodleBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: shouldReduce ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: shouldReduce ? 0 : -6 }}
              transition={{ duration: shouldReduce ? 0 : 0.22, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </div>
  );
}
