
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

export default function RecruiterCompanyPage() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    website: "",
    location: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [hasCompany, setHasCompany] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadCompany() {
      try {
        const response = await fetch("/api/recruiter/company", {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load your company.");
        }

        if (!cancelled && data.company) {
          setHasCompany(true);
          setForm({
            name: data.company.name || "",
            description: data.company.description || "",
            website: data.company.website || "",
            location: data.company.location || "",
          });
        }
      } catch (err) {
        if (!cancelled && err.name !== "AbortError") {
          setError(err.message || "Unable to load your company.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCompany();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/recruiter/company", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save your company.");
      }

      setHasCompany(true);
      setMessage(
        "Company profile saved. You can now post jobs and review applicants."
      );
    } catch (err) {
      setError(err.message || "Unable to save your company.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">Company Profile</h1>

        <p className="mt-2 text-slate-600">
          Recruiters need a company profile before they can publish jobs.
        </p>

        {loading ? (
          <p className="mt-8 text-slate-600">Loading your company...</p>
        ) : (
          <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="mb-2 block font-medium">
                  Company Name
                </label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  minLength={2}
                  maxLength={100}
                  placeholder="e.g. TechNova Solutions"
                  className={inputClass}
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
                  maxLength={100}
                  placeholder="e.g. Jaipur, India"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="website" className="mb-2 block font-medium">
                  Website
                </label>
                <input
                  id="website"
                  name="website"
                  type="url"
                  value={form.website}
                  onChange={handleChange}
                  maxLength={200}
                  placeholder="https://example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block font-medium"
                >
                  About the company
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  maxLength={2000}
                  placeholder="Describe what your company does..."
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Company Profile"}
              </button>
            </form>
          </section>
        )}

        <div className="mt-8 flex flex-wrap gap-6">
          <Link
            href="/recruiter/jobs"
            className="font-semibold text-indigo-600 hover:underline"
          >
            {hasCompany ? "Post a job →" : "Go to job posting →"}
          </Link>

          <Link
            href="/recruiter/applications"
            className="font-semibold text-indigo-600 hover:underline"
          >
            Review applications →
          </Link>
        </div>
      </main>
    </div>
  );
}
