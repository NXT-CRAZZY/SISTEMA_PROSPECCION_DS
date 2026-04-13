-- ============================================================
-- CRM COMERCIAL - Base de datos MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS crm_ventas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crm_ventas;

-- TABLA 1: USUARIOS
CREATE TABLE usuarios (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100)    NOT NULL,
    email           VARCHAR(150)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    rol             VARCHAR(20)     NOT NULL,
    activo          TINYINT(1)      NOT NULL DEFAULT 1,
    creado_en       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (rol IN ('vendedor', 'supervisor', 'administrador'))
);

-- TABLA 2: CANALES DE ORIGEN
CREATE TABLE canales_origen (
    id      INT         AUTO_INCREMENT PRIMARY KEY,
    codigo  CHAR(1)    NOT NULL UNIQUE,
    nombre  VARCHAR(50) NOT NULL
);

INSERT INTO canales_origen (codigo, nombre) VALUES
    ('C', 'Correo'),
    ('T', 'Teléfono'),
    ('V', 'Visita'),
    ('W', 'Web'),
    ('F', 'Facebook'),
    ('R', 'Referencia de cliente');

-- TABLA 3: CANALES DE CONTACTO
CREATE TABLE canales_contacto (
    id      INT         AUTO_INCREMENT PRIMARY KEY,
    codigo  VARCHAR(10) NOT NULL UNIQUE,
    nombre  VARCHAR(50) NOT NULL
);

INSERT INTO canales_contacto (codigo, nombre) VALUES
    ('TEL',   'Teléfono'),
    ('WA',    'WhatsApp'),
    ('EMAIL', 'Correo electrónico'),
    ('VIS',   'Visita física'),
    ('ZOOM',  'Videollamada');

-- TABLA 4: RESULTADOS DEL CONTACTO
CREATE TABLE resultados_contacto (
    id                  INT     AUTO_INCREMENT PRIMARY KEY,
    codigo              VARCHAR(20) NOT NULL UNIQUE,
    nombre              VARCHAR(80) NOT NULL,
    canal_contacto_id   INT,
    contacto_exitoso    TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (canal_contacto_id) REFERENCES canales_contacto(id) ON DELETE SET NULL
);

INSERT INTO resultados_contacto (codigo, nombre, canal_contacto_id, contacto_exitoso) VALUES
    ('TEL_EFECTIVA',    'Llamada efectiva',         1, 1),
    ('TEL_OCUPADO',     'Ocupado / No disponible',  1, 0),
    ('TEL_NO_CONTEST',  'No contestó',              1, 0),
    ('TEL_EQUIVOCADO',  'Número equivocado',         1, 0),
    ('WA_CONVERSACION', 'Conversación iniciada',    2, 1),
    ('WA_LEIDO',        'Leído sin respuesta',      2, 0),
    ('WA_ENVIADO',      'Enviado sin leer',         2, 0),
    ('EMAIL_RESPONDIDO','Respondió el correo',      3, 1),
    ('EMAIL_ENVIADO',   'Enviado sin respuesta',    3, 0),
    ('VIS_REUNION',     'Reunión efectiva',         4, 1),
    ('VIS_FILTRO',      'Atendido por filtro',       4, 0),
    ('VIS_AUSENTE',     'Prospecto ausente',         4, 0),
    ('ZOOM_EFECTIVA',   'Videollamada efectiva',    5, 1),
    ('ZOOM_NO_CONECT',  'No se conectó',            5, 0);

-- TABLA 5: LOGROS DEL CONTACTO
CREATE TABLE logros_contacto (
    id      INT         AUTO_INCREMENT PRIMARY KEY,
    codigo  CHAR(1)    NOT NULL UNIQUE,
    nombre  VARCHAR(50) NOT NULL
);

INSERT INTO logros_contacto (codigo, nombre) VALUES
    ('C', 'Cotización'),
    ('D', 'Demostración'),
    ('K', 'Capacitación'),
    ('V', 'Venta cerrada'),
    ('S', 'Solo conversación / Seguimiento');

