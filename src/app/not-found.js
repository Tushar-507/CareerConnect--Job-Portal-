
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <p className="font-semibold text-indigo-600">404</p>

        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Page not found
        </h1>

        <p className="mt-3 text-slate-600">
          The page you are looking for does not exist or has moved.
        </p>

        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
