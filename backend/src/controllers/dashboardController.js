const db = require('../config/db');

const obterDadosFinanceiros = async (req, res) => {
    try {
        // 1. KPIs de HOJE (Cards do Topo)
        // Usamos NOW() e DATE() para garantir que pegue o dia atual do servidor
        const [kpisHoje] = await db.execute(`
            SELECT 
                COUNT(*) as qtd_pedidos, 
                COALESCE(SUM(total), 0) as faturamento_total, 
                COALESCE(AVG(total), 0) as ticket_medio 
            FROM pedidos 
            WHERE status = 'Pago' 
            AND (DATE(data_fechamento) = CURDATE() OR data_fechamento IS NULL)
        `);

        // 2. Faturamento dos últimos 7 dias
        const [faturacaoDias] = await db.execute(`
            SELECT 
                DATE_FORMAT(data_fechamento, '%d/%m') as dia, 
                SUM(total) as total
            FROM pedidos 
            WHERE status = 'Pago' 
            AND data_fechamento >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY dia 
            ORDER BY MIN(data_fechamento) ASC
        `);

        // 3. Pizzas mais vendidas (Top 5)
        const [pizzasVendidas] = await db.execute(`
            SELECT 
                prod.nome, 
                COUNT(isab.id) as quantidade
            FROM item_sabores isab
            JOIN produtos prod ON isab.id_produto = prod.id
            JOIN itens_pedido ip ON isab.id_item_pedido = ip.id
            JOIN pedidos p ON ip.id_pedido = p.id
            WHERE p.status = 'Pago'
            GROUP BY prod.nome 
            ORDER BY quantidade DESC 
            LIMIT 5
        `);

        // 4. Distribuição por Método de Pagamento (Com tratamento para nomes vazios)
        const [metodosPagamento] = await db.execute(`
            SELECT 
                COALESCE(forma_pagamento, 'Outros') as name, 
                SUM(total) as value
            FROM pedidos 
            WHERE status = 'Pago'
            GROUP BY forma_pagamento
        `);

        res.json({ 
            kpis: kpisHoje[0], 
            faturacaoDias, 
            pizzasVendidas, 
            metodosPagamento 
        });
    } catch (error) {
        console.error("🔥 ERRO NO DASHBOARD:", error);
        res.status(500).json({ erro: 'Erro ao extrair dados do dashboard' });
    }
};

module.exports = { obterDadosFinanceiros };