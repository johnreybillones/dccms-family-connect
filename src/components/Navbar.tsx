import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import seal from "@/assets/seal-logo.png";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/announcements", label: "Announcements" },
  { to: "/contact", label: "Contact Us" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-sky-100 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-3" aria-label="DCCMS Home">
          <img src={seal} alt="Barangay San Antonio de Padua I seal" className="h-12 w-12 rounded-full" width={48} height={48} />
          <div className="leading-tight">
            <div className="font-display text-xl sm:text-2xl text-brand font-bold">DCCMS</div>
            <div className="text-[10px] sm:text-xs">
              <span className="text-brand font-semibold">Day Care Center</span>{" "}
              <span className="text-accent-red font-semibold">Management System</span>
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
                className={`font-display text-lg transition-colors ${
                  active ? "text-brand font-bold" : "text-foreground hover:text-brand"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            to="/login"
            className="bg-brand hover:bg-brand/90 text-white font-display text-lg px-7 py-2.5 rounded-2xl shadow-md transition-colors"
          >
            Login
          </Link>
        </nav>

        <button
          className="md:hidden p-2 text-brand"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-sky-100 bg-white px-4 py-4 flex flex-col gap-2" aria-label="Mobile">
          {links.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={`font-display text-lg py-3 px-3 rounded-xl ${
                  active ? "bg-sky-100 text-brand font-bold" : "text-foreground hover:bg-sky-50"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="mt-2 bg-brand text-white font-display text-lg px-6 py-3 rounded-2xl text-center shadow"
          >
            Login
          </Link>
        </nav>
      )}
    </header>
  );
}