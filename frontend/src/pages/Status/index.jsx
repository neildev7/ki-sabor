import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Status.css';

export default function Status() {
    const { id_pedido } = useParams();
    const navigate = useNavigate();
    
    const [pedido, setPedido] = useState(null);
    const [segundosRestantes, setSegundosRestantes] = useState(null);
    const [minutosDecorridos, setMinutosDecorridos] = useState(0);
    const [notificacaoEnviada, setNotificacaoEnviada] = useState(false);

    useEffect(() => {
        const sincronizarComBanco = async () => {
            try {
                const { data } = await api.get(`/pedidos/${id_pedido}`);
                setPedido(data);

                const agora = new Date().getTime();
                
                // 1. Calcula o timer de 3 minutos de cancelamento
                const limiteTimer = new Date(data.timer_limite).getTime();
                const diferencaTimer = Math.floor((limiteTimer - agora) / 1000);
                setSegundosRestantes(diferencaTimer > 0 ? diferencaTimer : 0);

                // 2. Calcula quanto tempo total se passou para a regra dos 25 minutos
                const dataCriacao = new Date(data.data_criacao).getTime();
                const minutosPassados = Math.floor((agora - dataCriacao) / 60000);
                setMinutosDecorridos(minutosPassados);

            } catch (error) {
                console.error("Erro ao buscar pedido:", error);
            }
        };

        sincronizarComBanco();
        const syncInterval = setInterval(sincronizarComBanco, 10000); // Atualiza a cada 10s
        return () => clearInterval(syncInterval);
    }, [id_pedido]);

    useEffect(() => {
        if (segundosRestantes > 0) {
            const timer = setInterval(() => setSegundosRestantes(s => s - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [segundosRestantes]);

    const handleCancelar = async () => {
        if (window.confirm("Deseja realmente cancelar seu pedido?")) {
            try {
                await api.delete(`/pedidos/${id_pedido}`);
                alert("Pedido Cancelado.");
                navigate('/cardapio');
            } catch (e) {
                alert("Não é mais possível cancelar este pedido.");
            }
        }
    };

    const handleApressar = async () => {
        try {
            await api.post(`/pedidos/${id_pedido}/apressar`);
            setNotificacaoEnviada(true);
            alert("Aviso enviado! O gerente já foi notificado e sua pizza terá prioridade.");
        } catch (e) {
            alert("Erro ao notificar a cozinha.");
        }
    };

    if (!pedido || segundosRestantes === null) return <div className="app-container"><p>Sincronizando...</p></div>;

    const tempoFormatado = `${Math.floor(segundosRestantes / 60)}:${String(segundosRestantes % 60).padStart(2, '0')}`;

    // Renderiza a mensagem e cor dependendo do status real do banco
    const getStatusInfo = () => {
        switch(pedido.status) {
            case 'Confirmado': return { cor: '#3182CE', icone: '📋', texto: 'Na Fila da Cozinha' };
            case 'Em Preparo': return { cor: '#D69E2E', icone: '👨‍🍳', texto: 'Em Preparo (Mão na massa!)' };
            case 'Pronto': return { cor: '#38A169', icone: '🍕', texto: 'Pronto! O garçom já vai levar.' };
            case 'Entregue': return { cor: '#718096', icone: '✅', texto: 'Entregue na mesa.' };
            case 'Cancelado': return { cor: '#E53E3E', icone: '❌', texto: 'Pedido Cancelado' };
            default: return { cor: '#718096', icone: '⏳', texto: pedido.status };
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <div className="status-container app-container">
            <header className="header-status">
                <h1 className="logo-texto">Ki-Sabor</h1>
                <p>Mesa {localStorage.getItem('mesa_kisabor')} • Pedido #{id_pedido}</p>
            </header>

            <main className="conteudo-status">
                <div className="card-status">
                    
                    {/* FASE 1: OS 3 MINUTOS DE EDIÇÃO */}
                    {segundosRestantes > 0 && pedido.status === 'Pendente' ? (
                        <>
                            <div className="badge-status badge-pendente">Aguardando Envio</div>
                            <div className="cronometro-circular">{tempoFormatado}</div>
                            <p className="texto-status">Sua pizza ainda pode ser alterada. O tempo voa!</p>
                            
                            <div className="acoes-pedido">
                                <button className="btn-acao btn-editar" onClick={() => navigate('/cardapio')}>✏️ EDITAR</button>
                                <button className="btn-acao btn-cancelar" onClick={handleCancelar}>❌ CANCELAR</button>
                            </div>
                        </>
                    ) : (
                    /* FASE 2: STATUS DINÂMICO APÓS OS 3 MINUTOS */
                        <>
                            <div className="status-dinamico-container">
                                <div className="icone-gigante" style={{ color: statusInfo.cor }}>{statusInfo.icone}</div>
                                <h2 style={{ color: statusInfo.cor, margin: '10px 0' }}>{statusInfo.texto}</h2>
                            </div>

                            {/* FASE 3: REGRA DOS 25 MINUTOS (Só aparece se estiver na cozinha/preparo e demorar) */}
                            {minutosDecorridos >= 25 && ['Confirmado', 'Em Preparo'].includes(pedido.status) && (
                                <div className="alerta-atraso-box">
                                    <p>Já se passaram <strong>{minutosDecorridos} minutos</strong>. Sentimos muito pela demora!</p>
                                    <button 
                                        className="btn-apressar" 
                                        onClick={handleApressar}
                                        disabled={notificacaoEnviada}
                                    >
                                        {notificacaoEnviada ? '✅ AVISO ENVIADO' : '🔔 APRESSAR MEU PEDIDO'}
                                    </button>
                                </div>
                            )}

                            {/* BOTÃO PARA PEDIR MAIS COISAS */}
                            <button 
                                className="btn-novo-pedido" 
                                onClick={() => navigate('/cardapio')}
                            >
                                🍕 Fazer Novo Pedido
                            </button>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}