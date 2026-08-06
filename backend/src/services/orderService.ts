import prisma from '../lib/prisma';
import { getCurrentUsdExchangeRate, parseExchangeRate } from './exchangeRateService';

type ActorContext = {
  userId?: number;
  role?: string;
  machineId?: number;
};

const parseSafeInt = (val: any) => {
  const parsed = parseInt(val);
  return isNaN(parsed) ? null : parsed;
};

const parseSafeFloat = (val: any) => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? null : parsed;
};

const normalizeQtyText = (val: any) => {
  if (val === undefined || val === null) return null;
  const text = String(val).trim();
  return text.length > 0 ? text : null;
};

const appendUniqueText = (current: string | null | undefined, next: string | null | undefined) => {
  const cleanNext = normalizeQtyText(next);
  if (!cleanNext) return current || null;

  const parts = String(current || '')
    .split(' / ')
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.includes(cleanNext)) parts.push(cleanNext);
  return parts.join(' / ');
};

const normalizeRole = (role?: string) => (role || 'ADMIN').toUpperCase();

const ensureAdmin = (actor?: ActorContext) => {
  if (normalizeRole(actor?.role) !== 'ADMIN') {
    throw new Error('Solo administracion puede modificar la base de la orden');
  }
};

const ensureProductionActor = (actor?: ActorContext) => {
  const role = normalizeRole(actor?.role);
  if (role !== 'ADMIN' && role !== 'MACHINE') {
    throw new Error('Solo administracion o planta puede avanzar una orden');
  }
};

const PROCESS_TYPE_LABELS: Record<string, string> = {
  IMPRESION: 'Impresion',
  LAMINACION: 'Laminacion',
  REFILADO: 'Refilado',
  CONFECCION: 'Confeccion'
};

const PROCESS_APPROVAL_FIELDS: Record<string, string> = {
  IMPRESION: 'approvedPrinting',
  LAMINACION: 'approvedLamination',
  REFILADO: 'approvedRefilado',
  CONFECCION: 'approvedConfeccion'
};

const CONSUMPTION_TYPE_TO_PROCESS_TYPE: Record<string, string> = {
  PRINTING: 'IMPRESION',
  LAMINATION: 'LAMINACION'
};

const TRANSACTION_OPTIONS = {
  maxWait: 10000,
  timeout: 30000
};

const getLatestProcessByType = (processes: any[] = [], type: string) =>
  processes
    .filter((process) => process.type === type && process.status !== 'Planificada')
    .sort((a, b) => new Date(b.updatedAt || b.endTime || b.startTime || 0).getTime() - new Date(a.updatedAt || a.endTime || a.startTime || 0).getTime())[0];

const enrichOrderOperationalState = (order: any) => {
  const processes = Array.isArray(order?.processes) ? order.processes : [];
  const plannedTypes = new Set(processes.map((process: any) => process.type));
  const latestPrinting = getLatestProcessByType(processes, 'IMPRESION');
  const latestLamination = getLatestProcessByType(processes, 'LAMINACION');
  const latestRefilado = getLatestProcessByType(processes, 'REFILADO');
  const latestConfeccion = getLatestProcessByType(processes, 'CONFECCION');

  let operationalStatus = 'PLANIFICADA';
  let currentStage: string | null = null;

  if (order.status === 'Entregadas') {
    operationalStatus = 'ENTREGADA';
  } else if (order.status === 'Finalizadas') {
    operationalStatus = 'FINALIZADA';
  } else if (order.approvedConfeccion) {
    operationalStatus = 'PENDIENTE_CONTROL';
    currentStage = 'CONFECCION';
  } else if (latestConfeccion) {
    currentStage = 'CONFECCION';
    operationalStatus = latestConfeccion.status === 'finalizado' ? 'CONFECCION_COMPLETA' : 'EN_CONFECCION';
  } else if (order.approvedRefilado) {
    operationalStatus = plannedTypes.has('CONFECCION') ? 'PENDIENTE_CONFECCION' : 'PENDIENTE_CONTROL';
    currentStage = plannedTypes.has('CONFECCION') ? 'CONFECCION' : 'REFILADO';
  } else if (latestRefilado) {
    currentStage = 'REFILADO';
    operationalStatus = latestRefilado.status === 'finalizado' ? 'REFILADO_COMPLETO' : 'EN_REFILADO';
  } else if (order.approvedLamination) {
    if (plannedTypes.has('REFILADO')) {
      operationalStatus = 'PENDIENTE_REFILADO';
      currentStage = 'REFILADO';
    } else if (plannedTypes.has('CONFECCION')) {
      operationalStatus = 'PENDIENTE_CONFECCION';
      currentStage = 'CONFECCION';
    } else {
      operationalStatus = 'PENDIENTE_CONTROL';
      currentStage = 'LAMINACION';
    }
  } else if (latestLamination) {
    currentStage = 'LAMINACION';
    operationalStatus = latestLamination.status === 'finalizado' ? 'LAMINACION_COMPLETA' : 'EN_LAMINACION';
  } else if (order.approvedPrinting) {
    if (plannedTypes.has('LAMINACION')) {
      operationalStatus = 'PENDIENTE_LAMINACION';
      currentStage = 'LAMINACION';
    } else if (plannedTypes.has('REFILADO')) {
      operationalStatus = 'PENDIENTE_REFILADO';
      currentStage = 'REFILADO';
    } else if (plannedTypes.has('CONFECCION')) {
      operationalStatus = 'PENDIENTE_CONFECCION';
      currentStage = 'CONFECCION';
    } else {
      operationalStatus = 'PENDIENTE_CONTROL';
      currentStage = 'IMPRESION';
    }
  } else if (latestPrinting) {
    currentStage = 'IMPRESION';
    operationalStatus = latestPrinting.status === 'finalizado' ? 'IMPRESION_COMPLETA' : 'EN_IMPRESION';
  } else if (plannedTypes.has('IMPRESION')) {
    operationalStatus = 'PENDIENTE_IMPRESION';
    currentStage = 'IMPRESION';
  } else if (plannedTypes.has('LAMINACION')) {
    operationalStatus = 'PENDIENTE_LAMINACION';
    currentStage = 'LAMINACION';
  } else if (plannedTypes.has('REFILADO')) {
    operationalStatus = 'PENDIENTE_REFILADO';
    currentStage = 'REFILADO';
  } else if (plannedTypes.has('CONFECCION')) {
    operationalStatus = 'PENDIENTE_CONFECCION';
    currentStage = 'CONFECCION';
  }

  return {
    ...order,
    currentStage,
    currentStageLabel: currentStage ? PROCESS_TYPE_LABELS[currentStage] || currentStage : null,
    operationalStatus
  };
};

