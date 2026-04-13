const express = require('express');
const router = express.Router();
const { 
    getResumenGeneral,
    getVentasPorMes,
    getProspectosPorEstado,
    getProspectosPorCanal,
    getProspectosPorNivelInteres,
    getTopVendedores,
    getActividadReciente,
    getProximasAcciones
} = require('../controllers/dashboard.controller');
const { auth, roleAuth } = require('../middleware/auth');

router.use(auth);

router.get('/resumen', getResumenGeneral);
router.get('/ventas-mensuales', getVentasPorMes);
router.get('/prospectos-estado', getProspectosPorEstado);
router.get('/prospectos-canal', getProspectosPorCanal);
router.get('/prospectos-interes', getProspectosPorNivelInteres);
router.get('/top-vendedores', roleAuth('administrador', 'supervisor'), getTopVendedores);
router.get('/actividad-reciente', getActividadReciente);
router.get('/proximas-acciones', getProximasAcciones);

module.exports = router;
