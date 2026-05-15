const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

// ==========================================
// 1. ROTAS ESTÁTICAS DE CONSULTA (GET)
// As mais específicas devem ficar no topo!
// ==========================================
router.get('/historico', pedidoController.historicoCaixa);
router.get('/painel/cozinha', pedidoController.listarParaCozinha);
router.get('/mesa/:numero/conta', pedidoController.buscarContaMesa);

// ==========================================
// 2. ROTAS ESTÁTICAS DE AÇÃO (POST)
// ==========================================
router.post('/', pedidoController.realizarPedido);
router.post('/ajuda', pedidoController.solicitarAjuda);

// ==========================================
// 3. ROTAS DINÂMICAS (COM ':id')
// O Node.js deixa essas pro final para não confundir a palavra "historico" com um ID
// ==========================================
router.get('/:id', pedidoController.buscarStatus);
router.put('/:id/status', pedidoController.alterarStatus);
router.delete('/:id', pedidoController.cancelar);
router.post('/:id/apressar', pedidoController.apressarPedido);

// 🔥 A ROTA DE AVALIAÇÃO PERFEITAMENTE POSICIONADA 🔥
router.post('/:id/avaliacao', pedidoController.salvarFeedback);

module.exports = router;