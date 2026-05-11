const mysql = require('mysql2/promise');
require('dotenv').config();

// Cria um "pool" de conexões. Isso é melhor para performance, 
// pois gerencia várias requisições simultâneas sem travar o banco.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Testando a conexão assim que o arquivo é chamado
pool.getConnection()
    .then(() => console.log('✅ Conectado ao banco de dados MySQL (pizzaria_db)!'))
    .catch((err) => console.error('❌ Erro ao conectar ao banco:', err.message));

module.exports = pool;