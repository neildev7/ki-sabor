import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Cardapio from './pages/Cardapio';
import ResumoPedido from './pages/ResumoPedido'; // <-- Importe aqui
import Status from './pages/Status'; // <-- IMPORTANTE
import Cozinha from './pages/Cozinha';
import ContaMesa from './pages/ContaMesa';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cardapio" element={<Cardapio />} />
        {/* A rota agora espera receber o ID do pedido no final da URL */}
        <Route path="/resumo-pedido" element={<ResumoPedido />} />
        <Route path="/status/:id_pedido" element={<Status />} /> 
        <Route path="/cozinha" element={<Cozinha />} /><Route path="/cozinha" element={<Cozinha />} />  
        <Route path="/conta" element={<ContaMesa />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;