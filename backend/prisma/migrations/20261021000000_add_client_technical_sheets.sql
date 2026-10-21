-- ====================================================================
-- SILCAR — MIGRACIÓN: HOJAS DE CLIENTES (FICHA TÉCNICA)
-- Esquema aislado: "silcar" (NO toca "public" ni otras aplicaciones)
-- ====================================================================

CREATE TABLE IF NOT EXISTS "silcar"."ClientSheet" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "productReference" TEXT,
    "cylinderSize" TEXT,
    "printingMeasure" TEXT,
    "materialType" TEXT,
    "speed" TEXT,
    "tunnelTemp" TEXT,
    "coilDisposition" TEXT,
    "orientationDisplacement" TEXT,
    "generalObservations" TEXT,
    "technicalNotes" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientSheet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "silcar"."ClientSheetBody" (
    "id" SERIAL NOT NULL,
    "sheetId" INTEGER NOT NULL,
    "bodyOrder" INTEGER NOT NULL,
    "colorName" TEXT NOT NULL,
    "inkReference" TEXT,
    "brandOrCode" TEXT,
    "specificParams" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientSheetBody_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClientSheet_clientId_fkey') THEN
    ALTER TABLE "silcar"."ClientSheet" ADD CONSTRAINT "ClientSheet_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "silcar"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClientSheet_createdById_fkey') THEN
    ALTER TABLE "silcar"."ClientSheet" ADD CONSTRAINT "ClientSheet_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "silcar"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClientSheet_updatedById_fkey') THEN
    ALTER TABLE "silcar"."ClientSheet" ADD CONSTRAINT "ClientSheet_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "silcar"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClientSheetBody_sheetId_fkey') THEN
    ALTER TABLE "silcar"."ClientSheetBody" ADD CONSTRAINT "ClientSheetBody_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "silcar"."ClientSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "ClientSheet_clientId_idx" ON "silcar"."ClientSheet"("clientId");
CREATE INDEX IF NOT EXISTS "ClientSheet_archived_idx" ON "silcar"."ClientSheet"("archived");
CREATE INDEX IF NOT EXISTS "ClientSheetBody_sheetId_bodyOrder_idx" ON "silcar"."ClientSheetBody"("sheetId", "bodyOrder");
