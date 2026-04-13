const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, toggleActivo } = require('../controllers/usuario.controller');
const { auth, roleAuth } = require('../middleware/auth');

router.use(auth);

router.get('/', roleAuth('administrador', 'supervisor'), getAll);
router.get('/:id', getById);
router.post('/', roleAuth('administrador'), create);
router.put('/:id', roleAuth('administrador'), update);
router.patch('/:id/toggle', roleAuth('administrador'), toggleActivo);

module.exports = router;
