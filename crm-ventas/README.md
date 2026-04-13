# CRM Ventas - Sistema de Rastreo de Ventas

Sistema web para automatizar la generación de reportes Excel y gestionar el seguimiento de prospectos de ventas.

## Características

- Dashboard con gráficas en tiempo real
- Gestión de prospectos con historial de contactos
- Registro rápido de intentos de contacto
- Generación automática de reportes Excel
- Control de acceso por roles (Administrador, Supervisor, Vendedor)
- Registro de auditoría de todas las acciones

## Requisitos

- Node.js 18+
- MySQL 8.0+ (o MariaDB)
- npm o yarn

## Instalación

### 1. Clonar el proyecto

```bash
cd crm-ventas
```

### 2. Backend

```bash
cd backend
npm install
```

### 3. Crear la base de datos MySQL

```sql
CREATE DATABASE crm_ventas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crm_ventas;
```

Luego ejecutar el script `scripts/schema.sql` en MySQL.

### 4. Configurar variables de entorno

Crear archivo `.env` en `backend/`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=crm_ventas
DB_PORT=3306

JWT_SECRET=tu_secret_key_para_jwt
JWT_EXPIRES_IN=24h

FRONTEND_URL=http://localhost:5173
```

### 5. Poblar con datos de prueba

```bash
npm run seed
```

### 6. Iniciar el backend

```bash
npm run dev
```

### 7. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

### 8. Acceder a la aplicación

Abrir `http://localhost:5173` en el navegador.

## Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@crm.com | password123 |
| Supervisor | carlos@crm.com | password123 |
| Vendedor | maria@crm.com | password123 |
| Vendedor | juan@crm.com | password123 |
| Vendedor | lucia@crm.com | password123 |

## Estructura del proyecto

```
crm-ventas/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── scripts/
│   │   ├── schema.sql      # Estructura de BD
│   │   └── seed.js         # Datos de prueba
│   ├── src/
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── middleware/     # Auth, validación
│   │   ├── routes/         # Endpoints API
│   │   ├── services/       # Servicios reutilizables
│   │   └── index.js       # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes Vue
│   │   ├── views/          # Páginas
│   │   ├── stores/         # Estado Pinia
│   │   ├── services/       # API client
│   │   └── router/         # Rutas
│   └── package.json
└── README.md
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/profile` - Perfil del usuario

### Prospectos
- `GET /api/prospectos` - Listar prospectos
- `GET /api/prospectos/:id` - Detalle de prospecto
- `POST /api/prospectos` - Crear prospecto
- `PUT /api/prospectos/:id` - Actualizar prospecto
- `DELETE /api/prospectos/:id` - Eliminar prospecto

### Intentos de Contacto
- `GET /api/intentos-contacto` - Listar contactos
- `POST /api/intentos-contacto` - Registrar contacto
- `PUT /api/intentos-contacto/:id` - Actualizar contacto

### Dashboard
- `GET /api/dashboard/resumen` - KPIs generales
- `GET /api/dashboard/ventas-mensuales` - Ventas por mes
- `GET /api/dashboard/prospectos-estado` - Por estado
- `GET /api/dashboard/prospectos-canal` - Por canal
- `GET /api/dashboard/actividad-reciente` - Actividad reciente

### Reportes
- `GET /api/reportes/seguimiento` - Excel seguimiento
- `GET /api/reportes/ventas` - Excel ventas

## Flujo de uso para vendedores

1. **Login** - Ingresar con credenciales
2. **Dashboard** - Ver métricas y gráficas
3. **Prospectos** - Ver lista de prospectos asignados
4. **Registrar Contacto** - Solo llenar canal, resultado y (opcionalmente) logro/interés
5. **Exportar Excel** - Un clic para generar el reporte

## Licencia

MIT
