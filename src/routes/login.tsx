import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, EyeOff, Wifi, WifiOff, ArrowLeft, Loader2 } from "lucide-react";
import seal from "@/assets/seal-logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Staff Login — Barangay San Antonio de Padua I Day Care Center" },
      {
        name: "description",
        content: "Staff login portal for the Day Care Center of Barangay San Antonio de Padua I.",
      },
    ],
  }),
  component: LoginPage,
});

type Status = "idle" | "loading" | "invalid" | "success";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [online, setOnline] = useState(true);
  const [status, setStatus] = useState<Status>("idle");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setTimeout(() => {
      if (username === "demo" && password === "demo") setStatus("success");
      else setStatus("invalid");
    }, 900);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-sky-200 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src={seal}
            alt="Barangay seal"
            className="h-20 w-20 rounded-full mb-3"
            width={80}
            height={80}
          />
          <h1 className="font-display text-3xl font-bold text-brand">Staff Login</h1>
          <p className="text-sm text-foreground/70 mt-1">
            Barangay San Antonio de Padua I Day Care Center — for authorized personnel only
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl p-3 mb-5">
          Authorized use only. Do not share your credentials. All activity may be logged.
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="u" className="block text-sm font-bold mb-1">
              Username
            </label>
            <input
              id="u"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-sky-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label htmlFor="p" className="block text-sm font-bold mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="p"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-sky-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-brand"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-brand"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOnline((v) => !v)}
            className={`w-full inline-flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-xl border ${
              online
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
            aria-label="Toggle connectivity"
          >
            {online ? <Wifi size={14} /> : <WifiOff size={14} />}
            {online ? "Online" : "Offline — login queued"}
          </button>

          {status === "invalid" && (
            <p className="text-sm text-accent-red text-center">
              Invalid username or password. Try “demo / demo”.
            </p>
          )}
          {status === "success" && (
            <p className="text-sm text-emerald-600 text-center">
              Redirecting to private management system…
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-brand-dark hover:bg-brand-dark/90 text-white font-display text-lg px-6 py-3 rounded-2xl shadow transition-colors disabled:opacity-70 inline-flex items-center justify-center gap-2"
          >
            {status === "loading" && <Loader2 size={18} className="animate-spin" />}
            Login
          </button>
        </form>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-1 text-sm text-brand hover:underline"
        >
          <ArrowLeft size={14} /> Back to Home
        </Link>
      </div>
    </div>
  );
}
