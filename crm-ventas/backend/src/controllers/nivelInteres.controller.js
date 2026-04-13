const pool = require('../../config/database');

const getAll = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM niveles_interes ORDER BY peso DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

module.exports = { getAll };
