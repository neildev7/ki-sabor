import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './ResumoPedido.css';

export default function ResumoPedido() {
    const location = useLocation();
    const navigate = useNavigate();
    
    const [carrinho, setCarrinho] = useState(location.state?.carrinho || []);
    const [enviando, setEnviando] = useState(false);
    
    // Pegamos o número para mostrar na tela e o ID real para enviar ao banco
    const numeroMesa = localStorage.getItem('mesa_kisabor');
    const idMesaReal = localStorage.getItem('id_mesa_kisabor');

    const totalPedido = carrinho.reduce((acc, item) => acc + item.preco, 0);

    const removerItem = (idRemover) => {
        const novoCarrinho = carrinho.filter(item => item.id_item_pedido !== idRemover);
        setCarrinho(novoCarrinho);
    };

    const enviarPedidoParaCozinha = async () => {
        if (carrinho.length === 0) return;
        setEnviando(true);

        // 1. Formatando os itens exatamente como o laço de repetição do Back-end espera
        const itensFormatados = carrinho.map(item => ({
            tamanho: { id: Number(item.tamanho.id) },
            observacoes: item.observacoes || "",
            preco: Number(item.preco),
            sabores: item.sabores 
        }));

        // 2. Montando o Payload com as chaves que o Controller está buscando
        const payload = {
            id_mesa: idMesaReal, // Enviando o ID do banco
            carrinho: itensFormatados // O nome da chave DEVE ser carrinho para evitar o erro de 'forEach'
        };

        try {
            // 3. Dispara pro Back-end
            const response = await api.post('/pedidos', payload);
            
            // 4. Redireciona usando o ID que o banco acabou de gerar
            navigate(`/status/${response.data.id_pedido}`);
        } catch (error) {
            console.error("Erro ao finalizar:", error);
            alert("Houve um problema ao enviar seu pedido. Verifique se o servidor está ligado.");
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
                                    <span><strong>Sabores:</strong> Meio a meio selecionado<br/></span>
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