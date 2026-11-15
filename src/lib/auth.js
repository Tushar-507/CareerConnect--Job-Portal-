
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

/**
 * Reads the session cookie, verifies the JWT and reloads the user from the
 * database. Reloading means a deleted user or a changed role takes effect
 * immediately instead of staying valid until the token expires.
 */
export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await verifySession(token);

  if (!session?.userId) {
    return null;
  }

  return await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      company: {
        select: {
          id: true,
          name: true,
          description: true,
          website: true,
          location: true,
        },
      },
    },
  });
}

/** Returns the user when they have the expected role, otherwise null. */
export async function getSessionUserWithRole(role) {
  const user = await getSessionUser();

  if (!user || user.role !== role) {
    return null;
  }

  return user;
}
