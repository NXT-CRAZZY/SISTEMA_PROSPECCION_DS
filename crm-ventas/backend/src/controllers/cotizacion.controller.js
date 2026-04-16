const pool = require('../../config/database');
const { registrarLog, TipoAccion } = require('../services/auditoria.service');

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
        const limiteNum = parseInt(limite) || 100;
        params.push(limiteNum);

        const [rows] = await pool.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const generateNumeroCotizacion = async (pool) => {
    const year = new Date().getFullYear();
    const [rows] = await pool.execute(`
        SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(numero_cotizacion, '-', -1) AS UNSIGNED)), 0) + 1 as siguiente
        FROM cotizaciones
        WHERE numero_cotizacion LIKE ?
    `, [`COT-${year}-%`]);
    const correlativo = rows[0]?.siguiente || 1;
    return `COT-${year}-${String(correlativo).padStart(4, '0')}`;
};

const create = async (req, res) => {
    try {
        const { prospecto_id, intento_contacto_id, producto_id, monto, descuento_porcentaje, observaciones_descuento, fecha_vencimiento } = req.body;

        if (!prospecto_id || !producto_id || !monto) {
            return res.status(400).json({ success: false, message: 'Datos requeridos faltantes' });
        }

        const numeroCotizacion = await generateNumeroCotizacion(pool);
        const montoDescuento = monto * (descuento_porcentaje || 0) / 100;
        const montoFinal = monto - montoDescuento;

        const [result] = await pool.execute(`
            INSERT INTO cotizaciones (
                prospecto_id, vendedor_id, intento_contacto_id, numero_cotizacion, producto_id,
                monto, descuento_porcentaje, monto_final,
                observaciones_descuento, fecha_vencimiento
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [prospecto_id, req.user.id, intento_contacto_id, numeroCotizacion, producto_id, monto, descuento_porcentaje || 0, montoFinal, observaciones_descuento, fecha_vencimiento]);

        const [[estadoCotizado]] = await pool.execute(
            'SELECT id FROM estados_prospecto WHERE codigo = ?',
            ['COTIZADO']
        );
        if (estadoCotizado) {
            await pool.execute(
                'UPDATE prospectos SET estado_id = ?, fecha_ultima_actividad = NOW() WHERE id = ?',
                [estadoCotizado.id, prospecto_id]
            );
        }

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

        const updates = [];
        const params = [];

        if (estado !== undefined) {
            updates.push('estado = ?');
            params.push(estado);
        }
        if (monto !== undefined) {
            const montoDescuento = monto * (descuento_porcentaje || 0) / 100;
            const montoFinal = monto - montoDescuento;
            updates.push('monto = ?', 'descuento_porcentaje = ?', 'monto_final = ?');
            params.push(monto, descuento_porcentaje || 0, montoFinal);
        }
        if (observaciones_descuento !== undefined) {
            updates.push('observaciones_descuento = ?');
            params.push(observaciones_descuento);
        }
        if (fecha_vencimiento !== undefined) {
            updates.push('fecha_vencimiento = ?');
            params.push(fecha_vencimiento);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
        }

        params.push(id);
        await pool.execute(`UPDATE cotizaciones SET ${updates.join(', ')} WHERE id = ?`, params);

        await registrarLog(req.user.id, 'cotizaciones', TipoAccion.UPDATE, id, req.body, req.ip);

        res.json({ success: true, message: 'Cotización actualizada' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

module.exports = { getAll, create, update };
