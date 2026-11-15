
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "careerconnect_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

let cachedKey = null;
let reportedConfigError = false;

function getKey() {
  if (cachedKey) {
    return cachedKey;
  }

  const secretKey = process.env.SESSION_SECRET;

  if (!secretKey || secretKey.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or shorter than 32 characters. " +
        "Add a strong SESSION_SECRET to your .env file (see .env.example)."
    );
  }

  cachedKey = new TextEncoder().encode(secretKey);

  return cachedKey;
}

function reportConfigError(error) {
  if (reportedConfigError) {
    return;
  }

  reportedConfigError = true;
  console.error("[auth] Session configuration error:", error.message);
}

export async function createSession(user) {
  return await new SignJWT({
    userId: user.id,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getKey());
}

export async function verifySession(token) {
  let key;

  try {
    key = getKey();
  } catch (error) {
    reportConfigError(error);
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch {
    return null;
  }
}
