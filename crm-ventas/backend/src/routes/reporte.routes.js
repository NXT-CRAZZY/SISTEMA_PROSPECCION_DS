const express = require('express');
const router = express.Router();
const { generarReporteSeguimiento, generarReporteVentas, getHistorialReportes } = require('../controllers/reporte.controller');
const { auth, roleAuth } = require('../middleware/auth');

router.use(auth);

router.get('/seguimiento', generarReporteSeguimiento);
router.get('/ventas', generarReporteVentas);
router.get('/historial', roleAuth('administrador', 'supervisor'), getHistorialReportes);

module.exports = router;
