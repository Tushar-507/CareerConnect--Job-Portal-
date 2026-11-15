
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Next.js 16 replaces `middleware.js` with `proxy.js`.
const PROTECTED_PREFIXES = [
  { prefix: "/recruiter", roles: ["RECRUITER"], fallback: "/jobs" },
  { prefix: "/my-applications", roles: ["CANDIDATE"], fallback: "/recruiter/jobs" },
];

function matchRule(pathname) {
  return PROTECTED_PREFIXES.find(
    (rule) =>
      pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
  );
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const rule = matchRule(pathname);

  if (!rule) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session?.userId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (!rule.roles.includes(session.role)) {
    const target = session.role === "RECRUITER" ? "/recruiter/jobs" : "/jobs";

    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/recruiter/:path*", "/my-applications/:path*"],
};
