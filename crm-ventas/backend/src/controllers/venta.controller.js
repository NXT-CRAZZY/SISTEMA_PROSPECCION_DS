const pool = require('../../config/database');
const { registrarLog, TipoAccion } = require('../../services/auditoria.service');

const getAll = async (req, res) => {
    try {
        const { vendedor_id, producto_id, fecha_inicio, fecha_fin, limite = 100 } = req.query;

        let query = `
            SELECT 
                v.*,
                p.nombre_contacto as prospecto_nombre,
                p.empresa as prospecto_empresa,
                p.ruc_dni as prospecto_ruc,
                u.nombre as vendedor_nombre,
                prod.nombre as producto_nombre,
                prod.codigo as producto_codigo,
                tc.nombre as tipo_comprobante_nombre
            FROM ventas v
            LEFT JOIN prospectos p ON p.id = v.prospecto_id
            LEFT JOIN usuarios u ON u.id = v.vendedor_id
            LEFT JOIN productos prod ON prod.id = v.producto_id
            LEFT JOIN tipos_comprobante tc ON tc.id = v.tipo_comprobante_id
            WHERE 1=1
        `;

        const params = [];
        if (vendedor_id) { query += ' AND v.vendedor_id = ?'; params.push(vendedor_id); }
        if (producto_id) { query += ' AND v.producto_id = ?'; params.push(producto_id); }
        if (fecha_inicio) { query += ' AND v.fecha_venta >= ?'; params.push(fecha_inicio); }
        if (fecha_fin) { query += ' AND v.fecha_venta <= ?'; params.push(fecha_fin); }

        query += ' ORDER BY v.fecha_venta DESC LIMIT ?';
        params.push(parseInt(limite));

        const [rows] = await pool.execute(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const create = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { prospecto_id, cotizacion_id, producto_id, tipo_producto, monto_bruto, descuento_porcentaje, observaciones_descuento, tipo_comprobante_id, ruc_dni_cliente, razon_social, numero_comprobante, fecha_pago, observaciones } = req.body;

        if (!prospecto_id || !producto_id || !monto_bruto || !tipo_comprobante_id) {
            return res.status(400).json({ success: false, message: 'Datos requeridos faltantes' });
        }

        const montoDescuento = monto_bruto * (descuento_porcentaje || 0) / 100;
        const montoNeto = monto_bruto - montoDescuento;
        const igv = montoNeto * 0.18;
        const montoTotal = montoNeto + igv;

        const [result] = await connection.execute(`
            INSERT INTO ventas (
                prospecto_id, vendedor_id, cotizacion_id, producto_id, tipo_producto,
                monto_bruto, descuento_porcentaje, monto_descuento, monto_neto, igv, monto_total,
                observaciones_descuento, tipo_comprobante_id, ruc_dni_cliente, razon_social,
                numero_comprobante, fecha_pago, observaciones
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [prospecto_id, req.user.id, cotizacion_id, producto_id, tipo_producto || 'N', monto_bruto, descuento_porcentaje || 0, montoDescuento, montoNeto, igv, montoTotal, observaciones_descuento, tipo_comprobante_id, ruc_dni_cliente, razon_social, numero_comprobante, fecha_pago, observaciones]);

        await connection.execute(
            'UPDATE prospectos SET estado_id = (SELECT id FROM estados_prospecto WHERE codigo = ?), fecha_ultima_actividad = NOW() WHERE id = ?',
            ['GANADO', prospecto_id]
        );

        if (cotizacion_id) {
            await connection.execute("UPDATE cotizaciones SET estado = 'ACEPTADA' WHERE id = ?", [cotizacion_id]);
        }

        await connection.commit();

        await registrarLog(req.user.id, 'ventas', TipoAccion.INSERT, result.insertId, { prospecto_id, monto_total: montoTotal }, req.ip);

        res.status(201).json({ success: true, message: 'Venta registrada exitosamente', data: { id: result.insertId, monto_total: montoTotal } });
    } catch (error) {
        await connection.rollback();
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    } finally {
        connection.release();
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { numero_comprobante, fecha_pago, pagado, observaciones } = req.body;

        await pool.execute(`
            UPDATE ventas SET 
                numero_comprobante = COALESCE(?, numero_comprobante),
                fecha_pago = COALESCE(?, fecha_pago),
                pagado = COALESCE(?, pagado),
                observaciones = COALESCE(?, observaciones)
            WHERE id = ?
        `, [numero_comprobante, fecha_pago, pagado, observaciones, id]);

        await registrarLog(req.user.id, 'ventas', TipoAccion.UPDATE, id, req.body, req.ip);

        res.json({ success: true, message: 'Venta actualizada' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

module.exports = { getAll, create, update };
