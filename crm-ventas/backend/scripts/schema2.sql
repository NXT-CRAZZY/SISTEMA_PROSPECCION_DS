
-- ============================================================
-- CRM COMERCIAL - Base de datos completa (MySQL Compatible)
-- ============================================================

CREATE DATABASE IF NOT EXISTS crm_ventas2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crm_ventas2;

-- TABLA 1: USUARIOS (Vendedores, Supervisores, Admins)
CREATE TABLE usuarios (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100)    NOT NULL,
    email           VARCHAR(150)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    rol             VARCHAR(20)     NOT NULL,
    activo          BOOLEAN         NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_usuarios_rol CHECK (rol IN ('vendedor', 'supervisor', 'administrador'))
);

-- TABLA 2: CANALES DE ORIGEN DEL PROSPECTO
CREATE TABLE canales_origen (
    id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo  CHAR(1)     NOT NULL UNIQUE,
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
    id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
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
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo              VARCHAR(20) NOT NULL UNIQUE,
    nombre              VARCHAR(80) NOT NULL,
    canal_contacto_id   BIGINT UNSIGNED,
    contacto_exitoso    BOOLEAN     NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_resultados_canal FOREIGN KEY (canal_contacto_id) REFERENCES canales_contacto(id)
);

INSERT INTO resultados_contacto (codigo, nombre, canal_contacto_id, contacto_exitoso) VALUES
    ('TEL_EFECTIVA',    'Llamada efectiva',         1, TRUE),
    ('TEL_OCUPADO',     'Ocupado / No disponible',  1, FALSE),
    ('TEL_NO_CONTEST',  'No contestó',              1, FALSE),
    ('TEL_EQUIVOCADO',  'Número equivocado',         1, FALSE),
    ('WA_CONVERSACION', 'Conversación iniciada',    2, TRUE),
    ('WA_LEIDO',        'Leído sin respuesta',      2, FALSE),
    ('WA_ENVIADO',      'Enviado sin leer',         2, FALSE),
    ('EMAIL_RESPONDIDO','Respondió el correo',      3, TRUE),
    ('EMAIL_ENVIADO',   'Enviado sin respuesta',    3, FALSE),
    ('VIS_REUNION',     'Reunión efectiva',         4, TRUE),
    ('VIS_FILTRO',      'Atendido por filtro',       4, FALSE),
    ('VIS_AUSENTE',     'Prospecto ausente',         4, FALSE),
    ('ZOOM_EFECTIVA',   'Videollamada efectiva',    5, TRUE),
    ('ZOOM_NO_CONECT',  'No se conectó',            5, FALSE);

-- TABLA 5: LOGROS DEL CONTACTO
CREATE TABLE logros_contacto (
    id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo  CHAR(1)     NOT NULL UNIQUE,
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
    id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo  CHAR(1)     NOT NULL UNIQUE,
    nombre  VARCHAR(30) NOT NULL
);

INSERT INTO modalidades_contacto (codigo, nombre) VALUES
    ('P', 'Presencial'),
    ('R', 'Remoto');

-- TABLA 7: NIVEL DE INTERÉS
CREATE TABLE niveles_interes (
    id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo  CHAR(1)     NOT NULL UNIQUE,
    nombre  VARCHAR(30) NOT NULL,
    peso    INT         NOT NULL
);

INSERT INTO niveles_interes (codigo, nombre, peso) VALUES
    ('M', 'Muy interesado (Hot)',    3),
    ('P', 'Poco interesado (Warm)',  2),
    ('N', 'Nada interesado (Cold)',  1);

-- TABLA 8: PRODUCTOS
CREATE TABLE productos (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo      VARCHAR(20)     NOT NULL UNIQUE,
    nombre      VARCHAR(100)    NOT NULL,
    descripcion TEXT,
    precio_base DECIMAL(10,2),
    activo      BOOLEAN         NOT NULL DEFAULT TRUE
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
    id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo  VARCHAR(10) NOT NULL UNIQUE,
    nombre  VARCHAR(50) NOT NULL
);

INSERT INTO tipos_comprobante (codigo, nombre) VALUES
    ('FAC', 'Factura'),
    ('BOL', 'Boleta de venta'),
    ('NC',  'Nota de crédito');

