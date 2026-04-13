const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, cambiarEstado, eliminar } = require('../controllers/prospecto.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/estado', cambiarEstado);
router.delete('/:id', eliminar);

module.exports = router;
