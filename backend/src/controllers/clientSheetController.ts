import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const TRANSACTION_OPTIONS = {
  maxWait: 15000,
  timeout: 20000
};

// Resumen de clientes con conteo de hojas e indicador de sin hojas
export const getClientsSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        sheets: {
          where: { archived: false },
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            name: true,
            productReference: true,
            updatedAt: true,
            createdAt: true
          }
        }
      }
    });

    const summary = clients.map((c: any) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      sheetsCount: c.sheets.length,
      hasSheets: c.sheets.length > 0,
      latestSheetUpdate: c.sheets[0]?.updatedAt || null,
      sheets: c.sheets
    }));

    res.json(summary);
  } catch (error: any) {
    console.error('Error fetching clients summary:', error);
    res.status(500).json({ error: 'Error al obtener resumen de clientes' });
  }
};

// Listado de hojas con filtros y búsqueda
export const getClientSheets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientId, search, includeArchived } = req.query;

    const where: any = {};

    if (clientId) {
      const parsedClientId = parseInt(String(clientId));
      if (!isNaN(parsedClientId)) {
        where.clientId = parsedClientId;
      }
    }

    if (includeArchived !== 'true') {
      where.archived = false;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const query = search.trim();
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { productReference: { contains: query, mode: 'insensitive' } },
        { materialType: { contains: query, mode: 'insensitive' } },
        { cylinderSize: { contains: query, mode: 'insensitive' } },
        { client: { name: { contains: query, mode: 'insensitive' } } },
        { client: { code: { contains: query, mode: 'insensitive' } } }
      ];
    }

    const sheets = await prisma.clientSheet.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        client: {
          select: { id: true, code: true, name: true }
        },
        bodies: {
          orderBy: { bodyOrder: 'asc' }
        },
        creator: {
          select: { id: true, username: true, name: true }
        },
        updater: {
          select: { id: true, username: true, name: true }
        }
      }
    });

    res.json(sheets);
  } catch (error: any) {
    console.error('Error fetching client sheets:', error);
    res.status(500).json({ error: 'Error al obtener hojas de clientes' });
  }
};

// Detalle de una hoja técnica específica
export const getClientSheetById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de hoja técnica inválido' });
    }

    const sheet = await prisma.clientSheet.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, code: true, name: true }
        },
        bodies: {
          orderBy: { bodyOrder: 'asc' }
        },
        creator: {
          select: { id: true, username: true, name: true }
        },
        updater: {
          select: { id: true, username: true, name: true }
        }
      }
    });

    if (!sheet) {
      return res.status(404).json({ error: 'Hoja técnica no encontrada' });
    }

    res.json(sheet);
  } catch (error: any) {
    console.error('Error fetching client sheet by id:', error);
    res.status(500).json({ error: 'Error al obtener detalle de la hoja técnica' });
  }
};

