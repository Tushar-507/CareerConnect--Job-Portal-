
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
} from "@/lib/session";
import { cleanString, isValidEmail } from "@/lib/validation";
import { clientIp, consumeAttempt, resetAttempts } from "@/lib/rate-limit";

const INVALID_CREDENTIALS = "Invalid email or password.";

function tooManyAttempts(retryAfterSeconds) {
  return NextResponse.json(
    {
      message:
        "Too many sign-in attempts. Please wait a few minutes and try again.",
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  );
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 }
      );
    }

    const email = cleanString(body.email, 254).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const ip = clientIp(request);
    const ipLimit = consumeAttempt(`login-ip:${ip}`, { limit: 30 });
    const emailLimit = consumeAttempt(`login-email:${email}`, { limit: 10 });

    if (!ipLimit.allowed || !emailLimit.allowed) {
      return tooManyAttempts(
        Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds)
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: INVALID_CREDENTIALS },
        { status: 401 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { message: INVALID_CREDENTIALS },
        { status: 401 }
      );
    }

    resetAttempts(`login-email:${email}`);

    const token = await createSession(user);
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });

    return NextResponse.json({
      message: "Login successful!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { message: "Unable to log in. Please try again." },
      { status: 500 }
    );
  }
}
