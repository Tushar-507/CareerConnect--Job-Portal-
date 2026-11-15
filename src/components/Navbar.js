
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(undefined);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    fetch("/api/me", { cache: "no-store", signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) {
          setUser(data.user ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [pathname]);

  async function handleSignOut() {
    setSigningOut(true);

    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // Even if the request fails, send the user home below.
    }

    setSigningOut(false);
    router.replace("/");
    router.refresh();
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="text-2xl font-bold text-indigo-600">
          CareerConnect
        </Link>

        <nav className="flex flex-wrap items-center gap-5 text-slate-700">
          <Link href="/jobs" className="hover:text-indigo-600">
            Find Jobs
          </Link>

          {user?.role === "CANDIDATE" && (
            <Link
              href="/my-applications"
              className="hover:text-indigo-600"
            >
              My Applications
            </Link>
          )}

          {user?.role === "RECRUITER" && (
            <>
              <Link href="/recruiter/jobs" className="hover:text-indigo-600">
                Post a Job
              </Link>
              <Link
                href="/recruiter/applications"
                className="hover:text-indigo-600"
              >
                Applications
              </Link>
              <Link
                href="/recruiter/company"
                className="hover:text-indigo-600"
              >
                Company
              </Link>
            </>
          )}

          {user === null && (
            <>
              <Link href="/login" className="hover:text-indigo-600">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
              >
                Sign Up
              </Link>
            </>
          )}

          {user && (
            <span className="flex items-center gap-3">
              <span className="hidden text-sm text-slate-500 sm:inline">
                {user.name}
                {user.company ? ` · ${user.company.name}` : ""}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {signingOut ? "Signing out..." : "Sign Out"}
              </button>
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
