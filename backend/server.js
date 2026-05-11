const express = require('express');
const cors = require('cors');
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


const produtoRoutes = require('./src/routes/produtoRoutes');
app.use('/api/produtos', produtoRoutes);

// ADICIONE ESTAS DUAS LINHAS:
const mesaRoutes = require('./src/routes/mesaRoutes');
app.use('/api/mesas', mesaRoutes);


// Definindo a porta e ligando o servidor
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});