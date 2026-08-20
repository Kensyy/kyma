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
      await auth.api.signUpEmail({
        body: { email, password: "kyma-dev-password", name },
      });
      await prisma.user.update({
        where: { email },
        data: { role, branchId: branch.id },
      });
      console.log(
        `Seeded ${role.toLowerCase()} user: ${email} / kyma-dev-password`,
      );
    } else {
      console.log(`User already exists: ${email}`);
    }
  }

  await seedUser("admin@kyma.local", "Admin", "ADMIN");
  await seedUser("priya@kyma.local", "Priya N.", "STAFF");
  await seedUser("sam@kyma.local", "Sam O.", "STAFF");

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
