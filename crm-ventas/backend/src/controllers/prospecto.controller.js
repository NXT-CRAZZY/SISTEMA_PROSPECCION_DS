const pool = require('../../config/database');
const { registrarLog, TipoAccion } = require('../../services/auditoria.service');

const getAll = async (req, res) => {
    try {
        const { vendedor_id, estado_id, canal_origen_id, busqueda, fecha_inicio, fecha_fin, limite = 100, offset = 0 } = req.query;

        let query = `
            SELECT 
                p.*,
                u.nombre as vendedor_nombre,
                co.nombre as canal_origen_nombre,
                co.codigo as canal_origen_codigo,
                ep.nombre as estado_nombre,
                ep.codigo as estado_codigo,
                ni.nombre as nivel_interes_nombre,
                ni.codigo as nivel_interes_codigo,
                COUNT(ic.id) as total_intentos,
                SUM(CASE WHEN rc.contacto_exitoso = TRUE THEN 1 ELSE 0 END) as contactos_exitosos
            FROM prospectos p
            LEFT JOIN usuarios u ON u.id = p.vendedor_id
            LEFT JOIN canales_origen co ON co.id = p.canal_origen_id
            LEFT JOIN estados_prospecto ep ON ep.id = p.estado_id
            LEFT JOIN niveles_interes ni ON ni.id = p.nivel_interes_id
            LEFT JOIN intentos_contacto ic ON ic.prospecto_id = p.id
            LEFT JOIN resultados_contacto rc ON rc.id = ic.resultado_id
            WHERE p.activo = TRUE
        `;

        const params = [];

        if (vendedor_id) {
            query += ' AND p.vendedor_id = ?';
            params.push(vendedor_id);
        }
        if (estado_id) {
            query += ' AND p.estado_id = ?';
            params.push(estado_id);
        }
        if (canal_origen_id) {
            query += ' AND p.canal_origen_id = ?';
            params.push(canal_origen_id);
        }
        if (busqueda) {
            query += ' AND (p.nombre_contacto LIKE ? OR p.empresa LIKE ? OR p.ruc_dni LIKE ?)';
            const searchTerm = `%${busqueda}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        if (fecha_inicio) {
            query += ' AND p.fecha_registro >= ?';
            params.push(fecha_inicio);
        }
        if (fecha_fin) {
            query += ' AND p.fecha_registro <= ?';
            params.push(fecha_fin);
        }

        query += ' GROUP BY p.id ORDER BY p.fecha_ultima_actividad DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limite), parseInt(offset));

        const [rows] = await pool.execute(query, params);

        const [countResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM prospectos WHERE activo = TRUE'
        );

        res.json({ 
            success: true, 
            data: rows,
            meta: {
                total: countResult[0].total,
                limite: parseInt(limite),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error('Error en getAll prospectos:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [prospectos] = await pool.execute(`
            SELECT 
                p.*,
                u.nombre as vendedor_nombre,
                co.nombre as canal_origen_nombre,
                co.codigo as canal_origen_codigo,
                ep.nombre as estado_nombre,
                ep.codigo as estado_codigo,
                ni.nombre as nivel_interes_nombre,
                ni.codigo as nivel_interes_codigo
            FROM prospectos p
            LEFT JOIN usuarios u ON u.id = p.vendedor_id
            LEFT JOIN canales_origen co ON co.id = p.canal_origen_id
            LEFT JOIN estados_prospecto ep ON ep.id = p.estado_id
            LEFT JOIN niveles_interes ni ON ni.id = p.nivel_interes_id
            WHERE p.id = ?
        `, [id]);

        if (prospectos.length === 0) {
            return res.status(404).json({ success: false, message: 'Prospecto no encontrado' });
        }

        const [intentos] = await pool.execute(`
            SELECT 
                ic.*,
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
            LEFT JOIN canales_contacto cc ON cc.id = ic.canal_contacto_id
            LEFT JOIN resultados_contacto rc ON rc.id = ic.resultado_id
            LEFT JOIN modalidades_contacto mc ON mc.id = ic.modalidad_id
            LEFT JOIN logros_contacto lc ON lc.id = ic.logro_id
            LEFT JOIN niveles_interes ni ON ni.id = ic.nivel_interes_id
            WHERE ic.prospecto_id = ?
            ORDER BY ic.fecha_contacto DESC, ic.creado_en DESC
        `, [id]);

        const [cotizaciones] = await pool.execute(`
            SELECT c.*, prod.nombre as producto_nombre, prod.codigo as producto_codigo
            FROM cotizaciones c
            LEFT JOIN productos prod ON prod.id = c.producto_id
            WHERE c.prospecto_id = ?
            ORDER BY c.fecha_cotizacion DESC
        `, [id]);

        const [ventas] = await pool.execute(`
            SELECT v.*, prod.nombre as producto_nombre, tc.nombre as tipo_comprobante_nombre
            FROM ventas v
            LEFT JOIN productos prod ON prod.id = v.producto_id
            LEFT JOIN tipos_comprobante tc ON tc.id = v.tipo_comprobante_id
            WHERE v.prospecto_id = ?
        `, [id]);

        const [demostraciones] = await pool.execute(`
            SELECT d.*, prod.nombre as producto_nombre, mc.nombre as modalidad_nombre
            FROM demostraciones d
            LEFT JOIN productos prod ON prod.id = d.producto_id
            LEFT JOIN modalidades_contacto mc ON mc.id = d.modalidad_id
            WHERE d.prospecto_id = ?
            ORDER BY d.fecha_programada DESC
        `, [id]);

        res.json({
            success: true,
            data: {
                ...prospectos[0],
                intentos_contacto: intentos,
                cotizaciones,
                ventas,
                demostraciones
            }
        });
    } catch (error) {
        console.error('Error en getById prospecto:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const create = async (req, res) => {
    try {
        const { nombre_contacto, empresa, ruc_dni, tipo_documento, telefono, email, cargo, canal_origen_id, ciudad, observaciones_generales } = req.body;

        if (!nombre_contacto || !canal_origen_id) {
            return res.status(400).json({ success: false, message: 'Nombre y canal de origen son requeridos' });
        }

        const estadoNuevo = 1;
        const vendedorId = req.user.id;

        const [result] = await pool.execute(`
            INSERT INTO prospectos (
                nombre_contacto, empresa, ruc_dni, tipo_documento, telefono, email, 
                cargo, canal_origen_id, vendedor_id, estado_id, ciudad, observaciones_generales
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [nombre_contacto, empresa, ruc_dni, tipo_documento, telefono, email, cargo, canal_origen_id, vendedorId, estadoNuevo, ciudad, observaciones_generales]);

        await registrarLog(req.user.id, 'prospectos', TipoAccion.INSERT, result.insertId, { nombre_contacto }, req.ip);

        res.status(201).json({
            success: true,
            message: 'Prospecto creado exitosamente',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Error en create prospecto:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const camposPermitidos = ['nombre_contacto', 'empresa', 'ruc_dni', 'tipo_documento', 'telefono', 'email', 'cargo', 'canal_origen_id', 'ciudad', 'observaciones_generales', 'nivel_interes_id', 'proxima_accion', 'fecha_proxima_accion'];
        
        const updates = [];
        const params = [];

        for (const campo of camposPermitidos) {
            if (req.body[campo] !== undefined) {
                updates.push(`${campo} = ?`);
                params.push(req.body[campo]);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
        }

        params.push(id);
        await pool.execute(`UPDATE prospectos SET ${updates.join(', ')}, fecha_ultima_actividad = NOW() WHERE id = ?`, params);

        await registrarLog(req.user.id, 'prospectos', TipoAccion.UPDATE, id, req.body, req.ip);

        res.json({ success: true, message: 'Prospecto actualizado' });
    } catch (error) {
        console.error('Error en update prospecto:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const cambiarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado_id, nivel_interes_id } = req.body;

        const updates = ['estado_id = ?'];
        const params = [estado_id];

        if (nivel_interes_id) {
            updates.push('nivel_interes_id = ?');
            params.push(nivel_interes_id);
        }

        params.push(id);
        await pool.execute(`UPDATE prospectos SET ${updates.join(', ')}, fecha_ultima_actividad = NOW() WHERE id = ?`, params);

        await registrarLog(req.user.id, 'prospectos', TipoAccion.UPDATE, id, { estado_id, nivel_interes_id }, req.ip);

        res.json({ success: true, message: 'Estado actualizado' });
    } catch (error) {
        console.error('Error en cambiarEstado:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.execute('UPDATE prospectos SET activo = FALSE WHERE id = ?', [id]);
        await registrarLog(req.user.id, 'prospectos', TipoAccion.DELETE, id, null, req.ip);

        res.json({ success: true, message: 'Prospecto eliminado' });
    } catch (error) {
        console.error('Error en eliminar prospecto:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

module.exports = { getAll, getById, create, update, cambiarEstado, eliminar };
