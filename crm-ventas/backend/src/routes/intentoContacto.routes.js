const express = require('express');
const router = express.Router();
const { getAll, create, update, delete: deleteIntento } = require('../controllers/intentoContacto.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', getAll);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', deleteIntento);

module.exports = router;
