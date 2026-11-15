
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

async function findOwnedJob(id, recruiterId) {
  return await prisma.job.findFirst({
    where: { id, recruiterId },
    select: { id: true, isActive: true },
  });
}

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
        { message: "Only recruiters can update jobs." },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (typeof id !== "string" || !id) {
      return NextResponse.json(
        { message: "A valid job ID is required." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);

    if (typeof body?.isActive !== "boolean") {
      return NextResponse.json(
        { message: "isActive must be true or false." },
        { status: 400 }
      );
    }

    const job = await findOwnedJob(id, user.id);

    if (!job) {
      return NextResponse.json(
        { message: "Job not found." },
        { status: 404 }
      );
    }

    const updated = await prisma.job.update({
      where: { id },
      data: { isActive: body.isActive },
      select: { id: true, isActive: true },
    });

    return NextResponse.json({
      message: body.isActive ? "Job is now live." : "Job was closed.",
      job: updated,
    });
  } catch (error) {
    console.error("Job update error:", error);

    return NextResponse.json(
      { message: "Unable to update the job." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
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
        { message: "Only recruiters can delete jobs." },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (typeof id !== "string" || !id) {
      return NextResponse.json(
        { message: "A valid job ID is required." },
        { status: 400 }
      );
    }

    const job = await findOwnedJob(id, user.id);

    if (!job) {
      return NextResponse.json(
        { message: "Job not found." },
        { status: 404 }
      );
    }

    await prisma.job.delete({ where: { id } });

    return NextResponse.json({ message: "Job deleted." });
  } catch (error) {
    console.error("Job delete error:", error);

    return NextResponse.json(
      { message: "Unable to delete the job." },
      { status: 500 }
    );
  }
}
