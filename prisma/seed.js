
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SAMPLE_JOBS = [
  {
    title: "Frontend Developer Intern",
    description:
      "Learn frontend development and build responsive websites with React and Tailwind CSS.",
    location: "Jaipur, India",
    type: "INTERNSHIP",
    salary: "₹10,000–₹15,000 per month",
  },
  {
    title: "JavaScript Developer",
    description:
      "Build interactive web applications using JavaScript, Node.js and modern tooling.",
    location: "Remote",
    type: "FULL_TIME",
    salary: "₹4–6 LPA",
  },
  {
    title: "UI/UX Designer",
    description:
      "Design user-friendly interfaces and engaging digital experiences for web products.",
    location: "Delhi, India",
    type: "FULL_TIME",
    salary: "₹3–5 LPA",
  },
  {
    title: "Backend Developer Intern",
    description:
      "Learn APIs, server-side development, and databases while shipping real features.",
    location: "Remote",
    type: "INTERNSHIP",
    salary: "₹10,000 per month",
  },
  {
    title: "Full Stack Developer",
    description:
      "Work on frontend and backend features for production web applications end to end.",
    location: "Jaipur, India",
    type: "FULL_TIME",
    salary: "₹5–8 LPA",
  },
  {
    title: "Graphic Designer",
    description:
      "Create graphics and visual assets for digital products, campaigns and social media.",
    location: "Remote",
    type: "PART_TIME",
    salary: "₹15,000 per month",
  },
];

/**
 * Resolves the recruiter to attach demo data to.
 *
 * Uses SEED_RECRUITER_EMAIL when set, otherwise the oldest recruiter account.
 * Nothing is created automatically so the seed never invents a login.
 */
async function findRecruiter() {
  const email = (process.env.SEED_RECRUITER_EMAIL || "").trim().toLowerCase();

  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new Error(
        `No account found for SEED_RECRUITER_EMAIL="${email}". Register that account first.`
      );
    }

    if (user.role !== "RECRUITER") {
      throw new Error(
        `The account "${email}" is not a recruiter. Use a recruiter account.`
      );
    }

    return user;
  }

  const recruiter = await prisma.user.findFirst({
    where: { role: "RECRUITER" },
    orderBy: { createdAt: "asc" },
  });

  if (!recruiter) {
    throw new Error(
      "No recruiter account found. Register a recruiter account first, " +
        "or set SEED_RECRUITER_EMAIL in your .env file."
    );
  }

  return recruiter;
}

async function main() {
  const recruiter = await findRecruiter();

  // Never overwrite a company the recruiter already configured in the app.
  const company = await prisma.company.upsert({
    where: { recruiterId: recruiter.id },
    update: {},
    create: {
      name: "TechNova Solutions",
      description:
        "A technology company building modern web applications.",
      location: "Jaipur, India",
      website: "https://example.com",
      recruiterId: recruiter.id,
    },
  });

  const existingJobs = await prisma.job.count({
    where: { companyId: company.id },
  });

  if (existingJobs > 0) {
    console.log(
      `"${company.name}" already has ${existingJobs} job(s). Nothing to seed.`
    );
    return;
  }

  for (const job of SAMPLE_JOBS) {
    await prisma.job.create({
      data: {
        ...job,
        isActive: true,
        recruiterId: recruiter.id,
        companyId: company.id,
      },
    });
  }

  console.log(
    `Created ${SAMPLE_JOBS.length} sample jobs for ${company.name} ` +
      `(recruiter: ${recruiter.email}).`
  );
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
