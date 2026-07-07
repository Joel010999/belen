const baseUrl = 'http://localhost:3001/api';

const jsonHeaders = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...extra
});

async function api(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message = typeof data === 'string' ? data : data?.error || data?.message || response.statusText;
    throw new Error(`${options.method || 'GET'} ${path} -> ${response.status} ${message}`);
  }

  return data;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function diff(before, after) {
  return Number((after - before).toFixed(4));
}

function pickSupplyByName(supplies, searchTerms, fallbackIndex = 0) {
  const loweredTerms = searchTerms.map((term) => term.toLowerCase());
  return supplies.find((supply) => loweredTerms.some((term) => String(supply.name).toLowerCase().includes(term))) || supplies[fallbackIndex];
}

function getLatestRealProcess(order, type) {
  const processes = (order?.processes || [])
    .filter((process) => process.type === type && process.status !== 'Planificada')
    .sort((a, b) => Number(b.id) - Number(a.id));
  return processes[0] || null;
}

async function login(username, password) {
  return api('/auth/login', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ username, password })
  });
}

async function runTests() {
  console.log('=== SMOKE TEST: FLUJO PRODUCTIVO SILCAR ===');

  const admin = await login('admin', 'admin123');
  const impresora1 = await login('impresora1', 'planta123');
  console.log(`Admin autenticado: ${admin.username} | Planta autenticada: ${impresora1.username}`);

  const adminHeaders = jsonHeaders({
    'x-user-id': String(admin.id),
    'x-user-role': admin.role
  });

  const machineHeaders = jsonHeaders({
    'x-user-id': String(impresora1.id),
    'x-user-role': impresora1.role,
    'x-machine-id': String(impresora1.machine.id)
  });

  const [clients, products, supplies, machines, operators] = await Promise.all([
    api('/clients'),
    api('/products'),
    api('/supplies'),
    api('/machines'),
    api('/operators')
  ]);

  assert(clients.length > 0, 'No hay clientes cargados');
  assert(products.length > 0, 'No hay productos cargados');
  assert(supplies.length >= 4, 'No hay insumos suficientes para la prueba');

  const printingMachine = machines.find((machine) => machine.code === 'IMP1') || machines.find((machine) => machine.type === 'IMPRESION');
  const laminationMachine = machines.find((machine) => machine.code === 'LAM1') || machines.find((machine) => machine.type === 'LAMINACION');
  const refiladoMachine = machines.find((machine) => machine.code === 'REF1') || machines.find((machine) => machine.type === 'REFILADO');
  const printOperator = operators.find((operator) => operator.role === 'IMPRESION') || operators[0];
  const laminationOperator = operators.find((operator) => operator.role === 'LAMINACION') || operators[0];
  const refiladoOperator = operators.find((operator) => operator.role === 'REFILADO') || operators[0];

  assert(printingMachine && laminationMachine && refiladoMachine, 'Faltan maquinas para el flujo completo');

  const greenSupply = pickSupplyByName(supplies, ['verde'], 0);
  const redSupply = pickSupplyByName(supplies, ['rojo'], 1);
  const adhesiveSupply = pickSupplyByName(supplies, ['adhesivo'], 2);
  const reticulantSupply = pickSupplyByName(supplies, ['reticulante'], 3);

  const productBefore = products[0];
  const productStockBefore = toNumber(productBefore.stock?.stockActual);
  const greenBefore = toNumber(greenSupply.stock?.stockActual);
  const redBefore = toNumber(redSupply.stock?.stockActual);
  const adhesiveBefore = toNumber(adhesiveSupply.stock?.stockActual);
  const reticulantBefore = toNumber(reticulantSupply.stock?.stockActual);

  const uniqueSuffix = `${Date.now()}`;
  const orderPayload = {
    orderNumber: `SMOKE-${uniqueSuffix}`,
    clientId: clients[0].id,
    creatorId: admin.id,
    deliveryDate: '2026-07-15',
    classification: 'NUEVO',
    workType: 'BOLSA_POUCH',
    hasSample: true,
    estimatedBagQty: 6000,
    machineIds: [String(printingMachine.id), String(laminationMachine.id), String(refiladoMachine.id)],
    products: [
      {
        productId: products[0].id,
        plannedQty: '6000 bolsas'
      }
    ],
    unit: 'UN',
    operatorsText: 'Tomás Díaz / Thiago Ferreira / Franco Castro',
    specifications: 'Orden smoke basada en la orden de papel. 1200 mts = 6000 bolsas.',
    observations: 'Seguimiento end-to-end automatizado',
    technicalSpec: {
      materialMeasure: '16/40',
      cut: '40',
      lamina: 'Polipropileno',
      meters: 1200,
      tube: 'Si',
      colorCount: 4,
      pie: 'Pie',
      cabeza: 'Cabeza',
      designName: `Diseno Smoke ${uniqueSuffix}`,
      printingType: 'Directo',
      tacaRight: 'Taca derecha OK',
      tacaLeft: 'Taca izquierda OK',
      clisheAlignment: 'Centrado',
      techObservations: 'Prueba automatizada'
    },
    colorOrders: [
      { sequence: 1, colorName: greenSupply.name, supplyId: greenSupply.id },
      { sequence: 2, colorName: redSupply.name, supplyId: redSupply.id }
    ]
  };

  console.log('\n1. Creando orden como administracion...');
  const createdOrder = await api('/orders', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify(orderPayload)
  });
  console.log(`Orden creada: ID ${createdOrder.id} / ${createdOrder.orderNumber}`);

  const createdOrderDetail = await api(`/orders/${createdOrder.id}`);
  assert(createdOrderDetail.workType === 'BOLSA_POUCH', 'La orden no guardo el tipo de trabajo');
  assert(createdOrderDetail.hasSample === true, 'La orden no guardo la muestra');
  assert(createdOrderDetail.technicalSpec?.meters === 1200, 'La ficha tecnica no guardo los metros');
  assert(createdOrderDetail.products?.length === 1, 'La orden no guardo sus productos');

  console.log('2. Verificando restriccion de edicion para usuario de maquina...');
  let machineEditBlocked = false;
  try {
    await api(`/orders/${createdOrder.id}`, {
      method: 'PUT',
      headers: machineHeaders,
      body: JSON.stringify({
        orderNumber: createdOrder.orderNumber,
        clientId: clients[0].id,
        products: [{ productId: products[0].id, plannedQty: '6000 bolsas' }],
        unit: 'UN',
        observations: 'Esto no deberia permitirse'
      })
    });
  } catch (error) {
    machineEditBlocked = String(error.message).includes('Solo administracion');
  }
  assert(machineEditBlocked, 'Un usuario de maquina pudo editar la base de la orden');

  console.log('3. Registrando impresion...');
  await api('/orders/processes', {
    method: 'POST',
    headers: machineHeaders,
    body: JSON.stringify({
      orderId: createdOrder.id,
      type: 'IMPRESION',
      machineId: printingMachine.id,
      operatorId: printOperator.id,
      scrapKg: 1.5,
      observations: 'Impresion inicial',
      specificData: {
        exitSense: 'Cliente hacia arriba',
        processedMeters: 1200,
        coilDiameter: 32,
        coilCount: 2
      }
    })
  });

  console.log('4. Cargando tiempo de impresion...');
  await api(`/orders/${createdOrder.id}/time-logs`, {
    method: 'POST',
    headers: machineHeaders,
    body: JSON.stringify({
      stage: 'IMPRESION',
      operatorId: printOperator.id,
      date: '2026-06-29',
      description: 'Parada por ajuste y reinicio',
      startTime: '08:00',
      endTime: '08:45'
    })
  });

  console.log('5. Confirmando consumos de impresion...');
  await api(`/orders/${createdOrder.id}/consumptions`, {
    method: 'POST',
    headers: machineHeaders,
    body: JSON.stringify({
      type: 'PRINTING',
      realMeters: 1180,
      consumptions: [
        { colorName: greenSupply.name, supplyId: greenSupply.id, loads: '4+3', endValue: '1', realQty: 6, unit: 'kg' },
        { colorName: redSupply.name, supplyId: redSupply.id, loads: '3+2', endValue: '1', realQty: 4, unit: 'kg' }
      ]
    })
  });

  console.log('6. Aprobando impresion desde administracion...');
  await api(`/orders/${createdOrder.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      approvedPrinting: true
    })
  });

  console.log('7. Registrando laminacion y sus consumos...');
  await api('/orders/processes', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      orderId: createdOrder.id,
      type: 'LAMINACION',
      machineId: laminationMachine.id,
      operatorId: laminationOperator.id,
      scrapKg: 0.8,
      observations: 'Laminacion normal',
      specificData: {
        mixProportion: '100:15',
        processedMeters: 1170
      }
    })
  });

  await api(`/orders/${createdOrder.id}/consumptions`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      type: 'LAMINATION',
      realMeters: 1165,
      consumptions: [
        { colorName: adhesiveSupply.name, supplyId: adhesiveSupply.id, loads: '10+5', endValue: '3', realQty: 12, unit: 'kg' },
        { colorName: reticulantSupply.name, supplyId: reticulantSupply.id, loads: '2+1', endValue: '0.5', realQty: 2.5, unit: 'kg' }
      ]
    })
  });

  await api(`/orders/${createdOrder.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      approvedLamination: true
    })
  });

  console.log('8. Registrando refilado...');
  await api('/orders/processes', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      orderId: createdOrder.id,
      type: 'REFILADO',
      machineId: refiladoMachine.id,
      operatorId: refiladoOperator.id,
      scrapKg: 0.4,
      observations: 'Refilado completo',
      specificData: {
        exitSense: 'Salida cliente',
        tacaRight: 'Derecha',
        tacaLeft: 'Izquierda',
        deCabeza: false,
        deTripa: true,
        coilDiameter: 28,
        processedMeters: 1150,
        coilCount: 3
      }
    })
  });

  await api(`/orders/${createdOrder.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      approvedRefilado: true
    })
  });

  console.log('9. Registrando inspeccion final...');
  await api(`/orders/${createdOrder.id}/final-inspections`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      inspectorName: 'Administrador del Sistema',
      productNameObserved: products[0].name,
      textOk: true,
      cutOk: true,
      toneOk: true,
      materialWidthOk: true,
      observations: 'Inspeccion final smoke test',
      signedOff: true
    })
  });

  console.log('10. Finalizando orden...');
  await api(`/orders/${createdOrder.id}/finalize`, {
    method: 'POST',
    headers: adminHeaders
  });

  const machineOrders = await api('/orders', {
    method: 'GET',
    headers: machineHeaders
  });
  assert(machineOrders.some((order) => order.id === createdOrder.id), 'La orden no aparece filtrada para la maquina involucrada');

  const finalOrder = await api(`/orders/${createdOrder.id}`);
  const refreshedProducts = await api('/products');
  const refreshedSupplies = await api('/supplies');
  const finalPrintingProcess = getLatestRealProcess(finalOrder, 'IMPRESION');
  const finalLaminationProcess = getLatestRealProcess(finalOrder, 'LAMINACION');
  const finalRefiladoProcess = getLatestRealProcess(finalOrder, 'REFILADO');

  const productAfter = refreshedProducts.find((product) => product.id === products[0].id);
  const greenAfter = refreshedSupplies.find((supply) => supply.id === greenSupply.id);
  const redAfter = refreshedSupplies.find((supply) => supply.id === redSupply.id);
  const adhesiveAfter = refreshedSupplies.find((supply) => supply.id === adhesiveSupply.id);
  const reticulantAfter = refreshedSupplies.find((supply) => supply.id === reticulantSupply.id);
  const greenDelta = diff(greenBefore, toNumber(greenAfter.stock?.stockActual));
  const redDelta = diff(redBefore, toNumber(redAfter.stock?.stockActual));
  const adhesiveDelta = diff(adhesiveBefore, toNumber(adhesiveAfter.stock?.stockActual));
  const reticulantDelta = diff(reticulantBefore, toNumber(reticulantAfter.stock?.stockActual));
  const productDelta = diff(productStockBefore, toNumber(productAfter.stock?.stockActual));

  console.log(`Delta ${greenSupply.name} (#${greenSupply.id}): ${greenDelta}`);
  console.log(`Delta ${redSupply.name} (#${redSupply.id}): ${redDelta}`);
  console.log(`Delta ${adhesiveSupply.name} (#${adhesiveSupply.id}): ${adhesiveDelta}`);
  console.log(`Delta ${reticulantSupply.name} (#${reticulantSupply.id}): ${reticulantDelta}`);
  console.log(`Delta producto ${products[0].name} (#${products[0].id}): ${productDelta}`);

  assert(finalOrder.status === 'Finalizadas', 'La orden no quedo finalizada');
  assert(finalOrder.finalInspections?.length >= 1, 'La inspeccion final no se guardo');
  assert(Boolean(finalPrintingProcess), 'No se guardo impresion');
  assert(Boolean(finalLaminationProcess), 'No se guardo laminacion');
  assert(Boolean(finalRefiladoProcess), 'No se guardo refilado');
  assert(finalPrintingProcess?.timeLogs?.length >= 1, 'No se guardo el tiempo de impresion');
  assert(
    finalPrintingProcess?.printingData?.processedMeters === 1180,
    'Los metros reales de impresion no quedaron actualizados desde consumos'
  );
  assert(
    finalLaminationProcess?.laminationData?.processedMeters === 1165,
    'Los metros reales de laminacion no quedaron actualizados desde consumos'
  );
  assert(greenDelta === -6, 'El stock del insumo verde no bajo lo esperado');
  assert(redDelta === -4, 'El stock del insumo rojo no bajo lo esperado');
  assert(adhesiveDelta === -12, 'El stock del adhesivo no bajo lo esperado');
  assert(reticulantDelta === -2.5, 'El stock del reticulante no bajo lo esperado');
  assert(productDelta === 5997.3, 'El stock del producto terminado no subio con el neto esperado al finalizar');

  console.log('\n=== RESULTADO ===');
  console.log(`Orden finalizada correctamente: ${finalOrder.orderNumber}`);
  console.log(`Estado final: ${finalOrder.status}`);
  console.log(`Stock producto: ${productStockBefore} -> ${toNumber(productAfter.stock?.stockActual)}`);
  console.log(`Stock ${greenSupply.name}: ${greenBefore} -> ${toNumber(greenAfter.stock?.stockActual)}`);
  console.log(`Stock ${redSupply.name}: ${redBefore} -> ${toNumber(redAfter.stock?.stockActual)}`);
  console.log(`Stock ${adhesiveSupply.name}: ${adhesiveBefore} -> ${toNumber(adhesiveAfter.stock?.stockActual)}`);
  console.log(`Stock ${reticulantSupply.name}: ${reticulantBefore} -> ${toNumber(reticulantAfter.stock?.stockActual)}`);
  console.log('Smoke test completo: OK');
}

runTests().catch((error) => {
  console.error('\nSMOKE TEST FALLIDO');
  console.error(error.message);
  process.exit(1);
});