-- TABLA 6: MODALIDAD DEL CONTACTO
CREATE TABLE modalidades_contacto (
    id      INT         AUTO_INCREMENT PRIMARY KEY,
    codigo  CHAR(1)    NOT NULL UNIQUE,
    nombre  VARCHAR(30) NOT NULL
);

INSERT INTO modalidades_contacto (codigo, nombre) VALUES
    ('P', 'Presencial'),
    ('R', 'Remoto');

-- TABLA 7: NIVEL DE INTERÉS
CREATE TABLE niveles_interes (
    id      INT         AUTO_INCREMENT PRIMARY KEY,
    codigo  CHAR(1)    NOT NULL UNIQUE,
    nombre  VARCHAR(30) NOT NULL,
    peso    INT         NOT NULL
);

INSERT INTO niveles_interes (codigo, nombre, peso) VALUES
    ('M', 'Muy interesado (Hot)',    3),
    ('P', 'Poco interesado (Warm)',  2),
    ('N', 'Nada interesado (Cold)',  1);

-- TABLA 8: PRODUCTOS
CREATE TABLE productos (
    id          INT             AUTO_INCREMENT PRIMARY KEY,
    codigo      VARCHAR(20)     NOT NULL UNIQUE,
    nombre      VARCHAR(100)    NOT NULL,
    descripcion TEXT,
    precio_base DECIMAL(10,2),
    activo      TINYINT(1)      NOT NULL DEFAULT 1
);

INSERT INTO productos (codigo, nombre, precio_base) VALUES
    ('CONT-BASE',  'Sistema Contable Base',      1500.00),
    ('CONT-PRO',   'Sistema Contable Pro',        2500.00),
    ('FACTURA',    'Módulo Facturación',           800.00),
    ('PLANILLA',   'Módulo Planillas',             900.00),
    ('SOPORTE',    'Servicio de Soporte Anual',   400.00),
    ('CAPAC',      'Servicio de Capacitación',    350.00);

-- TABLA 9: TIPOS DE COMPROBANTE
CREATE TABLE tipos_comprobante (
    id      INT         AUTO_INCREMENT PRIMARY KEY,
    codigo  VARCHAR(10) NOT NULL UNIQUE,
    nombre  VARCHAR(50) NOT NULL
);

INSERT INTO tipos_comprobante (codigo, nombre) VALUES
    ('FAC', 'Factura'),
    ('BOL', 'Boleta de venta'),
    ('NC',  'Nota de crédito');

-- TABLA 10: ESTADOS DEL PROSPECTO
CREATE TABLE estados_prospecto (
    id          INT         AUTO_INCREMENT PRIMARY KEY,
    codigo      VARCHAR(20) NOT NULL UNIQUE,
    nombre      VARCHAR(50) NOT NULL,
    descripcion VARCHAR(200),
    es_activo   TINYINT(1)  NOT NULL DEFAULT 1
);

INSERT INTO estados_prospecto (codigo, nombre, es_activo) VALUES
    ('NUEVO',       'Nuevo',                    1),
    ('CONTACTANDO', 'En contacto',              1),
    ('INTERESADO',  'Interesado',               1),
    ('COTIZADO',    'Cotización enviada',        1),
    ('DEMO',        'Demo / Capacitación prog.', 1),
    ('NEGOCIANDO',  'En negociación',            1),
    ('GANADO',      'Venta cerrada (Ganado)',    0),
    ('PERDIDO',     'No concretó (Perdido)',     0),
    ('DESCARTADO',  'Descartado',               0);