export const createOrder = async (orderData: any, actor?: ActorContext) => {
  ensureAdmin(actor);

  const { 
    orderNumber, 
    clientId, 
    productId, 
    plannedQty, 
    unit, 
    creatorId,
    operatorIds,
    technicalSpec,
    colorOrders,
    products,
    machineIds,
    deliveryDate,
    specifications,
    observations,
    classification,
    workType,
    hasSample,
    estimatedBagQty
  } = orderData;

  const finalCreatorId = creatorId ? parseInt(creatorId) : 1;
  const firstProduct = products && products.length > 0 ? products[0] : { productId, plannedQty };
  const finalProductId = parseSafeInt(firstProduct?.productId ?? productId);
  const finalPlannedQty = normalizeQtyText(firstProduct?.plannedQty ?? plannedQty);

  return await prisma.$transaction(async (tx) => {
    // 1. Create the base order
    const order = await tx.productionOrder.create({
      data: {
        orderNumber,
        clientId: parseInt(clientId),
        productId: finalProductId,
        classification,
        workType,
        hasSample: Boolean(hasSample),
        estimatedBagQty: parseSafeInt(estimatedBagQty),
        plannedQty: finalPlannedQty,
        unit,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(),
        creatorId: finalCreatorId,
        machineId: (machineIds && machineIds.length > 0) ? parseInt(machineIds[0]) : null,
        operatorsText: orderData.operatorsText,
        status: 'Órdenes por realizar',
        specifications,
        observations
      }
    });

    // 1.1 Create OrderProduct records
    if (products && Array.isArray(products)) {
      for (const prod of products) {
        if (!prod.productId) continue;
        await tx.orderProduct.create({
          data: {
            orderId: order.id,
            productId: parseInt(prod.productId),
            plannedQty: String(prod.plannedQty)
          }
        });
      }
    } else if (finalProductId) {
      await tx.orderProduct.create({
        data: {
          orderId: order.id,
          productId: finalProductId,
          plannedQty: finalPlannedQty || ""
        }
      });
    }

    // 2. Associate operators if provided
    if (operatorIds && Array.isArray(operatorIds)) {
      for (const opId of operatorIds) {
        await tx.orderOperator.create({
          data: {
            orderId: order.id,
            operatorId: parseInt(opId)
          }
        });
      }
    }

    // 2.5 Associate machines as planned processes
    if (machineIds && Array.isArray(machineIds)) {
      for (const mId of machineIds) {
        const machine = await tx.machine.findUnique({ where: { id: parseInt(mId) } });
        if (machine) {
          await tx.productionProcess.create({
            data: {
              orderId: order.id,
              type: machine.type,
              status: 'Planificada',
              machineId: machine.id
            }
          });
        }
      }
    }

    // 3. Record stock movement (As 'RESERVA' or just audit)
    const qtyNum = parseSafeFloat(finalPlannedQty?.replace(/[^0-9.]/g, '')) || 0;
    if (finalProductId && qtyNum > 0) {
      await tx.stockMovement.create({
        data: {
          type: 'EGRESO',
          itemType: 'PRODUCTO',
          productId: finalProductId,
          qty: qtyNum,
          unit: unit || 'UN',
          sign: 0, 
          orderId: order.id,
          observations: `Reserva para orden ${orderNumber}`
        }
      });
    }

    // 4. Create the technical specification linked to the order
    if (technicalSpec) {
      await tx.technicalSpec.create({
        data: {
          orderId: order.id,
          materialMeasure: technicalSpec.materialMeasure,
          cut: technicalSpec.cut,
          lamina: technicalSpec.lamina,
          meters: parseSafeFloat(technicalSpec.meters),
          tube: technicalSpec.tube,
          colorCount: parseSafeInt(technicalSpec.colorCount),
          pie: technicalSpec.pie,
          designName: technicalSpec.designName,
          cabeza: technicalSpec.cabeza,
          printingType: technicalSpec.printingType,
          tacaRight: technicalSpec.tacaRight,
          tacaLeft: technicalSpec.tacaLeft,
          clisheAlignment: technicalSpec.clisheAlignment,
          techObservations: technicalSpec.techObservations,
          refiladoExitSense: technicalSpec.refiladoExitSense,
          refiladoDePie: Boolean(technicalSpec.refiladoDePie),
          refiladoDeCabeza: Boolean(technicalSpec.refiladoDeCabeza),
          refiladoTacaRight: technicalSpec.refiladoTacaRight,
          refiladoTacaLeft: technicalSpec.refiladoTacaLeft,
          refiladoAnchoEspira: parseSafeFloat(technicalSpec.refiladoAnchoEspira),
          refiladoCoilDiameter: parseSafeFloat(technicalSpec.refiladoCoilDiameter),
          refiladoMeters: parseSafeFloat(technicalSpec.refiladoMeters),
        }
      });
    }

    // 5. Create color sequence
    if (colorOrders && Array.isArray(colorOrders)) {
      for (const color of colorOrders) {
        await tx.colorOrder.create({
          data: {
            orderId: order.id,
            sequence: parseSafeInt(color.sequence) || 0,
            colorName: color.colorName,
            lotNumber: color.lotNumber,
            formula: color.formula,
            supplyId: parseSafeInt(color.supplyId ?? color.insumoId),
            changesToConsider: color.changesToConsider,
          }
        });
      }
    }

    return order;
  }, TRANSACTION_OPTIONS);
};

const buildMonthRange = (month?: string) => {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return null;

  const [yearText, monthText] = month.split('-');
  const year = parseInt(yearText, 10);
  const monthIndex = parseInt(monthText, 10) - 1;

  if (Number.isNaN(year) || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return null;
  }

  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 1);
  return { start, end };
};

