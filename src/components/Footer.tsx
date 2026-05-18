import { Link } from "@tanstack/react-router";
import { Twitter, Instagram, Youtube, Linkedin } from "lucide-react";
import seal from "@/assets/seal-logo.png";

const col = "flex flex-col gap-2";
const heading = "font-display text-base font-bold text-foreground mb-2";
const link = "text-sm text-foreground/70 hover:text-brand transition-colors";

export function Footer() {
  return (
    <footer className="bg-white border-t border-sky-100 mt-0">
      <div className="mx-auto max-w-7xl px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <img src={seal} alt="DCCMS seal" className="h-14 w-14 rounded-full mb-4" width={56} height={56} />
          <div className="flex gap-3 text-foreground/80">
            <a href="#" aria-label="X / Twitter" className="hover:text-brand"><Twitter size={18} /></a>
            <a href="#" aria-label="Instagram" className="hover:text-brand"><Instagram size={18} /></a>
            <a href="#" aria-label="YouTube" className="hover:text-brand"><Youtube size={18} /></a>
            <a href="#" aria-label="LinkedIn" className="hover:text-brand"><Linkedin size={18} /></a>
          </div>
        </div>
        <div className={col}>
          <h3 className={heading}>System</h3>
          <span className={link}>Student Records</span>
          <span className={link}>Attendance</span>
          <span className={link}>Offline Access</span>
        </div>
        <div className={col}>
          <h3 className={heading}>Explore</h3>
          <Link to="/" className={link}>Home</Link>
          <Link to="/about" className={link}>About Us</Link>
          <Link to="/announcements" className={link}>Announcements</Link>
          <Link to="/contact" className={link}>Contact Us</Link>
        </div>
        <div className={col}>
          <h3 className={heading}>Community</h3>
          <span className={link}>Day Care Personnel</span>
          <span className={link}>Barangay San Antonio de Padua I</span>
          <span className={link}>Parents &amp; Guardians</span>
          <span className={link}>CSWD Office</span>
        </div>
      </div>
      <div className="border-t border-sky-100 py-4 text-center text-xs text-foreground/60">
        © {new Date().getFullYear()} DCCMS · Barangay San Antonio de Padua I, Dasmariñas City, Cavite
      </div>
    </footer>
  );
}