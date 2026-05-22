-- CreateTable
CREATE TABLE "MaterialLot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "processId" INTEGER NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "kg" REAL NOT NULL,
    "initialMeters" REAL NOT NULL,
    "addedMeters" REAL NOT NULL DEFAULT 0,
    "finalMeters" REAL NOT NULL DEFAULT 0,
    "totalUsedMeters" REAL NOT NULL,
    "observations" TEXT,
    CONSTRAINT "MaterialLot_processId_fkey" FOREIGN KEY ("processId") REFERENCES "ProductionProcess" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
