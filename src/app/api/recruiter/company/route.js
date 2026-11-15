
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { cleanString, isValidUrl } from "@/lib/validation";

export const dynamic = "force-dynamic";

function validationError(message) {
  return NextResponse.json({ message }, { status: 400 });
}

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
        { message: "Only recruiters can manage a company profile." },
        { status: 403 }
      );
    }

    return NextResponse.json({ company: user.company });
  } catch (error) {
    console.error("Company lookup error:", error);

    return NextResponse.json(
      { message: "Unable to load your company profile." },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
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
        { message: "Only recruiters can manage a company profile." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 }
      );
    }

    const name = cleanString(body.name, 100);
    const description = cleanString(body.description, 2000);
    const location = cleanString(body.location, 100);
    const website = cleanString(body.website, 200);

    if (name.length < 2) {
      return validationError("Please enter your company name.");
    }

    if (website && !isValidUrl(website)) {
      return validationError(
        "Website must start with http:// or https:// and be a valid URL."
      );
    }

    const company = await prisma.company.upsert({
      where: { recruiterId: user.id },
      update: {
        name,
        description: description || null,
        location: location || null,
        website: website || null,
      },
      create: {
        name,
        description: description || null,
        location: location || null,
        website: website || null,
        recruiterId: user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        location: true,
      },
    });

    return NextResponse.json({
      message: "Company profile saved.",
      company,
    });
  } catch (error) {
    console.error("Company update error:", error);

    return NextResponse.json(
      { message: "Unable to save your company profile." },
      { status: 500 }
    );
  }
}
