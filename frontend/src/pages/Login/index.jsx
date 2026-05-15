import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login() {
    const navigate = useNavigate();
    const [pin, setPin] = useState('');
    const [erro, setErro] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        
        // A SENHA MESTRE: 1994
        if (pin === '1994') {
            // Salva o crachá do funcionário no navegador
            localStorage.setItem('kisabor_auth', 'true');
            navigate('/caixa'); // Manda pro PDV
        } else {
            setErro('PIN incorreto. Acesso negado!');
            setPin('');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>Ki-Sabor</h1>
                <p>Acesso Restrito para Funcionários</p>

                {erro && <div className="erro-login">❌ {erro}</div>}

                <form onSubmit={handleLogin}>
                    <div className="pin-input-container">
                        <input 
                            type="password" 
                            className="pin-input" 
                            maxLength="4"
                            placeholder="****"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} // Aceita só números
                            autoFocus
                        />
                    </div>

                    <button type="submit" className="btn-login">
                        🔓 Acessar Sistema
                    </button>
                </form>

                <button className="btn-voltar-cliente" onClick={() => navigate('/')}>
                    Voltar para tela do cliente
                </button>
            </div>
        </div>
    );
}