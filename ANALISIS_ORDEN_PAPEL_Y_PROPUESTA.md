# Analisis de la Orden en Papel y Propuesta de Digitalizacion

## Objetivo

Este documento traduce la orden de produccion en papel usada actualmente por Silcar a un flujo digital operativo, con foco en:

- respetar la logica real de planta
- separar claramente lo administrativo de lo operativo
- permitir trazabilidad por etapa
- actualizar stock en tiempo real
- evitar que los operarios modifiquen datos tecnicos o comerciales cargados por administracion

---

## 1. Lectura funcional de la orden en papel

La orden en papel no es solo una nota de pedido. En la practica funciona como un documento unico que combina:

1. Alta administrativa del trabajo
2. Ficha tecnica de impresion
3. Hoja de produccion por etapas
4. Registro de consumos
5. Control de calidad final

La misma hoja se crea en oficina, acompana fisicamente el trabajo por planta, se completa en impresion, laminacion y refilado, y vuelve a administracion o supervision para el control final.

---

## 2. Flujo real del negocio

## 2.1 Creacion inicial

La encargada crea la orden y completa:

- fecha
- fecha de entrega
- cliente
- nombre del producto
- clasificacion
- numero de orden
- si lleva muestra
- tipo de material principal
- descripcion del trabajo
- medida material
- corte
- metros planificados
- cantidad de colores
- directo o retroverso
- pie
- cabeza
- taca derecha
- taca izquierda
- clise centrado izq/der
- secuencia de colores
- referencia de equivalencia entre metros y cantidad final estimada

Esta etapa ya existe parcialmente en el sistema actual.

## 2.2 Planificacion semanal

Antes de la produccion, la empresa define en que maquina se hara el trabajo:

- Impresora 1 o Impresora 2
- maquina de laminacion si corresponde
- maquina de refilado si corresponde

Hoy esto no queda escrito en el papel, pero en el sistema deberia quedar cargado porque condiciona la vista del operario y la trazabilidad.

## 2.3 Produccion por etapa

La orden pasa por una o varias etapas:

- impresion
- laminacion
- refilado
- control final

Cada etapa completa solo su seccion:

- operarios
- tiempos de inicio y fin
- paradas
- causas o descripciones
- consumos reales
- scrap
- datos tecnicos propios de la etapa

## 2.4 Control final

Supervisor o administracion valida:

- texto
- corte
- tono
- ancho material
- observaciones
- firma

Puede haber multiples inspecciones sobre la misma orden antes de darla por correcta.

## 2.5 Cierre

Cuando todas las etapas estan correctas:

- se confirma resultado final
- se puede dejar lista para exportacion
- se consolida el producto terminado

Importante: el stock no deberia esperar a este cierre administrativo para moverse. Los consumos deben descontarse cuando cada etapa reporta datos reales.

---

## 3. Modelo digital propuesto

## 3.1 Bloques funcionales de la orden

La orden digital deberia separarse en 5 bloques claros.

### A. Cabecera administrativa

Editable solo por administracion o encargada.

Campos:

- numero de orden
- fecha de orden
- fecha de entrega
- cliente
- nombre del producto
- clasificacion
- tipo de trabajo
- muestra si/no
- observaciones generales

### B. Ficha tecnica

Editable solo por administracion o encargada.

Campos:

- material principal
- materiales complementarios si aplican
- descripcion del trabajo
- medida material
- corte
- metros planificados
- cantidad de colores
- tipo de impresion: directo o retroverso
- tubo
- pie
- cabeza
- taca derecha
- taca izquierda
- clise centrado izq/der
- equivalencia planificada: metros -> bolsas

### C. Secuencia de colores

Editable solo por administracion o encargada, con uso posterior por impresion.

Campos por fila:

- secuencia
- color
- insumo asociado opcional
- formula manual

### D. Produccion por etapa

Editable por operarios y/o supervisor de la etapa correspondiente.

Subbloques:

- impresion
- laminacion
- refilado

### E. Control final

Editable por supervisor o administracion.

Campos:

- multiples inspecciones
- nombre
- firma o usuario responsable
- checks de texto, corte, tono, ancho material
- observaciones
- validacion final

