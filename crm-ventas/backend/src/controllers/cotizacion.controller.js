const pool = require('../../config/database');
const { registrarLog, TipoAccion } = require('../../services/auditoria.service');

const getAll = async (req, res) => {
    try {
        const { prospecto_id, vendedor_id, estado, limite = 100 } = req.query;

        let query = `
            SELECT 
                c.*,
                p.nombre_contacto as prospecto_nombre,
                p.empresa as prospecto_empresa,
                u.nombre as vendedor_nombre,
                prod.nombre as producto_nombre,
                prod.codigo as producto_codigo
            FROM cotizaciones c
            LEFT JOIN prospectos p ON p.id = c.prospecto_id
            LEFT JOIN usuarios u ON u.id = c.vendedor_id
            LEFT JOIN productos prod ON prod.id = c.producto_id
            WHERE 1=1
        `;

        const params = [];
        if (prospecto_id) { query += ' AND c.prospecto_id = ?'; params.push(prospecto_id); }
        if (vendedor_id) { query += ' AND c.vendedor_id = ?'; params.push(vendedor_id); }
        if (estado) { query += ' AND c.estado = ?'; params.push(estado); }

        query += ' ORDER BY c.fecha_cotizacion DESC LIMIT ?';
        params.push(parseInt(limite));

        const [rows] = await pool.execute(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const create = async (req, res) => {
    try {
        const { prospecto_id, intento_contacto_id, producto_id, monto, descuento_porcentaje, observaciones_descuento, fecha_vencimiento } = req.body;

        if (!prospecto_id || !producto_id || !monto) {
            return res.status(400).json({ success: false, message: 'Datos requeridos faltantes' });
        }

        const montoDescuento = monto * (descuento_porcentaje || 0) / 100;
        const montoFinal = monto - montoDescuento;

        const [result] = await pool.execute(`
            INSERT INTO cotizaciones (
                prospecto_id, vendedor_id, intento_contacto_id, producto_id,
                monto, descuento_porcentaje, monto_descuento, monto_final,
                observaciones_descuento, fecha_vencimiento
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [prospecto_id, req.user.id, intento_contacto_id, producto_id, monto, descuento_porcentaje || 0, montoDescuento, montoFinal, observaciones_descuento, fecha_vencimiento]);

        await pool.execute(
            'UPDATE prospectos SET estado_id = (SELECT id FROM estados_prospecto WHERE codigo = ?), fecha_ultima_actividad = NOW() WHERE id = ?',
            ['COTIZADO', prospecto_id]
        );

        await registrarLog(req.user.id, 'cotizaciones', TipoAccion.INSERT, result.insertId, { prospecto_id, monto: montoFinal }, req.ip);

        res.status(201).json({ success: true, message: 'Cotización creada', data: { id: result.insertId, monto_final: montoFinal } });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, monto, descuento_porcentaje, observaciones_descuento, fecha_vencimiento } = req.body;

        let montoDescuento = 0;
        let montoFinal = monto;

        if (monto !== undefined) {
            montoDescuento = monto * (descuento_porcentaje || 0) / 100;
            montoFinal = monto - montoDescuento;
        }

        await pool.execute(`
            UPDATE cotizaciones SET 
                estado = COALESCE(?, estado),
                monto = COALESCE(?, monto),
                descuento_porcentaje = COALESCE(?, descuento_porcentaje),
                monto_descuento = ?,
                monto_final = ?,
                observaciones_descuento = COALESCE(?, observaciones_descuento),
                fecha_vencimiento = COALESCE(?, fecha_vencimiento)
            WHERE id = ?
        `, [estado, monto, descuento_porcentaje, montoDescuento, montoFinal, observaciones_descuento, fecha_vencimiento, id]);

        await registrarLog(req.user.id, 'cotizaciones', TipoAccion.UPDATE, id, req.body, req.ip);

        res.json({ success: true, message: 'Cotización actualizada' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

module.exports = { getAll, create, update };
