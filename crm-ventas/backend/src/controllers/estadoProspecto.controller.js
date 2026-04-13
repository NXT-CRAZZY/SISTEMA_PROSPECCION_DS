const pool = require('../../config/database');

const getAll = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM estados_prospecto ORDER BY es_activo DESC, nombre');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

module.exports = { getAll };
