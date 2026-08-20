import { z } from "zod";
import { WIDGET_IDS } from "@/lib/dashboard-widgets";

export const updateDashboardConfigSchema = z.object({
  widgetIds: z.array(z.enum(WIDGET_IDS)).max(WIDGET_IDS.length),
});

export type UpdateDashboardConfigInput = z.infer<
  typeof updateDashboardConfigSchema
>;
