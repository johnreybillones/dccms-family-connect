/**
 * src/components/staff/PinGate.tsx
 *
 * Offline PIN unlock screen for the encrypted staff vault.
 *
 * Shows a beautiful numeric PIN pad; collects 6 digits, then attempts
 * to unlock the vault via offline-vault.unlockVault(). Renders inline
 * error feedback for wrong PINs, progressive lock delays, and a recovery
 * link for the online reactivation path.
 *
 * Usage:
 *   <PinGate userId={user.id} onUnlocked={() => setVaultOpen(true)} />
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { unlockVault, getPinLockStatus } from "@/features/staff/client/offline-vault";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type PinGateProps = {
  userId: string;
  displayName?: string;
  onUnlocked: () => void;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PIN_LENGTH = 6;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PinGate({ userId, displayName, onUnlocked }: PinGateProps) {
  const [digits, setDigits] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "checking" | "error" | "locked">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [remainingSec, setRemainingSec] = useState(0);
  const [shake, setShake] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll lock countdown
  useEffect(() => {
    const poll = () => {
      const { locked, remainingMs } = getPinLockStatus();
      if (locked) {
        setStatus("locked");
        setRemainingSec(Math.ceil(remainingMs / 1000));
      } else if (status === "locked") {
        setStatus("idle");
        setErrorMsg("");
      }
    };
    timerRef.current = setInterval(poll, 500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const handleKey = useCallback(
    async (key: string) => {
      if (status === "locked" || status === "checking") return;

      if (key === "⌫") {
        setDigits((d) => d.slice(0, -1));
        return;
      }
      if (key === "") return; // spacer key

      const next = [...digits, key].slice(0, PIN_LENGTH);
      setDigits(next);

      if (next.length === PIN_LENGTH) {
        setStatus("checking");
        const pin = next.join("");
        const result = await unlockVault(userId, pin);

        if (result.ok) {
          onUnlocked();
        } else {
          setShake(true);
          setTimeout(() => setShake(false), 600);
          setDigits([]);

          if (result.reason === "pin_locked") {
            setStatus("locked");
            setErrorMsg("Too many attempts. Please wait.");
          } else if (result.reason === "no_wrapped_key") {
            setStatus("error");
            setErrorMsg("No offline PIN found. Please sign in online to re-enroll.");
          } else {
            setStatus("error");
            setErrorMsg("Incorrect PIN. Try again.");
          }
          // Clear error message after 3s for recoverable errors
          if (result.reason === "wrong_pin") {
            setTimeout(() => {
              setStatus("idle");
              setErrorMsg("");
            }, 3000);
          }
        }
      } else {
        if (status === "error") {
          setStatus("idle");
          setErrorMsg("");
        }
      }
    },
    [digits, status, userId, onUnlocked],
  );

  // Keyboard support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") handleKey(e.key);
      else if (e.key === "Backspace") handleKey("⌫");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200">
            <ShieldCheck className="size-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Enter your offline PIN</h1>
          {displayName && <p className="mt-1 text-sm text-gray-500">Welcome back, {displayName}</p>}
        </div>

        {/* PIN dots */}
        <motion.div
          animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="mb-6 flex justify-center gap-4"
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: digits[i] !== undefined ? 1.15 : 1,
                backgroundColor: digits[i] !== undefined ? "#4f46e5" : "#e5e7eb",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="size-4 rounded-full"
            />
          ))}
        </motion.div>

        {/* Error / lock message */}
        <AnimatePresence>
          {(status === "error" || status === "locked") && (
            <motion.div
              key="msg"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {status === "locked" ? (
                <Clock className="size-4 shrink-0" />
              ) : (
                <AlertCircle className="size-4 shrink-0" />
              )}
              <span>
                {errorMsg}
                {status === "locked" && remainingSec > 0 && (
                  <span className="ml-1 font-semibold">({remainingSec}s)</span>
                )}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-3">
          {KEYS.map((key, idx) => {
            const isDelete = key === "⌫";
            const isSpacer = key === "";
            const isDisabled = status === "locked" || status === "checking";

            if (isSpacer) return <div key={idx} />;

            return (
              <motion.button
                key={idx}
                whileTap={!isDisabled ? { scale: 0.92 } : {}}
                onClick={() => handleKey(key)}
                disabled={isDisabled}
                aria-label={isDelete ? "Delete" : `Digit ${key}`}
                className={[
                  "flex h-16 items-center justify-center rounded-2xl text-xl font-semibold",
                  "transition-colors duration-100 select-none",
                  isDelete
                    ? "bg-red-50 text-red-500 hover:bg-red-100 active:bg-red-200"
                    : "bg-white text-gray-800 shadow-sm shadow-gray-200 hover:bg-indigo-50 active:bg-indigo-100",
                  isDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
                ].join(" ")}
              >
                {key}
              </motion.button>
            );
          })}
        </div>

        {/* Recovery link */}
        <div className="mt-8 text-center">
          <a
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline"
          >
            <RefreshCw className="size-3.5" />
            Sign in online to recover access
          </a>
        </div>
      </motion.div>
    </div>
  );
}
