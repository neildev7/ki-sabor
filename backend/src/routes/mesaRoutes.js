const express = require('express');
const router = express.Router();
const mesaController = require('../controllers/mesaController');

router.get('/', mesaController.buscarMesas);

module.exports = router;