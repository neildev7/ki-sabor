const express = require('express');
const router = express.Router();
const mesaController = require('../controllers/mesaController');

router.get('/', mesaController.listarMesas);
router.post('/:numero/liberar', mesaController.liberarMesa);
router.put('/:numero/nome', mesaController.atualizarNome);
router.post('/:numero/juntar', mesaController.juntarMesas);

module.exports = router;