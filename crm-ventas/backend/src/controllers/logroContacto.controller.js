const pool = require('../../config/database');

const getAll = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM logros_contacto ORDER BY codigo');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

module.exports = { getAll };
