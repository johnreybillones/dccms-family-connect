import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLocation } from "@tanstack/react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

function MeshGradientBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1] bg-slate-50">
      <div className="absolute -top-24 -left-24 w-[30rem] h-[30rem] bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-65 animate-blob"></div>
      <div className="absolute top-12 -right-24 w-[30rem] h-[30rem] bg-purple-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-65 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-24 left-1/4 w-[30rem] h-[30rem] bg-orange-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-65 animate-blob animation-delay-4000"></div>
    </div>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const shouldReduce = useReducedMotion();

  return (
    <div className="min-h-screen flex flex-col relative">
      <MeshGradientBackground />
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