// Crear nueva hoja técnica (con guardado transaccional atómico de cuerpos)
export const createClientSheet = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      clientId,
      name,
      productReference,
      cylinderSize,
      printingMeasure,
      materialType,
      speed,
      tunnelTemp,
      coilDisposition,
      orientationDisplacement,
      generalObservations,
      technicalNotes,
      bodies
    } = req.body;

    const parsedClientId = parseInt(String(clientId));
    if (isNaN(parsedClientId)) {
      return res.status(400).json({ error: 'Se requiere un cliente válido' });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre identificador de la hoja es obligatorio' });
    }

    // Validar que el cliente exista
    const clientExists = await prisma.client.findUnique({
      where: { id: parsedClientId }
    });

    if (!clientExists) {
      return res.status(404).json({ error: 'El cliente seleccionado no existe' });
    }

    const userId = req.user?.userId || null;

    // Guardado atómico con transacción rápida
    const createdId = await prisma.$transaction(async (tx: any) => {
      const sheet = await tx.clientSheet.create({
        data: {
          clientId: parsedClientId,
          name: name.trim(),
          productReference: productReference?.trim() || null,
          cylinderSize: cylinderSize?.trim() || null,
          printingMeasure: printingMeasure?.trim() || null,
          materialType: materialType?.trim() || null,
          speed: speed?.trim() || null,
          tunnelTemp: tunnelTemp?.trim() || null,
          coilDisposition: coilDisposition?.trim() || null,
          orientationDisplacement: orientationDisplacement?.trim() || null,
          generalObservations: generalObservations?.trim() || null,
          technicalNotes: technicalNotes?.trim() || null,
          createdById: userId,
          updatedById: userId
        }
      });

      if (Array.isArray(bodies) && bodies.length > 0) {
        const bodyInserts = bodies.map((b: any, index: number) => ({
          sheetId: sheet.id,
          bodyOrder: typeof b.bodyOrder === 'number' ? b.bodyOrder : index + 1,
          colorName: String(b.colorName || `Cuerpo ${index + 1}`).trim(),
          inkReference: b.inkReference ? String(b.inkReference).trim() : null,
          brandOrCode: b.brandOrCode ? String(b.brandOrCode).trim() : null,
          specificParams: b.specificParams ? String(b.specificParams).trim() : null,
          observations: b.observations ? String(b.observations).trim() : null
        }));

        await tx.clientSheetBody.createMany({
          data: bodyInserts
        });
      }

      return sheet.id;
    }, TRANSACTION_OPTIONS);

    // Lectura completa fuera de la transacción para máximo rendimiento
    const fullSheet = await prisma.clientSheet.findUnique({
      where: { id: createdId },
      include: {
        client: { select: { id: true, code: true, name: true } },
        bodies: { orderBy: { bodyOrder: 'asc' } },
        creator: { select: { id: true, username: true, name: true } },
        updater: { select: { id: true, username: true, name: true } }
      }
    });

    res.status(201).json(fullSheet);
  } catch (error: any) {
    console.error('Error creating client sheet:', error);
    res.status(500).json({ error: error.message || 'Error al guardar la hoja técnica' });
  }
};

// Editar hoja técnica existente (actualización atómica)
export const updateClientSheet = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de hoja técnica inválido' });
    }

    const {
      name,
      productReference,
      cylinderSize,
      printingMeasure,
      materialType,
      speed,
      tunnelTemp,
      coilDisposition,
      orientationDisplacement,
      generalObservations,
      technicalNotes,
      bodies
    } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre identificador de la hoja es obligatorio' });
    }

    const existingSheet = await prisma.clientSheet.findUnique({
      where: { id }
    });

    if (!existingSheet) {
      return res.status(404).json({ error: 'Hoja técnica no encontrada' });
    }

    const userId = req.user?.userId || null;

    // Actualización transaccional: actualiza cabecera y sincroniza cuerpos sin estados parciales
    await prisma.$transaction(async (tx: any) => {
      await tx.clientSheet.update({
        where: { id },
        data: {
          name: name.trim(),
          productReference: productReference?.trim() || null,
          cylinderSize: cylinderSize?.trim() || null,
          printingMeasure: printingMeasure?.trim() || null,
          materialType: materialType?.trim() || null,
          speed: speed?.trim() || null,
          tunnelTemp: tunnelTemp?.trim() || null,
          coilDisposition: coilDisposition?.trim() || null,
          orientationDisplacement: orientationDisplacement?.trim() || null,
          generalObservations: generalObservations?.trim() || null,
          technicalNotes: technicalNotes?.trim() || null,
          updatedById: userId
        }
      });

      // Reemplazo atómico de los cuerpos de impresión
      await tx.clientSheetBody.deleteMany({
        where: { sheetId: id }
      });

      if (Array.isArray(bodies) && bodies.length > 0) {
        const bodyInserts = bodies.map((b: any, index: number) => ({
          sheetId: id,
          bodyOrder: typeof b.bodyOrder === 'number' ? b.bodyOrder : index + 1,
          colorName: String(b.colorName || `Cuerpo ${index + 1}`).trim(),
          inkReference: b.inkReference ? String(b.inkReference).trim() : null,
          brandOrCode: b.brandOrCode ? String(b.brandOrCode).trim() : null,
          specificParams: b.specificParams ? String(b.specificParams).trim() : null,
          observations: b.observations ? String(b.observations).trim() : null
        }));

        await tx.clientSheetBody.createMany({
          data: bodyInserts
        });
      }
    }, TRANSACTION_OPTIONS);

    // Lectura completa fuera de la transacción
    const updated = await prisma.clientSheet.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, code: true, name: true } },
        bodies: { orderBy: { bodyOrder: 'asc' } },
        creator: { select: { id: true, username: true, name: true } },
        updater: { select: { id: true, username: true, name: true } }
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating client sheet:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar la hoja técnica' });
  }
};

