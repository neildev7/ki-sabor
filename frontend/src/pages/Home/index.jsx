import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import './Home.css';

export default function Home() {
    const [splashAtivo, setSplashAtivo] = useState(true);
    const [mesas, setMesas] = useState([]);
    const [salaoSelecionado, setSalaoSelecionado] = useState(null);
    const [ajudaSolicitada, setAjudaSolicitada] = useState(false);
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const numeroMesaUrl = searchParams.get('mesa');

    useEffect(() => {
        const carregarMesas = async () => {
            try {
                const response = await api.get('/mesas');
                setMesas(response.data);
            } catch (error) {
                console.error("Erro ao carregar mesas:", error);
            }
        };
        carregarMesas();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSplashAtivo(false);
            if (numeroMesaUrl) {
                localStorage.setItem('mesa_kisabor', numeroMesaUrl);
                navigate('/cardapio');
            }
        }, 3500); 
        return () => clearTimeout(timer);
    }, [numeroMesaUrl, navigate]);

    const selecionarMesa = (mesa) => {
        if (mesa.status === 'Ocupada') return;
        localStorage.setItem('mesa_kisabor', mesa.numero);
        navigate('/cardapio');
    };

    // FUNÇÃO DO NOVO BOTÃO DE AJUDA
    const solicitarAjuda = async () => {
        try {
            await api.post('/pedidos/ajuda', { numero_mesa: 'Recepção / Entrada' });
            setAjudaSolicitada(true);
            alert("Sinal enviado! Um atendente já está vindo te ajudar.");
        } catch (error) {
            alert("Erro ao chamar ajuda.");
        }
    };

    const mesasExibidas = mesas.filter(mesa => {
        if (salaoSelecionado === 'baixo') return mesa.numero >= 1 && mesa.numero <= 15;
        if (salaoSelecionado === 'cima') return mesa.numero >= 20 && mesa.numero <= 44;
        return false;
    });

    return (
        <div className="app-container selecao-mesa-screen">
            <div className={`splash-overlay ${!splashAtivo ? 'escondido' : ''}`}>
                <div className="splash-conteudo">
                    <h1 className="splash-logo">Ki-Sabor</h1>
                    <p className="splash-subtitulo">Desde 1994</p>
                </div>
            </div>

            <header className="header-kisabor-simples">
                <h2 className="logo-texto-pequeno">Ki-Sabor</h2>
            </header>

            <main className="conteudo-mesas">
                {!salaoSelecionado ? (
                    <>
                        <h1 className="titulo-boas-vindas">Bem-vindo!</h1>
                        <p className="texto-instrucao">Onde você vai se sentar hoje?</p>

                        <div className="botoes-salao">
                            <button className="btn-salao" onClick={() => setSalaoSelecionado('baixo')}>
                                <span className="icone-salao">👇</span>
                                <div className="info-salao">
                                    <h3>Salão de Baixo</h3>
                                    <p>Mesas da 1 até 15</p>
                                </div>
                            </button>

                            <button className="btn-salao" onClick={() => setSalaoSelecionado('cima')}>
                                <span className="icone-salao">👆</span>
                                <div className="info-salao">
                                    <h3>Salão de Cima</h3>
                                    <p>Mesas da 20 até 44</p>
                                </div>
                            </button>
                        </div>

                        {/* BOTÃO DE AJUDA NA ENTRADA */}
                        <button 
                            className="btn-ajuda-geral" 
                            onClick={solicitarAjuda}
                            disabled={ajudaSolicitada}
                            style={{
                                marginTop: '2rem', padding: '15px', width: '100%', 
                                borderRadius: '12px', border: '2px dashed #94a3b8', 
                                background: ajudaSolicitada ? '#f1f5f9' : 'transparent',
                                color: '#475569', fontWeight: 'bold', fontSize: '1rem',
                                cursor: 'pointer'
                            }}
                        >
                            {ajudaSolicitada ? '✅ Um atendente está a caminho' : '🙋 Precisa de ajuda para pedir?'}
                        </button>
                    </>
                ) : (
                    <>
                        <div className="cabecalho-mesas">
                            <button className="btn-voltar-salao" onClick={() => setSalaoSelecionado(null)}>⬅ Voltar</button>
                            <h2 className="titulo-salao">{salaoSelecionado === 'baixo' ? 'Salão de Baixo' : 'Salão de Cima'}</h2>
                        </div>
                        <p className="texto-instrucao">Toque no número da sua mesa:</p>
                        <div className="grid-mesas">
                            {mesasExibidas.map((mesa) => {
                                const isOcupada = mesa.status === 'Ocupada';
                                return (
                                    <button 
                                        key={mesa.id} 
                                        className={`btn-mesa ${isOcupada ? 'mesa-ocupada' : ''}`}
                                        onClick={() => selecionarMesa(mesa)}
                                        disabled={isOcupada}
                                    >
                                        <span className="numero-mesa">{mesa.numero}</span>
                                        {isOcupada && <span className="faixa-ocupada">EM USO</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}