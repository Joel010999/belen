import prisma from '../lib/prisma';

const parseSafeInt = (val: any) => {
  const parsed = parseInt(val);
  return isNaN(parsed) ? null : parsed;
};

const parseSafeFloat = (val: any) => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? null : parsed;
};

export const createOrder = async (orderData: any) => {
  const { 
    orderNumber, 
    clientId, 
    productId, 
    plannedQty, 
    unit, 
    creatorId,
    machineId,
    operatorIds,
    technicalSpec,
    colorOrders,
    products,
    deliveryDate,
    specifications,
    observations
  } = orderData;

  const finalCreatorId = creatorId ? parseInt(creatorId) : 1;

  return await prisma.$transaction(async (tx) => {
    // Handle fallback if single product sent instead of array
    const firstProduct = products && products.length > 0 ? products[0] : { productId, plannedQty };
    const finalProductId = firstProduct?.productId ? parseInt(firstProduct.productId) : (productId ? parseInt(productId) : null);
    const finalPlannedQty = firstProduct?.plannedQty ? String(firstProduct.plannedQty) : (plannedQty ? String(plannedQty) : null);

    // 1. Create the base order
    const order = await tx.productionOrder.create({
      data: {
        orderNumber,
        clientId: parseInt(clientId),
        productId: finalProductId,
        plannedQty: finalPlannedQty,
        unit,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(),
        creatorId: finalCreatorId,
        machineId: machineId ? parseInt(machineId) : null,
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
          cliseCenter: technicalSpec.cliseCenter,
          cliseLeft: technicalSpec.cliseLeft,
          cliseRight: technicalSpec.cliseRight,
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
            formula: color.formula,
            supplyId: parseSafeInt(color.insumoId),
            changesToConsider: color.changesToConsider,
          }
        });
      }
    }

    return order;
  });
};

