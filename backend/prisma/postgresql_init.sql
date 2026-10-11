-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "silcar";
SET search_path TO "silcar";

-- CreateTable
CREATE TABLE "silcar"."Client" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."Product" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."Supply" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."ProductionOrder" (
    "id" SERIAL NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" INTEGER NOT NULL,
    "productId" INTEGER,
    "sampleId" INTEGER,
    "classification" TEXT,
    "workType" TEXT,
    "hasSample" BOOLEAN NOT NULL DEFAULT false,
    "estimatedBagQty" INTEGER,
    "plannedQty" TEXT,
    "producedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT '├ôrdenes por realizar',
    "observations" TEXT,
    "specifications" TEXT,
    "approvedPrinting" BOOLEAN NOT NULL DEFAULT false,
    "approvedLamination" BOOLEAN NOT NULL DEFAULT false,
    "approvedRefilado" BOOLEAN NOT NULL DEFAULT false,
    "approvedConfeccion" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" INTEGER NOT NULL,
    "machineId" INTEGER,
    "operatorsText" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."OrderOperator" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "operatorId" INTEGER NOT NULL,

    CONSTRAINT "OrderOperator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."TechnicalSpec" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "materialMeasure" TEXT,
    "cut" TEXT,
    "lamina" TEXT,
    "meters" DOUBLE PRECISION,
    "tube" TEXT,
    "colorCount" INTEGER,
    "pie" TEXT,
    "designName" TEXT,
    "cabeza" TEXT,
    "printingType" TEXT,
    "printingExitSense" TEXT,
    "printingCoilDiameter" DOUBLE PRECISION,
    "tacaRight" TEXT,
    "tacaLeft" TEXT,
    "clisheAlignment" TEXT,
    "techObservations" TEXT,
    "refiladoExitSense" TEXT,
    "refiladoDePie" BOOLEAN,
    "refiladoDeCabeza" BOOLEAN,
    "refiladoTacaRight" TEXT,
    "refiladoTacaLeft" TEXT,
    "refiladoAnchoEspira" DOUBLE PRECISION,
    "refiladoCoilDiameter" DOUBLE PRECISION,
    "refiladoMeters" DOUBLE PRECISION,
    "laminationStructure" TEXT,
    "laminationAdhesive" TEXT,
    "laminationReticulant" TEXT,
    "laminationDiluent" TEXT,
    "laminationViscosity" DOUBLE PRECISION,
    "laminationOvenTemp" DOUBLE PRECISION,
    "laminationCalenderTemp" DOUBLE PRECISION,
    "laminationAdhesiveLoad" DOUBLE PRECISION,
    "laminationObservations" TEXT,

    CONSTRAINT "TechnicalSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."ColorOrder" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "colorName" TEXT NOT NULL,
    "lotNumber" TEXT,
    "supplyId" INTEGER,
    "formula" TEXT,
    "observations" TEXT,
    "changesToConsider" TEXT,

    CONSTRAINT "ColorOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."Consumption" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "supplyId" INTEGER NOT NULL,
    "lotNumber" TEXT,
    "plannedQty" DOUBLE PRECISION NOT NULL,
    "realQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION,
    "calculatedCost" DOUBLE PRECISION,
    "exchangeRate" DOUBLE PRECISION,
    "calculatedCostArs" DOUBLE PRECISION,
    "observations" TEXT,

    CONSTRAINT "Consumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "silcar"."ProductionProcess" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "machineId" INTEGER,
    "operatorId" INTEGER,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "scrapKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observations" TEXT,

    CONSTRAINT "ProductionProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."ProcessScrapEntry" (
    "id" SERIAL NOT NULL,
    "processId" INTEGER NOT NULL,
    "kg" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessScrapEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."ProcessMetricEntry" (
    "id" SERIAL NOT NULL,
    "processId" INTEGER NOT NULL,
    "meters" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scrapKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coilCount" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessMetricEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."ProcessTimeLog" (
    "id" SERIAL NOT NULL,
    "processId" INTEGER NOT NULL,
    "operatorId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessTimeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."MaterialLot" (
    "id" SERIAL NOT NULL,
    "processId" INTEGER NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "kg" DOUBLE PRECISION NOT NULL,
    "initialMeters" DOUBLE PRECISION NOT NULL,
    "addedMeters" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalMeters" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalUsedMeters" DOUBLE PRECISION NOT NULL,
    "observations" TEXT,

    CONSTRAINT "MaterialLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."ProcessPrinting" (
    "id" SERIAL NOT NULL,
    "processId" INTEGER NOT NULL,
    "exitSense" TEXT,
    "coilDiameter" DOUBLE PRECISION,
    "processedMeters" DOUBLE PRECISION,
    "coilCount" INTEGER,
    "perFlecha" TEXT,

    CONSTRAINT "ProcessPrinting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."ProcessPrintingColor" (
    "id" SERIAL NOT NULL,
    "printingId" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "colorName" TEXT NOT NULL,
    "endValue" DOUBLE PRECISION,
    "diffValue" DOUBLE PRECISION,
    "calcValue" DOUBLE PRECISION,

    CONSTRAINT "ProcessPrintingColor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."ProcessLamination" (
    "id" SERIAL NOT NULL,
    "processId" INTEGER NOT NULL,
    "materialId" INTEGER,
    "adhesiveId" INTEGER,
    "reticulantId" INTEGER,
    "diluentId" INTEGER,
    "mixProportion" TEXT,
    "processedMeters" DOUBLE PRECISION,

    CONSTRAINT "ProcessLamination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."ProcessRefilado" (
    "id" SERIAL NOT NULL,
    "processId" INTEGER NOT NULL,
    "exitSense" TEXT,
    "tacaRight" TEXT,
    "tacaLeft" TEXT,
    "dePie" BOOLEAN,
    "deCabeza" BOOLEAN,
    "deTripa" BOOLEAN,
    "anchoEspira" DOUBLE PRECISION,
    "coilDiameter" DOUBLE PRECISION,
    "processedMeters" DOUBLE PRECISION,
    "coilCount" INTEGER,
    "controlName" TEXT,
    "tacaDerIzq" TEXT,
    "finalAnchoEspira" DOUBLE PRECISION,
    "finalExitSense" TEXT,
    "bobbinCountName" TEXT,

    CONSTRAINT "ProcessRefilado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."RefiladoOutputBobbin" (
    "id" SERIAL NOT NULL,
    "refiladoId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "productName" TEXT,
    "kg" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefiladoOutputBobbin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."ProcessConfeccion" (
    "id" SERIAL NOT NULL,
    "processId" INTEGER NOT NULL,

    CONSTRAINT "ProcessConfeccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."ProcessConfeccionOutput" (
    "id" SERIAL NOT NULL,
    "confeccionId" INTEGER NOT NULL,
    "productId" INTEGER,
    "productName" TEXT NOT NULL,
    "bagQty" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessConfeccionOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."FinalControl" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "operatorId" INTEGER NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "observations" TEXT,

    CONSTRAINT "FinalControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."FinalControlItem" (
    "id" SERIAL NOT NULL,
    "controlId" INTEGER NOT NULL,
    "item" TEXT NOT NULL,
    "confort" BOOLEAN NOT NULL,
    "textValue" TEXT,
    "observation" TEXT,

    CONSTRAINT "FinalControlItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."ProductionResult" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "producedQty" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "pouchBagQty" INTEGER,
    "corteFondoBagQty" INTEGER,
    "corteLateralBagQty" INTEGER,
    "coilQty" INTEGER,
    "finalKg" DOUBLE PRECISION,
    "finalMeters" DOUBLE PRECISION,
    "totalScrapKg" DOUBLE PRECISION,
    "observations" TEXT,
    "readyForExport" BOOLEAN NOT NULL DEFAULT false,
    "exported" BOOLEAN NOT NULL DEFAULT false,
    "exportDate" TIMESTAMP(3),

    CONSTRAINT "ProductionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."StockMovement" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "source" TEXT,
    "orderId" INTEGER,
    "itemType" TEXT NOT NULL,
    "productId" INTEGER,
    "supplyId" INTEGER,
    "qty" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "sign" INTEGER NOT NULL,
    "observations" TEXT,
    "pendingExport" BOOLEAN NOT NULL DEFAULT true,
    "exported" BOOLEAN NOT NULL DEFAULT false,
    "exportDate" TIMESTAMP(3),
    "batchId" INTEGER,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."CurrentStock" (
    "id" SERIAL NOT NULL,
    "itemType" TEXT NOT NULL,
    "productId" INTEGER,
    "supplyId" INTEGER,
    "stockActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minStock" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "unit" TEXT NOT NULL,
    "lastUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateSource" TEXT,

    CONSTRAINT "CurrentStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."ImportLog" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "readCount" INTEGER NOT NULL,
    "insertedCount" INTEGER NOT NULL,
    "updatedCount" INTEGER NOT NULL,
    "errorCount" INTEGER NOT NULL,
    "errorLog" TEXT,
    "status" TEXT NOT NULL,

    CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."ExportBatch" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "movementCount" INTEGER NOT NULL,

    CONSTRAINT "ExportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL,
    "operatorId" INTEGER,
    "machineId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."Operator" (
    "id" SERIAL NOT NULL,
    "legajo" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."Machine" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."Sample" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "frontImage" TEXT,
    "backImage" TEXT,
    "artFile" TEXT,
    "observations" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."Attachment" (
    "id" SERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."OrderProduct" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "plannedQty" TEXT NOT NULL,
    "materialType" TEXT,

    CONSTRAINT "OrderProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."ProcessChecklist" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operatorId" INTEGER NOT NULL,

    CONSTRAINT "ProcessChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."ProcessChecklistItem" (
    "id" SERIAL NOT NULL,
    "checklistId" INTEGER NOT NULL,
    "time" TEXT NOT NULL,
    "controlName" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "value" TEXT,

    CONSTRAINT "ProcessChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."QualityControl" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" TEXT NOT NULL,

    CONSTRAINT "QualityControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."FinalInspection" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inspectorUserId" INTEGER,
    "inspectorName" TEXT,
    "textOk" BOOLEAN NOT NULL DEFAULT false,
    "cutOk" BOOLEAN NOT NULL DEFAULT false,
    "toneOk" BOOLEAN NOT NULL DEFAULT false,
    "materialWidthOk" BOOLEAN NOT NULL DEFAULT false,
    "orderNumberOk" BOOLEAN NOT NULL DEFAULT false,
    "labelOk" BOOLEAN NOT NULL DEFAULT false,
    "receiptOk" BOOLEAN NOT NULL DEFAULT false,
    "observations" TEXT,
    "productNameObserved" TEXT,
    "signatureName" TEXT,
    "signedOff" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FinalInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silcar"."SystemAuditLog" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "userStr" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "details" TEXT,

    CONSTRAINT "SystemAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_code_key" ON "silcar"."Client"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "silcar"."Product"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Supply_code_key" ON "silcar"."Supply"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOrder_orderNumber_key" ON "silcar"."ProductionOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "OrderOperator_orderId_operatorId_key" ON "silcar"."OrderOperator"("orderId", "operatorId");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicalSpec_orderId_key" ON "silcar"."TechnicalSpec"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessPrinting_processId_key" ON "silcar"."ProcessPrinting"("processId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessLamination_processId_key" ON "silcar"."ProcessLamination"("processId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessRefilado_processId_key" ON "silcar"."ProcessRefilado"("processId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessConfeccion_processId_key" ON "silcar"."ProcessConfeccion"("processId");

-- CreateIndex
CREATE UNIQUE INDEX "FinalControl_orderId_key" ON "silcar"."FinalControl"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionResult_orderId_key" ON "silcar"."ProductionResult"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "CurrentStock_productId_key" ON "silcar"."CurrentStock"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CurrentStock_supplyId_key" ON "silcar"."CurrentStock"("supplyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "silcar"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_operatorId_key" ON "silcar"."User"("operatorId");

-- CreateIndex
CREATE UNIQUE INDEX "User_machineId_key" ON "silcar"."User"("machineId");

-- CreateIndex
CREATE UNIQUE INDEX "Operator_legajo_key" ON "silcar"."Operator"("legajo");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_code_key" ON "silcar"."Machine"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Sample_code_key" ON "silcar"."Sample"("code");

-- AddForeignKey
ALTER TABLE "silcar"."ProductionOrder" ADD CONSTRAINT "ProductionOrder_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "silcar"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProductionOrder" ADD CONSTRAINT "ProductionOrder_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "silcar"."Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProductionOrder" ADD CONSTRAINT "ProductionOrder_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "silcar"."Sample"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProductionOrder" ADD CONSTRAINT "ProductionOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "silcar"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProductionOrder" ADD CONSTRAINT "ProductionOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "silcar"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."OrderOperator" ADD CONSTRAINT "OrderOperator_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "silcar"."ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."OrderOperator" ADD CONSTRAINT "OrderOperator_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "silcar"."Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."TechnicalSpec" ADD CONSTRAINT "TechnicalSpec_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "silcar"."ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ColorOrder" ADD CONSTRAINT "ColorOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "silcar"."ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."Consumption" ADD CONSTRAINT "Consumption_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "silcar"."Supply"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."Consumption" ADD CONSTRAINT "Consumption_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "silcar"."ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProductionProcess" ADD CONSTRAINT "ProductionProcess_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "silcar"."Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProductionProcess" ADD CONSTRAINT "ProductionProcess_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "silcar"."Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProductionProcess" ADD CONSTRAINT "ProductionProcess_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "silcar"."ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProcessScrapEntry" ADD CONSTRAINT "ProcessScrapEntry_processId_fkey" FOREIGN KEY ("processId") REFERENCES "silcar"."ProductionProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProcessMetricEntry" ADD CONSTRAINT "ProcessMetricEntry_processId_fkey" FOREIGN KEY ("processId") REFERENCES "silcar"."ProductionProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProcessTimeLog" ADD CONSTRAINT "ProcessTimeLog_processId_fkey" FOREIGN KEY ("processId") REFERENCES "silcar"."ProductionProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProcessTimeLog" ADD CONSTRAINT "ProcessTimeLog_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "silcar"."Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."MaterialLot" ADD CONSTRAINT "MaterialLot_processId_fkey" FOREIGN KEY ("processId") REFERENCES "silcar"."ProductionProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProcessPrinting" ADD CONSTRAINT "ProcessPrinting_processId_fkey" FOREIGN KEY ("processId") REFERENCES "silcar"."ProductionProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProcessPrintingColor" ADD CONSTRAINT "ProcessPrintingColor_printingId_fkey" FOREIGN KEY ("printingId") REFERENCES "silcar"."ProcessPrinting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProcessLamination" ADD CONSTRAINT "ProcessLamination_processId_fkey" FOREIGN KEY ("processId") REFERENCES "silcar"."ProductionProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProcessRefilado" ADD CONSTRAINT "ProcessRefilado_processId_fkey" FOREIGN KEY ("processId") REFERENCES "silcar"."ProductionProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."RefiladoOutputBobbin" ADD CONSTRAINT "RefiladoOutputBobbin_refiladoId_fkey" FOREIGN KEY ("refiladoId") REFERENCES "silcar"."ProcessRefilado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProcessConfeccion" ADD CONSTRAINT "ProcessConfeccion_processId_fkey" FOREIGN KEY ("processId") REFERENCES "silcar"."ProductionProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProcessConfeccionOutput" ADD CONSTRAINT "ProcessConfeccionOutput_confeccionId_fkey" FOREIGN KEY ("confeccionId") REFERENCES "silcar"."ProcessConfeccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."FinalControl" ADD CONSTRAINT "FinalControl_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "silcar"."Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."FinalControl" ADD CONSTRAINT "FinalControl_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "silcar"."ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."FinalControlItem" ADD CONSTRAINT "FinalControlItem_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "silcar"."FinalControl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProductionResult" ADD CONSTRAINT "ProductionResult_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "silcar"."ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."StockMovement" ADD CONSTRAINT "StockMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "silcar"."ExportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."StockMovement" ADD CONSTRAINT "StockMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "silcar"."ProductionOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."CurrentStock" ADD CONSTRAINT "CurrentStock_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "silcar"."Supply"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."CurrentStock" ADD CONSTRAINT "CurrentStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "silcar"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ImportLog" ADD CONSTRAINT "ImportLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "silcar"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ExportBatch" ADD CONSTRAINT "ExportBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "silcar"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."User" ADD CONSTRAINT "User_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "silcar"."Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."User" ADD CONSTRAINT "User_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "silcar"."Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."Attachment" ADD CONSTRAINT "Attachment_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "silcar"."ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."Attachment" ADD CONSTRAINT "Attachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "silcar"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."OrderProduct" ADD CONSTRAINT "OrderProduct_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "silcar"."ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."OrderProduct" ADD CONSTRAINT "OrderProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "silcar"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProcessChecklist" ADD CONSTRAINT "ProcessChecklist_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "silcar"."ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProcessChecklist" ADD CONSTRAINT "ProcessChecklist_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "silcar"."Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."ProcessChecklistItem" ADD CONSTRAINT "ProcessChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "silcar"."ProcessChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."QualityControl" ADD CONSTRAINT "QualityControl_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "silcar"."ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."FinalInspection" ADD CONSTRAINT "FinalInspection_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "silcar"."ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silcar"."FinalInspection" ADD CONSTRAINT "FinalInspection_inspectorUserId_fkey" FOREIGN KEY ("inspectorUserId") REFERENCES "silcar"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "silcar"."IdempotencyRecord" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "responseBody" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_key_key" ON "silcar"."IdempotencyRecord"("key");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_scope_idx" ON "silcar"."IdempotencyRecord"("scope");


