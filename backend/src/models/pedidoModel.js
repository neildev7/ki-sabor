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
    // 1. Busca os dados gerais do pedido
    const [pedidos] = await db.execute(
        'SELECT id, status, timer_limite, data_criacao, total FROM pedidos WHERE id = ?', 
        [id]
    );
    
    if (pedidos.length === 0) return null;
    const pedido = pedidos[0];

    // 2. Busca os itens detalhados desse pedido (com preço individual)
    const [itens] = await db.execute(`
        SELECT i.id, t.nome as tamanho, i.preco_pago, i.observacoes 
        FROM itens_pedido i
        JOIN tamanhos t ON i.id_tamanho = t.id
        WHERE i.id_pedido = ?
    `, [id]);

    // 3. Busca os sabores de cada item
    for (let item of itens) {
        const [sabores] = await db.execute(`
            SELECT p.nome 
            FROM item_sabores isab
            JOIN produtos p ON isab.id_produto = p.id
            WHERE isab.id_item_pedido = ?
        `, [item.id]);
        item.sabores = sabores.map(s => s.nome);
    }
    
    pedido.itens = itens;
    return pedido;
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

// Busca pedidos detalhados para o painel da cozinha
const buscarPedidosCozinha = async () => {
    // 1. Pega os pedidos ativos ordenados do mais antigo pro mais novo
    const [pedidos] = await db.execute(`
        SELECT id, id_mesa, status, data_criacao 
        FROM pedidos 
        WHERE status IN ('Confirmado', 'Em Preparo') 
        ORDER BY data_criacao ASC
    `);

    // 2. Busca os itens, tamanhos e sabores de cada pedido
    for (let pedido of pedidos) {
        const [itens] = await db.execute(`
            SELECT i.id, t.nome as tamanho, i.observacoes 
            FROM itens_pedido i
            JOIN tamanhos t ON i.id_tamanho = t.id
            WHERE i.id_pedido = ?
        `, [pedido.id]);

        for (let item of itens) {
            const [sabores] = await db.execute(`
                SELECT p.nome 
                FROM item_sabores isab
                JOIN produtos p ON isab.id_produto = p.id
                WHERE isab.id_item_pedido = ?
            `, [item.id]);
            // Transforma o array de objetos em um array simples de textos
            item.sabores = sabores.map(s => s.nome);
        }
        pedido.itens = itens;
    }
    return pedidos;
};

// NOVA FUNÇÃO: Busca tudo que a mesa pediu para fechar a conta
const buscarContaPorMesa = async (numeroMesa) => {
    // 1. Acha o ID real da mesa baseado no número
    const [mesas] = await db.execute('SELECT id FROM mesas WHERE numero = ?', [numeroMesa]);
    if (mesas.length === 0) return null;
    const idMesa = mesas[0].id;

    // 2. Busca todos os pedidos ativos (não cancelados)
    const [pedidos] = await db.execute(`
        SELECT id, status, total, data_criacao 
        FROM pedidos 
        WHERE id_mesa = ? AND status != 'Cancelado'
        ORDER BY data_criacao ASC
    `, [idMesa]);

    let totalGeral = 0;

    // 3. Busca os itens de cada pedido
    for (let pedido of pedidos) {
        const [itens] = await db.execute(`
            SELECT i.id, t.nome as tamanho, i.preco_pago 
            FROM itens_pedido i
            JOIN tamanhos t ON i.id_tamanho = t.id
            WHERE i.id_pedido = ?
        `, [pedido.id]);

        for (let item of itens) {
            const [sabores] = await db.execute(`
                SELECT p.nome FROM item_sabores isab
                JOIN produtos p ON isab.id_produto = p.id
                WHERE isab.id_item_pedido = ?
            `, [item.id]);
            item.sabores = sabores.map(s => s.nome);
        }
        pedido.itens = itens;
        totalGeral += Number(pedido.total);
    }

    return { pedidos, subtotal: totalGeral };
};

// ATUALIZE O MODULE.EXPORTS PARA INCLUIR A NOVA FUNÇÃO:
module.exports = { criarNovoPedido, atualizarStatus, buscarPedidoPorId, cancelarPedido, buscarPedidosCozinha, buscarContaPorMesa };