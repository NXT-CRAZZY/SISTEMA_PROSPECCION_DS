const express = require('express');
const router = express.Router();
const { getAll, getByCanal } = require('../controllers/resultadoContacto.controller');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/', getAll);
router.get('/canal/:canalId', getByCanal);

module.exports = router;
