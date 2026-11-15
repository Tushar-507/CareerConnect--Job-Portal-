
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  cleanString,
  isValidEmail,
  isValidPassword,
} from "@/lib/validation";
import { clientIp, consumeAttempt } from "@/lib/rate-limit";

const ALLOWED_ROLES = ["candidate", "recruiter"];

export async function POST(request) {
  try {
    const ip = clientIp(request);
    const limit = consumeAttempt(`register-ip:${ip}`, {
      limit: 25,
      windowMs: 60 * 60 * 1000,
    });

    if (!limit.allowed) {
      return NextResponse.json(
        { message: "Too many sign-up attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 }
      );
    }

    const name = cleanString(body.name, 80);
    const email = cleanString(body.email, 254).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const requestedRole = body.role;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        { message: "Please enter your full name." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { message: "Password must be between 8 and 72 characters." },
        { status: 400 }
      );
    }

    if (!ALLOWED_ROLES.includes(requestedRole)) {
      return NextResponse.json(
        { message: "Please select a valid account type." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: requestedRole.toUpperCase(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json(
      { message: "Account created successfully.", user },
      { status: 201 }
    );
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    console.error("Registration error:", error);

    return NextResponse.json(
      { message: "Unable to create account. Please try again." },
      { status: 500 }
    );
  }
}
