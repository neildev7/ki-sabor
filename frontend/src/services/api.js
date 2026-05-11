import axios from 'axios';

const api = axios.create({
    // Essa é a URL base do seu back-end Node.js
    baseURL: 'http://localhost:3333/api',
    timeout: 5000, // Evita que o app fique travado se o servidor cair
});

export default api;