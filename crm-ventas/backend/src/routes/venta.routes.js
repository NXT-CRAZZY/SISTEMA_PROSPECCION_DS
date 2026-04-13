const express = require('express');
const router = express.Router();
const { getAll, create, update } = require('../controllers/venta.controller');
const { auth, roleAuth } = require('../middleware/auth');

router.use(auth);

router.get('/', roleAuth('administrador', 'supervisor', 'vendedor'), getAll);
router.post('/', create);
router.put('/:id', update);

module.exports = router;
