const produtoModel = require('../models/produtoModel');

const buscarPizzas = async (req, res) => {
    try {
        const pizzas = await produtoModel.listarPizzas();
        res.status(200).json(pizzas);
    } catch (erro) {
        console.error('Erro ao buscar pizzas:', erro);
        // Retorna erro 500 se algo der errado no banco
        res.status(500).json({ erro: 'Erro interno ao carregar o cardápio.' });
    }
};
const buscarTamanhos = async (req, res) => {
    try {
        const tamanhos = await produtoModel.listarTamanhos();
        res.status(200).json(tamanhos);
    } catch (erro) {
        console.error('Erro ao buscar tamanhos:', erro);
        res.status(500).json({ erro: 'Erro interno ao carregar os tamanhos.' });
    }
};

module.exports = {
    buscarPizzas,
    buscarTamanhos // Exportando a nova função
};