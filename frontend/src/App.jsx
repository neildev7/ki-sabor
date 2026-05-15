import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Cardapio from './pages/Cardapio';
import ResumoPedido from './pages/ResumoPedido';
import Status from './pages/Status';
import Cozinha from './pages/Cozinha';
import ContaMesa from './pages/ContaMesa';
import Caixa from './pages/Caixa';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// O "Segurança" do sistema: Verifica se o funcionário está logado
const RotaProtegida = ({ children }) => {
    const autenticado = localStorage.getItem('kisabor_auth');
    
    if (!autenticado) {
        // Se não houver o "crachá" no localStorage, manda pro login
        return <Navigate to="/login" />;
    }
    
    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* --- ÁREA PÚBLICA (CLIENTE) --- */}
                <Route path="/" element={<Home />} />
                <Route path="/cardapio" element={<Cardapio />} />
                <Route path="/resumo-pedido" element={<ResumoPedido />} />
                <Route path="/status/:id_pedido" element={<Status />} /> 
                <Route path="/conta" element={<ContaMesa />} />
                
                {/* --- ÁREA DE ACESSO (LOGIN) --- */}
                <Route path="/login" element={<Login />} />

                {/* --- ÁREA PRIVADA (FUNCIONÁRIOS) --- */}
                {/* Protegemos o Caixa e a Cozinha com o mesmo componente de segurança */}
                
                <Route 
                    path="/caixa" 
                    element={
                        <RotaProtegida>
                            <Caixa />
                        </RotaProtegida>
                    } 
                />

                <Route 
                    path="/cozinha" 
                    element={
                        <RotaProtegida>
                            <Cozinha />
                        </RotaProtegida>
                    } 
                />

                <Route 
                  path="/dashboard" 
                    element={
                    <RotaProtegida>
                    <Dashboard />
                  </RotaProtegida>
                } 
                />

                {/* Rota de segurança: se o usuário digitar algo que não existe, volta pra Home */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;