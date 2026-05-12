const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

// ROTAS ESPECÍFICAS (Devem vir primeiro)
router.post('/', pedidoController.realizarPedido);
router.get('/painel/cozinha', pedidoController.listarParaCozinha);
router.post('/ajuda', pedidoController.solicitarAjuda);
router.get('/mesa/:numero/conta', pedidoController.buscarContaMesa); // <-- A Rota Nova!

// ROTAS DINÂMICAS (Com :id, devem vir por último)
router.get('/:id', pedidoController.buscarStatus);
router.put('/:id/status', pedidoController.alterarStatus);
router.delete('/:id', pedidoController.cancelar);
router.post('/:id/apressar', pedidoController.apressarPedido);

module.exports = router;