const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

// --- ROTAS ESPECÍFICAS (sem ':id') ---
router.post('/', pedidoController.realizarPedido);
router.get('/painel/cozinha', pedidoController.listarParaCozinha);
router.post('/ajuda', pedidoController.solicitarAjuda);
router.get('/mesa/:numero/conta', pedidoController.buscarContaMesa);

// --- ROTAS DINÂMICAS (com ':id') ---
router.get('/:id', pedidoController.buscarStatus);
router.put('/:id/status', pedidoController.alterarStatus);
router.delete('/:id', pedidoController.cancelar);
router.post('/:id/apressar', pedidoController.apressarPedido);

// 🔥 COLOQUE A ROTA DE AVALIAÇÃO AQUI, USANDO :id 🔥
router.post('/:id/avaliacao', pedidoController.salvarFeedback);

module.exports = router;