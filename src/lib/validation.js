
export const JOB_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "REMOTE",
];

export const APPLICATION_STATUSES = [
  "PENDING",
  "REVIEWED",
  "SHORTLISTED",
  "REJECTED",
  "ACCEPTED",
];

// Allowed status changes. ACCEPTED is terminal (only back to SHORTLISTED so a
// recruiter can undo a mistaken acceptance) and REJECTED can be reopened.
export const STATUS_TRANSITIONS = {
  PENDING: ["REVIEWED", "SHORTLISTED", "REJECTED"],
  REVIEWED: ["PENDING", "SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["REVIEWED", "ACCEPTED", "REJECTED"],
  ACCEPTED: ["SHORTLISTED"],
  REJECTED: ["PENDING", "REVIEWED"],
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trims a value and caps its length. Returns "" for non-strings. */
export function cleanString(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

export function isValidEmail(email) {
  return (
    typeof email === "string" &&
    email.length <= 254 &&
    EMAIL_PATTERN.test(email)
  );
}

export function isValidPassword(password) {
  // 72 bytes is the bcrypt input limit; longer input would be silently cut.
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 72
  );
}

export function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parsePage(value, pageSize = 9) {
  const page = Number.parseInt(value ?? "1", 10);
  const size = Number.parseInt(String(pageSize), 10);

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(size) && size > 0 ? Math.min(size, 50) : 9,
  };
}
