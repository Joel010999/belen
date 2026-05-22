# Belén Industrial Management System

Sistema de gestión de producción industrial para fábricas de empaquetado flexible.

## Características
- **Trazabilidad Total**: Desde la orden de producción hasta el despacho final.
- **Control de Stock**: Movimientos automáticos de insumos y productos terminados.
- **Integración CSV**: Sincronización bidireccional con sistemas de gestión externos (Backoffice).
- **Interfaz Premium**: Diseñada para alta usabilidad en entornos industriales (Desktop y Tablet).

## Requisitos
- Node.js (v18+)
- PostgreSQL o SQL Server
- npm

## Configuración

### Backend
1. Ir a la carpeta `backend`.
2. Ejecutar `npm install`.
3. Configurar el archivo `.env` con la URL de su base de datos.
4. Ejecutar las migraciones: `npx prisma migrate dev`.
5. Iniciar en desarrollo: `npm run dev`.

### Frontend
1. Ir a la carpeta `frontend`.
2. Ejecutar `npm install`.
3. Iniciar en desarrollo: `npm run dev`.

## Autores
Desarrollado con foco en robustez industrial.
