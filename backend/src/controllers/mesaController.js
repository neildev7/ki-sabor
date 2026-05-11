const mesaModel = require('../models/mesaModel');

const buscarMesas = async (req, res) => {
    try {
        const mesas = await mesaModel.listarMesas();
        res.status(200).json(mesas);
    } catch (erro) {
        console.error('Erro ao buscar mesas:', erro);
        res.status(500).json({ erro: 'Erro ao carregar as mesas.' });
    }
};

module.exports = { buscarMesas };