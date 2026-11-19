
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { cleanString, isValidUrl } from "@/lib/validation";

const MAX_COVER_LETTER_LENGTH = 5000;
const MAX_RESUME_URL_LENGTH = 500;

export async function POST(request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { message: "Please log in before applying for a job." },
        { status: 401 }
      );
    }

    // Only candidates can apply for jobs.
    if (user.role !== "CANDIDATE") {
      return NextResponse.json(
        { message: "Only candidate accounts can apply for jobs." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const jobId = typeof body?.jobId === "string" ? body.jobId : "";

    if (!jobId) {
      return NextResponse.json(
        { message: "A valid job ID is required." },
        { status: 400 }
      );
    }

    const coverLetter = cleanString(body.coverLetter, MAX_COVER_LETTER_LENGTH);
    const resumeUrl = cleanString(body.resumeUrl, MAX_RESUME_URL_LENGTH);

    if (!resumeUrl) {
      return NextResponse.json(
        { message: "A resume link is required to apply for this job." },
        { status: 400 }
      );
    }

    if (!isValidUrl(resumeUrl)) {
      return NextResponse.json(
        {
          message:
            "Resume link must start with http:// or https:// and be a valid URL.",
        },
        { status: 400 }
      );
    }

    // Confirm the job exists and is accepting applications.
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { message: "This job is unavailable." },
        { status: 404 }
      );
    }

    const existingApplication = await prisma.application.findUnique({
      where: {
        candidateId_jobId: {
          candidateId: user.id,
          jobId,
        },
      },
      select: { id: true },
    });

    if (existingApplication) {
      return NextResponse.json(
        { message: "You have already applied for this job." },
        { status: 409 }
      );
    }

    const application = await prisma.application.create({
      data: {
        candidateId: user.id,
        jobId,
        coverLetter: coverLetter || null,
        resumeUrl: resumeUrl || null,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        jobId: true,
        coverLetter: true,
        resumeUrl: true,
      },
    });

    return NextResponse.json(
      {
        message: "Your application was submitted successfully!",
        application,
      },
      { status: 201 }
    );
  } catch (error) {
    // A duplicate submission can race with another request.
    if (error?.code === "P2002") {
      return NextResponse.json(
        { message: "You have already applied for this job." },
        { status: 409 }
      );
    }

    console.error("Job application error:", error);

    return NextResponse.json(
      { message: "Unable to submit your application. Please try again." },
      { status: 500 }
    );
  }
}