---

## 4. Roles y permisos

## 4.1 Administracion / Encargada

Puede:

- crear orden
- editar cabecera
- editar ficha tecnica
- editar clasificacion
- editar secuencia de colores
- asignar maquinas
- ver todas las ordenes
- ver stock
- modificar stock minimo
- cerrar orden
- validar control final
- exportar

No deberia:

- cargar consumos operativos en nombre del operario salvo excepcion controlada

## 4.2 Operario de impresion

Puede:

- ver solo ordenes asignadas a su maquina o etapa
- registrar tiempos de impresion
- registrar eventos de parada y reanudacion
- registrar scrap de impresion
- registrar consumo real de tintas
- registrar observaciones operativas
- confirmar avance o finalizacion de impresion

No puede:

- editar cliente
- editar producto
- editar clasificacion
- editar metros planificados
- editar secuencia tecnica cargada por administracion
- editar otras etapas

## 4.3 Operario de laminacion

Puede:

- ver ordenes asignadas
- registrar material usado
- registrar adhesivo
- registrar reticulante
- registrar diluyente
- registrar tiempos y paradas
- registrar scrap
- confirmar avance o finalizacion de laminacion

No puede editar la base administrativa o tecnica.

## 4.4 Operario de refilado

Puede:

- registrar sentido de salida
- registrar pie o cabeza
- registrar tacas
- registrar ancho espira
- registrar diametro bobinas
- registrar metros reales
- registrar cantidad de bobinas
- registrar tiempos
- registrar scrap

No puede editar la base administrativa o tecnica.

## 4.5 Supervisor / Control final

Puede:

- ver orden completa
- revisar cada etapa
- cargar multiples inspecciones
- validar texto, corte, tono y ancho material
- observar
- aprobar o rechazar
- habilitar cierre

---

## 5. Flujo digital propuesto paso a paso

## Paso 1. Alta de orden

Administracion crea la orden con toda la parte inicial equivalente al frente del papel.

Estado sugerido:

- `BORRADOR`
- `PLANIFICADA`

## Paso 2. Asignacion de maquinas

Se asignan:

- maquina de impresion
- maquina de laminacion si aplica
- maquina de refilado si aplica

Esto no necesita verse en la orden impresa actual, pero si en sistema.

Estado sugerido:

- `ASIGNADA`

## Paso 3. Impresion

El operario de impresion ve solo las ordenes que le corresponden y carga:

- tiempos
- paradas
- operarios
- scrap
- consumo de cada tinta
- metros reales si corresponde

Cuando confirma consumos:

- se descuenta stock de tintas en tiempo real

Estado sugerido:

- `EN_IMPRESION`
- `IMPRESION_COMPLETA`

## Paso 4. Laminacion

Si la orden requiere laminacion:

- el operario registra insumos reales
- tiempos
- scrap

Cuando confirma:

- se descuentan material, adhesivo, reticulante y diluyente

Estado sugerido:

- `EN_LAMINACION`
- `LAMINACION_COMPLETA`

## Paso 5. Refilado

Si la orden requiere refilado:

- se cargan metros reales
- sentido de salida
- pie/cabeza
- tacas
- ancho espira
- diametro bobinas
- cantidad de bobinas
- scrap

Estado sugerido:

- `EN_REFILADO`
- `REFILADO_COMPLETO`

## Paso 6. Control final

Supervisor o administracion completa:

- inspecciones
- checks
- observaciones
- aprobacion o rechazo

Estado sugerido:

- `PENDIENTE_CONTROL`
- `APROBADA`
- `RECHAZADA`

## Paso 7. Cierre

Solo cuando este aprobada:

- se consolida producto terminado
- se genera movimiento de ingreso final
- se deja lista para exportacion si aplica

Estado sugerido:

- `FINALIZADA`
- `EXPORTADA`

---

## 6. Propuesta de estados de orden

Los estados actuales del sistema son demasiado generales para esta operatoria. Se recomienda usar estados mas fieles al proceso:

