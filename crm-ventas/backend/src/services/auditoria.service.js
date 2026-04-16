const pool = require('../../config/database');

const TipoAccion = {
    INSERT: 'INSERT',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    EXPORT: 'EXPORT',
    VIEW: 'VIEW'
};

async function registrarLog(usuarioId, tablaAfectada, accion, registroId = null, detalle = null, ipAddress = null) {
    try {
        const detalleJson = typeof detalle === 'object' ? JSON.stringify(detalle) : detalle;
        
        await pool.execute(
            `INSERT INTO auditoria_logs (usuario_id, tabla_afectada, accion, registro_id, detalle, ip_address) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [usuarioId, tablaAfectada, accion, registroId, detalleJson, ipAddress]
        );
    } catch (error) {
        console.error('Error al registrar log de auditoría:', error);
    }
}

async function obtenerLogs(filtros = {}) {
    const { usuarioId, tabla, accion, fechaInicio, fechaFin, limite = 100 } = filtros;
    
    let query = `
        SELECT al.*, u.nombre as usuario_nombre 
        FROM auditoria_logs al 
        LEFT JOIN usuarios u ON u.id = al.usuario_id 
        WHERE 1=1
    `;
    const params = [];

    if (usuarioId) {
        query += ' AND al.usuario_id = ?';
        params.push(usuarioId);
    }
    if (tabla) {
        query += ' AND al.tabla_afectada = ?';
        params.push(tabla);
    }
    if (accion) {
        query += ' AND al.accion = ?';
        params.push(accion);
    }
    if (fechaInicio) {
        query += ' AND al.creado_en >= ?';
        params.push(fechaInicio);
    }
    if (fechaFin) {
        query += ' AND al.creado_en <= ?';
        params.push(fechaFin);
    }

    query += ` ORDER BY al.creado_en DESC LIMIT ${parseInt(limite) || 100}`;

    const [rows] = await pool.query(query, params);
    return rows;
}

module.exports = {
    TipoAccion,
    registrarLog,
    obtenerLogs
};
