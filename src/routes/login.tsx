import { useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";

import seal from "@/assets/seal-logo.png";
import { loginWithCredentials } from "@/features/staff/client/auth-client";
import { getSession, setSession } from "@/features/staff/client/session-store";

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

  // If a session is already in memory, skip the login page.
  beforeLoad() {
    if (getSession()) {
      throw redirect({ to: "/staff", replace: true });
    }
  },

  component: LoginPage,
});

type Status = "idle" | "loading" | "invalid" | "network_error" | "success";

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    const result = await loginWithCredentials(username.trim(), password);

    if (result.ok) {
      setSession(result.user);
      setStatus("success");
      // Give the success message a moment, then navigate.
      setTimeout(() => navigate({ to: "/staff", replace: true }), 350);
      return;
    }

    if (result.code === "INVALID_CREDENTIALS") {
      setStatus("invalid");
    } else {
      setStatus("network_error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky/30 via-background to-brand/10">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-2xl border border-border/50 p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src={seal}
            alt="Barangay seal"
            className="h-20 w-20 rounded-full mb-3 shadow-md"
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

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="login-username" className="block text-sm font-bold mb-1">
              Username
            </label>
            <input
              id="login-username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-sky-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand bg-background"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              disabled={status === "loading" || status === "success"}
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-bold mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-sky-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-brand bg-background"
                autoComplete="current-password"
                required
                disabled={status === "loading" || status === "success"}
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

          {/* Error / success feedback */}
          {status === "invalid" && (
            <p id="login-error" role="alert" className="text-sm text-accent-red text-center">
              Incorrect username or password. Please try again.
            </p>
          )}
          {status === "network_error" && (
            <p id="login-error" role="alert" className="text-sm text-accent-red text-center">
              Could not reach the server. Check your connection and try again.
            </p>
          )}
          {status === "success" && (
            <p id="login-success" role="status" className="text-sm text-emerald-600 text-center">
              Signed in — opening the management system…
            </p>
          )}

          <button
            id="login-submit"
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="w-full bg-brand-dark hover:bg-brand-dark/90 text-white font-display text-lg px-6 py-3 rounded-2xl shadow transition-colors disabled:opacity-70 inline-flex items-center justify-center gap-2"
          >
            {status === "loading" && (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            )}
            {status === "success" ? "Signing in…" : "Log In"}
          </button>
        </form>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-1 text-sm text-brand hover:underline"
        >
          <ArrowLeft size={14} aria-hidden="true" /> Back to Home
        </Link>
      </div>
    </div>
  );
}