-- TABLA 11: PROSPECTOS
CREATE TABLE prospectos (
    id                      INT         AUTO_INCREMENT PRIMARY KEY,
    numero_prospecto        VARCHAR(20) NOT NULL UNIQUE,
    nombre_contacto         VARCHAR(150) NOT NULL,
    empresa                 VARCHAR(150),
    ruc_dni                 VARCHAR(11),
    tipo_documento          CHAR(3),
    telefono                VARCHAR(20),
    email                   VARCHAR(150),
    cargo                   VARCHAR(80),
    canal_origen_id         INT         NOT NULL,
    vendedor_id             INT         NOT NULL,
    estado_id               INT         NOT NULL DEFAULT 1,
    nivel_interes_id        INT,
    proxima_accion          VARCHAR(100),
    fecha_proxima_accion    DATE,
    ciudad                  VARCHAR(80),
    observaciones_generales TEXT,
    fecha_registro         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_actividad TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo                  TINYINT(1)  NOT NULL DEFAULT 1,
    
    FOREIGN KEY (canal_origen_id) REFERENCES canales_origen(id),
    FOREIGN KEY (vendedor_id) REFERENCES usuarios(id),
    FOREIGN KEY (estado_id) REFERENCES estados_prospecto(id),
    FOREIGN KEY (nivel_interes_id) REFERENCES niveles_interes(id),
    
    INDEX idx_prospectos_vendedor (vendedor_id),
    INDEX idx_prospectos_estado (estado_id),
    INDEX idx_prospectos_fecha_reg (fecha_registro)
);

-- TABLA 12: INTENTOS DE CONTACTO
CREATE TABLE intentos_contacto (
    id                      INT         AUTO_INCREMENT PRIMARY KEY,
    prospecto_id            INT         NOT NULL,
    vendedor_id             INT         NOT NULL,
    numero_intento          INT         NOT NULL,
    fecha_contacto          DATE        NOT NULL DEFAULT (CURRENT_DATE),
    canal_contacto_id       INT         NOT NULL,
    modalidad_id            INT,
    resultado_id            INT         NOT NULL,
    logro_id                INT,
    nivel_interes_id        INT,
    proxima_accion          VARCHAR(100),
    fecha_proxima_accion    DATE,
    observaciones           TEXT,
    creado_en               TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (prospecto_id) REFERENCES prospectos(id) ON DELETE CASCADE,
    FOREIGN KEY (vendedor_id) REFERENCES usuarios(id),
    FOREIGN KEY (canal_contacto_id) REFERENCES canales_contacto(id),
    FOREIGN KEY (modalidad_id) REFERENCES modalidades_contacto(id),
    FOREIGN KEY (resultado_id) REFERENCES resultados_contacto(id),
    FOREIGN KEY (logro_id) REFERENCES logros_contacto(id),
    FOREIGN KEY (nivel_interes_id) REFERENCES niveles_interes(id),
    
    UNIQUE KEY uk_prospecto_intento (prospecto_id, numero_intento),
    
    INDEX idx_contacto_prospecto (prospecto_id),
    INDEX idx_contacto_vendedor (vendedor_id),
    INDEX idx_contacto_fecha (fecha_contacto)
);

