const pedidoModel = require('../models/pedidoModel');

// 1. Função de Criar Pedido (A original, com o Timer de 3 minutos)
const realizarPedido = async (req, res) => {
    try {
        const dadosPedido = req.body; 
        const resultado = await pedidoModel.criarNovoPedido(dadosPedido);

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

const listarParaCozinha = async (req, res) => {
    try {
        const pedidos = await pedidoModel.buscarPedidosCozinha();
        res.json(pedidos);
    } catch (error) {
        console.error('Erro ao buscar pedidos da cozinha:', error);
        res.status(500).json({ erro: 'Erro ao carregar painel da cozinha' });
    }
};

// NOVA: Atualiza o status do pedido (Ex: Confirmado -> Em Preparo -> Pronto)
const STATUS_VALIDOS = ['Confirmado', 'Em Preparo', 'Pronto', 'Entregue', 'Cancelado'];

const alterarStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { novo_status } = req.body;

        if (!novo_status || !STATUS_VALIDOS.includes(novo_status)) {
            return res.status(400).json({ 
                erro: `Status inválido. Valores aceitos: ${STATUS_VALIDOS.join(', ')}` 
            });
        }

        await pedidoModel.atualizarStatus(id, novo_status);
        res.json({ mensagem: `Pedido ${id} atualizado para ${novo_status}` });
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ erro: 'Erro ao atualizar pedido' });
    }
};

// NOVA< FUNÇÃO: Puxa a conta da mesa
const buscarContaMesa = async (req, res) => {
    try {
        const conta = await pedidoModel.buscarContaPorMesa(req.params.numero);
        if (!conta) return res.status(404).json({ erro: 'Mesa não encontrada' });
        res.json(conta);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar conta da mesa.' });
    }
};

const solicitarAjuda = async (req, res) => {
    try {
        const { numero_mesa } = req.body;
        console.log(`🚨 AJUDA: A mesa ${numero_mesa} solicitou um garçom.`);
        res.json({ mensagem: 'Um garçom foi notificado e logo chegará à sua mesa!' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao chamar garçom.' });
    }
};

const salvarFeedback = async (req, res) => {
    try {
        const { id } = req.params; 
        const { notaPizza, notaServico, comentario } = req.body;
        await pedidoModel.salvarAvaliacao(id, notaPizza, notaServico, comentario);
        
        res.json({ mensagem: 'Avaliação salva com sucesso!' });
    } catch (error) {
        console.error("Erro ao salvar avaliação:", error); 
        res.status(500).json({ erro: 'Erro ao salvar feedback.' });
    }
};



module.exports = { realizarPedido, buscarStatus, cancelar, apressarPedido, listarParaCozinha, alterarStatus, buscarContaMesa, solicitarAjuda, salvarFeedback };
    