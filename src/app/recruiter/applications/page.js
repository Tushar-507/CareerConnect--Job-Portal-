
"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { APPLICATION_STATUSES, STATUS_TRANSITIONS } from "@/lib/validation";

const STATUS_FILTERS = [
  { value: "", label: "All statuses" },
  ...APPLICATION_STATUSES.map((status) => ({
    value: status,
    label: status.charAt(0) + status.slice(1).toLowerCase(),
  })),
];

export default function RecruiterApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");
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
          `/api/recruiter/applications?${params.toString()}`,
          { signal: controller.signal }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load applications.");
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

        setError(err.message || "Something went wrong.");
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

  function changeStatus(id, nextStatus) {
    setApplications((current) =>
      current.map((application) =>
        application.id === id
          ? { ...application, selectedStatus: nextStatus }
          : application
      )
    );
    setMessage("");
    setError("");
  }

  async function updateStatus(application) {
    const status = application.selectedStatus || application.status;

    setSavingId(application.id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/recruiter/applications/${application.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update status.");
      }

      setApplications((current) =>
        current.map((item) =>
          item.id === application.id
            ? {
                ...item,
                status: data.application.status,
                selectedStatus: data.application.status,
              }
            : item
        )
      );

      setMessage("Application status updated successfully.");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Candidate Applications
          </h1>
          <p className="mt-2 text-gray-600">
            Review candidates and update their application statuses.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-3 text-sm text-gray-600">
            Filter
            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2"
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {!loading && !error && (
            <p className="text-sm text-gray-600">
              Total applications: <strong>{total}</strong>
            </p>
          )}
        </div>

        {loading && (
          <p className="rounded-lg bg-white p-6 text-gray-600 shadow-sm">
            Loading applications...
          </p>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        {!loading && message && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700"
          >
            {message}
          </div>
        )}

        {!loading && !error && applications.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">
              No applications yet
            </h2>
            <p className="mt-2 text-gray-600">
              Applications for your posted jobs will appear here.
            </p>
            <a
              href="/recruiter/jobs"
              className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              Post a Job
            </a>
          </div>
        )}

        {!loading && applications.length > 0 && (
          <div className="space-y-5">
            {applications.map((application) => {
              const selectedStatus =
                application.selectedStatus || application.status;
              const allowedNext = STATUS_TRANSITIONS[application.status] ?? [];

              return (
                <article
                  key={application.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {application.candidate?.name || "Unknown candidate"}
                      </h2>
                      <p className="mt-1 break-all text-sm text-gray-600">
                        {application.candidate?.email || "No email available"}
                      </p>
                    </div>

                    <span className="h-fit w-fit rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                      {application.status}
                    </span>
                  </div>

                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <p className="font-medium text-gray-800">
                      {application.job?.title || "Job title unavailable"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {application.job?.company?.name || "Company"}
                    </p>
                    <p className="mt-3 text-sm text-gray-500">
                      Applied on:{" "}
                      {new Date(application.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {application.resumeUrl && (
                    <p className="mt-4 text-sm">
                      <span className="font-medium text-gray-700">Resume: </span>
                      <a
                        href={application.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-blue-600 underline hover:text-blue-800"
                      >
                        {application.resumeUrl}
                      </a>
                    </p>
                  )}

                  {application.coverLetter && (
                    <details className="mt-4 rounded-lg border border-gray-200 p-3 text-sm">
                      <summary className="cursor-pointer font-medium text-gray-700">
                        Cover letter
                      </summary>
                      <p className="mt-3 whitespace-pre-line text-gray-600">
                        {application.coverLetter}
                      </p>
                    </details>
                  )}

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <label
                        htmlFor={`status-${application.id}`}
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Update application status
                      </label>

                      <select
                        id={`status-${application.id}`}
                        value={selectedStatus}
                        onChange={(event) =>
                          changeStatus(application.id, event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-blue-500"
                      >
                        <option value={application.status}>
                          {application.status} (current)
                        </option>

                        {allowedNext.map((nextStatus) => (
                          <option key={nextStatus} value={nextStatus}>
                            {nextStatus}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => updateStatus(application)}
                      disabled={
                        savingId === application.id ||
                        selectedStatus === application.status
                      }
                      className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingId === application.id
                        ? "Updating..."
                        : "Update Status"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page === totalPages}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
