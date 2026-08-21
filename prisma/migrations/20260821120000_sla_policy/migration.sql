-- CreateTable
CREATE TABLE "sla_policy" (
    "id" TEXT NOT NULL,
    "priority" "Priority" NOT NULL,
    "categoryId" TEXT,
    "hours" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sla_policy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sla_policy_priority_categoryId_key" ON "sla_policy"("priority", "categoryId");

-- AddForeignKey
ALTER TABLE "sla_policy" ADD CONSTRAINT "sla_policy_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
