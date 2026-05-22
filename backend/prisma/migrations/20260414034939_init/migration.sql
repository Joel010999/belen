-- CreateTable
CREATE TABLE "Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Supply" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductionOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderNumber" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "sampleId" INTEGER,
    "plannedQty" REAL NOT NULL,
    "producedQty" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "deliveryDate" DATETIME,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'BORRADOR',
    "observations" TEXT,
    "creatorId" INTEGER NOT NULL,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductionOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductionOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductionOrder_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProductionOrder_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TechnicalSpec" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "materialMeasure" TEXT,
    "cut" TEXT,
    "lamina" TEXT,
    "meters" REAL,
    "tube" TEXT,
    "colorCount" INTEGER,
    "pie" TEXT,
    "designName" TEXT,
    "cabeza" TEXT,
    "printingType" TEXT,
    "cliseCenter" TEXT,
    "cliseLeft" TEXT,
    "cliseRight" TEXT,
    "tacaRight" TEXT,
    "tacaLeft" TEXT,
    "techObservations" TEXT,
    CONSTRAINT "TechnicalSpec_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ProductionOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ColorOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "colorName" TEXT NOT NULL,
    "supplyId" INTEGER,
    "formula" TEXT,
    "observations" TEXT,
    CONSTRAINT "ColorOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ProductionOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Consumption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "supplyId" INTEGER NOT NULL,
    "plannedQty" REAL NOT NULL,
    "realQty" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "observations" TEXT,
    CONSTRAINT "Consumption_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ProductionOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Consumption_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "Supply" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductionProcess" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "machineId" INTEGER,
    "operatorId" INTEGER,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "scrapKg" REAL NOT NULL DEFAULT 0,
    "observations" TEXT,
    CONSTRAINT "ProductionProcess_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ProductionOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductionProcess_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProductionProcess_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcessPrinting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "processId" INTEGER NOT NULL,
    "exitSense" TEXT,
    "coilDiameter" REAL,
    "processedMeters" REAL,
    "coilCount" INTEGER,
    "perFlecha" TEXT,
    CONSTRAINT "ProcessPrinting_processId_fkey" FOREIGN KEY ("processId") REFERENCES "ProductionProcess" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcessPrintingColor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "printingId" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "colorName" TEXT NOT NULL,
    "endValue" REAL,
    "diffValue" REAL,
    "calcValue" REAL,
    CONSTRAINT "ProcessPrintingColor_printingId_fkey" FOREIGN KEY ("printingId") REFERENCES "ProcessPrinting" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcessLamination" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "processId" INTEGER NOT NULL,
    "materialId" INTEGER,
    "adhesiveId" INTEGER,
    "reticulantId" INTEGER,
    "diluentId" INTEGER,
    "mixProportion" TEXT,
    "processedMeters" REAL,
    CONSTRAINT "ProcessLamination_processId_fkey" FOREIGN KEY ("processId") REFERENCES "ProductionProcess" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcessRefilado" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "processId" INTEGER NOT NULL,
    "exitSense" TEXT,
    "tacaRight" TEXT,
    "tacaLeft" TEXT,
    "deCabeza" BOOLEAN,
    "deTripa" BOOLEAN,
    "coilDiameter" REAL,
    "processedMeters" REAL,
    "coilCount" INTEGER,
    CONSTRAINT "ProcessRefilado_processId_fkey" FOREIGN KEY ("processId") REFERENCES "ProductionProcess" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinalControl" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "operatorId" INTEGER NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "observations" TEXT,
    CONSTRAINT "FinalControl_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ProductionOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FinalControl_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinalControlItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "controlId" INTEGER NOT NULL,
    "item" TEXT NOT NULL,
    "confort" BOOLEAN NOT NULL,
    "textValue" TEXT,
    "observation" TEXT,
    CONSTRAINT "FinalControlItem_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "FinalControl" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductionResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "producedQty" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "pouchBagQty" INTEGER,
    "corteFondoBagQty" INTEGER,
    "corteLateralBagQty" INTEGER,
    "coilQty" INTEGER,
    "finalKg" REAL,
    "finalMeters" REAL,
    "totalScrapKg" REAL,
    "observations" TEXT,
    "readyForExport" BOOLEAN NOT NULL DEFAULT false,
    "exported" BOOLEAN NOT NULL DEFAULT false,
    "exportDate" DATETIME,
    CONSTRAINT "ProductionResult_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ProductionOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "source" TEXT,
    "orderId" INTEGER,
    "itemType" TEXT NOT NULL,
    "productId" INTEGER,
    "supplyId" INTEGER,
    "qty" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "sign" INTEGER NOT NULL,
    "observations" TEXT,
    "pendingExport" BOOLEAN NOT NULL DEFAULT true,
    "exported" BOOLEAN NOT NULL DEFAULT false,
    "exportDate" DATETIME,
    "batchId" INTEGER,
    CONSTRAINT "StockMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ProductionOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ExportBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CurrentStock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemType" TEXT NOT NULL,
    "productId" INTEGER,
    "supplyId" INTEGER,
    "stockActual" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "lastUpdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateSource" TEXT,
    CONSTRAINT "CurrentStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CurrentStock_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "Supply" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "readCount" INTEGER NOT NULL,
    "insertedCount" INTEGER NOT NULL,
    "updatedCount" INTEGER NOT NULL,
    "errorCount" INTEGER NOT NULL,
    "errorLog" TEXT,
    "status" TEXT NOT NULL,
    CONSTRAINT "ImportLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExportBatch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "movementCount" INTEGER NOT NULL,
    CONSTRAINT "ExportBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL,
    "operatorId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "User_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Operator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "legajo" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Machine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Sample" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Attachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Attachment_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "ProductionOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_code_key" ON "Client"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Supply_code_key" ON "Supply"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOrder_orderNumber_key" ON "ProductionOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicalSpec_orderId_key" ON "TechnicalSpec"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessPrinting_processId_key" ON "ProcessPrinting"("processId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessLamination_processId_key" ON "ProcessLamination"("processId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessRefilado_processId_key" ON "ProcessRefilado"("processId");

-- CreateIndex
CREATE UNIQUE INDEX "FinalControl_orderId_key" ON "FinalControl"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionResult_orderId_key" ON "ProductionResult"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "CurrentStock_productId_key" ON "CurrentStock"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CurrentStock_supplyId_key" ON "CurrentStock"("supplyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_operatorId_key" ON "User"("operatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Operator_legajo_key" ON "Operator"("legajo");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_code_key" ON "Machine"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Sample_code_key" ON "Sample"("code");
