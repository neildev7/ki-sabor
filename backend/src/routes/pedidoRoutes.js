const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

// Rota para criar um novo pedido (POST)
router.post('/', pedidoController.realizarPedido);

// --- AS ROTAS QUE ESTAVAM FALTANDO ---

// Rota para buscar o status de um pedido específico pelo ID (GET)
router.get('/:id', pedidoController.buscarStatus);

// Rota para cancelar um pedido específico pelo ID (DELETE)
router.delete('/:id', pedidoController.cancelar);

// Adicione esta linha junto das outras rotas:
router.post('/:id/apressar', pedidoController.apressarPedido);

module.exports = router;