export const getAllOrders = async (machineId?: number, month?: string) => {
  const where: any = {};
  const monthRange = buildMonthRange(month);
  
  if (machineId) {
    // If filtered by machine, show orders created ON that machine 
    // OR orders that have a process on that machine
    where.OR = [
      { machineId },
      { processes: { some: { machineId } } }
    ];
  }

  if (monthRange) {
    where.createdAt = {
      gte: monthRange.start,
      lt: monthRange.end
    };
  }

  const orders = await prisma.productionOrder.findMany({
    where,
    include: {
      client: true,
      product: true,
      products: { include: { product: true } },
      technicalSpec: true,
      colorOrders: true,
      consumptions: { include: { supply: true } },
      machine: true,
      processes: true,
      operators: {
        include: {
          operator: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return orders.map(enrichOrderOperationalState);
};

export const getOrderById = async (id: number) => {
  const order = await prisma.productionOrder.findUnique({
    where: { id },
    include: {
      client: true,
      product: true,
      products: { include: { product: true } },
      technicalSpec: true,
      colorOrders: true,
      consumptions: { include: { supply: true } },
      machine: true,
      operators: {
        include: {
          operator: true
        }
      },
      checklists: {
        include: {
          items: true,
          operator: true
        }
      },
      qualityControls: true,
      finalInspections: {
        include: {
          inspectorUser: true
        },
        orderBy: {
          date: 'desc'
        }
      },
      processes: {
        include: {
          machine: true,
          operator: true,
          printingData: true,
          laminationData: true,
          refiladoData: { include: { outputBobbins: true } },
          confeccionData: { include: { outputs: true } },
          materialLots: true,
          scrapEntries: {
            orderBy: {
              createdAt: 'asc'
            }
          },
          timeLogs: {
            include: {
              operator: true
            },
            orderBy: {
              startTime: 'asc'
            }
          }
        }
      },
    }
  });

  return order ? enrichOrderOperationalState(order) : null;
};

export const createProcess = async (processData: any) => {
  const { 
    orderId, 
    type, 
    machineId, 
    operatorId, 
    startTime, 
    endTime, 
    scrapKg, 
    observations,
    specificData 
  } = processData;

  return await prisma.$transaction(async (tx) => {
    const order = await tx.productionOrder.findUnique({
      where: { id: parseInt(orderId) },
      include: { products: true }
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    const existingInProgress = await tx.productionProcess.findFirst({
      where: {
        orderId: parseInt(orderId),
        type,
        status: 'en_proceso'
      },
      orderBy: { id: 'desc' }
    });

    const hasScrapEntriesPayload = type === 'REFILADO' && Array.isArray(specificData?.scrapEntries);
    const scrapEntries = hasScrapEntriesPayload
      ? specificData.scrapEntries
          .map((entry: any) => ({
            kg: parseSafeFloat(entry.kg) || 0,
            description: normalizeQtyText(entry.description)
          }))
          .filter((entry: any) => entry.kg > 0)
      : [];
    const scrapKgFromEntries = scrapEntries.reduce((acc: number, entry: any) => acc + entry.kg, 0);

    const processPayload = {
      machineId: machineId ? parseInt(machineId) : existingInProgress?.machineId ?? null,
      operatorId: operatorId ? parseInt(operatorId) : existingInProgress?.operatorId ?? null,
      endTime: endTime ? new Date(endTime) : existingInProgress?.endTime ?? null,
      scrapKg: hasScrapEntriesPayload ? scrapKgFromEntries : (scrapKg ? parseFloat(scrapKg) : existingInProgress?.scrapKg ?? 0),
      observations: observations ?? existingInProgress?.observations ?? null,
    };
    const previousScrapKg = existingInProgress?.scrapKg || 0;
    const nextScrapKg = Number(processPayload.scrapKg) || 0;
    const scrapDeltaKg = Math.max(0, nextScrapKg - previousScrapKg);

    const process = existingInProgress
      ? await tx.productionProcess.update({
          where: { id: existingInProgress.id },
          data: {
            ...processPayload,
            status: endTime ? 'finalizado' : existingInProgress.status
          }
        })
      : await tx.productionProcess.create({
          data: {
            orderId: parseInt(orderId),
            type,
            status: endTime ? 'finalizado' : 'en_proceso',
            machineId: machineId ? parseInt(machineId) : null,
            operatorId: operatorId ? parseInt(operatorId) : null,
            startTime: startTime ? new Date(startTime) : new Date(),
            endTime: endTime ? new Date(endTime) : null,
            scrapKg: scrapKg ? parseFloat(scrapKg) : 0,
            observations,
          }
        });

    if (order.status !== 'Finalizadas' && order.status !== 'Entregadas') {
      await tx.productionOrder.update({
        where: { id: order.id },
        data: { status: 'En proceso' }
      });
    }

    // Save bobbins/lots used by the operator in any plant stage.
    if (processData.materialLots && Array.isArray(processData.materialLots)) {
      for (const lot of processData.materialLots) {
        const initial = parseFloat(lot.initialMeters) || 0;
        const added = parseFloat(lot.addedMeters) || 0;
        const final = parseFloat(lot.finalMeters) || 0;
        const totalUsed = initial + added - final;

        await tx.materialLot.create({
          data: {
            processId: process.id,
            lotNumber: lot.lotNumber,
            kg: parseFloat(lot.kg) || 0,
            initialMeters: initial,
            addedMeters: added,
            finalMeters: final,
            totalUsedMeters: totalUsed > 0 ? totalUsed : 0,
            observations: lot.observations
          }
        });

        // Discount from stock if material is identifiable
        // Since we don't have a direct supplyId for the lot yet, 
        // we record a movement linked to the order's product or material.
        await tx.stockMovement.create({
          data: {
            type: 'EGRESO',
            itemType: 'MATERIAL',
            productId: order.productId,
            qty: totalUsed > 0 ? totalUsed : 0,
            unit: 'Metros',
            sign: -1,
            orderId: order.id,
            observations: `Consumo real lote ${lot.lotNumber} en etapa ${type}`
          }
        });
      }
    }

    const fallbackProductId = order.productId ?? order.products?.[0]?.productId ?? null;

    // Discount scrap from stock only when the order is linked to a real product
    if (scrapDeltaKg > 0 && fallbackProductId) {
      await tx.currentStock.updateMany({
        where: { productId: fallbackProductId },
        data: {
          stockActual: { decrement: scrapDeltaKg },
          lastUpdate: new Date()
        }
      });

      await tx.stockMovement.create({
        data: {
          type: 'EGRESO',
          itemType: 'PRODUCTO',
          productId: fallbackProductId,
          qty: scrapDeltaKg,
          unit: 'KG',
          sign: -1,
          orderId: order.id,
          observations: `Scrap detectado en etapa ${type}`
        }
      });
    }

    if (type === 'IMPRESION' && specificData) {
      await tx.processPrinting.upsert({
        where: { processId: process.id },
        update: {
          exitSense: specificData.exitSense,
          coilDiameter: specificData.coilDiameter ? parseFloat(specificData.coilDiameter) : null,
          processedMeters: specificData.processedMeters ? parseFloat(specificData.processedMeters) : null,
          coilCount: specificData.coilCount ? parseInt(specificData.coilCount) : null,
        },
        create: {
          processId: process.id,
          exitSense: specificData.exitSense,
          coilDiameter: specificData.coilDiameter ? parseFloat(specificData.coilDiameter) : null,
          processedMeters: specificData.processedMeters ? parseFloat(specificData.processedMeters) : null,
          coilCount: specificData.coilCount ? parseInt(specificData.coilCount) : null,
        }
      });
    } else if (type === 'LAMINACION' && specificData) {
      await tx.processLamination.upsert({
        where: { processId: process.id },
        update: {
          mixProportion: specificData.mixProportion,
          processedMeters: specificData.processedMeters ? parseFloat(specificData.processedMeters) : null,
        },
        create: {
          processId: process.id,
          mixProportion: specificData.mixProportion,
          processedMeters: specificData.processedMeters ? parseFloat(specificData.processedMeters) : null,
        }
      });
    } else if (type === 'REFILADO' && specificData) {
      const refiladoPayload = {
        exitSense: specificData.exitSense,
        tacaRight: specificData.tacaRight,
        tacaLeft: specificData.tacaLeft,
        dePie: typeof specificData.dePie === 'boolean' ? specificData.dePie : null,
        deCabeza: typeof specificData.deCabeza === 'boolean' ? specificData.deCabeza : null,
        deTripa: typeof specificData.deTripa === 'boolean' ? specificData.deTripa : undefined,
        anchoEspira: specificData.anchoEspira ? parseFloat(specificData.anchoEspira) : null,
        coilDiameter: specificData.coilDiameter ? parseFloat(specificData.coilDiameter) : null,
        processedMeters: specificData.processedMeters ? parseFloat(specificData.processedMeters) : null,
        coilCount: specificData.coilCount ? parseInt(specificData.coilCount) : null,
        controlName: specificData.controlName,
        tacaDerIzq: specificData.tacaDerIzq,
        finalAnchoEspira: specificData.finalAnchoEspira ? parseFloat(specificData.finalAnchoEspira) : null,
        finalExitSense: specificData.finalExitSense,
        bobbinCountName: specificData.bobbinCountName,
      };

      const refilado = await tx.processRefilado.upsert({
        where: { processId: process.id },
        update: refiladoPayload,
        create: {
          processId: process.id,
          ...refiladoPayload,
        }
      });

      if (hasScrapEntriesPayload) {
        await tx.processScrapEntry.deleteMany({ where: { processId: process.id } });

        for (const entry of scrapEntries) {
          await tx.processScrapEntry.create({
            data: {
              processId: process.id,
              kg: entry.kg,
              description: entry.description
            }
          });
        }
      }

      const outputBobbins = Array.isArray(specificData.outputBobbins) ? specificData.outputBobbins : [];
      if (outputBobbins.length > 0) {
        await tx.refiladoOutputBobbin.deleteMany({ where: { refiladoId: refilado.id } });
      }

      for (const bobbin of outputBobbins) {
        const kg = parseFloat(bobbin.kg);
        if (!bobbin.label || isNaN(kg)) continue;

        await tx.refiladoOutputBobbin.create({
          data: {
            refiladoId: refilado.id,
            label: bobbin.label,
            productName: bobbin.productName || null,
            kg,
            notes: bobbin.notes || null
          }
        });
      }
    } else if (type === 'CONFECCION' && specificData) {
      const confeccion = await tx.processConfeccion.upsert({
        where: { processId: process.id },
        update: {},
        create: {
          processId: process.id
        }
      });

      const outputs = Array.isArray(specificData.outputs) ? specificData.outputs : [];
      if (outputs.length > 0) {
        await tx.processConfeccionOutput.deleteMany({ where: { confeccionId: confeccion.id } });
      }

      for (const output of outputs) {
        const bagQty = parseSafeInt(output.bagQty) || 0;
        const productName = normalizeQtyText(output.productName);
        if (!productName || bagQty <= 0) continue;

        await tx.processConfeccionOutput.create({
          data: {
            confeccionId: confeccion.id,
            productId: parseSafeInt(output.productId),
            productName,
            bagQty,
            notes: output.notes || null
          }
        });
      }
    }

    return process;
  }, TRANSACTION_OPTIONS);
};

const getOrderedPlannedStages = (processes: any[] = []) => {
  const plannedTypes = new Set(processes.map((process: any) => process.type));
  return ['IMPRESION', 'LAMINACION', 'REFILADO', 'CONFECCION'].filter((stage) => plannedTypes.has(stage));
};

const isStageComplete = (order: any, stage: string) => {
  const approvalField = PROCESS_APPROVAL_FIELDS[stage];
  const latest = getLatestProcessByType(order.processes || [], stage);
  return Boolean(order?.[approvalField]) || latest?.status === 'finalizado';
};

const arePlannedStagesComplete = (order: any) => {
  const plannedStages = getOrderedPlannedStages(order.processes || []);
  if (plannedStages.length === 0) return false;
  return plannedStages.every((stage) => isStageComplete(order, stage));
};

export const updateStageAction = async (orderId: number, data: any, actor?: ActorContext) => {
  ensureProductionActor(actor);

  const stage = String(data.stage || data.type || '').toUpperCase();
  const action = String(data.action || '').toUpperCase();

  if (!PROCESS_APPROVAL_FIELDS[stage]) {
    throw new Error('Etapa invalida');
  }

  if (!['START', 'FINISH'].includes(action)) {
    throw new Error('Accion de etapa invalida');
  }

  return await prisma.$transaction(async (tx) => {
    const order = await tx.productionOrder.findUnique({
      where: { id: orderId },
      include: { processes: true }
    });

    if (!order) throw new Error('Orden no encontrada');
    if (order.status === 'Finalizadas' || order.status === 'Entregadas') {
      throw new Error('La orden ya fue cerrada');
    }

    const plannedProcess = order.processes.find((process: any) => process.type === stage && process.status === 'Planificada');
    const latestInProgress = order.processes
      .filter((process: any) => process.type === stage && process.status === 'en_proceso')
      .sort((a: any, b: any) => (b.startTime?.getTime?.() || 0) - (a.startTime?.getTime?.() || 0))[0];

    if (action === 'START') {
      if (latestInProgress) {
        return latestInProgress;
      }

      const process = await tx.productionProcess.create({
        data: {
          orderId,
          type: stage,
          status: 'en_proceso',
          machineId: parseSafeInt(data.machineId) ?? actor?.machineId ?? plannedProcess?.machineId ?? null,
          operatorId: parseSafeInt(data.operatorId),
          startTime: new Date(),
          scrapKg: 0,
          observations: data.observations || `Inicio de ${PROCESS_TYPE_LABELS[stage]}`
        }
      });

      await tx.productionOrder.update({
        where: { id: orderId },
        data: { status: 'En proceso' }
      });

      return process;
    }

    if (!latestInProgress) {
      throw new Error(`Primero inicia ${PROCESS_TYPE_LABELS[stage]} antes de marcarla terminada`);
    }

    const process = await tx.productionProcess.update({
      where: { id: latestInProgress.id },
      data: {
        status: 'finalizado',
        endTime: new Date(),
        observations: data.observations || latestInProgress.observations
      }
    });

    await tx.productionOrder.update({
      where: { id: orderId },
      data: {
        [PROCESS_APPROVAL_FIELDS[stage]]: true,
        status: 'En proceso'
      }
    });

    return process;
  }, TRANSACTION_OPTIONS);
};

export const getDashboardStats = async (machineId?: number) => {
  const whereOrder: any = {};
  const whereProcess: any = {};
  
  if (machineId) {
    whereOrder.processes = { some: { machineId } };
    whereProcess.machineId = machineId;
  }

  const [
    openOrders, 
    finishedOrders, 
    pendingControl, 
    pendingExport,
    stockItems,
    allProcesses,
    recentOrders
  ] = await Promise.all([
    prisma.productionOrder.count({ where: { ...whereOrder, status: 'Órdenes por realizar' } }),
    prisma.productionOrder.count({ where: { ...whereOrder, status: 'Finalizadas' } }),
    prisma.productionOrder.count({ where: { ...whereOrder, status: 'En proceso' } }),
    prisma.stockMovement.count({ where: { exported: false } }),
    prisma.currentStock.findMany(),
    prisma.productionProcess.findMany({ 
      where: whereProcess,
      include: {
        materialLots: true,
        printingData: true,
        laminationData: true,
        refiladoData: { include: { outputBobbins: true } }
      }
    }),
    prisma.productionOrder.findMany({
      where: whereOrder,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { client: true, product: true }
    })
  ]);

  const availableStock = stockItems.reduce((acc, item) => acc + item.stockActual, 0);
  const lowStockAlerts = stockItems.filter(item => item.stockActual < (item.minStock || 100)).length;
  
  let totalProcessedMeters = 0;
  let totalScrapKg = 0;

  allProcesses.forEach(p => {
    totalScrapKg += p.scrapKg || 0;
    
    // Sum from material lots if they exist (Printing/Lamination)
    if (p.materialLots && p.materialLots.length > 0) {
      totalProcessedMeters += p.materialLots.reduce((acc, lot) => acc + (lot.totalUsedMeters || 0), 0);
    } else {
      // Fallback to specific stage data
      if (p.type === 'IMPRESION') totalProcessedMeters += p.printingData?.processedMeters || 0;
      else if (p.type === 'LAMINACION') totalProcessedMeters += p.laminationData?.processedMeters || 0;
      else if (p.type === 'REFILADO') totalProcessedMeters += p.refiladoData?.processedMeters || 0;
    }
  });

  return {
    stats: {
      openOrders,
      finishedOrders,
      pendingControl,
      pendingExport,
      availableStock,
      lowStockAlerts,
      totalProcessedMeters,
      totalScrapKg
    },
    recentOrders
  };
};



export const getCostStats = async () => {
  const orders = await prisma.productionOrder.findMany({
    where: { 
      consumptions: { some: {} } 
    },
    include: {
      consumptions: { include: { supply: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  const stats = orders.map(o => {
    let plannedKg = 0;
    let realKg = 0;
    
    o.consumptions.forEach(c => {
      plannedKg += c.plannedQty || 0;
      realKg += c.realQty || 0;
    });

    const totalCostUsd = o.consumptions.reduce((acc, c: any) => {
      const unitPrice = c.unitPrice ?? c.supply?.price;
      const subtotal = c.calculatedCost ?? (unitPrice ? (c.realQty || 0) * unitPrice : 0);
      return acc + (subtotal || 0);
    }, 0);

    const totalCostArs = o.consumptions.reduce((acc, c: any) => {
      const unitPrice = c.unitPrice ?? c.supply?.price;
      const subtotalUsd = c.calculatedCost ?? (unitPrice ? (c.realQty || 0) * unitPrice : 0);
      const subtotalArs = c.calculatedCostArs ?? (c.exchangeRate && subtotalUsd ? subtotalUsd * c.exchangeRate : 0);
      return acc + (subtotalArs || 0);
    }, 0);

    return {
      orderNumber: o.orderNumber,
      status: o.status,
      date: o.date,
      plannedKg,
      realKg,
      totalCostUsd,
      totalCostArs,
      difference: realKg - plannedKg,
      differencePercent: plannedKg > 0 ? ((realKg - plannedKg) / plannedKg) * 100 : 0
    };
  });

  return stats;
};

export const finalizeOrder = async (id: number, actor?: ActorContext) => {
  ensureProductionActor(actor);

  return await prisma.$transaction(async (tx) => {
    const order = await tx.productionOrder.findUnique({
      where: { id },
      include: { processes: true, products: true }
    });

    if (!order) throw new Error("Orden no encontrada");
    if (order.status === 'Entregadas') throw new Error('La orden ya fue entregada');
    if (order.status === 'Finalizadas') return order;

    if (normalizeRole(actor?.role) === 'MACHINE' && !arePlannedStagesComplete(order)) {
      throw new Error('Para marcar producto terminado, primero deben completarse todas las etapas planificadas');
    }

    // Update order status
    const updatedOrder = await tx.productionOrder.update({
      where: { id },
      data: { status: 'Finalizadas', closedAt: new Date() }
    });

    const fallbackProductId = order.productId ?? order.products?.[0]?.productId ?? null;
    const fallbackPlannedQty = order.plannedQty ?? order.products?.[0]?.plannedQty ?? null;

    // Calculate total produced (could be plannedQty or based on last stage)
    const qtyProduced = parseSafeFloat(fallbackPlannedQty?.replace(/[^0-9.]/g, '')) || 0;

    if (fallbackProductId && qtyProduced > 0) {
      // Increase product stock
      await tx.currentStock.upsert({
        where: { productId: fallbackProductId },
      update: {
        stockActual: { increment: qtyProduced },
        lastUpdate: new Date()
      },
      create: {
        productId: fallbackProductId,
        stockActual: qtyProduced,
        itemType: 'PRODUCTO',
        unit: order.unit,
        lastUpdate: new Date()
      }
    });

      // Record stock movement
      await tx.stockMovement.create({
        data: {
          type: 'INGRESO',
          itemType: 'PRODUCTO',
          productId: fallbackProductId,
          qty: qtyProduced,
          unit: order.unit,
          sign: 1,
          orderId: order.id,
          observations: `Producción finalizada de orden ${order.orderNumber}`
        }
      });
    }

    return updatedOrder;
  }, TRANSACTION_OPTIONS);
};

export const deleteOrder = async (id: number, actor?: ActorContext) => {
  ensureAdmin(actor);

  return await prisma.productionOrder.delete({
    where: { id }
  });
};

export const exportOrdersCSV = async (machineId?: number, month?: string) => {
  const where: any = {};
  const monthRange = buildMonthRange(month);

  if (machineId) {
    where.OR = [
      { machineId },
      { processes: { some: { machineId } } }
    ];
  }

  if (monthRange) {
    where.createdAt = {
      gte: monthRange.start,
      lt: monthRange.end
    };
  }

  const orders = await prisma.productionOrder.findMany({
    where,
    include: {
      client: true,
      product: true,
      technicalSpec: true,
      colorOrders: { orderBy: { sequence: 'asc' } },
      consumptions: { include: { supply: true } },
      machine: true,
      processes: {
        include: {
          machine: true,
          operator: true,
          materialLots: true,
          printingData: true,
          laminationData: true,
          refiladoData: { include: { outputBobbins: true } },
          confeccionData: { include: { outputs: true } },
          scrapEntries: {
            orderBy: {
              createdAt: 'asc'
            }
          },
          timeLogs: {
            include: {
              operator: true
            },
            orderBy: {
              startTime: 'asc'
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const header = [
    'Orden N°',
    'Fecha',
    'Estado',
    'Máquina Creación',
    'Operadores de Turno',
    'Cliente Cod.',
    'Cliente Nombre',
    'Producto Cod.',
    'Producto Nombre',
    'Producto Cant. Usada (Metros)',
    'Cant. Planificada',
    'Unidad',
    'Medida Material',
    'Corte',
    'Lámina / Material',
    'Metros Previstos',
    'Tipo Tubo',
    'Pie',
    'Cant. Colores',
    'Tipo Impresión',
    'Códigos Insumos',
    'Cantidades Insumos',
    'Costo Insumos USD',
    'Costo Insumos ARS',
    'Lotes Insumos',
    'Refiladora - Sentido Salida Admin',
    'Refiladora - De Pie Admin',
    'Refiladora - De Cabeza Admin',
    'Refiladora - Taca Derecha Admin',
    'Refiladora - Taca Izquierda Admin',
    'Refiladora - Ancho Espira Admin',
    'Refiladora - Diametro Admin',
    'Refiladora - Metros Admin',
    'Etapa Impresión - Máquina',
    'Etapa Impresión - Operario',
    'Etapa Impresión - Metros',
    'Etapa Impresión - Scrap (Kg)',
    'Etapa Impresión - Lotes',
    'Etapa Impresión - Tiempos',
    'Etapa Impresión - Total Horas',
    'Etapa Laminación - Máquina',
    'Etapa Laminación - Operario',
    'Etapa Laminación - Metros',
    'Etapa Laminación - Scrap (Kg)',
    'Etapa Laminación - Lotes',
    'Etapa Laminación - Tiempos',
    'Etapa Laminación - Total Horas',
    'Etapa Refilado - Máquina',
    'Etapa Refilado - Operario',
    'Etapa Refilado - Metros',
    'Etapa Refilado - Scrap (Kg)',
    'Etapa Refilado - Scrap Detalle',
    'Etapa Refilado - Tiempos',
    'Etapa Refilado - Total Horas',
    'Etapa Refilado - Bobinas Salida',
    'Etapa Refilado - Sentido Salida Cliente',
    'Etapa Refilado - Taca Derecha',
    'Etapa Refilado - Taca Izquierda',
    'Etapa Refilado - De Pie',
    'Etapa Refilado - De Cabeza',
    'Etapa Refilado - Ancho Espira',
    'Etapa Refilado - Diametro Bobinas CMM',
    'Etapa Refilado - Cantidad Bobinas',
    'Etapa Refilado - Nombre Control',
    'Etapa Refilado - Taca Der-Izq',
    'Etapa Refilado - Ancho Espira Salida',
    'Etapa Refilado - Sentido Salida Final',
    'Etapa Refilado - Nombre',
    'Etapa Confeccion - Máquina',
    'Etapa Confeccion - Operario',
    'Etapa Confeccion - Tiempos',
    'Etapa Confeccion - Total Horas',
    'Etapa Confeccion - Productos/Bolsas'
  ].join(';');

  const rows = orders.map(o => {
    const impresion = o.processes.find((p: any) => p.type === 'IMPRESION');
    const laminacion = o.processes.find((p: any) => p.type === 'LAMINACION');
    const refilado = o.processes.find((p: any) => p.type === 'REFILADO');
    const confeccion = o.processes.find((p: any) => p.type === 'CONFECCION');

    const formatLots = (proc: any) => {
      if (!proc?.materialLots || proc.materialLots.length === 0) return '-';
      return proc.materialLots.map((l: any) => `Lote:${l.lotNumber} ${l.totalUsedMeters}m`).join(', ');
    };

    const padTime = (value: number) => String(value).padStart(2, '0');
    const formatLogDate = (value: any) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) return '-';
      return `${padTime(date.getUTCDate())}/${padTime(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
    };
    const formatLogTime = (value: any) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) return '-';
      return `${padTime(date.getUTCHours())}:${padTime(date.getUTCMinutes())}`;
    };
    const getDurationMinutes = (log: any) => {
      const start = new Date(log.startTime).getTime();
      const end = new Date(log.endTime).getTime();
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
      return Math.round((end - start) / 60000);
    };
    const formatTimeLogs = (proc: any) => {
      if (!proc?.timeLogs || proc.timeLogs.length === 0) return '-';
      return proc.timeLogs.map((log: any) => {
        const operator = log.operator ? `${log.operator.firstName} ${log.operator.lastName}` : 'Sin operario';
        const duration = (getDurationMinutes(log) / 60).toFixed(2);
        return `${formatLogDate(log.date)} ${formatLogTime(log.startTime)}-${formatLogTime(log.endTime)} ${duration}h ${operator} ${log.description || ''}`.trim();
      }).join(' | ');
    };
    const formatTotalHours = (proc: any) => {
      if (!proc?.timeLogs || proc.timeLogs.length === 0) return '-';
      const minutes = proc.timeLogs.reduce((acc: number, log: any) => acc + getDurationMinutes(log), 0);
      return (minutes / 60).toFixed(2);
    };

    let productoCantidadUsada = 0;
    if (impresion?.materialLots?.length > 0) {
        productoCantidadUsada = impresion.materialLots.reduce((acc: number, l: any) => acc + (l.totalUsedMeters || 0), 0);
    } else if (laminacion?.materialLots?.length > 0) {
        productoCantidadUsada = laminacion.materialLots.reduce((acc: number, l: any) => acc + (l.totalUsedMeters || 0), 0);
    } else if (refilado?.materialLots?.length > 0) {
        productoCantidadUsada = refilado.materialLots.reduce((acc: number, l: any) => acc + (l.totalUsedMeters || 0), 0);
    }

    const consumos = o.consumptions || [];
    const codigosInsumos = consumos.map((c: any) => c.supply?.code || c.supply?.name || '-').join(' / ');
    const cantidadesInsumos = consumos.map((c: any) => `${c.realQty}${c.unit}`).join(' / ');
    const lotesInsumos = consumos.map((c: any) => c.lotNumber ? `${c.supply?.code || c.supply?.name || 'Insumo'}:${c.lotNumber}` : null).filter(Boolean).join(' / ');
    const scrapDetalleRefilado = refilado?.scrapEntries?.length
      ? refilado.scrapEntries.map((entry: any) => `${entry.description || 'Scrap'}:${entry.kg}kg`).join(' / ')
      : '-';
    const bobinasSalidaRefilado = refilado?.refiladoData?.outputBobbins?.length
      ? refilado.refiladoData.outputBobbins.map((bobbin: any) => `${bobbin.label} ${bobbin.productName || '-'} ${bobbin.kg}kg`).join(' / ')
      : '-';
    const bolsasConfeccion = confeccion?.confeccionData?.outputs?.length
      ? confeccion.confeccionData.outputs.map((output: any) => `${output.productName}:${output.bagQty} bolsas`).join(' / ')
      : '-';
    const costoInsumosUsd = consumos.reduce((acc: number, c: any) => {
      const unitPrice = c.unitPrice ?? c.supply?.price;
      const subtotal = c.calculatedCost ?? (unitPrice ? (c.realQty || 0) * unitPrice : 0);
      return acc + (subtotal || 0);
    }, 0);
    const costoInsumosArs = consumos.reduce((acc: number, c: any) => {
      const unitPrice = c.unitPrice ?? c.supply?.price;
      const subtotalUsd = c.calculatedCost ?? (unitPrice ? (c.realQty || 0) * unitPrice : 0);
      const subtotalArs = c.calculatedCostArs ?? (c.exchangeRate && subtotalUsd ? subtotalUsd * c.exchangeRate : 0);
      return acc + (subtotalArs || 0);
    }, 0);

    return [
      o.orderNumber,
      o.createdAt.toLocaleDateString(),
      o.status,
      o.machine?.name || 'Administración',
      o.operatorsText || '',
      o.client?.code || '',
      o.client?.name || '',
      o.product?.code || '',
      o.product?.name || '',
      productoCantidadUsada > 0 ? productoCantidadUsada : '-',
      o.plannedQty,
      o.unit,
      o.technicalSpec?.materialMeasure || '',
      o.technicalSpec?.cut || '',
      o.technicalSpec?.lamina || '',
      o.technicalSpec?.meters || '',
      o.technicalSpec?.tube || '',
      o.technicalSpec?.pie || '',
      o.technicalSpec?.colorCount || '',
      o.technicalSpec?.printingType || '',
      codigosInsumos || '-',
      cantidadesInsumos || '-',
      costoInsumosUsd || '-',
      costoInsumosArs || '-',
      lotesInsumos || '-',
      o.technicalSpec?.refiladoExitSense || '-',
      o.technicalSpec ? (o.technicalSpec.refiladoDePie ? 'Si' : 'No') : '-',
      o.technicalSpec ? (o.technicalSpec.refiladoDeCabeza ? 'Si' : 'No') : '-',
      o.technicalSpec?.refiladoTacaRight || '-',
      o.technicalSpec?.refiladoTacaLeft || '-',
      o.technicalSpec?.refiladoAnchoEspira ?? '-',
      o.technicalSpec?.refiladoCoilDiameter ?? '-',
      o.technicalSpec?.refiladoMeters ?? '-',
      impresion?.machine?.name || '-',
      impresion?.operator ? `${impresion.operator.firstName} ${impresion.operator.lastName}` : '-',
      impresion?.printingData?.processedMeters || '-',
      impresion?.scrapKg ?? '-',
      formatLots(impresion),
      formatTimeLogs(impresion),
      formatTotalHours(impresion),
      laminacion?.machine?.name || '-',
      laminacion?.operator ? `${laminacion.operator.firstName} ${laminacion.operator.lastName}` : '-',
      laminacion?.laminationData?.processedMeters || '-',
      laminacion?.scrapKg ?? '-',
      formatLots(laminacion),
      formatTimeLogs(laminacion),
      formatTotalHours(laminacion),
      refilado?.machine?.name || '-',
      refilado?.operator ? `${refilado.operator.firstName} ${refilado.operator.lastName}` : '-',
      refilado?.refiladoData?.processedMeters || '-',
      refilado?.scrapKg ?? '-',
      scrapDetalleRefilado,
      formatTimeLogs(refilado),
      formatTotalHours(refilado),
      bobinasSalidaRefilado,
      refilado?.refiladoData?.exitSense || '-',
      refilado?.refiladoData?.tacaRight || '-',
      refilado?.refiladoData?.tacaLeft || '-',
      refilado?.refiladoData ? (refilado.refiladoData.dePie ? 'Si' : 'No') : '-',
      refilado?.refiladoData ? (refilado.refiladoData.deCabeza ? 'Si' : 'No') : '-',
      refilado?.refiladoData?.anchoEspira ?? '-',
      refilado?.refiladoData?.coilDiameter ?? '-',
      refilado?.refiladoData?.coilCount ?? '-',
      refilado?.refiladoData?.controlName || '-',
      refilado?.refiladoData?.tacaDerIzq || '-',
      refilado?.refiladoData?.finalAnchoEspira ?? '-',
      refilado?.refiladoData?.finalExitSense || '-',
      refilado?.refiladoData?.bobbinCountName || '-',
      confeccion?.machine?.name || '-',
      confeccion?.operator ? `${confeccion.operator.firstName} ${confeccion.operator.lastName}` : '-',
      formatTimeLogs(confeccion),
      formatTotalHours(confeccion),
      bolsasConfeccion
    ].map(val => `"${val}"`).join(';');
  });

  return [header, ...rows].join('\n');
};

const cleanPalmField = (value: any) => String(value ?? '').replace(/,/g, ' ').replace(/\r?\n/g, ' ').trim();

const formatPalmDate = (dateValue?: Date | string | null) => {
  const date = dateValue ? new Date(dateValue) : new Date();
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

const parsePalmQty = (value: any) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).replace(',', '.').replace(/[^0-9.-]/g, '');
  if (!normalized) return null;
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
};

const formatPalmNumber = (value: number) => {
  if (!Number.isFinite(value)) return '0';
  const fixed = Number.isInteger(value) ? value.toString() : value.toFixed(3);
  return fixed.replace(/\.?0+$/, '');
};

const getAlegonExportOrders = async (month?: string) => {
  const where: any = {};
  const monthRange = buildMonthRange(month);

  if (monthRange) {
    where.createdAt = {
      gte: monthRange.start,
      lt: monthRange.end
    };
  }

  return await prisma.productionOrder.findMany({
    where,
    include: {
      client: true,
      product: true,
      products: { include: { product: true } },
      consumptions: { include: { supply: true } },
      result: true
    },
    orderBy: { createdAt: 'asc' }
  });
};

export const exportAlegonFacturaPalm = async (month?: string) => {
  const orders = await getAlegonExportOrders(month);

  return orders.map((order: any) => [
    'NOTP',
    formatPalmDate(order.date || order.createdAt),
    '0',
    cleanPalmField(order.orderNumber),
    cleanPalmField(order.client?.code),
    '0',
    '0',
    '0'
  ].join(',')).join('\n');
};

export const exportAlegonDetallePalm = async (month?: string) => {
  const orders = await getAlegonExportOrders(month);
  const rows: string[] = [];

  for (const order of orders as any[]) {
    const orderNumber = cleanPalmField(order.orderNumber);
    const productLines = order.products?.length
      ? order.products.map((item: any) => ({
          code: item.product?.code,
          qty: parsePalmQty(item.plannedQty)
        }))
      : [{
          code: order.product?.code,
          qty: order.result?.producedQty ? parsePalmQty(order.result.producedQty) : parsePalmQty(order.plannedQty)
        }];

    productLines.forEach((item: any) => {
      if (!item.code || item.qty === null || item.qty === 0) return;
      rows.push([
        'P',
        orderNumber,
        cleanPalmField(item.code),
        formatPalmNumber(Math.abs(item.qty)),
        '0',
        '21',
        '1',
        '0'
      ].join(','));
    });

    order.consumptions?.forEach((consumption: any) => {
      const realQty = parsePalmQty(consumption.realQty);
      const code = consumption.supply?.code;
      if (!code || realQty === null || realQty === 0) return;

      // Consumed supplies decrease stock in Alegon, returns increase it.
      rows.push([
        'P',
        orderNumber,
        cleanPalmField(code),
        formatPalmNumber(-realQty),
        '0',
        '21',
        '1',
        '0'
      ].join(','));
    });
  }

  return rows.join('\n');
};

export const updateOrder = async (id: number, orderData: any, actor?: ActorContext) => {
  ensureAdmin(actor);

  const { 
    orderNumber, clientId, productId, plannedQty, unit, products,
    machineIds, operatorsText, technicalSpec, colorOrders,
    classification, workType, hasSample, estimatedBagQty,
    specifications, observations
  } = orderData;

  return await prisma.$transaction(async (tx) => {
    const hasProductsPayload = Array.isArray(products) && products.length > 0;
    const shouldTouchPrimaryProduct = products !== undefined || productId !== undefined || plannedQty !== undefined;
    const firstProduct = hasProductsPayload ? products[0] : { productId, plannedQty };
    const finalProductId = shouldTouchPrimaryProduct ? parseSafeInt(firstProduct?.productId ?? productId) : undefined;
    const finalPlannedQty = shouldTouchPrimaryProduct ? normalizeQtyText(firstProduct?.plannedQty ?? plannedQty) : undefined;

    const dataToUpdate: any = {};
    if (orderNumber !== undefined) dataToUpdate.orderNumber = orderNumber;
    if (clientId !== undefined) dataToUpdate.clientId = parseInt(clientId);
    if (finalProductId !== undefined) dataToUpdate.productId = finalProductId;
    if (finalPlannedQty !== undefined) dataToUpdate.plannedQty = finalPlannedQty;
    if (unit !== undefined) dataToUpdate.unit = unit;
    if (classification !== undefined) dataToUpdate.classification = classification;
    if (workType !== undefined) dataToUpdate.workType = workType;
    if (hasSample !== undefined) dataToUpdate.hasSample = Boolean(hasSample);
    if (estimatedBagQty !== undefined) dataToUpdate.estimatedBagQty = parseSafeInt(estimatedBagQty);
    if (machineIds !== undefined) dataToUpdate.machineId = (machineIds && machineIds.length > 0) ? parseInt(machineIds[0]) : null;
    if (operatorsText !== undefined) dataToUpdate.operatorsText = operatorsText;
    if (specifications !== undefined) dataToUpdate.specifications = specifications;
    if (observations !== undefined) dataToUpdate.observations = observations;
    if (orderData.approvedPrinting !== undefined) dataToUpdate.approvedPrinting = orderData.approvedPrinting;
    if (orderData.approvedLamination !== undefined) dataToUpdate.approvedLamination = orderData.approvedLamination;
    if (orderData.approvedRefilado !== undefined) dataToUpdate.approvedRefilado = orderData.approvedRefilado;
    if (orderData.approvedConfeccion !== undefined) dataToUpdate.approvedConfeccion = orderData.approvedConfeccion;

      const order = await tx.productionOrder.update({
        where: { id },
        data: dataToUpdate
      });

    if (products && Array.isArray(products)) {
      await tx.orderProduct.deleteMany({ where: { orderId: id } });
      for (const productRow of products) {
        if (!productRow.productId) continue;
        await tx.orderProduct.create({
          data: {
            orderId: id,
            productId: parseInt(productRow.productId),
            plannedQty: String(productRow.plannedQty)
          }
        });
      }
    }

    if (technicalSpec) {
      await tx.technicalSpec.upsert({
        where: { orderId: id },
        update: {
          materialMeasure: technicalSpec.materialMeasure,
          cut: technicalSpec.cut,
          lamina: technicalSpec.lamina,
          meters: parseSafeFloat(technicalSpec.meters),
          tube: technicalSpec.tube,
          colorCount: parseSafeInt(technicalSpec.colorCount),
          pie: technicalSpec.pie,
          designName: technicalSpec.designName,
          cabeza: technicalSpec.cabeza,
          printingType: technicalSpec.printingType,
          tacaRight: technicalSpec.tacaRight,
          tacaLeft: technicalSpec.tacaLeft,
          clisheAlignment: technicalSpec.clisheAlignment,
          techObservations: technicalSpec.techObservations,
          refiladoExitSense: technicalSpec.refiladoExitSense,
          refiladoDePie: Boolean(technicalSpec.refiladoDePie),
          refiladoDeCabeza: Boolean(technicalSpec.refiladoDeCabeza),
          refiladoTacaRight: technicalSpec.refiladoTacaRight,
          refiladoTacaLeft: technicalSpec.refiladoTacaLeft,
          refiladoAnchoEspira: parseSafeFloat(technicalSpec.refiladoAnchoEspira),
          refiladoCoilDiameter: parseSafeFloat(technicalSpec.refiladoCoilDiameter),
          refiladoMeters: parseSafeFloat(technicalSpec.refiladoMeters),
        },
        create: {
          orderId: id,
          materialMeasure: technicalSpec.materialMeasure,
          cut: technicalSpec.cut,
          lamina: technicalSpec.lamina,
          meters: parseSafeFloat(technicalSpec.meters),
          tube: technicalSpec.tube,
          colorCount: parseSafeInt(technicalSpec.colorCount),
          pie: technicalSpec.pie,
          designName: technicalSpec.designName,
          cabeza: technicalSpec.cabeza,
          printingType: technicalSpec.printingType,
          tacaRight: technicalSpec.tacaRight,
          tacaLeft: technicalSpec.tacaLeft,
          clisheAlignment: technicalSpec.clisheAlignment,
          techObservations: technicalSpec.techObservations,
          refiladoExitSense: technicalSpec.refiladoExitSense,
          refiladoDePie: Boolean(technicalSpec.refiladoDePie),
          refiladoDeCabeza: Boolean(technicalSpec.refiladoDeCabeza),
          refiladoTacaRight: technicalSpec.refiladoTacaRight,
          refiladoTacaLeft: technicalSpec.refiladoTacaLeft,
          refiladoAnchoEspira: parseSafeFloat(technicalSpec.refiladoAnchoEspira),
          refiladoCoilDiameter: parseSafeFloat(technicalSpec.refiladoCoilDiameter),
          refiladoMeters: parseSafeFloat(technicalSpec.refiladoMeters),
        }
      });
    }

    if (colorOrders && Array.isArray(colorOrders)) {
      await tx.colorOrder.deleteMany({ where: { orderId: id } });
      for (const color of colorOrders) {
        await tx.colorOrder.create({
          data: {
            orderId: id,
            sequence: parseSafeInt(color.sequence) || 0,
            colorName: color.colorName,
            lotNumber: color.lotNumber,
            formula: color.formula,
            supplyId: parseSafeInt(color.supplyId ?? color.insumoId),
          }
        });
      }
    }

    if (machineIds && Array.isArray(machineIds)) {
      // Remove previous planned processes for this order to recreate them
      await tx.productionProcess.deleteMany({
        where: { orderId: id, status: 'Planificada' }
      });
      for (const mId of machineIds) {
        const machine = await tx.machine.findUnique({ where: { id: parseInt(mId) } });
        if (machine) {
          await tx.productionProcess.create({
            data: {
              orderId: id,
              type: machine.type,
              status: 'Planificada',
              machineId: machine.id
            }
          });
        }
      }
    }

    return order;
  }, TRANSACTION_OPTIONS);
};

export const changeStatus = async (id: number, newStatus: string, actor?: ActorContext) => {
  ensureAdmin(actor);

  const validStatuses = ['Órdenes por realizar', 'En proceso', 'Finalizadas', 'Entregadas'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Estado inválido: ${newStatus}`);
  }

  const order = await prisma.productionOrder.findUnique({ where: { id } });
  if (!order) throw new Error('Orden no encontrada');

  if (newStatus === 'Entregadas' && order.status !== 'Finalizadas') {
    throw new Error('Solo se puede marcar como Entregada una orden Finalizada');
  }

  return await prisma.$transaction(async (tx) => {
    if (newStatus === 'Entregadas') {
      const orderWithProducts = await tx.productionOrder.findUnique({
        where: { id },
        include: { products: true }
      });

      const fallbackProductId = orderWithProducts?.productId ?? orderWithProducts?.products?.[0]?.productId ?? null;
      const fallbackPlannedQty = orderWithProducts?.plannedQty ?? orderWithProducts?.products?.[0]?.plannedQty ?? null;
      const qtyDelivered = parseSafeFloat(fallbackPlannedQty?.replace(/[^0-9.]/g, '')) || 0;

      if (fallbackProductId && qtyDelivered > 0) {
        await tx.currentStock.upsert({
          where: { productId: fallbackProductId },
          update: {
            stockActual: { decrement: qtyDelivered },
            lastUpdate: new Date(),
            updateSource: `Entrega orden ${order.orderNumber}`
          },
          create: {
            productId: fallbackProductId,
            stockActual: -qtyDelivered,
            itemType: 'PRODUCTO',
            unit: order.unit,
            lastUpdate: new Date(),
            updateSource: `Entrega orden ${order.orderNumber}`
          }
        });

        await tx.stockMovement.create({
          data: {
            type: 'EGRESO',
            itemType: 'PRODUCTO',
            productId: fallbackProductId,
            qty: qtyDelivered,
            unit: order.unit,
            sign: -1,
            orderId: order.id,
            observations: `Producto entregado de orden ${order.orderNumber}`
          }
        });
      }
    }

    return await tx.productionOrder.update({
      where: { id },
      data: { status: newStatus }
    });
  }, TRANSACTION_OPTIONS);
};

// ---- Checklist CRUD ----
export const getChecklists = async (orderId: number) => {
  return await prisma.processChecklist.findMany({
    where: { orderId },
    include: { items: true, operator: true },
    orderBy: { date: 'desc' }
  });
};

export const saveChecklist = async (data: any) => {
  const { orderId, stage, operatorId, items } = data;
  const parsedOrderId = parseInt(orderId);
  let finalOperatorId = operatorId ? parseInt(operatorId) : null;

  if (!finalOperatorId) {
    const existingOrderOperator = await prisma.orderOperator.findFirst({
      where: { orderId: parsedOrderId },
      orderBy: { id: 'asc' }
    });

    if (existingOrderOperator?.operatorId) {
      finalOperatorId = existingOrderOperator.operatorId;
    }
  }

  if (!finalOperatorId) {
    const fallbackOperator = await prisma.operator.findFirst({
      orderBy: { id: 'asc' }
    });

    if (fallbackOperator?.id) {
      finalOperatorId = fallbackOperator.id;
    }
  }

  if (!finalOperatorId) {
    throw new Error('No hay un operador disponible para asociar al checklist');
  }

  const existing = await prisma.processChecklist.findFirst({
    where: { orderId: parsedOrderId, stage }
  });

  if (existing) {
    await prisma.processChecklistItem.deleteMany({ where: { checklistId: existing.id } });
    await prisma.processChecklist.delete({ where: { id: existing.id } });
  }

  return await prisma.processChecklist.create({
    data: {
      orderId: parsedOrderId,
      stage,
      operatorId: finalOperatorId,
      items: {
        create: items.map((item: any) => ({
          time: item.time,
          controlName: item.controlName,
          checked: item.checked || false,
          value: item.value || null
        }))
      }
    },
    include: { items: true }
  });
};

// ---- Quality Control CRUD ----
export const getQualityControls = async (orderId: number) => {
  return await prisma.qualityControl.findMany({
    where: { orderId },
    orderBy: { date: 'desc' }
  });
};

export const saveQualityControl = async (data: any, actor?: ActorContext) => {
  ensureAdmin(actor);

  const { orderId, stage, controlData } = data;

  const existing = await prisma.qualityControl.findFirst({
    where: { orderId: parseInt(orderId), stage }
  });

  if (existing) {
    return await prisma.qualityControl.update({
      where: { id: existing.id },
      data: { data: JSON.stringify(controlData), date: new Date() }
    });
  }

  return await prisma.qualityControl.create({
    data: {
      orderId: parseInt(orderId),
      stage,
      data: JSON.stringify(controlData)
    }
  });
};

export const getProcessTimeLogs = async (orderId: number, stage?: string) => {
  return await prisma.processTimeLog.findMany({
    where: {
      process: {
        orderId,
        ...(stage ? { type: stage } : {})
      }
    },
    include: {
      operator: true,
      process: {
        include: {
          machine: true
        }
      }
    },
    orderBy: {
      startTime: 'asc'
    }
  });
};

export const saveProcessTimeLog = async (data: any) => {
  const { orderId, stage, operatorId, description, date, startTime, endTime } = data;

  if (!orderId || !stage || !startTime || !endTime) {
    throw new Error('Faltan datos obligatorios para registrar tiempos');
  }

  const process = await prisma.productionProcess.findFirst({
    where: { orderId: parseInt(orderId), type: stage, status: { not: 'Planificada' } },
    orderBy: { id: 'desc' }
  });

  if (!process) {
    throw new Error('Primero debes registrar la etapa antes de cargar tiempos');
  }

  const [startHours = '0', startMinutes = '0'] = String(startTime).split(':');
  const [endHours = '0', endMinutes = '0'] = String(endTime).split(':');
  const baseDate = date ? new Date(date) : new Date();
  const startDateTime = new Date(baseDate);
  startDateTime.setHours(parseInt(startHours, 10), parseInt(startMinutes, 10), 0, 0);
  const endDateTime = new Date(baseDate);
  endDateTime.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10), 0, 0);

  if (endDateTime <= startDateTime) {
    throw new Error('La hora de fin debe ser mayor a la hora de inicio');
  }

  return await prisma.processTimeLog.create({
    data: {
      processId: process.id,
      operatorId: operatorId ? parseInt(operatorId) : null,
      date: baseDate,
      description,
      startTime: startDateTime,
      endTime: endDateTime
    },
    include: {
      operator: true
    }
  });
};

export const getFinalInspections = async (orderId: number) => {
  return await prisma.finalInspection.findMany({
    where: { orderId },
    include: {
      inspectorUser: true
    },
    orderBy: {
      date: 'desc'
    }
  });
};

export const saveFinalInspection = async (data: any, actor?: ActorContext) => {
  ensureAdmin(actor);

  const { orderId, inspectorName, textOk, cutOk, toneOk, materialWidthOk, observations, productNameObserved, signatureName, signedOff } = data;

  return await prisma.finalInspection.create({
    data: {
      orderId: parseInt(orderId),
      inspectorUserId: actor?.userId || null,
      inspectorName,
      textOk: Boolean(textOk),
      cutOk: Boolean(cutOk),
      toneOk: Boolean(toneOk),
      materialWidthOk: Boolean(materialWidthOk),
      observations,
      productNameObserved,
      signatureName,
      signedOff: Boolean(signedOff)
    },
    include: {
      inspectorUser: true
    }
  });
};

export const registerConsumptions = async (orderId: number, data: any) => {
  const { type, realMeters } = data;
  const consumptions = Array.isArray(data?.consumptions) ? data.consumptions : [];
  const postedExchangeRate = parseExchangeRate(data?.exchangeRate);
  const exchangeRateResult = postedExchangeRate
    ? { rate: postedExchangeRate }
    : await getCurrentUsdExchangeRate();
  const exchangeRate = exchangeRateResult.rate;
  
  return await prisma.$transaction(async (tx) => {
    // 1. Save general consumptions and deduct stock
    for (const cons of consumptions) {
      if (!cons.supplyId) {
        // Try to find supplyId by name if missing (common for colors)
        if (cons.colorName) {
          const supply = await tx.supply.findFirst({ where: { name: cons.colorName } });
          if (supply) {
            cons.supplyId = supply.id;
          }
        }
      }

      if (!cons.supplyId) {
        continue;
      }

      if (cons.supplyId) {
        const supplyId = parseInt(cons.supplyId);
        if (isNaN(supplyId)) continue;

        const realQty = parseFloat(cons.realQty) || 0;
        const stockQty = type === 'PRINTING' ? realQty : Math.max(0, realQty);
        const supply = await tx.supply.findUnique({ where: { id: supplyId } });
        const unitPrice = supply?.price ?? null;
        const calculatedCost = unitPrice !== null ? realQty * unitPrice : null;
        const calculatedCostArs = calculatedCost !== null && exchangeRate ? calculatedCost * exchangeRate : null;

        // Upsert Consumption record
        const existingCons = await tx.consumption.findFirst({
          where: { orderId, supplyId }
        });

        if (existingCons) {
          await tx.consumption.update({
            where: { id: existingCons.id },
            data: {
              realQty: (existingCons.realQty || 0) + realQty,
              lotNumber: appendUniqueText(existingCons.lotNumber, cons.lotNumber),
              unitPrice: unitPrice ?? existingCons.unitPrice,
              calculatedCost: calculatedCost !== null ? (existingCons.calculatedCost || 0) + calculatedCost : existingCons.calculatedCost,
              exchangeRate: exchangeRate ?? existingCons.exchangeRate,
              calculatedCostArs: calculatedCostArs !== null ? (existingCons.calculatedCostArs || 0) + calculatedCostArs : existingCons.calculatedCostArs,
              observations: cons.loads ? `Cargas: ${cons.loads} | Sobrante: ${cons.endValue}` : undefined
            }
          });
        } else {
          await tx.consumption.create({
            data: {
              orderId,
              supplyId,
              lotNumber: cons.lotNumber || null,
              plannedQty: cons.plannedQty ? parseFloat(cons.plannedQty) : 0,
              realQty,
              unit: cons.unit || 'kg',
              type: type,
              unitPrice,
              calculatedCost,
              exchangeRate,
              calculatedCostArs,
              observations: cons.loads ? `Cargas: ${cons.loads} | Sobrante: ${cons.endValue}` : undefined
            }
          });
        }

        // Deduct from Stock
        const currentStock = await tx.currentStock.findUnique({
          where: { supplyId }
        });

        if (currentStock && stockQty !== 0) {
          const isReturn = stockQty < 0;

          await tx.currentStock.update({
            where: { id: currentStock.id },
            data: {
              stockActual: currentStock.stockActual - stockQty,
              lastUpdate: new Date(),
              updateSource: `${isReturn ? 'Devolucion' : 'Consumo'} Orden #${orderId}`
            }
          });

          // Create StockMovement
          await tx.stockMovement.create({
            data: {
              type: isReturn ? 'Devolucion Produccion' : 'Consumo Produccion',
              source: `Orden #${orderId}`,
              orderId,
              itemType: 'supply',
              supplyId,
              qty: Math.abs(stockQty),
              unit: cons.unit || 'kg',
              sign: isReturn ? 1 : -1,
              observations: isReturn
                ? `Sobrante devuelto por operarios de ${type}`
                : `Consumo reportado por operarios de ${type}`,
              pendingExport: true,
              exported: false
            }
          });
        }
      }
    }

    // 2. Optionally update real meters on the latest process of that stage
    if (realMeters) {
        const processType = CONSUMPTION_TYPE_TO_PROCESS_TYPE[type];
        const process = processType
          ? await tx.productionProcess.findFirst({
              where: { orderId, type: processType },
              orderBy: { id: 'desc' }
            })
          : null;
        
        if (process) {
            if (type === 'PRINTING') {
                const printData = await tx.processPrinting.findUnique({ where: { processId: process.id } });
                if (printData) {
                    await tx.processPrinting.update({
                        where: { processId: process.id },
                        data: { processedMeters: parseFloat(realMeters) }
                    });
                }
            } else if (type === 'LAMINATION') {
                const lamData = await tx.processLamination.findUnique({ where: { processId: process.id } });
                if (lamData) {
                    await tx.processLamination.update({
                        where: { processId: process.id },
                        data: { processedMeters: parseFloat(realMeters) }
                    });
                }
            }
        }
    }

    return { success: true, message: 'Consumos registrados y stock actualizado' };
  }, TRANSACTION_OPTIONS);
};
