
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const JOB_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "FULL_TIME", label: "Full time" },
  { value: "PART_TIME", label: "Part time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "REMOTE", label: "Remote" },
];

export default function JobsClient({
  initialQuery,
  initialLocation,
  initialType,
  viewerRole,
}) {
  const initialFilters = {
    q: initialQuery || "",
    location: initialLocation || "",
    type: initialType || "",
  };

  const [filters, setFilters] = useState(initialFilters);
  const [applied, setApplied] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applyingJobId, setApplyingJobId] = useState("");
  const [messages, setMessages] = useState({});
  const [coverLetters, setCoverLetters] = useState({});
  const [resumeLinks, setResumeLinks] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadJobs() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (applied.q) params.set("q", applied.q);
        if (applied.location) params.set("location", applied.location);
        if (applied.type) params.set("type", applied.type);
        params.set("page", String(page));

        const response = await fetch(`/api/jobs?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load jobs.");
        }

        if (!cancelled) {
          setJobs(data.jobs || []);
          setTotal(data.total ?? 0);
          setTotalPages(data.totalPages ?? 1);
        }
      } catch (err) {
        if (cancelled || err.name === "AbortError") {
          return;
        }

        setError(err.message || "Unable to load jobs.");
        setJobs([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadJobs();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [applied, page]);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((previous) => ({ ...previous, [name]: value }));
  }

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setApplied({ ...filters });
  }

  function handleReset() {
    const empty = { q: "", location: "", type: "" };

    setFilters(empty);
    setPage(1);
    setApplied(empty);
  }

  async function handleApply(jobId) {
    if (!viewerRole) {
      setMessages((previous) => ({
        ...previous,
        [jobId]: "Please log in before applying for a job.",
      }));
      return;
    }

    if (viewerRole !== "CANDIDATE") {
      setMessages((previous) => ({
        ...previous,
        [jobId]: "Only candidate accounts can apply for jobs.",
      }));
      return;
    }

    setApplyingJobId(jobId);
    setMessages((previous) => ({ ...previous, [jobId]: "" }));

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          coverLetter: coverLetters[jobId] || "",
          resumeUrl: resumeLinks[jobId] || "",
        }),
      });

      const data = await response.json();

      setMessages((previous) => ({
        ...previous,
        [jobId]:
          data.message ||
          (response.ok
            ? "Application submitted successfully!"
            : "Unable to submit your application."),
      }));
    } catch {
      setMessages((previous) => ({
        ...previous,
        [jobId]: "Could not contact the server. Please try again.",
      }));
    } finally {
      setApplyingJobId("");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="mb-2 font-semibold text-indigo-600">CAREERCONNECT</p>

        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          Explore Job Opportunities
        </h1>

        <p className="mt-3 text-slate-600">
          Find your next opportunity and take the next step in your career.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="mb-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1.4fr_1fr_0.8fr_auto_auto]"
      >
        <input
          type="search"
          name="q"
          value={filters.q}
          onChange={handleFilterChange}
          placeholder="Job title, company, or keyword"
          className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-600"
        />

        <input
          type="text"
          name="location"
          value={filters.location}
          onChange={handleFilterChange}
          placeholder="City or Remote"
          className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-600"
        />

        <select
          name="type"
          value={filters.type}
          onChange={handleFilterChange}
          className="rounded-lg border border-slate-300 bg-white px-4 py-3"
        >
          {JOB_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Search
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Reset
        </button>
      </form>

      {loading && (
        <p className="py-10 text-center text-slate-600">Loading jobs...</p>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          No jobs match your search. Try a different keyword or clear the
          filters.
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <>
          <p className="mb-4 text-sm text-slate-600">
            Showing {jobs.length} of {total} matching jobs
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => {
              const message = messages[job.id] || "";
              const needsLogin = message.toLowerCase().includes("log in");

              return (
                <article
                  key={job.id}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-slate-900">
                      {job.title}
                    </h2>

                    <p className="mt-1 font-medium text-indigo-600">
                      {job.company?.name || "Company"}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      {job.location ||
                        job.company?.location ||
                        "Location not specified"}
                    </p>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {job.type && (
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                        {String(job.type).replaceAll("_", " ")}
                      </span>
                    )}

                    {job.salary && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        {job.salary}
                      </span>
                    )}
                  </div>

                  <p className="mb-4 flex-1 whitespace-pre-line leading-6 text-slate-600">
                    {job.description}
                  </p>

                  <details className="mb-4 rounded-lg border border-slate-200 p-3 text-sm">
                    <summary className="cursor-pointer font-medium text-slate-700">
                      Add a cover letter and resume link (optional)
                    </summary>

                    <textarea
                      rows={4}
                      maxLength={5000}
                      value={coverLetters[job.id] || ""}
                      onChange={(event) =>
                        setCoverLetters((previous) => ({
                          ...previous,
                          [job.id]: event.target.value,
                        }))
                      }
                      placeholder="Why are you a great fit for this role?"
                      className="mt-3 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-indigo-600"
                    />

                    <label
                      htmlFor={`resume-link-${job.id}`}
                      className="mt-4 block font-medium text-slate-700"
                    >
                      Resume link
                    </label>

                    <input
                      id={`resume-link-${job.id}`}
                      type="url"
                      maxLength={500}
                      value={resumeLinks[job.id] || ""}
                      onChange={(event) =>
                        setResumeLinks((previous) => ({
                          ...previous,
                          [job.id]: event.target.value,
                        }))
                      }
                      placeholder="https://drive.google.com/your-resume"
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-indigo-600"
                    />

                    <p className="mt-2 text-xs text-slate-500">
                      Share a public link (Google Drive, Dropbox, portfolio,
                      LinkedIn). Recruiters will see it with your application.
                    </p>
                  </details>

                  <button
                    type="button"
                    disabled={applyingJobId === job.id}
                    onClick={() => handleApply(job.id)}
                    className="mt-auto w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {applyingJobId === job.id ? "Submitting..." : "Apply Now"}
                  </button>

                  {message && (
                    <p
                      role="status"
                      aria-live="polite"
                      className={`mt-3 text-sm ${
                        message.toLowerCase().includes("successfully")
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {message}{" "}
                      {needsLogin && (
                        <Link
                          href="/login?next=/jobs"
                          className="font-semibold text-indigo-600 underline"
                        >
                          Go to login
                        </Link>
                      )}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}

      {!loading && !error && totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
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
            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}
