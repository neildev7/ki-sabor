const db = require('../config/db');

const listarPizzas = async () => {
    const [linhas] = await db.execute('SELECT * FROM produtos WHERE id_categoria = 1');
    return linhas;
};

// NOVA FUNÇÃO
const listarTamanhos = async () => {
    const [linhas] = await db.execute('SELECT * FROM tamanhos WHERE id_categoria = 1');
    return linhas;
};

module.exports = {
    listarPizzas,
    listarTamanhos // Não esqueça de exportar!
};