const baseUrl = 'http://localhost:3001/api';

async function runTests() {
  console.log("=== INICIANDO PRUEBA COMPLETA DE FLUJO ===");
  
  try {
    // 1. Obtener datos maestros
    console.log("\n1. Obteniendo datos maestros (Clientes, Productos, Insumos)...");
    const clientsRes = await fetch(`${baseUrl}/clients`);
    const clients = await clientsRes.json();
    console.log(`✅ Clientes obtenidos: ${clients.length}`);

    const productsRes = await fetch(`${baseUrl}/products`);
    const products = await productsRes.json();
    console.log(`✅ Productos obtenidos: ${products.length}`);

    const suppliesRes = await fetch(`${baseUrl}/supplies`);
    const supplies = await suppliesRes.json();
    console.log(`✅ Insumos obtenidos: ${supplies.length}`);

    if (clients.length === 0 || products.length === 0) {
        throw new Error("No hay datos maestros suficientes para probar.");
    }

    // 2. Configurar Stock Mínimo (Prueba de Alertas de Stock)
    console.log("\n2. Configurando Stock Mínimo y verificando alertas...");
    const testProduct = products[0];
    const updateStockRes = await fetch(`${baseUrl}/stock/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            productId: testProduct.id,
            itemType: 'PRODUCTO',
            unit: 'UN',
            minStock: 5000 // Un valor alto para forzar la alerta
        })
    });
    
    if (updateStockRes.ok) {
        console.log(`✅ Stock Mínimo actualizado correctamente para el producto ID ${testProduct.id}`);
    } else {
        console.log("❌ Error actualizando stock mínimo", await updateStockRes.text());
    }

    // 3. Crear Orden de Producción
    console.log("\n3. Creando nueva orden de producción con múltiples productos y texto en cantidades...");
    const orderData = {
      orderNumber: `TEST-OP-${Math.floor(Math.random() * 10000)}`,
      clientId: clients[0].id,
      deliveryDate: "2026-12-31",
      products: [
        { productId: products[0].id, plannedQty: "100 kg" },
        { productId: products.length > 1 ? products[1].id : products[0].id, plannedQty: "5000 unidades" }
      ],
      unit: 'Mixto',
      creatorId: 1,
      operatorsText: 'Tomás Díaz, Emanuel Melero', // Usando los operadores nuevos
      specifications: 'Prueba de integración end-to-end automatizada',
      observations: '',
      colorOrders: [
          { sequence: 1, colorName: 'Azul', formula: 'Manual', insumoId: supplies.length > 0 ? supplies[0].id : '', changesToConsider: 'Limpiar tintero' }
      ]
    };

    const createOrderRes = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    });
    
    if (!createOrderRes.ok) {
        throw new Error("Error creando orden: " + await createOrderRes.text());
    }
    
    const createdOrder = await createOrderRes.json();
    console.log(`✅ Orden creada correctamente! ID: ${createdOrder.id} - Número: ${createdOrder.orderNumber}`);

    // 4. Verificando estado inicial y datos de la orden
    console.log("\n4. Verificando detalles de la orden guardada...");
    const orderDetailsRes = await fetch(`${baseUrl}/orders/${createdOrder.id}`);
    const orderDetails = await orderDetailsRes.json();
    
    console.log(`   - Estado actual: ${orderDetails.status} (Debería ser 'Órdenes por realizar')`);
    console.log(`   - Productos asociados: ${orderDetails.products?.length || 0}`);
    console.log(`   - Fecha de entrega: ${new Date(orderDetails.deliveryDate).toLocaleDateString()}`);
    console.log(`   - Especificaciones guardadas: "${orderDetails.specifications}"`);
    console.log(`   - Cambios de color a considerar: "${orderDetails.colorOrders[0].changesToConsider}"`);

    // 5. Probar aprobaciones de calidad
    console.log("\n5. Simulando aprobación de impresión y laminación...");
    const approveRes = await fetch(`${baseUrl}/orders/${createdOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...orderDetails,
            approvedPrinting: true,
            approvedLamination: true
        })
    });

    if (approveRes.ok) {
        console.log(`✅ Aprobaciones registradas correctamente en la base de datos.`);
    }

    console.log("\n=== PRUEBA COMPLETA FINALIZADA CON ÉXITO ===");

  } catch (error) {
    console.error("\n❌ ERROR EN LA PRUEBA:", error.message);
  }
}

runTests();
