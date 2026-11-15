
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function safeNextPath(rawNext) {
  if (typeof rawNext !== "string") {
    return null;
  }

  // Only allow internal absolute paths to avoid open redirects.
  if (!rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return null;
  }

  return rawNext;
}

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    setMessage("");
    setIsError(false);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed.");
      }

      const requestedNext = safeNextPath(
        new URLSearchParams(window.location.search).get("next")
      );
      const destination =
        requestedNext ||
        (result.user?.role === "RECRUITER" ? "/recruiter/jobs" : "/jobs");

      setMessage("Login successful! Redirecting...");
      router.replace(destination);
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <Link href="/" className="text-2xl font-bold text-indigo-600">
          CareerConnect
        </Link>

        <h1 className="mt-8 text-3xl font-bold text-slate-900">
          Welcome Back!
        </h1>

        <p className="mt-2 text-slate-600">
          Sign in to continue your career journey.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block font-medium">
              Email Address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block font-medium">
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-600"
            />
          </div>

          {message && (
            <p
              role="status"
              aria-live="polite"
              className={isError ? "text-red-600" : "text-green-600"}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-indigo-600 hover:underline"
          >
            Create Account
          </Link>
        </p>
      </div>
    </main>
  );
}
