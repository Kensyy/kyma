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
    { label: "Open", order: 1, color: "accent" },
    { label: "In Progress", order: 2, color: "violet" },
    { label: "Blocked", order: 3, color: "destructive" },
    { label: "Resolved", order: 4, color: "success" },
    { label: "Closed", order: 5, color: "muted" },
  ];
  for (const status of ticketStatuses) {
    await prisma.status.upsert({
      where: {
        entityType_label: { entityType: "TICKET", label: status.label },
      },
      update: { order: status.order, color: status.color },
      create: { entityType: "TICKET", ...status },
    });
  }

  const assetStatuses = [
    { label: "In Use", order: 1, color: "success" },
    { label: "In Storage", order: 2, color: "muted" },
    { label: "Under Repair", order: 3, color: "destructive" },
    { label: "Retired", order: 4, color: "muted" },
  ];
  for (const status of assetStatuses) {
    await prisma.status.upsert({
      where: { entityType_label: { entityType: "ASSET", label: status.label } },
      update: { order: status.order, color: status.color },
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

  const adminEmail = "admin@kyma.local";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { accounts: true },
  });
  // A user with no linked account means a prior signUpEmail failed partway
  // through (e.g. a schema mismatch) — clean it up and retry rather than
  // leaving a passwordless account behind.
  if (existingAdmin && existingAdmin.accounts.length === 0) {
    await prisma.user.delete({ where: { id: existingAdmin.id } });
  }
  if (!existingAdmin || existingAdmin.accounts.length === 0) {
    await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        password: "kyma-dev-admin",
        name: "Admin",
      },
    });
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN", branchId: branch.id },
    });
    console.log(`Seeded admin user: ${adminEmail} / kyma-dev-admin`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

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
