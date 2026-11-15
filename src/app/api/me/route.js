
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();

    return NextResponse.json({
      user: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            company: user.company
              ? { id: user.company.id, name: user.company.name }
              : null,
          }
        : null,
    });
  } catch (error) {
    console.error("Session lookup error:", error);

    return NextResponse.json({ user: null });
  }
}
