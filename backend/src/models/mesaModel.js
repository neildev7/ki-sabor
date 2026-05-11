const db = require('../config/db');

const listarMesas = async () => {
    const [linhas] = await db.execute('SELECT * FROM mesas ORDER BY numero ASC');
    return linhas;
};

module.exports = { listarMesas };