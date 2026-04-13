const pool = require('../../config/database');

const getAll = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT rc.*, cc.nombre as canal_nombre 
            FROM resultados_contacto rc 
            LEFT JOIN canales_contacto cc ON cc.id = rc.canal_contacto_id 
            ORDER BY cc.nombre, rc.nombre
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const getByCanal = async (req, res) => {
    try {
        const { canalId } = req.params;
        const [rows] = await pool.execute(
            'SELECT * FROM resultados_contacto WHERE canal_contacto_id = ? OR canal_contacto_id IS NULL ORDER BY nombre',
            [canalId]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

module.exports = { getAll, getByCanal };
