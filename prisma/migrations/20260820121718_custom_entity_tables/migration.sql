-- CreateEnum
CREATE TYPE "CustomEntityFieldType" AS ENUM ('TEXT', 'NUMBER', 'SELECT', 'DATE', 'BOOLEAN', 'RELATION');

-- CreateEnum
CREATE TYPE "RelationTargetType" AS ENUM ('TICKET', 'ASSET', 'USER');

-- CreateTable
CREATE TABLE "custom_entity_definition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_entity_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_entity_field_definition" (
    "id" TEXT NOT NULL,
    "entityDefinitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fieldType" "CustomEntityFieldType" NOT NULL,
    "options" JSONB,
    "relationTarget" "RelationTargetType",
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,

    CONSTRAINT "custom_entity_field_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_entity_record" (
    "id" TEXT NOT NULL,
    "entityDefinitionId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_entity_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_entity_field_value" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "fieldDefinitionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "custom_entity_field_value_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_entity_definition_slug_key" ON "custom_entity_definition"("slug");

-- CreateIndex
CREATE INDEX "custom_entity_field_definition_entityDefinitionId_idx" ON "custom_entity_field_definition"("entityDefinitionId");

-- CreateIndex
CREATE INDEX "custom_entity_record_entityDefinitionId_idx" ON "custom_entity_record"("entityDefinitionId");

-- CreateIndex
CREATE INDEX "custom_entity_field_value_recordId_idx" ON "custom_entity_field_value"("recordId");

-- CreateIndex
CREATE INDEX "custom_entity_field_value_fieldDefinitionId_idx" ON "custom_entity_field_value"("fieldDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_entity_field_value_recordId_fieldDefinitionId_key" ON "custom_entity_field_value"("recordId", "fieldDefinitionId");

-- AddForeignKey
ALTER TABLE "custom_entity_field_definition" ADD CONSTRAINT "custom_entity_field_definition_entityDefinitionId_fkey" FOREIGN KEY ("entityDefinitionId") REFERENCES "custom_entity_definition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_entity_record" ADD CONSTRAINT "custom_entity_record_entityDefinitionId_fkey" FOREIGN KEY ("entityDefinitionId") REFERENCES "custom_entity_definition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_entity_record" ADD CONSTRAINT "custom_entity_record_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_entity_field_value" ADD CONSTRAINT "custom_entity_field_value_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "custom_entity_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_entity_field_value" ADD CONSTRAINT "custom_entity_field_value_fieldDefinitionId_fkey" FOREIGN KEY ("fieldDefinitionId") REFERENCES "custom_entity_field_definition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
