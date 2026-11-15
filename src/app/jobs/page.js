
import Navbar from "@/components/Navbar";
import { getSessionUser } from "@/lib/auth";
import JobsClient from "./JobsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Explore jobs",
  description:
    "Browse open roles by title, company, location, and employment type.",
};

async function getViewerRole() {
  try {
    const user = await getSessionUser();
    return user?.role ?? null;
  } catch (error) {
    console.error("Jobs page session error:", error);
    return null;
  }
}

export default async function JobsPage({ searchParams }) {
  const params = await searchParams;
  const viewerRole = await getViewerRole();

  const readParam = (key) =>
    typeof params?.[key] === "string" ? params[key].slice(0, 100) : "";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <JobsClient
        initialQuery={readParam("q")}
        initialLocation={readParam("location")}
        initialType={readParam("type")}
        viewerRole={viewerRole}
      />
    </div>
  );
}
