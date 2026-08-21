import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "STAFF",
        input: false,
      },
      branchId: {
        type: "string",
        required: false,
      },
      isDemo: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
    },
  },
});
