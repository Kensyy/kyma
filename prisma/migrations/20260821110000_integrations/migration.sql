-- CreateEnum
CREATE TYPE "WebhookEvent" AS ENUM ('TICKET_CREATED', 'TICKET_STATUS_CHANGED', 'TICKET_ASSIGNED');

-- AlterTable
ALTER TABLE "ticket" ADD COLUMN     "sourceId" TEXT;

-- CreateTable
CREATE TABLE "integration_source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_subscription" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "event" "WebhookEvent" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integration_source_name_key" ON "integration_source"("name");

-- CreateIndex
CREATE UNIQUE INDEX "integration_source_apiKey_key" ON "integration_source"("apiKey");

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "integration_source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
