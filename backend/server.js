const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

// Importando a conexão com o banco de dados
const db = require('./src/config/db');

const app = express();

// Middlewares globais
app.use(cors()); // Permite requisições do seu Front-end (React)
app.use(express.json()); // Permite que a API receba dados no formato JSON

// Rota de teste simples
app.get('/ping', (req, res) => {
    res.json({ mensagem: 'Pong! A API da Pizzaria está no ar. 🍕' });
});

cron.schedule('* * * * *', async () => {
    try {
        const [pedidosAtrasados] = await db.execute(`
            SELECT id FROM pedidos 
            WHERE status = 'Pendente' AND timer_limite <= NOW()
        `);
        
        for (let pedido of pedidosAtrasados) {
            await db.execute("UPDATE pedidos SET status = 'Confirmado' WHERE id = ?", [pedido.id]);
            console.log(`🤖 Cron: Pedido ${pedido.id} confirmado automaticamente.`);
        }
    } catch (error) {
        console.error("Erro no cron job de pedidos:", error);
    }
});

const produtoRoutes = require('./src/routes/produtoRoutes');
app.use('/api/produtos', produtoRoutes);

// ADICIONE ESTAS DUAS LINHAS:
const mesaRoutes = require('./src/routes/mesaRoutes');
app.use('/api/mesas', mesaRoutes);

const pedidoRoutes = require('./src/routes/pedidoRoutes');
app.use('/api/pedidos', pedidoRoutes);

// Definindo a porta e ligando o servidor
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});