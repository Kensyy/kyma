-- AlterEnum
ALTER TYPE "RelationTargetType" ADD VALUE 'CUSTOM_ENTITY';

-- AlterTable
ALTER TABLE "custom_entity_definition" ADD COLUMN     "displayFieldId" TEXT;

-- AlterTable
ALTER TABLE "custom_entity_field_definition" ADD COLUMN     "relationTargetEntityId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "custom_entity_definition_displayFieldId_key" ON "custom_entity_definition"("displayFieldId");

-- AddForeignKey
ALTER TABLE "custom_entity_definition" ADD CONSTRAINT "custom_entity_definition_displayFieldId_fkey" FOREIGN KEY ("displayFieldId") REFERENCES "custom_entity_field_definition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_entity_field_definition" ADD CONSTRAINT "custom_entity_field_definition_relationTargetEntityId_fkey" FOREIGN KEY ("relationTargetEntityId") REFERENCES "custom_entity_definition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
