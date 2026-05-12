import { useCallback, useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import './Cozinha.css';

export default function Cozinha() {
    const [pedidos, setPedidos] = useState([]);
    const [horaAtual, setHoraAtual] = useState(new Date());
    const [modoConsolidado, setModoConsolidado] = useState(false);
    const [carregando, setCarregando] = useState(true);
    
    const qtdePedidosPendentes = useRef(0);

    const tocarAlertaSonoro = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime); 
            gain.gain.setValueAtTime(0.5, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.3); 
        } catch {
            console.log("Áudio bloqueado pelo navegador até interação.");
        }
    }, []);

    const carregarPedidos = useCallback(async () => {
        try {
            const response = await api.get('/pedidos/painel/cozinha');
            
            // BLINDAGEM 1: Garante que "data" seja sempre um array, mesmo que o backend falhe
            const data = Array.isArray(response.data) ? response.data : [];
            
            const qtdNovos = data.filter(p => p.status === 'Confirmado').length;
            if (qtdNovos > qtdePedidosPendentes.current) {
                tocarAlertaSonoro();
            }
            qtdePedidosPendentes.current = qtdNovos;

            setPedidos(data);
        } catch (error) {
            console.error("Erro ao comunicar com a API do KDS:", error);
        } finally {
            setCarregando(false);
        }
    }, [tocarAlertaSonoro]);

    useEffect(() => {
        const iniciarCarga = async () => {
            await carregarPedidos();
        };

        iniciarCarga();
    }, [carregarPedidos]);

    useEffect(() => {
        const relogio = setInterval(() => {
            setHoraAtual(new Date());
            carregarPedidos();
        }, 5000);
        return () => clearInterval(relogio);
    }, [carregarPedidos]);

    const atualizarStatus = async (id, novoStatus) => {
        try {
            await api.put(`/pedidos/${id}/status`, { novo_status: novoStatus });
            carregarPedidos();
        } catch {
            alert("Erro ao atualizar o pedido. Verifique sua conexão.");
        }
    };

    const calcularTempo = (dataCriacao) => {
        const diffMs = horaAtual.getTime() - new Date(dataCriacao).getTime();
        return Math.max(0, Math.floor(diffMs / 60000)); 
    };

    const gerarProducaoConsolidada = () => {
        const contagem = {};
        pedidos.forEach(p => {
            if (p.status !== 'Confirmado' && p.status !== 'Em Preparo') return;
            // BLINDAGEM 2: Protege contra itens indefinidos
            (p.itens || []).forEach(item => {
                (item.sabores || []).forEach(sabor => {
                    contagem[sabor] = (contagem[sabor] || 0) + 1;
                });
            });
        });
        return Object.entries(contagem).sort((a, b) => b[1] - a[1]);
    };

    // Filtros de segurança
    const filaNovos = pedidos.filter(p => p.status === 'Confirmado');
    const filaPreparo = pedidos.filter(p => p.status === 'Em Preparo');

    if (carregando) {
        return <div className="kds-container" style={{justifyContent: 'center', alignItems: 'center', color: '#38bdf8', fontSize: '2rem'}}>Sincronizando Cozinha...</div>;
    }

    return (
        <div className="kds-container">
            <header className="kds-header">
                <div>
                    <h1 style={{margin: 0, color: '#38bdf8'}}>🍳 KDS Ki-Sabor</h1>
                    <span style={{color: '#94a3b8', fontSize: '0.9rem'}}>Kitchen Display System</span>
                </div>
                
                <div className="kds-controles">
                    <button 
                        className={`btn-visao ${modoConsolidado ? 'modo-consolidado' : ''}`}
                        onClick={() => setModoConsolidado(!modoConsolidado)}
                    >
                        {modoConsolidado ? '📋 Voltar para Kanban' : '📊 Visão Consolidada (Geral)'}
                    </button>
                    <div className="kds-relogio">{horaAtual.toLocaleTimeString('pt-BR')}</div>
                </div>
            </header>

            {modoConsolidado ? (
                <main className="visao-consolidada">
                    <h2 className="titulo-consolidado">Produção Total Ativa</h2>
                    <div className="grid-consolidada">
                        {gerarProducaoConsolidada().map(([sabor, quantidade]) => (
                            <div key={sabor} className="item-consolidado">
                                <span>{sabor}</span>
                                <div className="qtd-consolidada">{quantidade}</div>
                            </div>
                        ))}
                        {gerarProducaoConsolidada().length === 0 && <p style={{fontSize: '1.2rem', color: '#94a3b8'}}>Nenhum item na fila para produção em massa no momento.</p>}
                    </div>
                </main>
            ) : (
                <main className="kds-board">
                    <div className="kds-coluna">
                        <div className="kds-coluna-header" style={{color: '#60a5fa'}}>
                            Aguardando Início <span className="badge-count">{filaNovos.length}</span>
                        </div>
                        <div className="kds-lista">
                            {filaNovos.length === 0 && <p style={{textAlign: 'center', color: '#475569', marginTop: '2rem'}}>Sem pedidos novos. A cozinha está limpa!</p>}
                            
                            {filaNovos.map(pedido => {
                                const min = calcularTempo(pedido.data_criacao);
                                let slaClass = 'sla-ok';
                                if (min >= 15) slaClass = 'sla-atencao';
                                if (min >= 25) slaClass = 'sla-atrasado';

                                return (
                                    <div key={pedido.id} className={`kds-card ${slaClass}`}>
                                        <div className="card-topo">
                                            <span className="kds-mesa">Mesa {pedido.id_mesa}</span>
                                            <span className={`kds-tempo ${min >= 25 ? 'atrasado' : ''}`}>{min}m</span>
                                        </div>
                                        
                                        {/* BLINDAGEM 3: Protege o mapeamento dos itens */}
                                        {(pedido.itens || []).map(item => (
                                            <div key={item.id} className="kds-item">
                                                <span className="kds-tamanho">{item.tamanho}</span>
                                                <div className="kds-sabor">{(item.sabores || []).join(' / ')}</div>
                                                {item.observacoes && <div className="kds-obs">{item.observacoes}</div>}
                                            </div>
                                        ))}

                                        <button className="kds-btn btn-iniciar" onClick={() => atualizarStatus(pedido.id, 'Em Preparo')}>
                                            COMEÇAR
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="kds-coluna">
                        <div className="kds-coluna-header" style={{color: '#fbbf24'}}>
                            No Forno / Montagem <span className="badge-count">{filaPreparo.length}</span>
                        </div>
                        <div className="kds-lista">
                            {filaPreparo.length === 0 && <p style={{textAlign: 'center', color: '#475569', marginTop: '2rem'}}>Nenhum pedido no forno.</p>}

                            {filaPreparo.map(pedido => {
                                const min = calcularTempo(pedido.data_criacao);
                                
                                return (
                                    <div key={pedido.id} className="kds-card" style={{borderTopColor: '#f59e0b'}}>
                                        <div className="card-topo">
                                            <span className="kds-mesa">Mesa {pedido.id_mesa}</span>
                                            <span className="kds-tempo">{min}m</span>
                                        </div>
                                        
                                        {(pedido.itens || []).map(item => (
                                            <div key={item.id} className="kds-item">
                                                <span className="kds-tamanho">{item.tamanho}</span>
                                                <div className="kds-sabor">{(item.sabores || []).join(' / ')}</div>
                                            </div>
                                        ))}

                                        <button className="kds-btn btn-finalizar" onClick={() => atualizarStatus(pedido.id, 'Pronto')}>
                                            PRONTO (CHAMAR GARÇOM)
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </main>
            )}
        </div>
    );
}