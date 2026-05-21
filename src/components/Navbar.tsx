import { useState, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import seal from "@/assets/seal-logo.png";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/announcements", label: "Announcements" },
  { to: "/contact", label: "Contact Us" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="sticky top-4 z-50 px-4 sm:px-6">
      <motion.header
        className="mx-auto max-w-6xl bg-white/90 backdrop-blur-md rounded-full border border-white/50 shadow-clay-card relative"
        animate={
          shouldReduce
            ? {}
            : {
                boxShadow: scrolled
                  ? "0 8px 32px rgba(0,0,0,0.13)"
                  : "0 8px 0 oklch(0.35 0.13 230), inset 0 4px 0 rgba(255,255,255,0.3)",
              }
        }
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="px-4 sm:px-8 flex items-center justify-between overflow-hidden"
          animate={shouldReduce ? {} : { height: scrolled ? 56 : 72 }}
          initial={{ height: 72 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Link to="/" className="flex items-center gap-3" aria-label="Day Care Center Home">
            <img
              src={seal}
              alt="Barangay San Antonio de Padua I seal"
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-sm"
              width={48}
              height={48}
            />
            <div className="leading-tight">
              <div className="font-display text-lg sm:text-xl text-brand font-bold">
                Day Care Center
              </div>
              <div className="text-[10px] sm:text-xs">
                <span className="text-brand font-semibold opacity-80">
                  Brgy. San Antonio de Padua I
                </span>
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
            {links.map((l) => {
              const active = pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`font-display text-base lg:text-lg transition-colors ${
                    active ? "text-brand font-bold" : "text-slate-600 hover:text-brand"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <motion.div
              whileHover={shouldReduce ? {} : { scale: 1.03 }}
              whileTap={shouldReduce ? {} : { scale: 0.96 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
            >
              <Link
                to="/login"
                id="nav-staff-login"
                className="bg-brand text-white font-display text-base lg:text-lg px-7 py-2.5 rounded-full shadow-clay active:shadow-clay-active active:translate-y-[8px] transition-all"
              >
                Staff Login
              </Link>
            </motion.div>
          </nav>

          <button
            className="md:hidden p-2 text-brand bg-sky-50 rounded-full"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </motion.div>

        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="md:hidden absolute top-[110%] left-0 right-0 bg-white p-4 rounded-3xl shadow-clay-card flex flex-col gap-2 border border-sky-50"
            aria-label="Mobile"
          >
            {links.map((l) => {
              const active = pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={`font-display text-lg py-3 px-4 rounded-2xl transition-colors ${
                    active
                      ? "bg-sky-50 text-brand font-bold"
                      : "text-slate-600 hover:bg-sky-50 hover:text-brand"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            {/* Mobile: pill-shaped, not full-width block */}
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              id="mobile-nav-staff-login"
              className="mt-2 self-start bg-brand text-white font-display text-base px-7 py-2.5 rounded-full text-center shadow-clay active:shadow-clay-active active:translate-y-[8px] transition-all"
            >
              Staff Login
            </Link>
          </motion.nav>
        )}
      </motion.header>
    </div>
  );
}
