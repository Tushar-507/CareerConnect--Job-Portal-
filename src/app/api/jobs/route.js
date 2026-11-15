
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JOB_TYPES, cleanString, parsePage } from "@/lib/validation";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = cleanString(searchParams.get("q"), 100);
    const location = cleanString(searchParams.get("location"), 100);
    const type = searchParams.get("type");
    const { page, pageSize } = parsePage(searchParams.get("page"), 9);

    const where = { isActive: true };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { company: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    if (JOB_TYPES.includes(type)) {
      where.type = type;
    }

    const [jobs, total] = await prisma.$transaction([
      prisma.job.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          type: true,
          salary: true,
          createdAt: true,
          company: {
            select: {
              name: true,
              location: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.job.count({ where }),
    ]);

    return NextResponse.json({
      jobs,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    console.error("Fetch jobs error:", error);

    return NextResponse.json(
      { message: "Unable to fetch jobs." },
      { status: 500 }
    );
  }
}