-- TABLA 13: DEMOSTRACIONES
CREATE TABLE demostraciones (
    id                      INT         AUTO_INCREMENT PRIMARY KEY,
    prospecto_id            INT         NOT NULL,
    vendedor_id             INT         NOT NULL,
    intento_contacto_id     INT,
    tipo                    VARCHAR(20) NOT NULL,
    modalidad_id            INT,
    producto_id             INT,
    fecha_programada        DATETIME    NOT NULL,
    fecha_realizada         DATETIME,
    duracion_minutos        INT,
    resultado               VARCHAR(20) DEFAULT 'PENDIENTE',
    observaciones           TEXT,
    creado_en               TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (prospecto_id) REFERENCES prospectos(id) ON DELETE CASCADE,
    FOREIGN KEY (vendedor_id) REFERENCES usuarios(id),
    FOREIGN KEY (intento_contacto_id) REFERENCES intentos_contacto(id) ON DELETE SET NULL,
    FOREIGN KEY (modalidad_id) REFERENCES modalidades_contacto(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    
    INDEX idx_demo_prospecto (prospecto_id),
    INDEX idx_demo_fecha (fecha_programada)
);

-- TABLA 14: COTIZACIONES
CREATE TABLE cotizaciones (
    id                      INT         AUTO_INCREMENT PRIMARY KEY,
    prospecto_id            INT         NOT NULL,
    vendedor_id             INT         NOT NULL,
    intento_contacto_id     INT,
    numero_cotizacion       VARCHAR(30) NOT NULL UNIQUE,
    producto_id             INT         NOT NULL,
    monto                   DECIMAL(10,2) NOT NULL,
    descuento_porcentaje    DECIMAL(5,2) DEFAULT 0,
    monto_final             DECIMAL(10,2) NOT NULL,
    observaciones_descuento TEXT,
    fecha_cotizacion        DATE        NOT NULL DEFAULT (CURRENT_DATE),
    fecha_vencimiento       DATE,
    estado                  VARCHAR(20) NOT NULL DEFAULT 'ENVIADA',
    creado_en               TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (prospecto_id) REFERENCES prospectos(id) ON DELETE CASCADE,
    FOREIGN KEY (vendedor_id) REFERENCES usuarios(id),
    FOREIGN KEY (intento_contacto_id) REFERENCES intentos_contacto(id) ON DELETE SET NULL,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    
    INDEX idx_cotizacion_prospecto (prospecto_id),
    INDEX idx_cotizacion_fecha (fecha_cotizacion)
);

-- TABLA 15: VENTAS
CREATE TABLE ventas (
    id                      INT         AUTO_INCREMENT PRIMARY KEY,
    prospecto_id            INT         NOT NULL,
    vendedor_id             INT         NOT NULL,
    cotizacion_id           INT,
    numero_venta            VARCHAR(30) NOT NULL UNIQUE,
    producto_id             INT         NOT NULL,
    tipo_producto           CHAR(1)     NOT NULL,
    monto_bruto             DECIMAL(10,2) NOT NULL,
    descuento_porcentaje    DECIMAL(5,2) DEFAULT 0,
    monto_descuento         DECIMAL(10,2) DEFAULT 0,
    monto_neto              DECIMAL(10,2) NOT NULL,
    igv                     DECIMAL(10,2),
    monto_total             DECIMAL(10,2) NOT NULL,
    observaciones_descuento TEXT,
    tipo_comprobante_id     INT         NOT NULL,
    ruc_dni_cliente         VARCHAR(11) NOT NULL,
    razon_social            VARCHAR(150),
    numero_comprobante      VARCHAR(30),
    fecha_venta             DATE        NOT NULL DEFAULT (CURRENT_DATE),
    fecha_pago              DATE,
    pagado                  TINYINT(1)  NOT NULL DEFAULT 0,
    observaciones           TEXT,
    creado_en               TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (prospecto_id) REFERENCES prospectos(id) ON DELETE CASCADE,
    FOREIGN KEY (vendedor_id) REFERENCES usuarios(id),
    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE SET NULL,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (tipo_comprobante_id) REFERENCES tipos_comprobante(id),
    
    INDEX idx_venta_prospecto (prospecto_id),
    INDEX idx_venta_vendedor (vendedor_id),
    INDEX idx_venta_fecha (fecha_venta),
    INDEX idx_venta_producto (producto_id)
);

-- TABLA 16: LOGS DE AUDITORÍA
CREATE TABLE auditoria_logs (
    id              INT         AUTO_INCREMENT PRIMARY KEY,
    usuario_id      INT,
    tabla_afectada  VARCHAR(50) NOT NULL,
    accion          VARCHAR(20) NOT NULL,
    registro_id     INT,
    detalle         TEXT,
    ip_address      VARCHAR(45),
    creado_en       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_log_usuario (usuario_id),
    INDEX idx_log_fecha (creado_en)
);

-- TABLA 17: REPORTES GENERADOS
CREATE TABLE reportes_generados (
    id              INT         AUTO_INCREMENT PRIMARY KEY,
    usuario_id      INT         NOT NULL,
    tipo_reporte    VARCHAR(50) NOT NULL,
    parametros      TEXT,
    nombre_archivo  VARCHAR(200),
    creado_en       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
