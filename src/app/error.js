
"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">
          Something went wrong
        </h1>

        <p className="mt-3 text-slate-600">
          We could not load this page. This is usually temporary — please try
          again.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
