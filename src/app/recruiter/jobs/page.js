
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

const EMPTY_FORM = {
  title: "",
  description: "",
  location: "",
  type: "FULL_TIME",
  salary: "",
};

export default function RecruiterJobsPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [company, setCompany] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyJobId, setBusyJobId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadAll() {
      try {
        const [companyResponse, jobsResponse] = await Promise.all([
          fetch("/api/recruiter/company", { signal: controller.signal }),
          fetch("/api/recruiter/jobs", { signal: controller.signal }),
        ]);

        const companyData = await companyResponse.json();
        const jobsData = await jobsResponse.json();

        if (cancelled) {
          return;
        }

        if (companyResponse.ok) {
          setCompany(companyData.company || null);
        }

        if (jobsResponse.ok) {
          setJobs(jobsData.jobs || []);
        } else {
          setError(jobsData.message || "Unable to load your jobs.");
        }
      } catch (err) {
        if (!cancelled && err.name !== "AbortError") {
          setError(err.message || "Unable to load your jobs.");
        }
      } finally {
        if (!cancelled) {
          setCompanyLoading(false);
        }
      }
    }

    loadAll();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [refreshKey]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/recruiter/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to post the job.");
      }

      setMessage("Job posted successfully!");
      setForm(EMPTY_FORM);
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleJob(job) {
    setBusyJobId(job.id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/recruiter/jobs/${job.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !job.isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update the job.");
      }

      setMessage(data.message || "Job updated.");
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setError(err.message || "Unable to update the job.");
    } finally {
      setBusyJobId("");
    }
  }

  async function deleteJob(job) {
    const confirmed = window.confirm(
      `Delete "${job.title}"? All its applications will also be removed.`
    );

    if (!confirmed) {
      return;
    }

    setBusyJobId(job.id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/recruiter/jobs/${job.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete the job.");
      }

      setMessage("Job deleted.");
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setError(err.message || "Unable to delete the job.");
    } finally {
      setBusyJobId("");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Post a New Job</h1>

          <Link
            href="/jobs"
            className="font-medium text-indigo-600 hover:text-indigo-800"
          >
            View Job Listings →
          </Link>
        </header>

        {!companyLoading && !company && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-medium text-amber-900">
              Add your company profile first — recruiters cannot publish jobs
              without one.
            </p>

            <Link
              href="/recruiter/company"
              className="mt-3 inline-block rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700"
            >
              Create company profile
            </Link>
          </div>
        )}

        {company && (
          <p className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Posting as{" "}
            <strong className="text-slate-900">{company.name}</strong>
            {company.location ? ` · ${company.location}` : ""}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="mb-5 rounded-lg bg-green-50 p-3 text-green-700"
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mb-5 rounded-lg bg-red-50 p-3 text-red-700"
          >
            {error}
          </p>
        )}

        <section className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
          <p className="text-slate-600">
            Enter the job details below to publish an opportunity.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="title" className="mb-2 block font-medium">
                Job Title
              </label>
              <input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength={120}
                placeholder="e.g. Frontend Developer"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block font-medium">
                Job Description
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                minLength={20}
                maxLength={5000}
                placeholder="Describe the responsibilities and requirements..."
                className={inputClass}
                rows={6}
                required
              />
            </div>

            <div>
              <label htmlFor="location" className="mb-2 block font-medium">
                Location
              </label>
              <input
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                maxLength={120}
                placeholder="e.g. Jaipur, India or Remote"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="type" className="mb-2 block font-medium">
                Employment Type
              </label>
              <select
                id="type"
                name="type"
                value={form.type}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="REMOTE">Remote</option>
              </select>
            </div>

            <div>
              <label htmlFor="salary" className="mb-2 block font-medium">
                Salary (Optional)
              </label>
              <input
                id="salary"
                name="salary"
                value={form.salary}
                onChange={handleChange}
                maxLength={80}
                placeholder="e.g. ₹25,000 per month"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !company}
              className="w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Publishing Job..." : "Publish Job"}
            </button>
          </form>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">My Posted Jobs</h2>

          {jobs.length === 0 ? (
            <p className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
              You have not posted any jobs yet.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {jobs.map((job) => (
                <article
                  key={job.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{job.title}</h3>
                      <p className="text-sm text-slate-600">
                        {job.location} · {String(job.type).replaceAll("_", " ")}
                        {job.salary ? ` · ${job.salary}` : ""}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {job._count?.applications ?? 0} application(s)
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        job.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {job.isActive ? "Live" : "Closed"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => toggleJob(job)}
                      disabled={busyJobId === job.id}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {job.isActive ? "Close job" : "Reopen job"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteJob(job)}
                      disabled={busyJobId === job.id}
                      className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
