const db = require('../config/db');

const listarPizzas = async () => {
    // Ao tirar o filtro de categoria, ele busca as Pizzas E as Bebidas!
    const [linhas] = await db.execute('SELECT * FROM produtos');
    return linhas;
};

const listarTamanhos = async () => {
    // Retiramos o "WHERE id_categoria = 1" para buscar todos os tamanhos disponíveis
    const [linhas] = await db.execute('SELECT * FROM tamanhos');
    return linhas;
};

module.exports = {
    listarPizzas,
    listarTamanhos // Não esqueça de exportar!
};