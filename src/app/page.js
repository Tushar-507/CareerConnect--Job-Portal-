
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Find your next job",
  description:
    "Discover jobs, connect with companies, and track your applications on CareerConnect.",
};

async function getFeaturedJobs() {
  try {
    return await prisma.job.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        location: true,
        type: true,
        company: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });
  } catch (error) {
    // The landing page must still render when the database is unreachable.
    console.error("Featured jobs error:", error);
    return [];
  }
}

export default async function Home() {
  const jobs = await getFeaturedJobs();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-indigo-50 to-slate-50 px-6 py-20 text-center">
        <p className="font-semibold tracking-wide text-indigo-600">
          YOUR NEXT OPPORTUNITY STARTS HERE
        </p>

        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold sm:text-5xl">
          Find a job you <span className="text-indigo-600">love.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          Discover exciting jobs, connect with great companies, and take the
          next step in your career.
        </p>

        <form
          action="/jobs"
          method="get"
          className="mx-auto mt-10 flex max-w-3xl flex-col gap-3 rounded-2xl bg-white p-4 shadow-lg sm:flex-row"
        >
          <input
            type="search"
            name="q"
            placeholder="Job title or keyword"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-600"
          />

          <input
            type="text"
            name="location"
            placeholder="City or Remote"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-600"
          />

          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            Search Jobs
          </button>
        </form>
      </section>

      {/* Featured jobs */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold">Featured Jobs</h2>

        <p className="mt-2 text-slate-600">
          The latest roles posted by recruiters on CareerConnect.
        </p>

        {jobs.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            No jobs are published yet. Recruiters can post the first one from
            the recruiter dashboard.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <article
                key={job.id}
                className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-xl font-bold text-indigo-600">
                  {(job.company?.name || "C").charAt(0)}
                </div>

                <h3 className="mt-4 text-xl font-bold">{job.title}</h3>

                <p className="mt-2 text-indigo-600">
                  {job.company?.name || "Company"}
                </p>

                <p className="mt-4 text-sm text-slate-600">{job.location}</p>

                <span className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-sm">
                  {String(job.type).replaceAll("_", " ")}
                </span>

                <Link
                  href="/jobs"
                  className="mt-5 block font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  View details →
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Call to action */}
      <section className="bg-indigo-600 px-6 py-24 text-center text-white sm:py-32">
        <h2 className="text-4xl font-bold sm:text-5xl">
          Ready for your next opportunity?
        </h2>

        <p className="mt-4 text-lg text-indigo-100">
          Join CareerConnect and explore new career possibilities.
        </p>

        <Link
          href="/register"
          className="mt-9 inline-block rounded-lg bg-white px-8 py-4 text-lg font-semibold text-indigo-700 transition hover:bg-indigo-50"
        >
          Get Started
        </Link>
      </section>

      <footer className="bg-white px-6 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} CareerConnect
      </footer>
    </div>
  );
}
