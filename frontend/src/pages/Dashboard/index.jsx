import React, { useEffect, useState } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import api from '../../services/api';
import './Dashboard.css';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
    const [dados, setDados] = useState(null);
    const [abaAtiva, setAbaAtiva] = useState('geral');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboard() {
            try {
                const res = await api.get('/dashboard/metricas');
                setDados(res.data);
            } catch (err) {
                console.error("Erro na API de Dashboard", err);
            } finally {
                setLoading(false);
            }
        }
        fetchDashboard();
    }, []);

    if (loading) return (
        <div className="dashboard-container" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
            <h1 style={{color: '#10b981'}}>Sincronizando Dados Financeiros...</h1>
        </div>
    );

    // Valores padrão caso o banco esteja vazio
    const kpis = dados?.kpis || { faturamento_total: 0, qtd_pedidos: 0, ticket_medio: 0 };
    const faturacao = dados?.faturacaoDias || [];
    const topPizzas = dados?.pizzasVendidas || [];
    const pagamentos = dados?.metodosPagamento || [];

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1>Ki-Sabor Intelligence</h1>
                    <p style={{color: '#94a3b8'}}>Monitoramento em tempo real do sistema</p>
                </div>

                <div className="dashboard-abas">
                    <button className={`btn-aba ${abaAtiva === 'geral' ? 'ativa' : ''}`} onClick={() => setAbaAtiva('geral')}>Visão Geral</button>
                    <button className={`btn-aba ${abaAtiva === 'vendas' ? 'ativa' : ''}`} onClick={() => setAbaAtiva('vendas')}>Performance</button>
                </div>
            </header>

            {abaAtiva === 'geral' ? (
                <>
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <span className="kpi-titulo">Receita de Hoje</span>
                            <span className="kpi-valor">R$ {Number(kpis.faturamento_total).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="kpi-card">
                            <span className="kpi-titulo">Pedidos Pagos</span>
                            <span className="kpi-valor">{kpis.qtd_pedidos}</span>
                        </div>
                        <div className="kpi-card">
                            <span className="kpi-titulo">Ticket Médio</span>
                            <span className="kpi-valor">R$ {Number(kpis.ticket_medio).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>

                    <div className="graficos-grid">
                        <div className="grafico-card">
                            <h3>Fluxo de Caixa (7 Dias)</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={faturacao}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                    <XAxis dataKey="dia" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff'}} />
                                    <Area type="monotone" dataKey="total" stroke="#10b981" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grafico-card">
                            <h3>Métodos de Pagamento</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={pagamentos} innerRadius={70} outerRadius={90} dataKey="value" paddingAngle={8}>
                                        {pagamentos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            ) : (
                <div className="grafico-card">
                    <h3>🏆 Sabores Mais Lucrativos</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={topPizzas} layout="vertical" margin={{left: 40}}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="nome" type="category" stroke="#fff" fontSize={12} />
                            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                            <Bar dataKey="quantidade" fill="#10b981" radius={[0, 10, 10, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}