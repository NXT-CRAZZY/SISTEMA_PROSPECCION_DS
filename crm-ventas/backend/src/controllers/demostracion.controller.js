const pool = require('../../config/database');
const { registrarLog, TipoAccion } = require('../services/auditoria.service');

const getAll = async (req, res) => {
    try {
        const { prospecto_id, vendedor_id, resultado, limite = 100 } = req.query;

        let query = `
            SELECT 
                d.*,
                p.nombre_contacto as prospecto_nombre,
                p.empresa as prospecto_empresa,
                u.nombre as vendedor_nombre,
                prod.nombre as producto_nombre,
                mc.nombre as modalidad_nombre
            FROM demostraciones d
            LEFT JOIN prospectos p ON p.id = d.prospecto_id
            LEFT JOIN usuarios u ON u.id = d.vendedor_id
            LEFT JOIN productos prod ON prod.id = d.producto_id
            LEFT JOIN modalidades_contacto mc ON mc.id = d.modalidad_id
            WHERE 1=1
        `;

        const params = [];

        if (prospecto_id) { query += ' AND d.prospecto_id = ?'; params.push(prospecto_id); }
        if (vendedor_id) { query += ' AND d.vendedor_id = ?'; params.push(vendedor_id); }
        if (resultado) { query += ' AND d.resultado = ?'; params.push(resultado); }

        query += ' ORDER BY d.fecha_programada DESC LIMIT ?';
        const limiteNum = parseInt(limite) || 100;
        params.push(limiteNum);

        const [rows] = await pool.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const create = async (req, res) => {
    try {
        const { prospecto_id, intento_contacto_id, tipo, modalidad_id, producto_id, fecha_programada, duracion_minutos, observaciones } = req.body;

        if (!prospecto_id || !tipo || !fecha_programada) {
            return res.status(400).json({ success: false, message: 'Datos requeridos faltantes' });
        }

        const [result] = await pool.execute(`
            INSERT INTO demostraciones (prospecto_id, vendedor_id, intento_contacto_id, tipo, modalidad_id, producto_id, fecha_programada, duracion_minutos, observaciones)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [prospecto_id, req.user.id, intento_contacto_id, tipo, modalidad_id, producto_id, fecha_programada, duracion_minutos, observaciones]);

        const [[estadoDemo]] = await pool.execute(
            'SELECT id FROM estados_prospecto WHERE codigo = ?',
            ['DEMO']
        );
        if (estadoDemo) {
            await pool.execute(
                'UPDATE prospectos SET estado_id = ?, fecha_ultima_actividad = NOW() WHERE id = ?',
                [estadoDemo.id, prospecto_id]
            );
        }

        await registrarLog(req.user.id, 'demostraciones', TipoAccion.INSERT, result.insertId, { prospecto_id }, req.ip);

        res.status(201).json({ success: true, message: 'Demostración programada', data: { id: result.insertId } });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_realizada, resultado, observaciones } = req.body;

        await pool.execute(`
            UPDATE demostraciones SET 
                fecha_realizada = COALESCE(?, fecha_realizada),
                resultado = COALESCE(?, resultado),
                observaciones = COALESCE(?, observaciones)
            WHERE id = ?
        `, [fecha_realizada, resultado, observaciones, id]);

        await registrarLog(req.user.id, 'demostraciones', TipoAccion.UPDATE, id, req.body, req.ip);

        res.json({ success: true, message: 'Demostración actualizada' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

module.exports = { getAll, create, update };
