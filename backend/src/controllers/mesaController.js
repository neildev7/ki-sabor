const db = require('../config/db');

const listarMesas = async (req, res) => {
    try {
        const [mesas] = await db.execute(`
            SELECT m.*, 
                   (SELECT COUNT(*) FROM pedidos p WHERE p.id_mesa = m.id AND p.status NOT IN ('Pago', 'Cancelado')) as qtd_pedidos
            FROM mesas m
            ORDER BY m.numero
        `);
        const mesasCorrigidas = mesas.map(m => {
            let statusReal = m.status;
            if (m.qtd_pedidos > 0) statusReal = 'Ocupada';
            return { ...m, status: statusReal };
        });
        res.json(mesasCorrigidas);
    } catch (error) { res.status(500).json({ erro: 'Erro ao buscar mesas' }); }
};

const liberarMesa = async (req, res) => {
    try {
        const numeroMesa = req.params.numero;
        const { formaPagamento } = req.body; // Pegando se foi PIX, Cartão ou Dinheiro do React!

        const [mesas] = await db.execute('SELECT id FROM mesas WHERE numero = ?', [numeroMesa]);
        if (mesas.length === 0) return res.status(404).json({ erro: 'Mesa não encontrada' });
        const idMesa = mesas[0].id;

        // 🔥 A MÁGICA PARA O SEU FUTURO DASHBOARD 🔥
        // Muda para Pago, salva a forma de pagamento e carimba a data exata do fechamento (NOW())
        await db.execute(
            `UPDATE pedidos 
             SET status = 'Pago', forma_pagamento = ?, data_fechamento = NOW() 
             WHERE (id_mesa = ? OR id_mesa IN (SELECT id FROM mesas WHERE id_mesa_principal = ?)) 
             AND status NOT IN ('Cancelado', 'Pago')`, 
            [formaPagamento, idMesa, idMesa]
        );

        // Libera a principal e as vinculadas, zerando os nomes e vínculos
        await db.execute(
            "UPDATE mesas SET status = 'Livre', precisa_ajuda = FALSE, nome_cliente = NULL, id_mesa_principal = NULL WHERE id = ? OR id_mesa_principal = ?", 
            [idMesa, idMesa]
        );
        
        res.json({ mensagem: `Conta encerrada com sucesso!` });
    } catch (error) { 
        console.error(error);
        res.status(500).json({ erro: 'Erro ao liberar mesa e registrar pagamento' }); 
    }
};

const atualizarNome = async (req, res) => {
    try {
        const { nome } = req.body;
        await db.execute('UPDATE mesas SET nome_cliente = ? WHERE numero = ?', [nome, req.params.numero]);
        res.json({ mensagem: 'Nome salvo!' });
    } catch (e) { res.status(500).json({erro: 'Erro'}); }
};

const juntarMesas = async (req, res) => {
    try {
        const { mesa_alvo } = req.body; // mesa que será engolida
        const mesaPrincipal = req.params.numero;
        
        const [mPrincipal] = await db.execute('SELECT id FROM mesas WHERE numero = ?', [mesaPrincipal]);
        await db.execute('UPDATE mesas SET id_mesa_principal = ? WHERE numero = ?', [mPrincipal[0].id, mesa_alvo]);
        
        res.json({ mensagem: 'Mesas vinculadas com sucesso!' });
    } catch (e) { res.status(500).json({erro: 'Erro'}); }
};

module.exports = { listarMesas, liberarMesa, atualizarNome, juntarMesas };