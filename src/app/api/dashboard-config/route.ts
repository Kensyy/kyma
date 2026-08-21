import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireWriteSession } from "@/lib/api-auth";
import { updateDashboardConfigSchema } from "@/lib/validations/dashboard-config";
import {
  DEFAULT_WIDGET_IDS,
  type DashboardWidgetId,
} from "@/lib/dashboard-widgets";

export async function GET() {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const config = await prisma.dashboardConfig.findUnique({
    where: { userId: session.user.id },
  });

  // No saved layout yet — the customize panel and the dashboard shell both
  // fall back to every widget, in registry order, until the user saves one.
  const layout = config?.layoutJson as
    { widgetIds?: DashboardWidgetId[] } | undefined;
  const widgetIds = layout?.widgetIds ?? DEFAULT_WIDGET_IDS;

  return NextResponse.json({ widgetIds });
}

export async function PATCH(request: NextRequest) {
  const session = await requireWriteSession();
  if ("error" in session) return session.error;

  const body = await request.json();
  const parsed = updateDashboardConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const config = await prisma.dashboardConfig.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      layoutJson: { widgetIds: parsed.data.widgetIds },
    },
    update: { layoutJson: { widgetIds: parsed.data.widgetIds } },
  });

  const layout = config.layoutJson as { widgetIds: DashboardWidgetId[] };
  return NextResponse.json({ widgetIds: layout.widgetIds });
}
