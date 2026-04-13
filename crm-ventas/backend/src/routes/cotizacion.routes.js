const express = require('express');
const router = express.Router();
const { getAll, create, update } = require('../controllers/cotizacion.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', getAll);
router.post('/', create);
router.put('/:id', update);

module.exports = router;
