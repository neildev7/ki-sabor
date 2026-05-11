const db = require('../config/db');

const criarNovoPedido = async (dadosPedido) => {
    // Extraímos os dados que o front-end vai enviar
    const { id_mesa, tipo_atendimento, total, itens } = dadosPedido;

    // Pegamos uma conexão exclusiva para a transação
    const conexao = await db.getConnection();

    try {
        await conexao.beginTransaction(); // Inicia a transação

        // 1. Calcula o timer de 3 minutos (agora + 3 minutos)
        const dataCriacao = new Date();
        const timerLimite = new Date(dataCriacao.getTime() + 3 * 60000); 

        // 2. Insere na tabela 'pedidos'
        const [resultPedido] = await conexao.execute(
            `INSERT INTO pedidos (id_mesa, tipo_atendimento, status, total, data_criacao, timer_limite) 
             VALUES (?, ?, 'Pendente', ?, ?, ?)`,
            [id_mesa, tipo_atendimento, total, dataCriacao, timerLimite]
        );
        const idPedido = resultPedido.insertId;

        // 3. Insere os itens e seus sabores
        for (const item of itens) {
            const [resultItem] = await conexao.execute(
                `INSERT INTO itens_pedido (id_pedido, id_tamanho, observacoes, preco_pago) 
                 VALUES (?, ?, ?, ?)`,
                [idPedido, item.id_tamanho, item.observacoes, item.preco_pago]
            );
            const idItemPedido = resultItem.insertId;

            // 4. Insere os sabores (até 4 por item, como no fluxograma)
            for (const idSabor of item.sabores) {
                await conexao.execute(
                    `INSERT INTO item_sabores (id_item_pedido, id_produto) VALUES (?, ?)`,
                    [idItemPedido, idSabor]
                );
            }
        }

        await conexao.commit(); // Salva tudo no banco definitivamente!
        return { idPedido, timerLimite };

    } catch (erro) {
        await conexao.rollback(); // Se der qualquer erro, desfaz TUDO!
        throw erro;
    } finally {
        conexao.release(); // Devolve a conexão para o "pool"
    }
};

// Atualize apenas esta função no seu pedidoModel.js
const buscarPedidoPorId = async (id) => {
    // Adicionamos o 'data_criacao' no SELECT
    const [linhas] = await db.execute(
        'SELECT id, status, timer_limite, data_criacao FROM pedidos WHERE id = ?', 
        [id]
    );
    return linhas[0];
};

// Cancela o pedido se ele ainda estiver pendente
const cancelarPedido = async (id) => {
    const [result] = await db.execute(
        "UPDATE pedidos SET status = 'Cancelado' WHERE id = ? AND status = 'Pendente'", 
        [id]
    );
    return result.affectedRows > 0;
};


// Função para atualizar o status do pedido após os 3 minutos
const atualizarStatus = async (id_pedido, novo_status) => {
    await db.execute('UPDATE pedidos SET status = ? WHERE id = ?', [novo_status, id_pedido]);
};

module.exports = { criarNovoPedido, atualizarStatus, buscarPedidoPorId, cancelarPedido };