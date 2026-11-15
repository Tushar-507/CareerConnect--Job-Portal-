
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { APPLICATION_STATUSES, STATUS_TRANSITIONS } from "@/lib/validation";

export async function PATCH(request, { params }) {
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
        { message: "Only recruiters can update applications." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const status = body?.status;

    if (typeof id !== "string" || !id) {
      return NextResponse.json(
        { message: "A valid application ID is required." },
        { status: 400 }
      );
    }

    if (!APPLICATION_STATUSES.includes(status)) {
      return NextResponse.json(
        { message: "Invalid application status." },
        { status: 400 }
      );
    }

    const application = await prisma.application.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        job: {
          select: { recruiterId: true },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { message: "Application not found." },
        { status: 404 }
      );
    }

    if (application.job.recruiterId !== user.id) {
      return NextResponse.json(
        { message: "You cannot update this application." },
        { status: 403 }
      );
    }

    const allowed = STATUS_TRANSITIONS[application.status] ?? [];

    if (!allowed.includes(status)) {
      return NextResponse.json(
        {
          message: `A ${application.status.toLowerCase()} application cannot be moved to ${status.toLowerCase()}.`,
        },
        { status: 409 }
      );
    }

    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Application status updated successfully.",
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Application status update error:", error);

    return NextResponse.json(
      { message: "Unable to update application status." },
      { status: 500 }
    );
  }
}