// Duplicar hoja técnica existente como base para nueva configuración
export const duplicateClientSheet = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de hoja técnica inválido' });
    }

    const { targetName } = req.body;

    const source = await prisma.clientSheet.findUnique({
      where: { id },
      include: {
        bodies: { orderBy: { bodyOrder: 'asc' } }
      }
    });

    if (!source) {
      return res.status(404).json({ error: 'Hoja técnica a duplicar no encontrada' });
    }

    const newName = targetName && String(targetName).trim().length > 0
      ? String(targetName).trim()
      : `${source.name} (Copia)`;

    const userId = req.user?.userId || null;

    // Duplicación atómica
    const createdId = await prisma.$transaction(async (tx: any) => {
      const created = await tx.clientSheet.create({
        data: {
          clientId: source.clientId,
          name: newName,
          productReference: source.productReference,
          cylinderSize: source.cylinderSize,
          printingMeasure: source.printingMeasure,
          materialType: source.materialType,
          speed: source.speed,
          tunnelTemp: source.tunnelTemp,
          coilDisposition: source.coilDisposition,
          orientationDisplacement: source.orientationDisplacement,
          generalObservations: source.generalObservations,
          technicalNotes: source.technicalNotes,
          createdById: userId,
          updatedById: userId
        }
      });

      if (source.bodies && source.bodies.length > 0) {
        const bodyInserts = source.bodies.map((b: any) => ({
          sheetId: created.id,
          bodyOrder: b.bodyOrder,
          colorName: b.colorName,
          inkReference: b.inkReference,
          brandOrCode: b.brandOrCode,
          specificParams: b.specificParams,
          observations: b.observations
        }));

        await tx.clientSheetBody.createMany({
          data: bodyInserts
        });
      }

      return created.id;
    }, TRANSACTION_OPTIONS);

    const duplicated = await prisma.clientSheet.findUnique({
      where: { id: createdId },
      include: {
        client: { select: { id: true, code: true, name: true } },
        bodies: { orderBy: { bodyOrder: 'asc' } },
        creator: { select: { id: true, username: true, name: true } },
        updater: { select: { id: true, username: true, name: true } }
      }
    });

    res.status(201).json(duplicated);
  } catch (error: any) {
    console.error('Error duplicating client sheet:', error);
    res.status(500).json({ error: error.message || 'Error al duplicar la hoja técnica' });
  }
};

// Archivado lógico de una hoja técnica (conserva historial sin borrado accidental)
export const archiveClientSheet = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de hoja técnica inválido' });
    }

    const sheet = await prisma.clientSheet.findUnique({ where: { id } });
    if (!sheet) {
      return res.status(404).json({ error: 'Hoja técnica no encontrada' });
    }

    const userId = req.user?.userId || null;
    await prisma.clientSheet.update({
      where: { id },
      data: {
        archived: true,
        updatedById: userId
      }
    });

    res.json({ success: true, message: 'Hoja técnica archivada correctamente' });
  } catch (error: any) {
    console.error('Error archiving client sheet:', error);
    res.status(500).json({ error: 'Error al archivar la hoja técnica' });
  }
};

// Consulta de auditoría para hojas técnicas
export const getClientSheetAudit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await prisma.systemAuditLog.findMany({
      where: {
        entity: { in: ['ClientSheet', 'ClientSheetBody'] }
      },
      orderBy: { date: 'desc' },
      take: 200
    });

    res.json(logs);
  } catch (error: any) {
    console.error('Error fetching client sheet audit logs:', error);
    res.status(500).json({ error: 'Error al obtener auditoría de hojas técnicas' });
  }
};
