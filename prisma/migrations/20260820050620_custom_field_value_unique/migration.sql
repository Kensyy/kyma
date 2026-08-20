-- AlterTable
CREATE UNIQUE INDEX "custom_field_value_entityId_fieldDefinitionId_key" ON "custom_field_value"("entityId", "fieldDefinitionId");
