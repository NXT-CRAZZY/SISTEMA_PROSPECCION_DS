const bcrypt = require('bcryptjs');
require('dotenv').config();
const mysql = require('mysql2/promise');

async function seed() {
    console.log('Iniciando seed de datos...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'crm_ventas',
        multipleStatements: true
    });

    const passwordHash = await bcrypt.hash('password123', 10);

    // 🔥 LIMPIEZA TOTAL
    await connection.query(`
        SET FOREIGN_KEY_CHECKS = 0;

        TRUNCATE TABLE ventas;
        TRUNCATE TABLE cotizaciones;
        TRUNCATE TABLE demostraciones;
        TRUNCATE TABLE intentos_contacto;
        TRUNCATE TABLE prospectos;
        TRUNCATE TABLE auditoria_logs;
        TRUNCATE TABLE reportes_generados;
        TRUNCATE TABLE usuarios;

        SET FOREIGN_KEY_CHECKS = 1;
    `);

    // 👥 USUARIOS
    await connection.query(`
        INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
        ('Admin Sistema', 'admin@crm.com', ?, 'administrador'),
        ('Carlos Mendoza', 'carlos@crm.com', ?, 'supervisor'),
        ('María García', 'maria@crm.com', ?, 'vendedor'),
        ('Juan Pérez', 'juan@crm.com', ?, 'vendedor'),
        ('Lucía Torres', 'lucia@crm.com', ?, 'vendedor')
    `, [passwordHash, passwordHash, passwordHash, passwordHash, passwordHash]);

    console.log('Usuarios creados');

    const [vendedores] = await connection.query('SELECT id FROM usuarios WHERE rol = "vendedor"');
    const [canales] = await connection.query('SELECT id, codigo FROM canales_origen');
    const [estados] = await connection.query('SELECT id, codigo FROM estados_prospecto');
    const [niveles] = await connection.query('SELECT id, codigo FROM niveles_interes');
    const [productos] = await connection.query('SELECT id, precio_base FROM productos');
    const [canalesContacto] = await connection.query('SELECT id, codigo FROM canales_contacto');
    const [resultados] = await connection.query('SELECT id, codigo, contacto_exitoso FROM resultados_contacto');
    const [logros] = await connection.query('SELECT id, codigo FROM logros_contacto');
    const [modalidades] = await connection.query('SELECT id FROM modalidades_contacto');
    const [tiposComprobante] = await connection.query('SELECT id FROM tipos_comprobante');

    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // 📌 PROSPECTOS
    const prospectosData = [
        { nombre: 'SHARMELY SANDI QUISPE', empresa: 'Sharmely EIRL', ruc: '20116447321', canal: 'W', estado: 'GANADO', nivel: 'M' },
        { nombre: 'CUIDAD SAN MARTIN', empresa: 'Ciudad San Martín S.A.C.', ruc: '20456789012', canal: 'C', estado: 'CONTACTANDO', nivel: 'P' },
        { nombre: 'ASESORÍA CONTABLE DEL SUR', empresa: 'Asesoría Contable Sur S.A.C.', ruc: '20567890123', canal: 'R', estado: 'INTERESADO', nivel: 'M' },
        { nombre: 'DISTRIBUIDORA NORTE', empresa: 'Distribuidora Norte S.A.', ruc: '20678901234', canal: 'T', estado: 'COTIZADO', nivel: 'M' }
    ];

    const prospectosIds = [];

    for (const p of prospectosData) {
        const vendedor = getRandom(vendedores);
        const canal = canales.find(c => c.codigo === p.canal);
        const estado = estados.find(e => e.codigo === p.estado);
        const nivel = niveles.find(n => n.codigo === p.nivel);

        const [res] = await connection.query(`
            INSERT INTO prospectos (
                nombre_contacto, empresa, ruc_dni, tipo_documento,
                canal_origen_id, vendedor_id, estado_id, nivel_interes_id
            ) VALUES (?, ?, ?, 'RUC', ?, ?, ?, ?)
        `, [p.nombre, p.empresa, p.ruc, canal.id, vendedor.id, estado.id, nivel.id]);

        prospectosIds.push({
            id: res.insertId,
            estado: p.estado,
            vendedorId: vendedor.id
        });
    }

    console.log('Prospectos creados');

    // 📞 INTENTOS
    for (const p of prospectosIds) {
        await connection.query(`
            INSERT INTO intentos_contacto (
                prospecto_id, vendedor_id, numero_intento,
                fecha_contacto, canal_contacto_id, resultado_id
            ) VALUES (?, ?, 1, CURDATE(), ?, ?)
        `, [
            p.id,
            p.vendedorId,
            getRandom(canalesContacto).id,
            getRandom(resultados).id
        ]);
    }

    console.log('Intentos creados');

    // 💰 COTIZACIONES
    let correlativoCot = 1;
    const cotizacionesMap = [];

    for (const p of prospectosIds) {
        if (['GANADO', 'COTIZADO'].includes(p.estado)) {
            const producto = getRandom(productos);

            const numeroCot = `COT-TEST-${String(correlativoCot).padStart(4, '0')}`;
            correlativoCot++;

            const [res] = await connection.query(`
                INSERT INTO cotizaciones (
                    prospecto_id, vendedor_id, numero_cotizacion,
                    producto_id, monto, monto_final, estado
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                p.id,
                p.vendedorId,
                numeroCot,
                producto.id,
                producto.precio_base,
                producto.precio_base,
                p.estado === 'GANADO' ? 'ACEPTADA' : 'ENVIADA'
            ]);

            cotizacionesMap.push({
                prospectoId: p.id,
                cotizacionId: res.insertId
            });
        }
    }

    console.log('Cotizaciones creadas');

    // 🧾 VENTAS (CON RELACIÓN A COTIZACIÓN)
    let correlativoVenta = 1;

    for (const p of prospectosIds.filter(x => x.estado === 'GANADO')) {
        const producto = getRandom(productos);

        const cot = cotizacionesMap.find(c => c.prospectoId === p.id);

        const numeroVenta = `VEN-TEST-${String(correlativoVenta).padStart(4, '0')}`;
        correlativoVenta++;

        const monto = producto.precio_base;
        const igv = monto * 0.18;

        await connection.query(`
            INSERT INTO ventas (
                prospecto_id,
                vendedor_id,
                cotizacion_id,
                numero_venta,
                producto_id,
                tipo_producto,
                monto_bruto,
                monto_neto,
                igv,
                monto_total,
                tipo_comprobante_id,
                ruc_dni_cliente,
                fecha_venta,
                pagado
            ) VALUES (?, ?, ?, ?, ?, 'N', ?, ?, ?, ?, ?, ?, CURDATE(), TRUE)
        `, [
            p.id,
            p.vendedorId,
            cot?.cotizacionId || null,
            numeroVenta,
            producto.id,
            monto,
            monto,
            igv,
            monto + igv,
            getRandom(tiposComprobante).id,
            '00000000000'
        ]);
    }

    console.log('Ventas creadas');

    await connection.end();

    console.log('========================================');
    console.log('SEED OK - TODO COHERENTE');
    console.log('========================================');
}

seed().catch(console.error);