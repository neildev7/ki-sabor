const pedidoModel = require('../models/pedidoModel');

// 1. Função de Criar Pedido (A original, com o Timer de 3 minutos)
const realizarPedido = async (req, res) => {
    try {
        const dadosPedido = req.body; 
        const resultado = await pedidoModel.criarNovoPedido(dadosPedido);

        // Timer de 3 minutos (180000 ms)
        setTimeout(async () => {
            try {
                await pedidoModel.atualizarStatus(resultado.idPedido, 'Confirmado');
                console.log(`⏰ Pedido #${resultado.idPedido} confirmado automaticamente após 3 min.`);
            } catch (err) {
                console.error('Erro ao atualizar status automático:', err);
            }
        }, 180000); 

        res.status(201).json({
            mensagem: 'Pedido recebido! Você tem 3 minutos para cancelar ou alterar.',
            id_pedido: resultado.idPedido,
            timer_limite: resultado.timerLimite
        });

    } catch (erro) {
        console.error('Erro ao criar pedido:', erro);
        res.status(500).json({ erro: 'Erro interno ao processar o pedido.' });
    }
};

// 2. NOVA: Função de buscar o status em tempo real (O Front-end chama essa)
const buscarStatus = async (req, res) => {
    try {
        const pedido = await pedidoModel.buscarPedidoPorId(req.params.id);
        if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
        res.json(pedido);
    } catch (error) {
        console.error('Erro ao buscar status:', error);
        res.status(500).json({ erro: 'Erro ao buscar status' });
    }
};

// 3. NOVA: Função de cancelar o pedido antes dos 3 minutos
const cancelar = async (req, res) => {
    try {
        const sucesso = await pedidoModel.cancelarPedido(req.params.id);
        if (sucesso) return res.json({ mensagem: 'Pedido cancelado com sucesso!' });
        res.status(400).json({ erro: 'Não foi possível cancelar (Pedido já em preparo)' });
    } catch (error) {
        console.error('Erro ao cancelar:', error);
        res.status(500).json({ erro: 'Erro ao cancelar' });
    }
};

// NOVA: Função para registrar a cobrança do cliente
const apressarPedido = async (req, res) => {
    try {
        // Futuramente, aqui você pode fazer um UPDATE no banco para acender uma luz 
        // vermelha no painel da cozinha. Por enquanto, retornamos sucesso.
        console.log(`🚨 ALERTA: A mesa do pedido #${req.params.id} está cobrando a pizza!`);
        res.json({ mensagem: 'Aviso enviado para a cozinha com sucesso!' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao notificar a cozinha' });
    }
};

// Não esqueça de adicionar a função nova no export:
module.exports = { realizarPedido, buscarStatus, cancelar, apressarPedido };
