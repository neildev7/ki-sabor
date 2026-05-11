import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import './Home.css';

export default function Home() {
    const [splashAtivo, setSplashAtivo] = useState(true);
    const [mesas, setMesas] = useState([]);
    
    // NOVO ESTADO: Controla qual salão o cliente escolheu ('baixo' ou 'cima')
    const [salaoSelecionado, setSalaoSelecionado] = useState(null);
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const numeroMesaUrl = searchParams.get('mesa');

    // 1. Busca as mesas no banco de dados
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

    // 2. Controla o tempo da Animação (3.5 segundos) e o QR Code
    useEffect(() => {
        const timer = setTimeout(() => {
            setSplashAtivo(false);
            
            // Se o cliente acessou via QR Code (ex: ?mesa=5)
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

    // Lógica para filtrar as mesas dependendo do salão clicado
    const mesasExibidas = mesas.filter(mesa => {
        if (salaoSelecionado === 'baixo') {
            return mesa.numero >= 1 && mesa.numero <= 15;
        } else if (salaoSelecionado === 'cima') {
            return mesa.numero >= 20 && mesa.numero <= 44;
        }
        return false;
    });

    return (
        <div className="app-container selecao-mesa-screen">
            
            {/* O SPLASH COM AS CLASSES NOVAS DA ANIMAÇÃO DO VENTO */}
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
                
                {/* ETAPA 1: O cliente não escolheu o salão ainda */}
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
                    </>
                ) : (
                /* ETAPA 2: O cliente escolheu o salão, agora escolhe a mesa */
                    <>
                        <div className="cabecalho-mesas">
                            <button className="btn-voltar-salao" onClick={() => setSalaoSelecionado(null)}>
                                ⬅ Voltar
                            </button>
                            <h2 className="titulo-salao">
                                {salaoSelecionado === 'baixo' ? 'Salão de Baixo' : 'Salão de Cima'}
                            </h2>
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