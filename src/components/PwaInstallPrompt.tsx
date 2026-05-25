import React, { useEffect, useState } from "react";
import { Download, X, Share, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    const standalone = checkStandalone();

    // 2. Check if dismissed for this session
    const isDismissed = sessionStorage.getItem("pwa-prompt-dismissed") === "true";

    if (standalone || isDismissed) {
      return;
    }

    // 3. Detect iOS Safari
    const detectIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      // Apple devices might also hide behind Macintosh userAgent on newer iPads, so check maxTouchPoints
      const isMacIpads = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
      const isApple = isIosDevice || isMacIpads;

      setIsIos(isApple);

      // If it's iOS and not standalone, show after a short delay to feel premium
      if (isApple) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    };

    detectIos();

    // 4. Capture beforeinstallprompt for Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a short delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the browser install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to PWA install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, discard it
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
    setShowPrompt(false);
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/80 backdrop-blur-xl p-5 shadow-2xl transition-all duration-300 hover:shadow-brand/5">
        {/* Soft decorative background blob */}
        <div className="absolute -right-10 -bottom-10 -z-10 h-32 w-32 rounded-full bg-brand/5 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 -z-10 h-32 w-32 rounded-full bg-sky/20 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-muted-foreground hover:text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-brand/40"
          aria-label="Close install prompt"
        >
          <X size={14} />
        </button>

        {/* Content */}
        <div className="flex gap-4">
          {/* Circular logo/icon container */}
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-sky/30 text-brand font-display font-bold shadow-sm border border-brand/10">
            DCC
          </span>

          <div className="flex-1 pr-6">
            <h3 className="font-display font-bold text-sm text-foreground leading-tight">
              Install DCCMS Staff App
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-normal">
              Access student profiles, attendance, and generate reports offline right from your home
              screen.
            </p>

            {isIos ? (
              /* iOS Specific Instructions */
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-50 border border-slate-100 px-3.5 py-2 text-[11px] font-medium text-slate-600">
                <span>To install, tap</span>
                <span className="inline-flex items-center justify-center rounded-md bg-white p-1 shadow-sm border border-slate-200">
                  <Share size={12} className="text-brand" />
                </span>
                <span>then select</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 font-bold shadow-sm border border-slate-200 text-brand-dark">
                  <PlusSquare size={11} className="inline text-brand" /> Add to Home Screen
                </span>
              </div>
            ) : (
              /* Standard Programmatic Install Button */
              <div className="mt-3.5 flex gap-2">
                <Button
                  onClick={handleInstallClick}
                  size="sm"
                  className="rounded-2xl bg-brand hover:bg-brand/90 gap-1.5 text-xs font-bold shadow-sm"
                >
                  <Download size={13} />
                  Get App
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="rounded-2xl text-xs font-medium hover:bg-slate-100 text-muted-foreground hover:text-foreground"
                >
                  Not Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
