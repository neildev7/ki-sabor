const pedidoModel = require('../models/pedidoModel');
const db = require('../config/db');

// 1. Função de Criar Pedido (A original, com o Timer de 3 minutos)
const realizarPedido = async (req, res) => {
    try {
        console.log("📦 DADOS QUE CHEGARAM DO REACT:", req.body); // Para debug visual no CMD
        
        const { carrinho, id_mesa } = req.body;

        // TRAVAS DE SEGURANÇA (Se faltar algo, avisa o React sem crashar o servidor)
        if (!id_mesa) {
            return res.status(400).json({ erro: 'O ID da mesa não foi enviado!' });
        }
        if (!carrinho || !Array.isArray(carrinho) || carrinho.length === 0) {
            return res.status(400).json({ erro: 'O carrinho está vazio ou em formato inválido!' });
        }

        let total = 0;
        carrinho.forEach(item => {
            total += Number(item.preco);
        });

        // Cria o pedido na tabela pedidos
        const [resultado] = await db.execute(
            "INSERT INTO pedidos (id_mesa, status, total, timer_limite) VALUES (?, 'Pendente', ?, DATE_ADD(NOW(), INTERVAL 1 SECOND))",
            [id_mesa, total]
        );
        
        const id_pedido = resultado.insertId;

        // Salva os itens e sabores vinculados ao pedido
        for (let item of carrinho) {
            const [resItem] = await db.execute(
                'INSERT INTO itens_pedido (id_pedido, id_tamanho, preco_pago, observacoes) VALUES (?, ?, ?, ?)',
                [id_pedido, item.tamanho.id, item.preco, item.observacoes || '']
            );
            const id_item_pedido = resItem.insertId;

            for (let id_sabor of item.sabores) {
                await db.execute(
                    'INSERT INTO item_sabores (id_item_pedido, id_produto) VALUES (?, ?)',
                    [id_item_pedido, id_sabor]
                );
            }
        }

        // Atualiza a mesa para Ocupada
        await db.execute("UPDATE mesas SET status = 'Ocupada' WHERE id = ?", [id_mesa]);

        res.json({ id_pedido, mensagem: 'Pedido enviado com sucesso!' });
    } catch (error) {
        console.error("🔥 ERRO GRAVE AO CRIAR PEDIDO:", error);
        res.status(500).json({ erro: 'Erro interno ao realizar pedido.' });
    }
};

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

const apressarPedido = async (req, res) => {
    try {
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
    