-- TABLA 10: ESTADOS DEL PROSPECTO
CREATE TABLE estados_prospecto (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo      VARCHAR(20) NOT NULL UNIQUE,
    nombre      VARCHAR(50) NOT NULL,
    descripcion VARCHAR(200),
    es_activo   BOOLEAN     NOT NULL DEFAULT TRUE
);

INSERT INTO estados_prospecto (codigo, nombre, es_activo) VALUES
    ('NUEVO',       'Nuevo',                    TRUE),
    ('CONTACTANDO', 'En contacto',              TRUE),
    ('INTERESADO',  'Interesado',               TRUE),
    ('COTIZADO',    'Cotización enviada',        TRUE),
    ('DEMO',        'Demo / Capacitación prog.', TRUE),
    ('NEGOCIANDO',  'En negociación',            TRUE),
    ('GANADO',      'Venta cerrada (Ganado)',    FALSE),
    ('PERDIDO',     'No concretó (Perdido)',     FALSE),
    ('DESCARTADO',  'Descartado',               FALSE);

-- TABLA 11: PROSPECTOS
CREATE TABLE prospectos (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    numero_prospecto    VARCHAR(20)     NOT NULL UNIQUE,
    nombre_contacto     VARCHAR(150)    NOT NULL,
    empresa             VARCHAR(150),
    ruc_dni             VARCHAR(11),
    tipo_documento      CHAR(3),
    telefono            VARCHAR(20),
    email               VARCHAR(150),
    cargo               VARCHAR(80),
    canal_origen_id     BIGINT UNSIGNED NOT NULL,
    vendedor_id         BIGINT UNSIGNED NOT NULL,
    estado_id           BIGINT UNSIGNED NOT NULL DEFAULT 1,
    nivel_interes_id    BIGINT UNSIGNED,
    proxima_accion      VARCHAR(100),
    fecha_proxima_accion DATE,
    ciudad              VARCHAR(80),
    observaciones_generales TEXT,
    fecha_registro      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_actividad TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo              BOOLEAN         NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_prospectos_tipo_doc CHECK (tipo_documento IN ('RUC','DNI')),
    CONSTRAINT fk_prospectos_canal FOREIGN KEY (canal_origen_id) REFERENCES canales_origen(id),
    CONSTRAINT fk_prospectos_vendedor FOREIGN KEY (vendedor_id) REFERENCES usuarios(id),
    CONSTRAINT fk_prospectos_estado FOREIGN KEY (estado_id) REFERENCES estados_prospecto(id),
    CONSTRAINT fk_prospectos_nivel FOREIGN KEY (nivel_interes_id) REFERENCES niveles_interes(id)
);

CREATE INDEX idx_prospectos_vendedor  ON prospectos(vendedor_id);
CREATE INDEX idx_prospectos_estado    ON prospectos(estado_id);
CREATE INDEX idx_prospectos_fecha_reg ON prospectos(fecha_registro);

-- TABLA 12: INTENTOS DE CONTACTO
CREATE TABLE intentos_contacto (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    prospecto_id        BIGINT UNSIGNED NOT NULL,
    vendedor_id         BIGINT UNSIGNED NOT NULL,
    numero_intento      INT         NOT NULL,
    fecha_contacto      DATE        NOT NULL DEFAULT (CURRENT_DATE),
    canal_contacto_id   BIGINT UNSIGNED NOT NULL,
    modalidad_id        BIGINT UNSIGNED,
    resultado_id        BIGINT UNSIGNED NOT NULL,
    logro_id            BIGINT UNSIGNED,
    nivel_interes_id    BIGINT UNSIGNED,
    proxima_accion      VARCHAR(100),
    fecha_proxima_accion DATE,
    observaciones       TEXT,
    creado_en           TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_prospecto_intento (prospecto_id, numero_intento),
    CONSTRAINT fk_intentos_prospecto FOREIGN KEY (prospecto_id) REFERENCES prospectos(id),
    CONSTRAINT fk_intentos_vendedor FOREIGN KEY (vendedor_id) REFERENCES usuarios(id),
    CONSTRAINT fk_intentos_canal FOREIGN KEY (canal_contacto_id) REFERENCES canales_contacto(id),
    CONSTRAINT fk_intentos_modalidad FOREIGN KEY (modalidad_id) REFERENCES modalidades_contacto(id),
    CONSTRAINT fk_intentos_resultado FOREIGN KEY (resultado_id) REFERENCES resultados_contacto(id),
    CONSTRAINT fk_intentos_logro FOREIGN KEY (logro_id) REFERENCES logros_contacto(id),
    CONSTRAINT fk_intentos_nivel FOREIGN KEY (nivel_interes_id) REFERENCES niveles_interes(id)
);

