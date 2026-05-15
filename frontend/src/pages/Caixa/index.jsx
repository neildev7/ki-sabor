import { useEffect, useState } from 'react';
import api from '../../services/api';
import './Caixa.css';

export default function Caixa() {
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

    // ESTADOS PARA O PIX E TAXA DE SERVIÇO
    const [modalPixAberto, setModalPixAberto] = useState(false);
    const [statusPix, setStatusPix] = useState('');
    const [incluirTaxa, setIncluirTaxa] = useState(true); // Toggle dos 10%

    const carregarMesas = async () => {
        try {
            const response = await api.get('/mesas');
            setMesas(response.data);
        } catch (error) { console.error("Erro ao carregar mapa de mesas:", error); }
    };

    useEffect(() => {
        carregarMesas();
        const intervalo = setInterval(() => {
            if(!modoJuntar) carregarMesas(); 
            setHora(new Date().toLocaleTimeString('pt-BR'));
        }, 3000); 
        return () => clearInterval(intervalo);
    }, [modoJuntar]);

    // Atalho de teclado avançado (ESC para fechar a gaveta)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && drawerAberto && !modalPixAberto) fecharDrawer();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [drawerAberto, modalPixAberto]);

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
        setIncluirTaxa(true); // Reseta a taxa para 100% ao abrir nova mesa
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

    const mesasFiltradas = mesas.filter(mesa => {
        if (filtroAtivo === 'Ocupadas') return mesa.status === 'Ocupada' || mesa.precisa_ajuda;
        if (filtroAtivo === 'Livres') return mesa.status === 'Livre' && !mesa.precisa_ajuda;
        if (filtroAtivo === 'Chamando') return mesa.precisa_ajuda;
        return true; 
    });

    // CÁLCULOS DINÂMICOS
    const subtotal = comanda?.subtotal || 0;
    const taxaServico = incluirTaxa ? (subtotal * 0.10) : 0;
    const totalFinal = subtotal + taxaServico;
    const isMesaVazia = !comanda || comanda.pedidos.length === 0;

    const pedidosAgrupadosPorMesa = comanda?.pedidos.reduce((acc, pedido) => {
        const chave = `Mesa ${pedido.mesa_numero} ${pedido.mesa_nome ? `(${pedido.mesa_nome})` : ''}`;
        if (!acc[chave]) acc[chave] = [];
        acc[chave].push(pedido);
        return acc;
    }, {}) || {};

    return (
        <div className="caixa-container">
            {modoJuntar && (
                <div className="barra-selecao">
                    🔗 Selecione a mesa que você deseja vincular à Mesa {mesaPrincipalParaJuntar.numero}
                    <button className="btn-cancelar-selecao" onClick={() => setModoJuntar(false)}>Cancelar</button>
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

            <header className="caixa-topbar">
                <h1>Painel PDV - Ki-Sabor</h1>
                <div className="relogio">🕒 {hora}</div>
            </header>

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

            {/* GAVETA LATERAL DE COMANDA */}
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
                        <button className="btn-fechar-drawer" onClick={fecharDrawer} title="Fechar (ESC)">✕</button>
                    </header>

                    <div className="drawer-acoes">
                        <button className="btn-acao-mesa" onClick={iniciarModoJuntar} disabled={isMesaVazia || mesaSelecionada?.id_mesa_principal}>🔗 Juntar Mesa</button>
                        <button className="btn-acao-mesa" onClick={() => alert("Simulação: Imprimindo relatório na impressora térmica...")}>🖨️ Imprimir</button>
                    </div>

                    <div className="drawer-conteudo">
                        {isMesaVazia ? (
                            <div className="vazio-comanda">Esta mesa não possui itens lançados.</div>
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
                                                        <small>Tam: {item.tamanho}</small>
                                                    </div>
                                                    <span className="item-preco">R$ {Number(item.preco_pago).toFixed(2).replace('.', ',')}</span>
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
                            <span>Subtotal:</span>
                            <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                        </div>
                        
                        {/* TOGGLE DA TAXA DE SERVIÇO */}
                        <div className="linha-total" style={{alignItems: 'center', color: !incluirTaxa ? '#94a3b8' : '#64748b'}}>
                            <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <input 
                                    type="checkbox" 
                                    checked={incluirTaxa} 
                                    onChange={(e) => setIncluirTaxa(e.target.checked)}
                                    style={{accentColor: 'var(--verde-kisabor)', width: '16px', height: '16px'}}
                                />
                                Taxa de Serviço (10%):
                            </label>
                            <span style={{textDecoration: !incluirTaxa ? 'line-through' : 'none'}}>
                                R$ {(subtotal * 0.10).toFixed(2).replace('.', ',')}
                            </span>
                        </div>
                        
                        <div className="linha-total destaque">
                            <span>TOTAL:</span>
                            <span>R$ {totalFinal.toFixed(2).replace('.', ',')}</span>
                        </div>

                        <div className="pagamento-opcoes">
                            {['PIX', 'Cartão', 'Dinheiro'].map(metodo => (
                                <button key={metodo} className={`btn-pagamento ${metodoPagamento === metodo ? 'ativo' : ''}`} onClick={() => setMetodoPagamento(metodo)} disabled={isMesaVazia}>
                                    {metodo}
                                </button>
                            ))}
                        </div>
                        
                        
                        <button className="btn-encerrar-conta" onClick={encerrarConta} disabled={isMesaVazia || carregando}>
                            {carregando ? 'Processando...' : `Fechar com ${metodoPagamento}`}
                        </button>
                    </footer>
                </div>
            </div>
        </div>
    );
}