export const getAllOrders = async (machineId?: number) => {
  const where: any = {};
  
  if (machineId) {
    // If filtered by machine, show orders created ON that machine 
    // OR orders that have a process on that machine
    where.OR = [
      { machineId },
      { processes: { some: { machineId } } }
    ];
  }

  return await prisma.productionOrder.findMany({
    where,
    include: {
      client: true,
      product: true,
      products: { include: { product: true } },
      technicalSpec: true,
      colorOrders: true,
      machine: true,
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
};

export const getOrderById = async (id: number) => {
  return await prisma.productionOrder.findUnique({
    where: { id },
    include: {
      client: true,
      product: true,
      products: { include: { product: true } },
      technicalSpec: true,
      colorOrders: true,
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
      processes: {
        include: {
          machine: true,
          operator: true,
          printingData: true,
          laminationData: true,
          refiladoData: true,
          materialLots: true,
        }
      },
    }
  });
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
      where: { id: parseInt(orderId) }
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    const process = await tx.productionProcess.create({
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

    // Save Material Lots if provided (Printing and Lamination)
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

    // Discount scrap from stock
    if (scrapKg && parseFloat(scrapKg) > 0 && order) {
      await tx.currentStock.updateMany({
        where: { productId: order.productId },
        data: {
          stockActual: { decrement: parseFloat(scrapKg) },
          lastUpdate: new Date()
        }
      });

      await tx.stockMovement.create({
        data: {
          type: 'EGRESO',
          itemType: 'PRODUCTO',
          productId: order.productId,
          qty: parseFloat(scrapKg),
          unit: 'KG',
          sign: -1,
          orderId: order.id,
          observations: `Scrap detectado en etapa ${type}`
        }
      });
    }

    if (type === 'IMPRESION' && specificData) {
      await tx.processPrinting.create({
        data: {
          processId: process.id,
          exitSense: specificData.exitSense,
          coilDiameter: specificData.coilDiameter ? parseFloat(specificData.coilDiameter) : null,
          processedMeters: specificData.processedMeters ? parseFloat(specificData.processedMeters) : null,
          coilCount: specificData.coilCount ? parseInt(specificData.coilCount) : null,
        }
      });
    } else if (type === 'LAMINACION' && specificData) {
      await tx.processLamination.create({
        data: {
          processId: process.id,
          mixProportion: specificData.mixProportion,
          processedMeters: specificData.processedMeters ? parseFloat(specificData.processedMeters) : null,
        }
      });
    } else if (type === 'REFILADO' && specificData) {
      await tx.processRefilado.create({
        data: {
          processId: process.id,
          exitSense: specificData.exitSense,
          coilDiameter: specificData.coilDiameter ? parseFloat(specificData.coilDiameter) : null,
          processedMeters: specificData.processedMeters ? parseFloat(specificData.processedMeters) : null,
          coilCount: specificData.coilCount ? parseInt(specificData.coilCount) : null,
        }
      });
    }

    return process;
  });
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
        refiladoData: true
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



export const finalizeOrder = async (id: number) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.productionOrder.findUnique({
      where: { id },
      include: { processes: true }
    });

    if (!order) throw new Error("Orden no encontrada");

    // Update order status
    const updatedOrder = await tx.productionOrder.update({
      where: { id },
      data: { status: 'Finalizadas' }
    });

    // Calculate total produced (could be plannedQty or based on last stage)
    const qtyProduced = parseSafeFloat(order.plannedQty?.replace(/[^0-9.]/g, '')) || 0;

    if (order.productId && qtyProduced > 0) {
      // Increase product stock
      await tx.currentStock.upsert({
        where: { productId: order.productId },
      update: {
        stockActual: { increment: qtyProduced },
        lastUpdate: new Date()
      },
      create: {
        productId: order.productId,
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
          productId: order.productId,
          qty: qtyProduced,
          unit: order.unit,
          sign: 1,
          orderId: order.id,
          observations: `Producción finalizada de orden ${order.orderNumber}`
        }
      });
    }

    return updatedOrder;
  });
};

export const deleteOrder = async (id: number) => {
  return await prisma.productionOrder.delete({
    where: { id }
  });
};

export const exportOrdersCSV = async () => {
  const orders = await prisma.productionOrder.findMany({
    include: {
      client: true,
      product: true,
      technicalSpec: true,
      colorOrders: { orderBy: { sequence: 'asc' } },
      machine: true,
      processes: {
        include: {
          machine: true,
          operator: true,
          materialLots: true,
          printingData: true,
          laminationData: true,
          refiladoData: true
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
    'Clisé Izq.',
    'Clisé Centro',
    'Clisé Der.',
    'Secuencia de Colores',
    'Fórmulas de Colores',
    'Etapa Impresión - Máquina',
    'Etapa Impresión - Operario',
    'Etapa Impresión - Metros',
    'Etapa Impresión - Scrap (Kg)',
    'Etapa Impresión - Lotes',
    'Etapa Laminación - Máquina',
    'Etapa Laminación - Operario',
    'Etapa Laminación - Metros',
    'Etapa Laminación - Scrap (Kg)',
    'Etapa Laminación - Lotes',
    'Etapa Refilado - Máquina',
    'Etapa Refilado - Operario',
    'Etapa Refilado - Metros',
    'Etapa Refilado - Scrap (Kg)'
  ].join(';');

  const rows = orders.map(o => {
    const impresion = o.processes.find((p: any) => p.type === 'IMPRESION');
    const laminacion = o.processes.find((p: any) => p.type === 'LAMINACION');
    const refilado = o.processes.find((p: any) => p.type === 'REFILADO');

    const colorNames = o.colorOrders?.map((c: any) => `${c.sequence}°${c.colorName}`).join(', ') || '';
    const colorFormulas = o.colorOrders?.map((c: any) => `${c.sequence}°${c.formula || '-'}`).join(', ') || '';

    const formatLots = (proc: any) => {
      if (!proc?.materialLots || proc.materialLots.length === 0) return '-';
      return proc.materialLots.map((l: any) => `Lote:${l.lotNumber} ${l.totalUsedMeters}m`).join(', ');
    };

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
      o.technicalSpec?.cliseLeft || '',
      o.technicalSpec?.cliseCenter || '',
      o.technicalSpec?.cliseRight || '',
      colorNames,
      colorFormulas,
      impresion?.machine?.name || '-',
      impresion?.operator ? `${impresion.operator.firstName} ${impresion.operator.lastName}` : '-',
      impresion?.printingData?.processedMeters || '-',
      impresion?.scrapKg ?? '-',
      formatLots(impresion),
      laminacion?.machine?.name || '-',
      laminacion?.operator ? `${laminacion.operator.firstName} ${laminacion.operator.lastName}` : '-',
      laminacion?.laminationData?.processedMeters || '-',
      laminacion?.scrapKg ?? '-',
      formatLots(laminacion),
      refilado?.machine?.name || '-',
      refilado?.operator ? `${refilado.operator.firstName} ${refilado.operator.lastName}` : '-',
      refilado?.refiladoData?.processedMeters || '-',
      refilado?.scrapKg ?? '-'
    ].map(val => `"${val}"`).join(';');
  });

  return [header, ...rows].join('\n');
};

export const updateOrder = async (id: number, orderData: any) => {
  const { 
    orderNumber, clientId, productId, plannedQty, unit, 
    machineId, operatorsText, technicalSpec, colorOrders
  } = orderData;

  return await prisma.$transaction(async (tx) => {
    const dataToUpdate: any = {
        orderNumber,
        clientId: parseInt(clientId),
        productId: parseInt(productId),
        plannedQty: plannedQty ? String(plannedQty) : null,
        unit,
        machineId: machineId ? parseInt(machineId) : null,
        operatorsText,
    };
    if (orderData.approvedPrinting !== undefined) dataToUpdate.approvedPrinting = orderData.approvedPrinting;
    if (orderData.approvedLamination !== undefined) dataToUpdate.approvedLamination = orderData.approvedLamination;
    if (orderData.approvedRefilado !== undefined) dataToUpdate.approvedRefilado = orderData.approvedRefilado;

    const order = await tx.productionOrder.update({
      where: { id },
      data: dataToUpdate
    });

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
          cliseCenter: technicalSpec.cliseCenter,
          cliseLeft: technicalSpec.cliseLeft,
          cliseRight: technicalSpec.cliseRight,
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
          cliseCenter: technicalSpec.cliseCenter,
          cliseLeft: technicalSpec.cliseLeft,
          cliseRight: technicalSpec.cliseRight,
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
            formula: color.formula,
            supplyId: parseSafeInt(color.insumoId),
          }
        });
      }
    }

    return order;
  });
};
