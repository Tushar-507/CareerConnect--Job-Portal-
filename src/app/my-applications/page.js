
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
];

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadApplications() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({ page: String(page) });

        if (status) {
          params.set("status", status);
        }

        const response = await fetch(
          `/api/applications/my?${params.toString()}`,
          { signal: controller.signal }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load your applications."
          );
        }

        if (!cancelled) {
          setApplications(data.applications || []);
          setTotal(data.total ?? 0);
          setTotalPages(data.totalPages ?? 1);
        }
      } catch (err) {
        if (cancelled || err.name === "AbortError") {
          return;
        }

        setError(err.message || "Unable to load your applications.");
        setApplications([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadApplications();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, status]);

  function formatDate(date) {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function statusStyle(currentStatus) {
    switch (currentStatus) {
      case "ACCEPTED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "SHORTLISTED":
        return "bg-blue-100 text-blue-800";
      case "REVIEWED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-amber-100 text-amber-800";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="mb-2 font-semibold text-indigo-600">CAREERCONNECT</p>

          <h1 className="text-3xl font-bold text-slate-900">My Applications</h1>

          <p className="mt-3 text-slate-600">
            Track the jobs you have applied for and check their status.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-3 text-sm text-slate-600">
            Filter
            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {!loading && !error && (
            <p className="text-sm text-slate-600">
              Total applications: {total}
            </p>
          )}
        </div>

        {loading && (
          <p className="py-10 text-center text-slate-600">
            Loading your applications...
          </p>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-medium text-amber-900">{error}</p>

            {error.toLowerCase().includes("log in") && (
              <Link
                href="/login?next=/my-applications"
                className="mt-4 inline-block font-semibold text-indigo-600 hover:underline"
              >
                Go to Login
              </Link>
            )}
          </div>
        )}

        {!loading && !error && applications.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              No applications yet
            </h2>

            <p className="mt-2 text-slate-600">
              Explore available jobs and submit your first application.
            </p>

            <Link
              href="/jobs"
              className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Browse Jobs
            </Link>
          </div>
        )}

        {!loading && !error && applications.length > 0 && (
          <div className="space-y-5">
            {applications.map((application) => (
              <article
                key={application.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {application.job.title}
                    </h2>

                    <p className="mt-1 font-medium text-indigo-600">
                      {application.job.company?.name || "Company"}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      {application.job.location || "Location not specified"}
                      {application.job.type
                        ? ` · ${application.job.type.replaceAll("_", " ")}`
                        : ""}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${statusStyle(
                      application.status
                    )}`}
                  >
                    {application.status.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-500">
                  Applied on: {formatDate(application.createdAt)}

                  {application.resumeUrl && (
                    <p className="mt-2">
                      Resume:{" "}
                      <a
                        href={application.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all font-medium text-indigo-600 hover:underline"
                      >
                        {application.resumeUrl}
                      </a>
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page === totalPages}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/jobs"
            className="font-semibold text-indigo-600 hover:underline"
          >
            ← Back to Jobs
          </Link>
        </div>
      </main>
    </div>
  );
}
