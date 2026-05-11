const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

// Quando alguém fizer um GET em /pizzas, chama a função do controller
router.get('/pizzas', produtoController.buscarPizzas);

// NOVA ROTA
router.get('/tamanhos', produtoController.buscarTamanhos);

module.exports = router;

module.exports = router;