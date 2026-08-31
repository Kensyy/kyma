import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";
import { getIntegrationSystemUser } from "../src/lib/webhooks";
import { addHours, resolveSlaHours } from "../src/lib/sla";

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
    role: "ADMIN" | "STAFF" | "END_USER",
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
  // Self-service role (End User self-service scoping) — reports/follows up
  // on their own tickets only, per requireStaff()/inline ownership checks
  // across the ticket routes.
  await seedUser(
    "jordan@kyma.local",
    "Jordan End User",
    "END_USER",
    "kyma-dev-password",
  );
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

  // Lookup maps for the ticket/asset seed data below — built from what was
  // just upserted rather than hardcoded ids, so this stays correct if the
  // status/category/type lists above ever change.
  const [ticketStatusRows, assetStatusRows, categoryRows, assetTypeRows, seedPeople] =
    await Promise.all([
      prisma.status.findMany({ where: { entityType: "TICKET" } }),
      prisma.status.findMany({ where: { entityType: "ASSET" } }),
      prisma.category.findMany({ where: { entityType: "TICKET" } }),
      prisma.assetType.findMany(),
      prisma.user.findMany({
        where: {
          email: {
            in: [
              "admin@kyma.local",
              "priya@kyma.local",
              "sam@kyma.local",
              "jordan@kyma.local",
            ],
          },
        },
      }),
    ]);
  const ticketStatusId = (label: string) =>
    ticketStatusRows.find((s) => s.label === label)!.id;
  const assetStatusId = (label: string) =>
    assetStatusRows.find((s) => s.label === label)!.id;
  const categoryId = (label: string) =>
    categoryRows.find((c) => c.label === label)!.id;
  const assetTypeId = (label: string) =>
    assetTypeRows.find((t) => t.label === label)!.id;
  const userId = (email: string) =>
    seedPeople.find((u) => u.email === email)!.id;

  // Two sample inbound sources (Section 5.5) — admin-configured data, not a
  // hardcoded vendor list. TeamDynamix is itself an ITSM/ticketing tool, so
  // its webhooks fire on ticket create/update in TD (see solutions.teamdynamix.com
  // "Getting Started with Webhooks") — a plausible real source is a
  // satellite office or department still running its own TD queue during a
  // migration, not network/infra alerts. FortiSIEM is what actually detects
  // something like a downed uplink and pushes an incident out via its own
  // webhook/ITSM-connector integration.
  const teamDynamix = await prisma.integrationSource.upsert({
    where: { name: "TeamDynamix" },
    update: { active: true },
    create: { name: "TeamDynamix", active: true },
  });
  const fortiSiem = await prisma.integrationSource.upsert({
    where: { name: "FortiSIEM" },
    update: { active: true },
    create: { name: "FortiSIEM", active: true },
  });
  const integrationsUser = await getIntegrationSystemUser();

  // A stray SlaPolicy row from manual testing (a 2-hour override that only
  // existed to force a breach) — clearing it so SLA due dates below resolve
  // from the real default-hours-by-priority table (sla.ts), not test data.
  await prisma.slaPolicy.deleteMany({});

  type AssetSeed = {
    id: string;
    name: string;
    type: string;
    status: string;
    serialNumber?: string;
    location?: string;
    ownerEmail?: string;
    purchasedMonthsAgo: number;
  };

  const assetSeeds: AssetSeed[] = [
    {
      id: "seed-asset-thinkpad-x1",
      name: "ThinkPad X1 Carbon Gen 11",
      type: "Laptop",
      status: "In Use",
      serialNumber: "PF3K4R2Q1088",
      ownerEmail: "priya@kyma.local",
      purchasedMonthsAgo: 14,
    },
    {
      id: "seed-asset-macbook-pro-14",
      name: 'MacBook Pro 14" M3',
      type: "Laptop",
      status: "In Use",
      serialNumber: "C02XG2QUMD6T",
      ownerEmail: "sam@kyma.local",
      purchasedMonthsAgo: 8,
    },
    {
      id: "seed-asset-ultrasharp-monitor",
      name: "Dell UltraSharp U2723QE",
      type: "Monitor",
      status: "In Storage",
      serialNumber: "CN0T8J2K7429",
      purchasedMonthsAgo: 20,
    },
    {
      id: "seed-asset-laserjet-printer",
      name: "HP LaserJet Pro M404dn",
      type: "Printer",
      status: "Under Repair",
      serialNumber: "VNC3D21045",
      location: "2nd Floor Copy Room",
      purchasedMonthsAgo: 30,
    },
    {
      id: "seed-asset-iphone-13",
      name: "iPhone 13",
      type: "Mobile",
      status: "In Use",
      serialNumber: "F2LN9J8XQP0Y",
      ownerEmail: "jordan@kyma.local",
      purchasedMonthsAgo: 10,
    },
    {
      id: "seed-asset-catalyst-switch",
      name: "Cisco Catalyst 9200 Switch",
      type: "Networking",
      status: "Retired",
      serialNumber: "FCW2231L0K9",
      location: "Server Closet B",
      purchasedMonthsAgo: 50,
    },
  ];

  const now = new Date();
  for (const a of assetSeeds) {
    const purchasedAt = new Date(now);
    purchasedAt.setMonth(purchasedAt.getMonth() - a.purchasedMonthsAgo);
    await prisma.asset.upsert({
      where: { id: a.id },
      update: {
        name: a.name,
        typeId: assetTypeId(a.type),
        statusId: assetStatusId(a.status),
        serialNumber: a.serialNumber,
        location: a.location,
        ownerId: a.ownerEmail ? userId(a.ownerEmail) : null,
        branchId: branch.id,
        purchasedAt,
      },
      create: {
        id: a.id,
        name: a.name,
        typeId: assetTypeId(a.type),
        statusId: assetStatusId(a.status),
        serialNumber: a.serialNumber,
        location: a.location,
        ownerId: a.ownerEmail ? userId(a.ownerEmail) : null,
        branchId: branch.id,
        purchasedAt,
      },
    });
    await prisma.assetHistory.upsert({
      where: { id: `${a.id}-created` },
      update: {},
      create: {
        id: `${a.id}-created`,
        assetId: a.id,
        eventType: "CREATED",
        userId: userId("admin@kyma.local"),
        timestamp: purchasedAt,
      },
    });
  }

  type TicketSeed = {
    id: string;
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    status: string;
    category: string;
    createdByEmail: string;
    assigneeEmail?: string;
    assetId?: string;
    hoursAgo: number;
    source?: { sourceId: string; externalRef: string };
  };

  const ticketSeeds: TicketSeed[] = [
    {
      id: "seed-ticket-vpn-guest-wifi",
      title: "VPN connection drops on the guest wireless network",
      description:
        "Multiple staff on the east wing are reporting the VPN client disconnecting every 15-20 minutes while on the guest SSID; wired connections are unaffected.",
      priority: "HIGH",
      status: "In Progress",
      category: "Network",
      createdByEmail: "priya@kyma.local",
      assigneeEmail: "sam@kyma.local",
      hoursAgo: 10,
    },
    {
      id: "seed-ticket-new-hire-onboarding",
      title: "New hire needs laptop and building access provisioned before Monday",
      description:
        "Marketing is onboarding a new coordinator starting Monday — needs a laptop imaged, badge access to the 3rd floor, and shared drive permissions set up.",
      priority: "MEDIUM",
      status: "Open",
      category: "Onboarding",
      createdByEmail: "priya@kyma.local",
      assigneeEmail: "priya@kyma.local",
      hoursAgo: 24,
    },
    {
      id: "seed-ticket-projector-hdmi",
      title: "Conference room projector won't detect HDMI input",
      description:
        "The projector in the 2nd floor conference room shows \"No signal\" whenever a laptop is plugged in over HDMI; VGA still works fine.",
      priority: "LOW",
      status: "Resolved",
      category: "Hardware",
      createdByEmail: "jordan@kyma.local",
      assigneeEmail: "sam@kyma.local",
      hoursAgo: 288,
    },
    {
      id: "seed-ticket-marketing-drive-permissions",
      title: "Shared drive permissions reset needed for the Marketing folder",
      description:
        "Lost read/write access to the Marketing shared drive after last week's reorg — a few teammates are seeing the same thing.",
      priority: "MEDIUM",
      status: "Closed",
      category: "Access",
      createdByEmail: "jordan@kyma.local",
      assigneeEmail: "priya@kyma.local",
      hoursAgo: 480,
    },
    {
      id: "seed-ticket-vendor-laptop-battery",
      title: "Vendor laptop battery swelling — needs immediate replacement",
      description:
        "The battery on a loaner laptop from an external vendor is visibly swollen and pushing the trackpad up. Pulled it from use; vendor RMA is in progress.",
      priority: "URGENT",
      status: "Blocked",
      category: "Hardware",
      createdByEmail: "sam@kyma.local",
      assigneeEmail: "sam@kyma.local",
      hoursAgo: 26,
    },
    {
      id: "seed-ticket-printer-jamming",
      title: "Printer on the 2nd floor is jamming on every print job",
      description:
        "The LaserJet outside the copy room jams within the first page on nearly every job, regardless of who's printing.",
      priority: "MEDIUM",
      status: "In Progress",
      category: "Hardware",
      createdByEmail: "jordan@kyma.local",
      assigneeEmail: "sam@kyma.local",
      assetId: "seed-asset-laserjet-printer",
      hoursAgo: 20,
    },
    {
      id: "seed-ticket-adobe-license-renewal",
      title: "Software license renewal needed for the design team's Adobe seats",
      description:
        "Adobe Creative Cloud licenses for the design team expire at the end of the month — need the renewal processed before then.",
      priority: "MEDIUM",
      status: "Open",
      category: "Software",
      createdByEmail: "priya@kyma.local",
      hoursAgo: 22,
    },
    {
      id: "seed-ticket-contractor-offboarding",
      title: "Password reset requested after contractor offboarding",
      description:
        "A contractor's account was flagged during offboarding — requesting a password reset and access review before it's reassigned to the next contractor.",
      priority: "HIGH",
      status: "Resolved",
      category: "Access",
      createdByEmail: "priya@kyma.local",
      assigneeEmail: "priya@kyma.local",
      hoursAgo: 192,
    },
    {
      id: "seed-ticket-fortisiem-outage",
      title: "Network outage alert — Building B core uplink down (FortiSIEM)",
      description:
        "Auto-generated from FortiSIEM: an SNMP trap shows the core switch uplink for Building B unreachable for over 5 minutes. No on-site confirmation yet.",
      priority: "URGENT",
      status: "Open",
      category: "Network",
      createdByEmail: "integrations@kyma.local",
      assigneeEmail: "sam@kyma.local",
      hoursAgo: 14,
      source: { sourceId: fortiSiem.id, externalRef: "FSM-INC-48213" },
    },
    {
      id: "seed-ticket-facilities-td",
      title: "Facilities request forwarded from the downtown campus service desk",
      description:
        "Downtown campus is still running its own TeamDynamix queue during the platform migration — this came through their portal: the loading dock door won't latch and needs a technician.",
      priority: "LOW",
      status: "Open",
      category: "Facilities",
      createdByEmail: "integrations@kyma.local",
      hoursAgo: 30,
      source: { sourceId: teamDynamix.id, externalRef: "TD-77410" },
    },
    {
      id: "seed-ticket-second-monitor-request",
      title: "New monitor requested for hybrid workstation setup",
      description:
        "Splitting time between office and home — could use a second monitor at the office desk to match the home setup.",
      priority: "LOW",
      status: "Open",
      category: "Inventory",
      createdByEmail: "jordan@kyma.local",
      hoursAgo: 96,
    },
  ];

  for (const t of ticketSeeds) {
    const createdAt = new Date(now.getTime() - t.hoursAgo * 3600 * 1000);
    const catId = categoryId(t.category);
    const hours = resolveSlaHours(t.priority, catId, []);
    const slaDueAt = addHours(createdAt, hours);
    const createdById =
      t.createdByEmail === "integrations@kyma.local"
        ? integrationsUser.id
        : userId(t.createdByEmail);

    const data = {
      title: t.title,
      description: t.description,
      priority: t.priority,
      statusId: ticketStatusId(t.status),
      categoryId: catId,
      branchId: branch.id,
      createdById,
      assigneeId: t.assigneeEmail ? userId(t.assigneeEmail) : null,
      assetId: t.assetId ?? null,
      sourceId: t.source?.sourceId ?? null,
      externalRef: t.source?.externalRef ?? null,
      createdAt,
      slaDueAt,
    };
    await prisma.ticket.upsert({
      where: { id: t.id },
      update: data,
      create: { id: t.id, ...data },
    });
  }

  // A couple of comments on the printer ticket to show the internal-vs-user-
  // visible distinction (Section 2) with real content instead of an empty
  // thread.
  await prisma.ticketComment.upsert({
    where: { id: "seed-comment-printer-internal" },
    update: {},
    create: {
      id: "seed-comment-printer-internal",
      ticketId: "seed-ticket-printer-jamming",
      authorId: userId("sam@kyma.local"),
      body: "Replaced the fuser roller kit — keeping an eye on it for a few days before marking this resolved.",
      isInternal: true,
    },
  });
  await prisma.ticketComment.upsert({
    where: { id: "seed-comment-printer-reply" },
    update: {},
    create: {
      id: "seed-comment-printer-reply",
      ticketId: "seed-ticket-printer-jamming",
      authorId: userId("sam@kyma.local"),
      body: "Thanks for flagging this — we've serviced the printer and it should be back to normal. Let us know if it jams again.",
      isInternal: false,
    },
  });

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
