const express = require('express');
const router = express.Router();
const { getAll } = require('../controllers/nivelInteres.controller');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/', getAll);

module.exports = router;