CREATE INDEX idx_contacto_prospecto   ON intentos_contacto(prospecto_id);
CREATE INDEX idx_contacto_vendedor    ON intentos_contacto(vendedor_id);
CREATE INDEX idx_contacto_fecha       ON intentos_contacto(fecha_contacto);

-- TABLA 13: DEMOSTRACIONES
CREATE TABLE demostraciones (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    prospecto_id        BIGINT UNSIGNED NOT NULL,
    vendedor_id         BIGINT UNSIGNED NOT NULL,
    intento_contacto_id BIGINT UNSIGNED,
    tipo                VARCHAR(20)     NOT NULL,
    modalidad_id        BIGINT UNSIGNED,
    producto_id         BIGINT UNSIGNED,
    fecha_programada    TIMESTAMP       NOT NULL,
    fecha_realizada     TIMESTAMP,
    duracion_minutos    INT,
    resultado           VARCHAR(20)     DEFAULT 'PENDIENTE',
    observaciones       TEXT,
    creado_en           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_demos_tipo CHECK (tipo IN ('DEMO', 'CAPACITACION', 'PRESENTACION')),
    CONSTRAINT chk_demos_resultado CHECK (resultado IN ('EXITOSA','REPROGRAMADA','CANCELADA','PENDIENTE')),
    CONSTRAINT fk_demos_prospecto FOREIGN KEY (prospecto_id) REFERENCES prospectos(id),
    CONSTRAINT fk_demos_vendedor FOREIGN KEY (vendedor_id) REFERENCES usuarios(id),
    CONSTRAINT fk_demos_intento FOREIGN KEY (intento_contacto_id) REFERENCES intentos_contacto(id),
    CONSTRAINT fk_demos_modalidad FOREIGN KEY (modalidad_id) REFERENCES modalidades_contacto(id),
    CONSTRAINT fk_demos_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE INDEX idx_demo_prospecto ON demostraciones(prospecto_id);
CREATE INDEX idx_demo_fecha     ON demostraciones(fecha_programada);

-- TABLA 14: COTIZACIONES
CREATE TABLE cotizaciones (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    prospecto_id        BIGINT UNSIGNED NOT NULL,
    vendedor_id         BIGINT UNSIGNED NOT NULL,
    intento_contacto_id BIGINT UNSIGNED,
    numero_cotizacion   VARCHAR(30)     NOT NULL UNIQUE,
    producto_id         BIGINT UNSIGNED NOT NULL,
    monto               DECIMAL(10,2)   NOT NULL,
    descuento_porcentaje DECIMAL(5,2)   DEFAULT 0,
    monto_final         DECIMAL(10,2)   NOT NULL,
    observaciones_descuento TEXT,
    fecha_cotizacion    DATE            NOT NULL DEFAULT (CURRENT_DATE),
    fecha_vencimiento   DATE,
    estado              VARCHAR(20)     NOT NULL DEFAULT 'ENVIADA',
    creado_en           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_cotizaciones_monto CHECK (monto > 0),
    CONSTRAINT chk_cotizaciones_estado CHECK (estado IN ('ENVIADA','ACEPTADA','RECHAZADA','VENCIDA')),
    CONSTRAINT fk_cotizaciones_prospecto FOREIGN KEY (prospecto_id) REFERENCES prospectos(id),
    CONSTRAINT fk_cotizaciones_vendedor FOREIGN KEY (vendedor_id) REFERENCES usuarios(id),
    CONSTRAINT fk_cotizaciones_intento FOREIGN KEY (intento_contacto_id) REFERENCES intentos_contacto(id),
    CONSTRAINT fk_cotizaciones_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE INDEX idx_cotizacion_prospecto ON cotizaciones(prospecto_id);
CREATE INDEX idx_cotizacion_fecha     ON cotizaciones(fecha_cotizacion);

-- TABLA 15: VENTAS
CREATE TABLE ventas (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    prospecto_id        BIGINT UNSIGNED NOT NULL,
    vendedor_id         BIGINT UNSIGNED NOT NULL,
    cotizacion_id       BIGINT UNSIGNED,
    numero_venta        VARCHAR(30)     NOT NULL UNIQUE,
    producto_id         BIGINT UNSIGNED NOT NULL,
    tipo_producto       CHAR(1)         NOT NULL,
    monto_bruto         DECIMAL(10,2)   NOT NULL,
    descuento_porcentaje DECIMAL(5,2)   DEFAULT 0,
    monto_descuento     DECIMAL(10,2)   DEFAULT 0,
    monto_neto          DECIMAL(10,2)   NOT NULL,
    igv                 DECIMAL(10,2),
    monto_total         DECIMAL(10,2)   NOT NULL,
    observaciones_descuento TEXT,
    tipo_comprobante_id BIGINT UNSIGNED NOT NULL,
    ruc_dni_cliente     VARCHAR(11)     NOT NULL,
    razon_social        VARCHAR(150),
    numero_comprobante  VARCHAR(30),
    fecha_venta         DATE            NOT NULL DEFAULT (CURRENT_DATE),
    fecha_pago          DATE,
    pagado              BOOLEAN         NOT NULL DEFAULT FALSE,
    observaciones       TEXT,
    creado_en           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_ventas_tipo_producto CHECK (tipo_producto IN ('N','A')),
    CONSTRAINT chk_ventas_monto_bruto CHECK (monto_bruto > 0),
    CONSTRAINT fk_ventas_prospecto FOREIGN KEY (prospecto_id) REFERENCES prospectos(id),
    CONSTRAINT fk_ventas_vendedor FOREIGN KEY (vendedor_id) REFERENCES usuarios(id),
    CONSTRAINT fk_ventas_cotizacion FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id),
    CONSTRAINT fk_ventas_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
    CONSTRAINT fk_ventas_tipo_comprobante FOREIGN KEY (tipo_comprobante_id) REFERENCES tipos_comprobante(id)
);

CREATE INDEX idx_venta_prospecto  ON ventas(prospecto_id);
CREATE INDEX idx_venta_vendedor   ON ventas(vendedor_id);
CREATE INDEX idx_venta_fecha      ON ventas(fecha_venta);
CREATE INDEX idx_venta_producto   ON ventas(producto_id);

-- TABLA 16: LOGS DE AUDITORÍA
CREATE TABLE auditoria_logs (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id      BIGINT UNSIGNED,
    tabla_afectada  VARCHAR(50)     NOT NULL,
    accion          VARCHAR(20)     NOT NULL,
    registro_id     INT,
    detalle         TEXT,
    ip_address      VARCHAR(45),
    creado_en       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_auditoria_accion CHECK (accion IN ('INSERT','UPDATE','DELETE','LOGIN','EXPORT','LOGOUT','VIEW')),
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX idx_log_usuario ON auditoria_logs(usuario_id);
CREATE INDEX idx_log_fecha   ON auditoria_logs(creado_en);

-- TABLA 17: REPORTES GENERADOS
CREATE TABLE reportes_generados (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id      BIGINT UNSIGNED NOT NULL,
    tipo_reporte    VARCHAR(50)     NOT NULL,
    parametros      TEXT,
    nombre_archivo  VARCHAR(200),
    creado_en       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reportes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- TRIGGER PARA GENERAR NÚMERO DE PROSPECTO
DELIMITER //

CREATE TRIGGER trg_numero_prospecto
BEFORE INSERT ON prospectos
FOR EACH ROW
BEGIN
    DECLARE anio VARCHAR(4);
    DECLARE correlativo INT;
    
    IF NEW.numero_prospecto IS NULL OR NEW.numero_prospecto = '' THEN
        SET anio = YEAR(NOW());
        
        SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(numero_prospecto, '-', -1) AS UNSIGNED)), 0) + 1
        INTO correlativo
        FROM prospectos
        WHERE numero_prospecto LIKE CONCAT('PROS-', anio, '-%');
        
        SET NEW.numero_prospecto = CONCAT('PROS-', anio, '-', LPAD(correlativo, 4, '0'));
    END IF;
END//

DELIMITER ;