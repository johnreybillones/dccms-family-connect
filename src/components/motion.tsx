/**
 * Shared Framer Motion animation primitives.
 * All animations respect `prefers-reduced-motion` via `useReducedMotion`.
 */
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { useRef } from "react";

// ---------------------------------------------------------------------------
// FadeInWhenVisible — fades + slides up when element enters the viewport
// ---------------------------------------------------------------------------
export function FadeInWhenVisible({
  children,
  className,
  delay = 0,
  yOffset = 24,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: shouldReduce ? 0 : yOffset }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// StaggerChildren — cascades children in with a stagger delay
// ---------------------------------------------------------------------------
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const childVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 26 },
  },
};

export function StaggerChildren({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// StaggerItem — individual item inside a StaggerChildren wrapper
// ---------------------------------------------------------------------------
export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={childVariants}>
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// MotionCard — card with lift on hover + tap scale feedback
// ---------------------------------------------------------------------------
export function MotionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      whileHover={shouldReduce ? {} : { y: -6, boxShadow: "0 16px 40px rgba(0,0,0,0.13)" }}
      whileTap={shouldReduce ? {} : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// MotionButton — button with press scale feedback
// ---------------------------------------------------------------------------
export function MotionButton({
  children,
  className,
  onClick,
  type = "button",
  disabled,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  id?: string;
}) {
  const shouldReduce = useReducedMotion();
  return (
    <motion.button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      whileHover={shouldReduce || disabled ? {} : { scale: 1.02 }}
      whileTap={shouldReduce || disabled ? {} : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
    >
      {children}
    </motion.button>
  );
}
