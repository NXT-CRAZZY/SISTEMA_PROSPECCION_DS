const pool = require('../../config/database');

const getResumenGeneral = async (req, res) => {
    try {
        const { vendedor_id, fecha_inicio, fecha_fin } = req.query;
        const vendedorFilter = vendedor_id ? 'AND p.vendedor_id = ?' : '';
        const params = [];
        if (vendedor_id) params.push(vendedor_id);
        if (fecha_inicio) params.push(fecha_inicio);
        if (fecha_fin) params.push(fecha_fin);

        let queryWhere = 'WHERE p.activo = TRUE';
        if (fecha_inicio) queryWhere += ' AND p.fecha_registro >= ?';
        if (fecha_fin) queryWhere += ' AND p.fecha_registro <= ?';

        const [[totales]] = await pool.execute(`
            SELECT 
                COUNT(DISTINCT p.id) as total_prospectos,
                COUNT(DISTINCT v.id) as total_ventas,
                COALESCE(SUM(v.monto_neto), 0) as monto_total_ventas,
                COUNT(DISTINCT cot.id) as total_cotizaciones,
                COALESCE(SUM(cot.monto_final), 0) as monto_total_cotizaciones,
                COUNT(DISTINCT d.id) as total_demos
            FROM prospectos p
            LEFT JOIN ventas v ON v.prospecto_id = p.id ${vendedorFilter}
            LEFT JOIN cotizaciones cot ON cot.prospecto_id = p.id ${vendedorFilter}
            LEFT JOIN demostraciones d ON d.prospecto_id = p.id ${vendedorFilter}
            ${queryWhere}
        `, params);

        const tasaConversion = totales.total_prospectos > 0 
            ? ((totales.total_ventas / totales.total_prospectos) * 100).toFixed(2)
            : 0;
        
        const tasaConversionMonto = totales.monto_total_cotizaciones > 0 
            ? ((totales.monto_total_ventas / totales.monto_total_cotizaciones) * 100).toFixed(2)
            : 0;

        res.json({
            success: true,
            data: {
                total_prospectos: totales.total_prospectos,
                total_ventas: totales.total_ventas,
                monto_total_ventas: parseFloat(totales.monto_total_ventas),
                total_cotizaciones: totales.total_cotizaciones,
                monto_total_cotizaciones: parseFloat(totales.monto_total_cotizaciones),
                total_demos: totales.total_demos,
                tasa_conversion_porcentaje: parseFloat(tasaConversion),
                tasa_conversion_monto: parseFloat(tasaConversionMonto)
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const getVentasPorMes = async (req, res) => {
    try {
        const { año } = req.query;
        const anio = año || new Date().getFullYear();

        const [rows] = await pool.execute(`
            SELECT 
                DATE_FORMAT(v.fecha_venta, '%Y-%m') as mes,
                COUNT(*) as cantidad_ventas,
                SUM(v.monto_neto) as monto
            FROM ventas v
            WHERE YEAR(v.fecha_venta) = ?
            GROUP BY DATE_FORMAT(v.fecha_venta, '%Y-%m')
            ORDER BY mes
        `, [anio]);

        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const datos = Array(12).fill(0);
        const cantidades = Array(12).fill(0);

        rows.forEach(row => {
            const mesIndex = parseInt(row.mes.split('-')[1]) - 1;
            datos[mesIndex] = parseFloat(row.monto) || 0;
            cantidades[mesIndex] = row.cantidad_ventas;
        });

        res.json({
            success: true,
            data: {
                labels: meses,
                montos: datos,
                cantidades: cantidades,
                año: anio
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const getProspectosPorEstado = async (req, res) => {
    try {
        const { vendedor_id } = req.query;
        let query = `
            SELECT 
                ep.nombre as estado,
                COUNT(*) as cantidad
            FROM prospectos p
            JOIN estados_prospecto ep ON ep.id = p.estado_id
            WHERE p.activo = TRUE
        `;
        const params = [];
        if (vendedor_id) { query += ' AND p.vendedor_id = ?'; params.push(vendedor_id); }
        query += ' GROUP BY ep.id, ep.nombre ORDER BY cantidad DESC';

        const [rows] = await pool.execute(query, params);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const getProspectosPorCanal = async (req, res) => {
    try {
        const { vendedor_id } = req.query;
        let query = `
            SELECT 
                co.nombre as canal,
                co.codigo,
                COUNT(*) as cantidad
            FROM prospectos p
            JOIN canales_origen co ON co.id = p.canal_origen_id
            WHERE p.activo = TRUE
        `;
        const params = [];
        if (vendedor_id) { query += ' AND p.vendedor_id = ?'; params.push(vendedor_id); }
        query += ' GROUP BY co.id, co.nombre, co.codigo ORDER BY cantidad DESC';

        const [rows] = await pool.execute(query, params);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const getProspectosPorNivelInteres = async (req, res) => {
    try {
        const { vendedor_id } = req.query;
        let query = `
            SELECT 
                COALESCE(ni.nombre, 'Sin definir') as nivel,
                COUNT(*) as cantidad
            FROM prospectos p
            LEFT JOIN niveles_interes ni ON ni.id = p.nivel_interes_id
            WHERE p.activo = TRUE
        `;
        const params = [];
        if (vendedor_id) { query += ' AND p.vendedor_id = ?'; params.push(vendedor_id); }
        query += ' GROUP BY ni.id, ni.nombre ORDER BY cantidad DESC';

        const [rows] = await pool.execute(query, params);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const getTopVendedores = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT 
                u.nombre as vendedor,
                COUNT(DISTINCT p.id) as prospectos,
                COUNT(DISTINCT v.id) as ventas,
                COALESCE(SUM(v.monto_neto), 0) as monto
            FROM usuarios u
            LEFT JOIN prospectos p ON p.vendedor_id = u.id AND p.activo = TRUE
            LEFT JOIN ventas v ON v.vendedor_id = u.id
            WHERE u.rol = 'vendedor' AND u.activo = TRUE
            GROUP BY u.id, u.nombre
            ORDER BY monto DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const getActividadReciente = async (req, res) => {
    try {
        const { limite = 10 } = req.query;

        const [intentos] = await pool.execute(`
            SELECT 
                'contacto' as tipo,
                ic.fecha_contacto as fecha,
                p.nombre_contacto as prospecto,
                cc.nombre as canal,
                rc.nombre as resultado,
                u.nombre as vendedor
            FROM intentos_contacto ic
            JOIN prospectos p ON p.id = ic.prospecto_id
            JOIN canales_contacto cc ON cc.id = ic.canal_contacto_id
            JOIN resultados_contacto rc ON rc.id = ic.resultado_id
            JOIN usuarios u ON u.id = ic.vendedor_id
            ORDER BY ic.creado_en DESC
            LIMIT ?
        `, [parseInt(limite)]);

        const [ventas] = await pool.execute(`
            SELECT 
                'venta' as tipo,
                v.fecha_venta as fecha,
                p.nombre_contacto as prospecto,
                prod.nombre as producto,
                v.monto_neto as monto,
                u.nombre as vendedor
            FROM ventas v
            JOIN prospectos p ON p.id = v.prospecto_id
            JOIN productos prod ON prod.id = v.producto_id
            JOIN usuarios u ON u.id = v.vendedor_id
            ORDER BY v.creado_en DESC
            LIMIT ?
        `, [parseInt(limite)]);

        const actividad = [...intentos.map(i => ({...i, detalle: i.resultado})), ...ventas.map(v => ({...v, canal: v.producto, detalle: `S/. ${v.monto}`}))]
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, parseInt(limite));

        res.json({
            success: true,
            data: actividad
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const getProximasAcciones = async (req, res) => {
    try {
        const { vendedor_id } = req.query;
        let query = `
            SELECT 
                p.id,
                p.nombre_contacto,
                p.empresa,
                p.telefono,
                p.proxima_accion,
                p.fecha_proxima_accion,
                u.nombre as vendedor_nombre
            FROM prospectos p
            JOIN usuarios u ON u.id = p.vendedor_id
            WHERE p.activo = TRUE 
                AND p.fecha_proxima_accion IS NOT NULL
                AND p.fecha_proxima_accion >= CURDATE()
        `;
        const params = [];
        if (vendedor_id) { query += ' AND p.vendedor_id = ?'; params.push(vendedor_id); }
        query += ' ORDER BY p.fecha_proxima_accion ASC LIMIT 20';

        const [rows] = await pool.execute(query, params);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

module.exports = {
    getResumenGeneral,
    getVentasPorMes,
    getProspectosPorEstado,
    getProspectosPorCanal,
    getProspectosPorNivelInteres,
    getTopVendedores,
    getActividadReciente,
    getProximasAcciones
};