- `BORRADOR`
- `PLANIFICADA`
- `ASIGNADA`
- `EN_IMPRESION`
- `IMPRESION_COMPLETA`
- `EN_LAMINACION`
- `LAMINACION_COMPLETA`
- `EN_REFILADO`
- `REFILADO_COMPLETO`
- `PENDIENTE_CONTROL`
- `RECHAZADA`
- `APROBADA`
- `FINALIZADA`
- `EXPORTADA`

Si se quiere mantener una UI simple, se puede mostrar un estado general y por debajo subestados por etapa.

---

## 7. Cambios de stock en tiempo real

Este es el cambio de negocio mas importante.

## 7.1 Problema actual

Hoy la hoja vuelve dias despues a administracion. Eso provoca que:

- los consumos reales se cargan tarde
- el stock del sistema queda atrasado
- administracion no ve el uso real durante la semana

## 7.2 Regla nueva propuesta

El stock debe moverse cuando la etapa confirma el consumo, no cuando vuelve la hoja.

## 7.3 Impresion

Por cada color:

- inicio
- cargas agregadas
- fin

Formula:

`consumo_real = inicio + sumatoria_de_cargas - fin`

Al confirmar impresion:

- descontar el stock del insumo tinta asociado a cada color
- registrar movimiento de stock con referencia a orden, etapa y color

## 7.4 Laminacion

Al confirmar laminacion:

- descontar material
- descontar adhesivo
- descontar reticulante
- descontar diluyente

Cada insumo debe quedar como movimiento separado.

## 7.5 Refilado

Refilado no siempre consume un insumo nuevo, pero si puede:

- registrar scrap
- registrar merma
- consolidar salida real

Si se identifica merma fisica, debe registrarse movimiento negativo asociado a producto o material segun definicion de negocio.

## 7.6 Cierre final

Cuando se finaliza:

- ingresar producto terminado al stock

La salida de insumos ya habra ocurrido antes, etapa por etapa.

---

## 8. Estructura de pantallas recomendada

## 8.1 Pantalla de orden para administracion

Secciones:

- Cabecera
- Ficha tecnica
- Colores
- Asignacion de maquinas
- Equivalencia metros y bolsas
- Historial de etapas
- Estado general

Acciones:

- guardar
- planificar
- asignar
- editar
- ver trazabilidad

## 8.2 Pantalla de impresion para operario

Solo lectura de base tecnica:

- cliente
- producto
- muestra
- material
- metros
- corte
- directo/retroverso
- pie/cabeza
- tacas
- clise
- secuencia de colores

Editable:

- eventos de tiempo
- paradas
- scrap
- consumos por color

## 8.3 Pantalla de laminacion

Solo lectura de base tecnica y editable en:

- material usado
- adhesivo
- reticulante
- diluyente
- tiempos
- scrap

## 8.4 Pantalla de refilado

Editable en:

- sentido salida
- pie/cabeza
- tacas
- ancho espira
- diametro bobinas
- metros reales
- cantidad de bobinas
- tiempos
- scrap

## 8.5 Pantalla de control final

Editable por supervisor:

- inspecciones multiples
- checks
- observaciones
- aprobacion o rechazo

---

## 9. Gap analisis contra el sistema actual

## 9.1 Lo que ya existe y sirve

- ordenes de produccion
- especificacion tecnica
- secuencia de colores
- procesos por etapa
- consumos
- checklists
- quality controls
- stock movements
- maquinas y operarios

## 9.2 Lo que falta o esta incompleto

- `muestra` como dato de orden visible y editable
- `clasificacion` real de la orden
- `tipo de trabajo` bien modelado
- `directo / retroverso` obligatorio y visible
- `pie`
- `cabeza`
- `taca derecha`
- `taca izquierda`
- `clise centrado izq/der`
- equivalencia `metros planificados -> bolsas estimadas`
- eventos multiples de tiempo por etapa
- registro fino de paradas
- control final con multiples filas firmadas
- permisos por rol mas cerrados
- maquinas asignadas por etapa, no solo orden general
- descuento de stock verdaderamente en tiempo real por etapa

## 9.3 Problemas del sistema actual detectados frente al papel

