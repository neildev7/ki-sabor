import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './ResumoPedido.css';

export default function ResumoPedido() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Puxa o carrinho que veio da tela de Cardápio. Se não tiver nada, inicia vazio.
    const [carrinho, setCarrinho] = useState(location.state?.carrinho || []);
    const [enviando, setEnviando] = useState(false);
    
    const numeroMesa = localStorage.getItem('mesa_kisabor');

    const totalPedido = carrinho.reduce((acc, item) => acc + item.preco, 0);

    const removerItem = (idRemover) => {
        const novoCarrinho = carrinho.filter(item => item.id_item_pedido !== idRemover);
        setCarrinho(novoCarrinho);
    };

    const enviarPedidoParaCozinha = async () => {
        if (carrinho.length === 0) return;
        setEnviando(true);

        // 1. Moldando os itens do carrinho para o formato que o Back-end MySQL espera
        const itensFormatados = carrinho.map(item => ({
            id_tamanho: Number(item.tamanho.id),
            observacoes: item.observacoes || "",
            preco_pago: Number(item.preco),
            sabores: item.sabores // Já é um array de IDs [idBase, idExtra1...]
        }));

        // 2. Montando o Payload final (O Pedido)
        const payload = {
            id_mesa: Number(numeroMesa),
            tipo_atendimento: "Automatico",
            total: totalPedido,
            itens: itensFormatados
        };

        try {
            // 3. Dispara pro Back-end!
            const response = await api.post('/pedidos', payload);
            
            // Opcional: Limpar o carrinho local se você estiver usando um Context no futuro.
            
            // 4. Redireciona para o Status (onde os 3 minutos começam a contar)
            navigate(`/status/${response.data.id_pedido}`);
        } catch (error) {
            console.error("Erro ao finalizar:", error);
            alert("Houve um problema ao enviar seu pedido. Tente novamente.");
            setEnviando(false);
        }
    };

    if (!numeroMesa) {
        navigate('/');
        return null;
    }

    return (
        <div className="app-container resumo-container">
            <header className="header-resumo">
                <button className="btn-voltar" onClick={() => navigate('/cardapio')}>
                    ⬅
                </button>
                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Resumo do Pedido</h2>
            </header>

            <main className="lista-carrinho">
                {carrinho.length === 0 ? (
                    <div className="carrinho-vazio">
                        <h2>Seu carrinho está vazio 😕</h2>
                        <p>Volte ao cardápio e adicione algumas delícias!</p>
                        <button 
                            className="btn-finalizar-pedido" 
                            style={{marginTop: '20px'}}
                            onClick={() => navigate('/cardapio')}
                        >
                            Ver Cardápio
                        </button>
                    </div>
                ) : (
                    carrinho.map((item) => (
                        <div key={item.id_item_pedido} className="item-carrinho">
                            <div className="item-topo">
                                <h3 className="item-nome">{item.produto.nome}</h3>
                                <button 
                                    className="btn-remover"
                                    onClick={() => removerItem(item.id_item_pedido)}
                                >
                                    Remover
                                </button>
                            </div>
                            
                            <p className="item-detalhes">
                                <strong>Tamanho:</strong> {item.tamanho.nome} <br/>
                                {item.sabores.length > 1 && (
                                    <span><strong>Extras:</strong> Selecionados no meio a meio<br/></span>
                                )}
                                {item.observacoes && (
                                    <span><strong>Obs:</strong> {item.observacoes}</span>
                                )}
                            </p>
                            
                            <span className="item-preco">
                                R$ {item.preco.toFixed(2).replace('.', ',')}
                            </span>
                        </div>
                    ))
                )}
            </main>

            {carrinho.length > 0 && (
                <div className="rodape-finalizar">
                    <div className="linha-total">
                        <span>Total do Pedido:</span>
                        <span className="valor-total">R$ {totalPedido.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <button 
                        className="btn-finalizar-pedido" 
                        style={{width: '100%'}}
                        onClick={enviarPedidoParaCozinha}
                        disabled={enviando}
                    >
                        {enviando ? 'Enviando...' : 'Confirmar e Enviar'}
                    </button>
                </div>
            )}
        </div>
    );
}