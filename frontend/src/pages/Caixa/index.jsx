import { useEffect, useState } from 'react';
import api from '../../services/api';
import './Caixa.css';

export default function Caixa() {
    // --- ESTADOS DO SISTEMA ---
    const [mesas, setMesas] = useState([]);
    const [mesaSelecionada, setMesaSelecionada] = useState(null);
    const [comanda, setComanda] = useState(null);
    const [metodoPagamento, setMetodoPagamento] = useState('Cartão');
    const [carregando, setCarregando] = useState(false);
    
    const [filtroAtivo, setFiltroAtivo] = useState('Todas');
    const [hora, setHora] = useState(new Date().toLocaleTimeString('pt-BR'));
    const [drawerAberto, setDrawerAberto] = useState(false);

    const [nomeCliente, setNomeCliente] = useState('');
    const [modoJuntar, setModoJuntar] = useState(false);
    const [mesaPrincipalParaJuntar, setMesaPrincipalParaJuntar] = useState(null);

    // --- ESTADOS PARA O PIX E TAXA DE SERVIÇO ---
    const [modalPixAberto, setModalPixAberto] = useState(false);
    const [statusPix, setStatusPix] = useState('');
    const [incluirTaxa, setIncluirTaxa] = useState(true);

    // --- ESTADOS: HISTÓRICO E TROCO ---
    const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
    const [historicoPedidos, setHistoricoPedidos] = useState([]);
    const [pedidoExpandido, setPedidoExpandido] = useState(null);
    const [valorEmDinheiro, setValorEmDinheiro] = useState('');

    // --- FUNÇÕES DE CARREGAMENTO ---
    const carregarMesas = async () => {
        try {
            const response = await api.get('/mesas');
            setMesas(response.data);
        } catch (error) { console.error("Erro ao carregar mapa de mesas:", error); }
    };

    const abrirHistorico = async () => {
        try {
            const response = await api.get('/pedidos/historico');
            
            // BLINDAGEM: Garante que o React receba sempre uma lista válida
            let listaPedidos = [];
            if (Array.isArray(response.data)) {
                listaPedidos = response.data;
            } else if (response.data && Array.isArray(response.data.pedidos)) {
                listaPedidos = response.data.pedidos;
            }

            setHistoricoPedidos(listaPedidos);
            setModalHistoricoAberto(true);
        } catch (error) { 
            console.error("Erro na requisição:", error);
            alert("Erro ao carregar histórico. Verifique o console ou a conexão."); 
        }
    };

    const toggleExpandir = (id) => {
        setPedidoExpandido(pedidoExpandido === id ? null : id);
    };

    // --- EFEITOS (LIFECYCLE) ---
    useEffect(() => {
        carregarMesas();
        const intervalo = setInterval(() => {
            if(!modoJuntar) carregarMesas(); 
            setHora(new Date().toLocaleTimeString('pt-BR'));
        }, 3000); 
        return () => clearInterval(intervalo);
    }, [modoJuntar]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && drawerAberto && !modalPixAberto) fecharDrawer();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [drawerAberto, modalPixAberto]);

    // --- FUNÇÕES DA COMANDA E MESA ---
    const abrirComanda = async (mesa) => {
        if (modoJuntar) {
            if (mesa.id === mesaPrincipalParaJuntar.id) return alert("Você não pode juntar a mesa com ela mesma.");
            if (!window.confirm(`Vincular Mesa ${mesa.numero} à Mesa ${mesaPrincipalParaJuntar.numero}?`)) return;
            
            try {
                await api.post(`/mesas/${mesaPrincipalParaJuntar.numero}/juntar`, { mesa_alvo: mesa.numero });
                setModoJuntar(false);
                setMesaPrincipalParaJuntar(null);
                carregarMesas();
                alert('Mesas vinculadas com sucesso!');
            } catch (e) { alert("Erro ao juntar mesas."); }
            return;
        }

        setMesaSelecionada(mesa);
        setNomeCliente(mesa.nome_cliente || '');
        setComanda(null);
        setIncluirTaxa(true);
        setValorEmDinheiro(''); // Reseta o campo de dinheiro
        setDrawerAberto(true);
        
        try {
            const response = await api.get(`/pedidos/mesa/${mesa.numero}/conta`);
            setComanda(response.data);
        } catch (error) { console.error("Erro ao carregar comanda:", error); }
    };

    const fecharDrawer = () => {
        setDrawerAberto(false);
        setTimeout(() => {
            setMesaSelecionada(null);
            setComanda(null);
            carregarMesas();
        }, 300);
    };

    const salvarNomeCliente = async (novoNome) => {
        setNomeCliente(novoNome);
        try {
            await api.put(`/mesas/${mesaSelecionada.numero}/nome`, { nome: novoNome });
        } catch (e) { console.error("Erro ao salvar nome."); }
    };

    const iniciarModoJuntar = () => {
        setMesaPrincipalParaJuntar(mesaSelecionada);
        setModoJuntar(true);
        fecharDrawer();
    };

    // --- FUNÇÕES DE PAGAMENTO ---
    const encerrarConta = async () => {
        if (metodoPagamento === 'PIX') {
            setModalPixAberto(true);
            setStatusPix('⏳ Aguardando leitura do QR Code...');
            setTimeout(() => {
                setStatusPix('✅ Pagamento Concluído!');
                setTimeout(() => {
                    executarFechamentoBanco();
                    setModalPixAberto(false);
                }, 1500);
            }, 5000);
        } else {
            if (!window.confirm(`Encerrar a conta da Mesa ${mesaSelecionada.numero} no ${metodoPagamento}?`)) return;
            executarFechamentoBanco();
        }
    };

    const executarFechamentoBanco = async () => {
        setCarregando(true);
        try {
            await api.post(`/mesas/${mesaSelecionada.numero}/liberar`, { formaPagamento: metodoPagamento });
            if (metodoPagamento !== 'PIX') alert('Conta encerrada com sucesso!');
            fecharDrawer();
        } catch (error) { 
            alert('Erro ao encerrar a conta.'); 
        } finally { 
            setCarregando(false); 
        }
    };

    const copiarPixCopiaECola = () => {
        navigator.clipboard.writeText(`00020126580014BR.GOV.BCB.PIX... Valor: R$${totalFinal.toFixed(2)}`);
        alert("Código PIX copiado para a área de transferência!");
    };

    // --- PROCESSAMENTO DE DADOS VISUAIS ---
    const mesasFiltradas = mesas.filter(mesa => {
        if (filtroAtivo === 'Ocupadas') return mesa.status === 'Ocupada' || mesa.precisa_ajuda;
        if (filtroAtivo === 'Livres') return mesa.status === 'Livre' && !mesa.precisa_ajuda;
        if (filtroAtivo === 'Chamando') return mesa.precisa_ajuda;
        return true; 
    });

    // Cálculos Dinâmicos do Caixa
    const subtotal = comanda?.subtotal || 0;
    const taxaServico = incluirTaxa ? (subtotal * 0.10) : 0;
    const totalFinal = subtotal + taxaServico;
    const isMesaVazia = !comanda || comanda.pedidos.length === 0;

    // Lógica do Troco Inteligente
    const troco = (valorEmDinheiro > totalFinal) ? (valorEmDinheiro - totalFinal) : 0;

    const pedidosAgrupadosPorMesa = comanda?.pedidos.reduce((acc, pedido) => {
        const chave = `Mesa ${pedido.mesa_numero} ${pedido.mesa_nome ? `(${pedido.mesa_nome})` : ''}`;
        if (!acc[chave]) acc[chave] = [];
        acc[chave].push(pedido);
        return acc;
    }, {}) || {};

    return (
        <div className="caixa-container">
            {/* MODO JUNTAR MESAS */}
            {modoJuntar && (
                <div className="barra-selecao">
                    🔗 Selecione a mesa que você deseja vincular à Mesa {mesaPrincipalParaJuntar.numero}
                    <button className="btn-cancelar-selecao" onClick={() => setModoJuntar(false)}>Cancelar</button>
                </div>
            )}

            {/* MODAL DO HISTÓRICO - BLINDADO */}
            {modalHistoricoAberto && (
                <div className="modal-pix-overlay" onClick={() => setModalHistoricoAberto(false)}>
                    <div className="modal-historico-content" onClick={e => e.stopPropagation()}>
                        <header className="drawer-header" style={{ borderRadius: '15px 15px 0 0' }}>
                            <h2>📜 Histórico de Contas</h2>
                            <button className="btn-fechar-drawer" onClick={() => setModalHistoricoAberto(false)}>✕</button>
                        </header>
                        
                        <div className="lista-historico" style={{ padding: '20px', overflowY: 'auto', maxHeight: '60vh' }}>
                            {(!historicoPedidos || historicoPedidos.length === 0) ? (
                                <div style={{ textAlign: 'center', color: '#64748b', marginTop: '20px' }}>
                                    <h3>Nenhuma conta encontrada.</h3>
                                </div>
                            ) : (
                                historicoPedidos.map((pedido, index) => (
                                    <div key={pedido?.id || index} style={{
                                        background: '#f8fafc', borderRadius: '10px', marginBottom: '15px', 
                                        border: '1px solid #e2e8f0', overflow: 'hidden', transition: 'all 0.3s'
                                    }}>
                                        {/* CABEÇALHO CLICÁVEL DO PEDIDO */}
                                        <div 
                                            onClick={() => toggleExpandir(pedido?.id)}
                                            style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '15px', cursor: 'pointer', 
                                                background: pedidoExpandido === pedido?.id ? '#f1f5f9' : 'transparent'
                                            }}
                                        >
                                            <div>
                                                <strong style={{ color: '#0f172a', fontSize: '1.1rem' }}>
                                                    Mesa {pedido?.mesa_numero || '--'}
                                                </strong> 
                                                <span style={{ color: '#64748b', marginLeft: '8px' }}>
                                                    ({pedido?.hora || '--:--'}h)
                                                </span>
                                                <div style={{ fontSize: '0.8rem', color: 'white', background: '#3b82f6', display: 'inline-block', padding: '2px 8px', borderRadius: '5px', marginTop: '5px', fontWeight: 'bold', marginLeft: '10px' }}>
                                                    {pedido?.forma_pagamento || 'Indefinido'}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <strong style={{ color: '#10b981', fontSize: '1.3rem' }}>
                                                    R$ {Number(pedido?.total || 0).toFixed(2).replace('.', ',')}
                                                </strong>
                                                <span style={{ fontSize: '1.2rem', color: '#64748b', transform: pedidoExpandido === pedido?.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }}>
                                                    ▼
                                                </span>
                                            </div>
                                        </div>

                                        {/* ÁREA EXPANDIDA (CUPOM FISCAL DETALHADO) */}
                                        {pedidoExpandido === pedido?.id && (
                                            <div style={{ padding: '15px', borderTop: '1px dashed #cbd5e1', background: 'white' }}>
                                                
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '0.9rem', color: '#475569', background: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
                                                    <span>⏳ <strong>Tempo na mesa:</strong> {pedido?.tempo_mesa ? `${pedido.tempo_mesa} min` : 'N/A'}</span>
                                                    <span>🧾 <strong>ID Pedido:</strong> #{pedido?.id || 'N/A'}</span>
                                                </div>

                                                <h4 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '0.95rem' }}>Itens Consumidos:</h4>
                                                
                                                {pedido?.itens && pedido.itens.length > 0 ? (
                                                    pedido.itens.map((item, idx) => (
                                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#334155' }}>
                                                            <span>• 1x {item?.sabores || 'Pizza'} <small>({item?.tamanho || '-'})</small></span>
                                                            <span style={{ fontWeight: '600' }}>R$ {Number(item?.preco_pago || 0).toFixed(2).replace('.', ',')}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Nenhum item detalhado encontrado.</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DO PIX */}
            {modalPixAberto && (
                <div className="modal-pix-overlay">
                    <div className="modal-pix-content">
                        <h3>Pagar via PIX</h3>
                        <p>Total: <strong style={{color: '#10b981'}}>R$ {totalFinal.toFixed(2).replace('.', ',')}</strong></p>
                        <div className="qr-code-box">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=KiSabor-Pix-R$${totalFinal.toFixed(2)}`} alt="QR Code Pix" />
                        </div>
                        <div className={`status-pix-texto ${statusPix.includes('Concluído') ? 'aprovado' : ''}`}>
                            {statusPix}
                        </div>
                        {!statusPix.includes('Concluído') && (
                            <button className="btn-acao-mesa" style={{marginTop: '20px', width: '100%', borderStyle: 'dashed'}} onClick={copiarPixCopiaECola}>
                                📋 Copiar Pix Copia e Cola
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* TOPBAR */}
            <header className="caixa-topbar">
                <h1>Painel PDV - Ki-Sabor</h1>
                <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                    <button className="btn-filtro" onClick={abrirHistorico} style={{background: '#1e293b', color: 'white'}}>📜 Ver Histórico</button>
                    <div className="relogio">🕒 {hora}</div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="caixa-main">
                <div className="caixa-filtros">
                    {['Todas', 'Ocupadas', 'Livres', 'Chamando'].map(filtro => (
                        <button key={filtro} className={`btn-filtro ${filtroAtivo === filtro ? 'ativo' : ''}`} onClick={() => setFiltroAtivo(filtro)}>
                            {filtro}
                        </button>
                    ))}
                </div>

                <div className="grid-mesas-caixa">
                    {mesasFiltradas.map(mesa => {
                        let classeMesa = mesa.status === 'Ocupada' ? 'mesa-ocupada' : 'mesa-livre';
                        if (mesa.precisa_ajuda) classeMesa = 'mesa-chamando';
                        if (mesa.id_mesa_principal) classeMesa = 'mesa-vinculada';

                        return (
                            <button key={mesa.id} className={`btn-mesa-caixa ${classeMesa}`} onClick={() => abrirComanda(mesa)}>
                                <span className="numero-caixa">{mesa.numero}</span>
                                {mesa.nome_cliente && <span className="nome-cliente-badge">👤 {mesa.nome_cliente}</span>}
                                <span className="status-caixa">
                                    {mesa.id_mesa_principal ? 'VINCULADA' : (mesa.precisa_ajuda ? '✋ CHAMANDO' : mesa.status)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </main>

            {/* DRAWER (GAVETA DA MESA) */}
            <div className={`drawer-overlay ${drawerAberto ? 'aberto' : ''}`} onClick={fecharDrawer}>
                <div className="drawer-painel" onClick={(e) => e.stopPropagation()}>
                    <header className="drawer-header">
                        <div className="drawer-header-titulos">
                            <h2>Mesa {mesaSelecionada?.numero}</h2>
                            <input 
                                type="text" 
                                className="input-nome-cliente" 
                                placeholder="Nome do Cliente (Opcional)" 
                                value={nomeCliente}
                                onChange={(e) => salvarNomeCliente(e.target.value)}
                            />
                        </div>
                        <button className="btn-fechar-drawer" onClick={fecharDrawer}>✕</button>
                    </header>

                    <div className="drawer-acoes">
                        <button className="btn-acao-mesa" onClick={iniciarModoJuntar} disabled={isMesaVazia || mesaSelecionada?.id_mesa_principal}>🔗 Juntar Mesa</button>
                        <button className="btn-acao-mesa" onClick={() => alert("Imprimindo...")}>🖨️ Imprimir</button>
                    </div>

                    <div className="drawer-conteudo">
                        {isMesaVazia ? (
                            <div className="vazio-comanda">Sem itens lançados.</div>
                        ) : (
                            Object.entries(pedidosAgrupadosPorMesa).map(([nomeGrupoMesa, pedidos]) => (
                                <div key={nomeGrupoMesa} className="grupo-mesa-comanda">
                                    <h3 className="titulo-grupo-mesa">{nomeGrupoMesa}</h3>
                                    {pedidos.map(pedido => (
                                        <div key={pedido.id}>
                                            {pedido.itens.map(item => (
                                                <div key={item.id} className="item-comanda-linha">
                                                    <div className="item-comanda-info">
                                                        <strong>1x {item.sabores.join(' / ')}</strong>
                                                        <small>{item.tamanho}</small>
                                                    </div>
                                                    <span className="item-preco">R$ {Number(item.preco_pago).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>

                    <footer className="drawer-footer">
                        <div className="linha-total">
                            <span>Subtotal: R$ {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="linha-total">
                            <label><input type="checkbox" checked={incluirTaxa} onChange={(e) => setIncluirTaxa(e.target.checked)} /> Taxa (10%): R$ {taxaServico.toFixed(2)}</label>
                        </div>
                        <div className="linha-total destaque">
                            <span>TOTAL: R$ {totalFinal.toFixed(2)}</span>
                        </div>

                        {/* SEÇÃO DE PAGAMENTO EM DINHEIRO / TROCO */}
                        {metodoPagamento === 'Dinheiro' && !isMesaVazia && (
                            <div className="calculadora-troco-box">
                                <input 
                                    type="number" 
                                    placeholder="Valor recebido em nota" 
                                    className="input-nome-cliente"
                                    value={valorEmDinheiro}
                                    onChange={(e) => setValorEmDinheiro(e.target.value)}
                                    style={{marginTop: '10px', textAlign: 'center', fontSize: '1.1rem'}}
                                />
                                {valorEmDinheiro > 0 && (
                                    <div className="resultado-troco">
                                        Troco: <strong style={{color: '#10b981'}}>R$ {troco.toFixed(2).replace('.', ',')}</strong>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="pagamento-opcoes">
                            {['PIX', 'Cartão', 'Dinheiro'].map(metodo => (
                                <button key={metodo} className={`btn-pagamento ${metodoPagamento === metodo ? 'ativo' : ''}`} onClick={() => setMetodoPagamento(metodo)} disabled={isMesaVazia}>
                                    {metodo}
                                </button>
                            ))}
                        </div>
                        <button className="btn-encerrar-conta" onClick={encerrarConta} disabled={isMesaVazia || carregando}>
                            {carregando ? '...' : `Fechar com ${metodoPagamento}`}
                        </button>
                    </footer>
                </div>
            </div>
        </div>
    );
}