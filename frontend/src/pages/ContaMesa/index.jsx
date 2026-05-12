import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './ContaMesa.css';

export default function ContaMesa() {
    const navigate = useNavigate();
    const numeroMesa = localStorage.getItem('mesa_kisabor');
    
    const [conta, setConta] = useState(null);

    useEffect(() => {
        if (!numeroMesa) return navigate('/');

        const carregarConta = async () => {
            try {
                const response = await api.get(`/pedidos/mesa/${numeroMesa}/conta`);
                setConta(response.data);
            } catch (error) {
                console.error("Erro ao carregar conta:", error);
            }
        };
        carregarConta();
    }, [numeroMesa, navigate]);

    if (!conta) return <div className="app-container" style={{padding: '2rem', textAlign: 'center'}}><h2>Carregando comanda...</h2></div>;

    const subtotal = conta.subtotal || 0;
    const taxaServico = subtotal * 0.10;
    const totalGeral = subtotal + taxaServico;

    return (
        <div className="app-container conta-container">
            <header className="header-conta">
                <button className="btn-voltar" style={{background:'transparent', border:'none', color:'white', fontSize:'1.2rem'}} onClick={() => navigate(-1)}>⬅</button>
                <h2 style={{margin: 0}}>Comanda da Mesa {numeroMesa}</h2>
            </header>

            <main className="lista-pedidos-conta">
                {conta.pedidos.length === 0 ? (
                    <p style={{textAlign: 'center', color: '#64748b'}}>Você ainda não pediu nada hoje.</p>
                ) : (
                    conta.pedidos.map(pedido => (
                        <div key={pedido.id} className="bloco-pedido">
                            <div className="bloco-pedido-header">
                                <span>Pedido #{pedido.id}</span>
                                <span>{pedido.status}</span>
                            </div>
                            
                            {pedido.itens.map(item => (
                                <div key={item.id} className="item-conta">
                                    <span>1x {item.sabores.join(' / ')} ({item.tamanho})</span>
                                    <strong>R$ {Number(item.preco_pago).toFixed(2).replace('.', ',')}</strong>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </main>

            {conta.pedidos.length > 0 && (
                <>
                    <div className="painel-totais">
                        <div className="linha-total-conta">
                            <span>Subtotal Consumido:</span>
                            <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="linha-total-conta" style={{color: '#94a3b8', fontSize: '0.95rem'}}>
                            <span>Taxa de Serviço (10% opcional):</span>
                            <span>+ R$ {taxaServico.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="linha-total-conta destaque">
                            <span>TOTAL FINAL:</span>
                            <span>R$ {totalGeral.toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>

                    {/* MENSAGEM DESTACADA PARA PAGAMENTO NO BALCÃO */}
                    <div style={{
                        margin: '1.5rem', padding: '1.5rem', 
                        backgroundColor: '#10b981', color: 'white', 
                        borderRadius: '16px', textAlign: 'center', 
                        boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
                    }}>
                        <h3 style={{margin: '0 0 10px 0'}}>Fim da sua experiência!</h3>
                        <p style={{margin: 0, fontSize: '1.05rem', lineHeight: '1.4'}}>
                            Por favor, dirija-se ao <strong>balcão do caixa</strong> informando a Mesa {numeroMesa} para realizar o pagamento.<br/><br/>Agradecemos a preferência!
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}