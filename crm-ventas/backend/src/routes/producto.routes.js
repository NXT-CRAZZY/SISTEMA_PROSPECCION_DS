const express = require('express');
const router = express.Router();
const { getAll, getById } = require('../controllers/producto.controller');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/', getAll);
router.get('/:id', getById);

module.exports = router;
