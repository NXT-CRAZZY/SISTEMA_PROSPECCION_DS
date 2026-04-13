const pool = require('../../config/database');
const bcrypt = require('bcryptjs');
const { registrarLog, TipoAccion } = require('../../services/auditoria.service');

const getAll = async (req, res) => {
    try {
        const [usuarios] = await pool.execute(
            'SELECT id, nombre, email, rol, activo, creado_en FROM usuarios ORDER BY nombre'
        );

        res.json({ success: true, data: usuarios });
    } catch (error) {
        console.error('Error en getAll usuarios:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const [usuarios] = await pool.execute(
            'SELECT id, nombre, email, rol, activo, creado_en FROM usuarios WHERE id = ?',
            [id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        res.json({ success: true, data: usuarios[0] });
    } catch (error) {
        console.error('Error en getById:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const create = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ success: false, message: 'Datos incompletos' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
            [nombre, email, passwordHash, rol || 'vendedor']
        );

        await registrarLog(req.user.id, 'usuarios', TipoAccion.INSERT, result.insertId, { email }, req.ip);

        res.status(201).json({
            success: true,
            message: 'Usuario creado',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Error en create:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, rol, activo } = req.body;

        await pool.execute(
            'UPDATE usuarios SET nombre = ?, email = ?, rol = ?, activo = ? WHERE id = ?',
            [nombre, email, rol, activo, id]
        );

        await registrarLog(req.user.id, 'usuarios', TipoAccion.UPDATE, id, req.body, req.ip);

        res.json({ success: true, message: 'Usuario actualizado' });
    } catch (error) {
        console.error('Error en update:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const toggleActivo = async (req, res) => {
    try {
        const { id } = req.params;
        const { activo } = req.body;

        await pool.execute('UPDATE usuarios SET activo = ? WHERE id = ?', [activo, id]);
        await registrarLog(req.user.id, 'usuarios', TipoAccion.UPDATE, id, { activo }, req.ip);

        res.json({ success: true, message: `Usuario ${activo ? 'activado' : 'desactivado'}` });
    } catch (error) {
        console.error('Error en toggleActivo:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

module.exports = { getAll, getById, create, update, toggleActivo };
