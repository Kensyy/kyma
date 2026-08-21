import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";

async function main() {
  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", ticketPrefix: "KYM" },
  });

  const branch = await prisma.branch.upsert({
    where: { id: "hq" },
    update: {},
    create: { id: "hq", name: "Headquarters" },
  });

  const ticketStatuses = [
    { label: "Open", order: 1, color: "accent", isTerminal: false },
    { label: "In Progress", order: 2, color: "violet", isTerminal: false },
    { label: "Blocked", order: 3, color: "destructive", isTerminal: false },
    { label: "Resolved", order: 4, color: "success", isTerminal: true },
    { label: "Closed", order: 5, color: "muted", isTerminal: true },
  ];
  for (const status of ticketStatuses) {
    await prisma.status.upsert({
      where: {
        entityType_label: { entityType: "TICKET", label: status.label },
      },
      update: {
        order: status.order,
        color: status.color,
        isTerminal: status.isTerminal,
      },
      create: { entityType: "TICKET", ...status },
    });
  }

  const assetStatuses = [
    { label: "In Use", order: 1, color: "success", isTerminal: false },
    { label: "In Storage", order: 2, color: "muted", isTerminal: false },
    {
      label: "Under Repair",
      order: 3,
      color: "destructive",
      isTerminal: false,
    },
    { label: "Retired", order: 4, color: "muted", isTerminal: true },
  ];
  for (const status of assetStatuses) {
    await prisma.status.upsert({
      where: { entityType_label: { entityType: "ASSET", label: status.label } },
      update: {
        order: status.order,
        color: status.color,
        isTerminal: status.isTerminal,
      },
      create: { entityType: "ASSET", ...status },
    });
  }

  const ticketCategories = [
    "Hardware",
    "Software",
    "Network",
    "Access",
    "Onboarding",
    "Facilities",
    "Inventory",
  ];
  for (const [i, label] of ticketCategories.entries()) {
    await prisma.category.upsert({
      where: { entityType_label: { entityType: "TICKET", label } },
      update: { order: i + 1 },
      create: { entityType: "TICKET", label, order: i + 1 },
    });
  }

  const assetTypes = [
    "Laptop",
    "Monitor",
    "Furniture",
    "Mobile",
    "Printer",
    "Networking",
  ];
  for (const [i, label] of assetTypes.entries()) {
    await prisma.assetType.upsert({
      where: { label },
      update: { order: i + 1 },
      create: { label, order: i + 1 },
    });
  }

  async function seedUser(
    email: string,
    name: string,
    role: "ADMIN" | "STAFF",
    password: string,
    isDemo = false,
  ) {
    const existing = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });
    // A user with no linked account means a prior signUpEmail failed partway
    // through (e.g. a schema mismatch) — clean it up and retry rather than
    // leaving a passwordless account behind.
    if (existing && existing.accounts.length === 0) {
      await prisma.user.delete({ where: { id: existing.id } });
    }
    if (!existing || existing.accounts.length === 0) {
      await auth.api.signUpEmail({ body: { email, password, name } });
      console.log(`Seeded ${role.toLowerCase()} user: ${email} / ${password}`);
    } else {
      console.log(`User already exists: ${email}`);
    }
    // Runs every seed, not just on first creation, so re-running the seed
    // after this field was added (or after any role/branch change) still
    // converges existing rows to the right values.
    await prisma.user.update({
      where: { email },
      data: { role, branchId: branch.id, isDemo },
    });
  }

  await seedUser("admin@kyma.local", "Admin", "ADMIN", "kyma-dev-password");
  await seedUser("priya@kyma.local", "Priya N.", "STAFF", "kyma-dev-password");
  await seedUser("sam@kyma.local", "Sam O.", "STAFF", "kyma-dev-password");
  // Public-demo account (Section 10) — kept separate from admin@kyma.local
  // above so the real dev/admin login stays unrestricted for local testing.
  // requireWriteSession() blocks every mutation for this account; recruiters
  // reach it with one click from the sign-in page, no credentials to type.
  await seedUser(
    "demo@kyma.local",
    "Demo Viewer",
    "ADMIN",
    "kyma-demo-password",
    true,
  );

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
