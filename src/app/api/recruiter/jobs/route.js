
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { JOB_TYPES, cleanString } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { message: "Please log in to continue." },
        { status: 401 }
      );
    }

    if (user.role !== "RECRUITER") {
      return NextResponse.json(
        { message: "Only recruiters can view posted jobs." },
        { status: 403 }
      );
    }

    const jobs = await prisma.job.findMany({
      where: { recruiterId: user.id },
      select: {
        id: true,
        title: true,
        location: true,
        type: true,
        salary: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Recruiter jobs error:", error);

    return NextResponse.json(
      { message: "Unable to load your posted jobs." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { message: "Please log in to continue." },
        { status: 401 }
      );
    }

    if (user.role !== "RECRUITER") {
      return NextResponse.json(
        { message: "Only recruiters can post jobs." },
        { status: 403 }
      );
    }

    // The company comes from the recruiter's profile, never from the client.
    if (!user.company) {
      return NextResponse.json(
        {
          code: "COMPANY_REQUIRED",
          message:
            "Create your company profile before posting a job.",
        },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 }
      );
    }

    const title = cleanString(body.title, 120);
    const description = cleanString(body.description, 5000);
    const location = cleanString(body.location, 120);
    const salary = cleanString(body.salary, 80);
    const type = body.type;

    if (!title || !description || !location || !JOB_TYPES.includes(type)) {
      return NextResponse.json(
        { message: "Please provide all required job details." },
        { status: 400 }
      );
    }

    if (description.length < 20) {
      return NextResponse.json(
        { message: "Please write at least 20 characters for the description." },
        { status: 400 }
      );
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        location,
        type,
        salary: salary || null,
        isActive: true,
        recruiterId: user.id,
        companyId: user.company.id,
      },
    });

    return NextResponse.json(
      {
        message: "Job posted successfully!",
        job,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Recruiter job creation error:", error);

    return NextResponse.json(
      { message: "Unable to post the job. Please try again." },
      { status: 500 }
    );
  }
}