- el estado actual de orden es muy simple para el flujo real
- los operarios todavia no estan suficientemente limitados respecto de la informacion administrativa
- consumos y tiempos no replican con precision el uso del formulario
- la hoja de papel maneja una continuidad por etapa que el sistema aun no expresa del todo

---

## 10. Cambios de datos recomendados

## 10.1 En ProductionOrder

Agregar o reforzar:

- `classification`
- `workType`
- `hasSample`
- `estimatedBagQty`
- `sampleNotes` opcional

## 10.2 En TechnicalSpec

Agregar o asegurar:

- `isDirectPrint` o `printingSide`
- `tacaRight`
- `tacaLeft`
- `clisheAlignment`
- `headOrientation`
- `footOrientation`

Nota: hoy algunas cosas ya existen parcialmente, pero no siempre con el mismo significado que en el papel.

## 10.3 En ProductionProcess

Agregar:

- `plannedMachineId`
- `completedByUserId`
- `approvedByUserId`

## 10.4 Nueva tabla sugerida: ProcessTimeLog

Para representar bien fecha, descripcion, hora inicio y hora fin por etapa.

Campos:

- id
- processId
- operatorId o userId
- date
- description
- startTime
- endTime
- eventType opcional

Esto resuelve la parte del papel donde registran multiples cortes y reanudaciones.

## 10.5 Nueva tabla sugerida: FinalInspection

Para replicar las multiples lineas de verificacion del trabajo final.

Campos:

- id
- orderId
- inspectorUserId o operatorId
- date
- textOk
- cutOk
- toneOk
- materialWidthOk
- observations
- productNameObserved
- signedOff

## 10.6 Mejoras en consumo de tintas

Idealmente el consumo de impresion deberia guardar:

- color
- supplyId
- initialKg
- addedKg
- finalKg
- calculatedKg

Hoy el sistema esta mas cerca de un solo valor agregado por color. Conviene modelar mejor la cuenta real.

---

## 11. Reglas de bloqueo por rol

## Operario no puede modificar

- cliente
- nombre del producto
- fecha de entrega
- clasificacion
- muestra
- material definido por administracion
- especificacion tecnica base
- secuencia de colores base
- equivalencia planificada

## Supervisor puede modificar

- controles
- aprobaciones de etapa
- observaciones de calidad

## Administracion puede modificar

- toda la base inicial antes de iniciar produccion
- luego de iniciada la produccion, solo cambios controlados con auditoria

---

## 12. Propuesta de implementacion por fases

## Fase 1. Ajuste funcional minimo viable

- agregar campos faltantes de la orden
- bloquear edicion por rol
- asignar maquina por etapa
- mejorar estado de orden

Resultado:

- el sistema ya respeta mejor la hoja real

## Fase 2. Operacion en tiempo real

- cargar consumos por etapa desde planta
- descontar stock automaticamente
- registrar scrap por etapa

Resultado:

- administracion ve stock actualizado durante la semana

## Fase 3. Trazabilidad fina

- agregar logs de tiempo por etapa
- registrar paradas y reanudaciones
- agregar inspecciones finales multiples

Resultado:

- el sistema replica casi 1 a 1 la orden en papel

## Fase 4. Cierre total del circuito

- ingreso final de producto terminado
- dashboards por etapa
- control de rendimiento metros vs bolsas
- exportacion lista para backoffice

---

## 13. Conclusion

La hoja en papel confirma que Silcar trabaja con un proceso productivo real por etapas, donde la orden es el documento central del trabajo. El sistema actual ya tiene buena parte de la base, pero todavia esta mas cerca de una orden administrativa enriquecida que de una replica fiel del circuito de planta.

La digitalizacion correcta no consiste solo en copiar campos, sino en:

- separar datos tecnicos y administrativos de datos operativos
- limitar permisos por rol
- capturar consumos y tiempos por etapa
- mover stock en el momento real
- permitir control final multiple con supervision

Si esto se implementa, el sistema no solo reemplaza el papel: pasa a dar visibilidad operativa que hoy no tienen, especialmente en stock, avance real y trazabilidad por maquina y etapa.
