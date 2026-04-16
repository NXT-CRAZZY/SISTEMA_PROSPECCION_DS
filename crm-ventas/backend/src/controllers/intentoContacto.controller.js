const pool = require('../../config/database');
const { registrarLog, TipoAccion } = require('../services/auditoria.service');

const getAll = async (req, res) => {
    try {
        const { prospecto_id, vendedor_id, fecha_inicio, fecha_fin, limite = 100 } = req.query;

        let query = `
            SELECT 
                ic.*,
                p.nombre_contacto as prospecto_nombre,
                p.empresa as prospecto_empresa,
                u.nombre as vendedor_nombre,
                cc.nombre as canal_contacto_nombre,
                cc.codigo as canal_contacto_codigo,
                rc.nombre as resultado_nombre,
                rc.codigo as resultado_codigo,
                rc.contacto_exitoso,
                mc.nombre as modalidad_nombre,
                lc.nombre as logro_nombre,
                lc.codigo as logro_codigo,
                ni.nombre as nivel_interes_nombre
            FROM intentos_contacto ic
            LEFT JOIN prospectos p ON p.id = ic.prospecto_id
            LEFT JOIN usuarios u ON u.id = ic.vendedor_id
            LEFT JOIN canales_contacto cc ON cc.id = ic.canal_contacto_id
            LEFT JOIN resultados_contacto rc ON rc.id = ic.resultado_id
            LEFT JOIN modalidades_contacto mc ON mc.id = ic.modalidad_id
            LEFT JOIN logros_contacto lc ON lc.id = ic.logro_id
            LEFT JOIN niveles_interes ni ON ni.id = ic.nivel_interes_id
            WHERE 1=1
        `;

        const params = [];

        if (prospecto_id) {
            query += ' AND ic.prospecto_id = ?';
            params.push(prospecto_id);
        }
        if (vendedor_id) {
            query += ' AND ic.vendedor_id = ?';
            params.push(vendedor_id);
        }
        if (fecha_inicio) {
            query += ' AND ic.fecha_contacto >= ?';
            params.push(fecha_inicio);
        }
        if (fecha_fin) {
            query += ' AND ic.fecha_contacto <= ?';
            params.push(fecha_fin);
        }

        query += ' ORDER BY ic.fecha_contacto DESC, ic.creado_en DESC LIMIT ?';
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
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { prospecto_id, canal_contacto_id, modalidad_id, resultado_id, logro_id, nivel_interes_id, proxima_accion, fecha_proxima_accion, observaciones, fecha_contacto } = req.body;

        if (!prospecto_id || !canal_contacto_id || !resultado_id) {
            return res.status(400).json({ success: false, message: 'Datos requeridos faltantes' });
        }

        const [[resultado]] = await connection.execute(
            'SELECT contacto_exitoso FROM resultados_contacto WHERE id = ?',
            [resultado_id]
        );

        const contactoExitoso = resultado?.contacto_exitoso || false;

        let numeroIntento = 1;
        if (contactoExitoso) {
            const [[maximo]] = await connection.execute(
                'SELECT COALESCE(MAX(numero_intento), 0) + 1 as siguiente FROM intentos_contacto WHERE prospecto_id = ?',
                [prospecto_id]
            );
            numeroIntento = maximo.siguiente;
        }

        const [insertResult] = await connection.execute(`
            INSERT INTO intentos_contacto (
                prospecto_id, vendedor_id, numero_intento, fecha_contacto,
                canal_contacto_id, modalidad_id, resultado_id, logro_id, 
                nivel_interes_id, proxima_accion, fecha_proxima_accion, observaciones
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            prospecto_id, req.user.id, numeroIntento, fecha_contacto || new Date(),
            canal_contacto_id, modalidad_id, resultado_id, 
            contactoExitoso ? logro_id : null,
            contactoExitoso ? nivel_interes_id : null,
            proxima_accion, fecha_proxima_accion, observaciones
        ]);

        if (contactoExitoso) {
            const [[logro]] = await connection.execute(
                'SELECT codigo FROM logros_contacto WHERE id = ?',
                [logro_id]
            );

            let nuevoEstado = 'CONTACTANDO';
            if (logro) {
                switch (logro.codigo) {
                    case 'C': nuevoEstado = 'COTIZADO'; break;
                    case 'D': nuevoEstado = 'DEMO'; break;
                    case 'K': nuevoEstado = 'DEMO'; break;
                    case 'V': nuevoEstado = 'GANADO'; break;
                }
            }

            const [[estadoRow]] = await connection.execute(
                'SELECT id FROM estados_prospecto WHERE codigo = ?',
                [nuevoEstado]
            );

            if (estadoRow) {
                let updateQuery = 'UPDATE prospectos SET estado_id = ?, fecha_ultima_actividad = NOW()';
                let updateParams = [estadoRow.id];

                if (nivel_interes_id) {
                    updateQuery += ', nivel_interes_id = ?';
                    updateParams.push(nivel_interes_id);
                }
                if (proxima_accion) {
                    updateQuery += ', proxima_accion = ?';
                    updateParams.push(proxima_accion);
                }
                if (fecha_proxima_accion) {
                    updateQuery += ', fecha_proxima_accion = ?';
                    updateParams.push(fecha_proxima_accion);
                }

                updateQuery += ' WHERE id = ?';
                updateParams.push(prospecto_id);

                await connection.execute(updateQuery, updateParams);
            }
        }

        await connection.commit();

        await registrarLog(req.user.id, 'intentos_contacto', TipoAccion.INSERT, insertResult.insertId, { prospecto_id }, req.ip);

        res.status(201).json({
            success: true,
            message: 'Contacto registrado exitosamente',
            data: { id: insertResult.insertId, numero_intento: numeroIntento }
        });
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
        const { logro_id, nivel_interes_id, proxima_accion, fecha_proxima_accion, observaciones } = req.body;

        await pool.execute(`
            UPDATE intentos_contacto SET 
                logro_id = COALESCE(?, logro_id),
                nivel_interes_id = COALESCE(?, nivel_interes_id),
                proxima_accion = COALESCE(?, proxima_accion),
                fecha_proxima_accion = COALESCE(?, fecha_proxima_accion),
                observaciones = COALESCE(?, observaciones)
            WHERE id = ?
        `, [logro_id, nivel_interes_id, proxima_accion, fecha_proxima_accion, observaciones, id]);

        if (nivel_interes_id) {
            const [[intento]] = await pool.execute('SELECT prospecto_id FROM intentos_contacto WHERE id = ?', [id]);
            if (intento) {
                await pool.execute(
                    'UPDATE prospectos SET nivel_interes_id = ?, fecha_ultima_actividad = NOW() WHERE id = ?',
                    [nivel_interes_id, intento.prospecto_id]
                );
            }
        }

        await registrarLog(req.user.id, 'intentos_contacto', TipoAccion.UPDATE, id, req.body, req.ip);

        res.json({ success: true, message: 'Contacto actualizado' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const deleteIntento = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM intentos_contacto WHERE id = ?', [id]);
        await registrarLog(req.user.id, 'intentos_contacto', TipoAccion.DELETE, id, null, req.ip);
        res.json({ success: true, message: 'Contacto eliminado' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

module.exports = { getAll, create, update, delete: deleteIntento };
