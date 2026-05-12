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

    const [notaPizza, setNotaPizza] = useState(null); 
    const [notaServico, setNotaServico] = useState(null);
    const [comentario, setComentario] = useState('');
    const [feedbackEnviado, setFeedbackEnviado] = useState(false);
    
    // NOVO: Estado para ocultar/mostrar a avaliação
    const [mostrarAvaliacao, setMostrarAvaliacao] = useState(false);

    useEffect(() => {
        const sincronizar = async () => {
            try {
                const { data } = await api.get(`/pedidos/${id_pedido}`);
                setPedido(data);

                const agora = new Date().getTime();
                const limiteTimer = new Date(data.timer_limite).getTime();
                const diferenca = Math.floor((limiteTimer - agora) / 1000);
                setSegundosRestantes(diferenca > 0 ? diferenca : 0);

                const dataCriacao = new Date(data.data_criacao).getTime();
                setMinutosDecorridos(Math.floor((agora - dataCriacao) / 60000));
            } catch (error) {
                console.error(error);
            }
        };

        sincronizar();
        const syncInterval = setInterval(sincronizar, 5000); 
        return () => clearInterval(syncInterval);
    }, [id_pedido]);

    useEffect(() => {
        if (segundosRestantes > 0) {
            const timer = setInterval(() => setSegundosRestantes(s => s - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [segundosRestantes]);

    const handleCancelar = async () => {
        if (window.confirm("Deseja cancelar o pedido?")) {
            try {
                await api.delete(`/pedidos/${id_pedido}`);
                navigate('/cardapio');
            } catch (e) { alert("Não é mais possível cancelar."); }
        }
    };

    const handleApressar = async () => {
        try {
            await api.post(`/pedidos/${id_pedido}/apressar`);
            setNotificacaoEnviada(true);
            alert("A cozinha foi notificada!");
        } catch (e) { alert("Erro ao notificar."); }
    };

    const handleConfirmarRecebimento = async () => {
        try {
            await api.put(`/pedidos/${id_pedido}/status`, { novo_status: 'Entregue' });
            setPedido({ ...pedido, status: 'Entregue' });
        } catch (e) { alert("Erro ao confirmar."); }
    };

    const enviarFeedback = () => {
        if (!notaPizza || !notaServico) return alert("Avalie a pizza e o serviço dando uma nota de 1 a 10.");
        console.log({ notaPizza, notaServico, comentario });
        setFeedbackEnviado(true);
    };

    if (!pedido || segundosRestantes === null) return <div className="app-container"><p>Sincronizando...</p></div>;

    const tempoFormatado = `${Math.floor(segundosRestantes / 60)}:${String(segundosRestantes % 60).padStart(2, '0')}`;

    const getStatusInfo = () => {
        switch(pedido.status) {
            case 'Confirmado': return { cor: '#3182CE', icone: '📋', texto: 'Na Fila da Cozinha' };
            case 'Em Preparo': return { cor: '#D69E2E', icone: '👨‍🍳', texto: 'Em Preparo (Mão na massa!)' };
            case 'Pronto': return { cor: '#38A169', icone: '🍕', texto: 'A caminho da sua mesa!' };
            case 'Entregue': return { cor: '#4338ca', icone: '✅', texto: 'Item Entregue!' };
            case 'Cancelado': return { cor: '#E53E3E', icone: '❌', texto: 'Pedido Cancelado' };
            default: return { cor: '#718096', icone: '⏳', texto: pedido.status };
        }
    };

    const statusInfo = getStatusInfo();
    const arrayNotas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; 

    return (
        <div className="status-container app-container">
            <header className="header-status">
                <h1 className="logo-texto">Ki-Sabor</h1>
                <p>Mesa {localStorage.getItem('mesa_kisabor')} • Pedido #{id_pedido}</p>
            </header>

            <main className="conteudo-status">
                <div className="card-status">
                    
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
                        <>
                            <div className="status-dinamico-container">
                                <div className="icone-gigante" style={{ color: statusInfo.cor }}>{statusInfo.icone}</div>
                                <h2 style={{ color: statusInfo.cor, margin: '10px 0' }}>{statusInfo.texto}</h2>
                            </div>

                            {pedido.status === 'Pronto' && (
                                <button className="btn-recebido" onClick={handleConfirmarRecebimento}>
                                    ✅ Recebi minha Pizza!
                                </button>
                            )}

                            {pedido.status === 'Entregue' && (
                                <>
                                    {/* MÓDULO DE FEEDBACK: SÓ APARECE SE CLICAR NO BOTÃO */}
                                    {!mostrarAvaliacao && !feedbackEnviado ? (
                                        <button 
                                            className="btn-novo-pedido" 
                                            onClick={() => setMostrarAvaliacao(true)} 
                                            style={{marginTop: '1rem', borderColor: '#f59e0b', color: '#d97706'}}
                                        >
                                            ⭐ Avaliar este pedido
                                        </button>
                                    ) : (
                                        !feedbackEnviado ? (
                                            <div className="container-feedback">
                                                <h3 style={{marginTop: 0}}>Sua opinião é importante!</h3>
                                                
                                                <div className="pergunta-feedback">
                                                    <h4>O que achou da qualidade do pedido?</h4>
                                                    <div className="escala-notas">
                                                        {arrayNotas.map(nota => (
                                                            <button 
                                                                key={`pizza-${nota}`}
                                                                className={`btn-nota ${notaPizza === nota ? 'ativo' : ''}`}
                                                                onClick={() => setNotaPizza(nota)}
                                                            >
                                                                {nota}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="pergunta-feedback">
                                                    <h4>E a velocidade do atendimento?</h4>
                                                    <div className="escala-notas">
                                                        {arrayNotas.map(nota => (
                                                            <button 
                                                                key={`servico-${nota}`}
                                                                className={`btn-nota ${notaServico === nota ? 'ativo' : ''}`}
                                                                onClick={() => setNotaServico(nota)}
                                                            >
                                                                {nota}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <textarea 
                                                    className="textarea-feedback" 
                                                    placeholder="Quer deixar algum comentário adicional?"
                                                    value={comentario}
                                                    onChange={(e) => setComentario(e.target.value)}
                                                    rows="3"
                                                ></textarea>

                                                <button className="btn-enviar-feedback" onClick={enviarFeedback}>Enviar Avaliação</button>
                                            </div>
                                        ) : (
                                            <div className="aviso-caixa" style={{background: '#ecfdf5', color: '#065f46', borderLeftColor: '#10b981', marginTop: '1.5rem'}}>
                                                Obrigado por nos ajudar a melhorar!
                                            </div>
                                        )
                                    )}

                                    <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '2rem'}}>
                                        <button className="btn-novo-pedido" onClick={() => navigate('/cardapio')} style={{marginTop: 0}}>
                                            🍕 Fazer Novo Pedido
                                        </button>
                                        
                                        <button className="btn-enviar-feedback" onClick={() => navigate('/conta')} style={{marginTop: 0, backgroundColor: '#0f172a'}}>
                                            🧾 Ver Conta Total da Mesa
                                        </button>
                                    </div>
                                </>
                            )}

                            {['Confirmado', 'Em Preparo'].includes(pedido.status) && (
                                <>
                                    {minutosDecorridos >= 25 && (
                                        <div className="alerta-atraso-box">
                                            <p>Já se passaram <strong>{minutosDecorridos} minutos</strong>. Sentimos muito pela demora!</p>
                                            <button className="btn-apressar" onClick={handleApressar} disabled={notificacaoEnviada}>
                                                {notificacaoEnviada ? '✅ AVISO ENVIADO' : '🔔 APRESSAR MEU PEDIDO'}
                                            </button>
                                        </div>
                                    )}
                                    <button className="btn-novo-pedido" onClick={() => navigate('/cardapio')}>🍕 Fazer Novo Pedido</button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}