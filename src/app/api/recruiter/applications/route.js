
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { APPLICATION_STATUSES, parsePage } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request) {
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
        { message: "Only recruiters can view applications." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const { page, pageSize } = parsePage(searchParams.get("page"), 20);
    const status = searchParams.get("status");

    const where = {
      job: { recruiterId: user.id },
    };

    if (APPLICATION_STATUSES.includes(status)) {
      where.status = status;
    }

    const [applications, total] = await prisma.$transaction([
      prisma.application.findMany({
        where,
        include: {
          candidate: {
            select: {
              name: true,
              email: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              company: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.application.count({ where }),
    ]);

    return NextResponse.json({
      applications,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    console.error("Recruiter applications error:", error);

    return NextResponse.json(
      { message: "Unable to load applications. Please try again." },
      { status: 500 }
    );
  }
}
