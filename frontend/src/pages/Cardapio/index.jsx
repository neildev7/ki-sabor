import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Cardapio.css';

export default function Cardapio() {
    const [pizzas, setPizzas] = useState([]);
    const [tamanhos, setTamanhos] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [termoBusca, setTermoBusca] = useState('');
    const [carrinho, setCarrinho] = useState([]);
    
    const [produtoSelecionado, setProdutoSelecionado] = useState(null);
    const [modalAberto, setModalAberto] = useState(false);
    
    // Estados para Pizzas
    const [tamanhoSelecionado, setTamanhoSelecionado] = useState('');
    const [saboresAlocados, setSaboresAlocados] = useState([]);
    const [mostrarSaboresExtras, setMostrarSaboresExtras] = useState(false);
    const [bordaSelecionada, setBordaSelecionada] = useState(null);
    
    // Estados Globais (Pizzas e Bebidas)
    const [observacaoTexto, setObservacaoTexto] = useState('');
    const [quantidadeBebida, setQuantidadeBebida] = useState(1);
    const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');

    const navigate = useNavigate();
    const numeroMesa = localStorage.getItem('mesa_kisabor');

    const opcoesBorda = [
        { id: 1, nome: 'Catupiry Original', preco: 12.00 },
        { id: 2, nome: 'Cheddar Cremoso', preco: 10.00 },
        { id: 3, nome: 'Chocolate ao Leite', preco: 15.00 }
    ];

    useEffect(() => {
        if (!numeroMesa) return navigate('/');
        const carregarDados = async () => {
            try {
                const [respProdutos, respTamanhos] = await Promise.all([
                    api.get('/produtos/pizzas'), // O backend deve estar retornando todos os produtos aqui
                    api.get('/produtos/tamanhos')
                ]);
                setPizzas(respProdutos.data);
                setTamanhos(respTamanhos.data);
            } catch (error) {
                console.error("Erro:", error);
            } finally {
                setLoading(false);
            }
        };
        carregarDados();
    }, [navigate, numeroMesa]);

    // O FILTRO CORRIGIDO
    const produtosFiltrados = pizzas.filter((produto) => {
        const matchPesquisa = produto.nome.toLowerCase().includes(termoBusca.toLowerCase()) || 
                              (produto.descricao && produto.descricao.toLowerCase().includes(termoBusca.toLowerCase()));
        
        let matchCategoria = true; 
        const isBebida = produto.id_categoria === 2;
        const nomesDoces = ['Brigadeiro', 'Romeu e Julieta', 'Banana com Canela'];
        const nomesEspeciais = ['Carne Seca', 'Rúcula com Tomate Seco', 'Strogonoff de Carne', 'Nordestina', 'Carbonara', 'Pepperoni', 'Lombo com Cream Cheese'];

        if (categoriaAtiva === 'Bebidas') matchCategoria = isBebida;
        else if (categoriaAtiva === 'Doces') matchCategoria = !isBebida && nomesDoces.includes(produto.nome);
        else if (categoriaAtiva === 'Especiais') matchCategoria = !isBebida && nomesEspeciais.includes(produto.nome);
        else if (categoriaAtiva === 'Tradicionais') matchCategoria = !isBebida && !nomesDoces.includes(produto.nome) && !nomesEspeciais.includes(produto.nome);

        return matchPesquisa && matchCategoria;
    });

    const getMaxFatias = (idTamanho) => {
        const tam = tamanhos.find(t => t.id === Number(idTamanho));
        return tam ? tam.fatias : 8;
    };

    const abrirModal = (produto) => {
        setProdutoSelecionado(produto);
        setObservacaoTexto('');
        
        if (produto.id_categoria === 2) {
            // Se for Bebida, reinicia a quantidade
            setQuantidadeBebida(1);
        } else {
            // Se for Pizza, prepara os tamanhos e fatias
            const tamanhoPadrao = tamanhos.length > 0 ? tamanhos[0].id : '';
            setTamanhoSelecionado(tamanhoPadrao);
            setSaboresAlocados([{ pizza: produto, fatias: getMaxFatias(tamanhoPadrao) }]);
            setBordaSelecionada(null);
            setMostrarSaboresExtras(false);
        }
        setModalAberto(true);
    };

    const fecharModal = () => {
        setModalAberto(false);
        setTimeout(() => setProdutoSelecionado(null), 300); 
    };

    const handleTrocarTamanho = (idNovoTamanho) => {
        setTamanhoSelecionado(idNovoTamanho);
        setSaboresAlocados([{ pizza: produtoSelecionado, fatias: getMaxFatias(idNovoTamanho) }]);
    };

    const redistribuirFatias = (lista) => {
        const totalFatias = getMaxFatias(tamanhoSelecionado);
        const fatiasBase = Math.floor(totalFatias / lista.length);
        let fatiasRestantes = totalFatias % lista.length;

        const novaLista = lista.map(item => {
            let qtd = fatiasBase;
            if (fatiasRestantes > 0) {
                qtd += 1;
                fatiasRestantes -= 1;
            }
            return { ...item, fatias: qtd };
        });
        setSaboresAlocados(novaLista);
    };

    const toggleSaborExtra = (pizzaExtra) => {
        const jaSelecionado = saboresAlocados.find(s => s.pizza.id === pizzaExtra.id);
        if (jaSelecionado) {
            const novaLista = saboresAlocados.filter(s => s.pizza.id !== pizzaExtra.id);
            redistribuirFatias(novaLista);
        } else {
            if (saboresAlocados.length >= 4) return alert("Máximo de 4 sabores alcançado.");
            const novaLista = [...saboresAlocados, { pizza: pizzaExtra, fatias: 0 }];
            redistribuirFatias(novaLista);
        }
    };

    const alterarFatia = (idPizza, delta) => {
        const novaLista = [...saboresAlocados];
        const indexAtual = novaLista.findIndex(s => s.pizza.id === idPizza);
        if (delta === -1 && novaLista[indexAtual].fatias === 1) return;

        if (delta === 1) {
            const indexDooador = novaLista.findIndex((s, i) => i !== indexAtual && s.fatias > 1);
            if (indexDooador === -1) return;
            novaLista[indexDooador].fatias -= 1;
            novaLista[indexAtual].fatias += 1;
        } else {
            const indexReceptor = indexAtual === 0 ? 1 : 0;
            novaLista[indexAtual].fatias -= 1;
            novaLista[indexReceptor].fatias += 1;
        }
        setSaboresAlocados(novaLista);
    };

    const alternarBorda = (borda) => {
        if (bordaSelecionada && bordaSelecionada.id === borda.id) setBordaSelecionada(null);
        else setBordaSelecionada(borda);
    };

    const calcularPrecoTotal = () => {
        if (!produtoSelecionado) return 0;
        
        // Se for Bebida
        if (produtoSelecionado.id_categoria === 2) {
            return Number(produtoSelecionado.preco_base) * quantidadeBebida;
        }

        // Se for Pizza
        const precosBase = saboresAlocados.map(s => Number(s.pizza.preco_base));
        const maiorPrecoBase = Math.max(...precosBase);
        const tamanhoObj = tamanhos.find(t => t.id === Number(tamanhoSelecionado));
        const ajuste = tamanhoObj ? Number(tamanhoObj.ajuste_preco) : 0;

        let total = maiorPrecoBase + ajuste;
        if (bordaSelecionada) total += Number(bordaSelecionada.preco);
        return total;
    };

    const adicionarAoCarrinho = () => {
        const isBebida = produtoSelecionado.id_categoria === 2;
        
        if (!isBebida && !tamanhoSelecionado) return alert("Selecione um tamanho.");

        const precoFinal = calcularPrecoTotal();
        let observacaoFinal = "";
        let IDsSabores = [];
        let tamanhoObj = null;

        if (isBebida) {
            // Configuração fake de tamanho para o banco não reclamar
            tamanhoObj = tamanhos.length > 0 ? tamanhos[0] : { id: 1, nome: 'Único' }; 
            observacaoFinal = `Qtd: ${quantidadeBebida}. `;
            if (observacaoTexto) observacaoFinal += `Obs: ${observacaoTexto}`;
            IDsSabores = [produtoSelecionado.id];
            
            // Adiciona a quantidade de bebidas vezes no carrinho
            for(let i=0; i < quantidadeBebida; i++) {
                setCarrinho(prev => [...prev, {
                    id_item_pedido: Date.now() + i,
                    produto: produtoSelecionado,
                    tamanho: tamanhoObj,
                    preco: Number(produtoSelecionado.preco_base),
                    observacoes: observacaoFinal.trim(),
                    sabores: IDsSabores
                }]);
            }
        } else {
            // Configuração da Pizza
            tamanhoObj = tamanhos.find(t => t.id === Number(tamanhoSelecionado));
            const textoFatias = saboresAlocados.map(s => `${s.fatias} fatias de ${s.pizza.nome}`).join(' | ');
            observacaoFinal = `Divisão: ${textoFatias}. `;
            if (bordaSelecionada) observacaoFinal += `Borda: ${bordaSelecionada.nome}. `;
            if (observacaoTexto) observacaoFinal += `Obs: ${observacaoTexto}`;
            IDsSabores = saboresAlocados.map(s => s.pizza.id);

            const novoItem = {
                id_item_pedido: Date.now(),
                produto: produtoSelecionado,
                tamanho: tamanhoObj,
                preco: precoFinal,
                observacoes: observacaoFinal.trim(),
                sabores: IDsSabores
            };
            setCarrinho([...carrinho, novoItem]);
        }

        fecharModal();
    };

    if (loading) return <div className="app-container" style={{display:'flex', alignItems:'center', justifyContent:'center'}}><p>Carregando...</p></div>;

    const idsSelecionados = !produtoSelecionado || produtoSelecionado.id_categoria === 2 ? [] : saboresAlocados.map(s => s.pizza.id);
    const maxFatiasPermitidas = !produtoSelecionado || produtoSelecionado.id_categoria === 2 ? 0 : getMaxFatias(tamanhoSelecionado);
    const isBebidaAtiva = produtoSelecionado?.id_categoria === 2;

    return (
        <div className="app-container">
            <header className="header-cardapio">
                <div className="header-topo" style={{ marginBottom: 0 }}>
                    <h1 className="logo-texto" style={{fontSize: '2rem'}}>Ki-Sabor</h1>
                    <span className="mesa-badge">Mesa {numeroMesa}</span>
                </div>
                <div className="barra-pesquisa-container">
                    <input type="text" className="input-pesquisa" placeholder="🔍 Buscar por nome..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} />
                </div>
                <div className="scroll-categorias">
                    {['Todas', 'Tradicionais', 'Especiais', 'Doces', 'Bebidas'].map(cat => (
                        <button key={cat} className={`btn-categoria ${categoriaAtiva === cat ? 'ativo' : ''}`} onClick={() => setCategoriaAtiva(cat)}>{cat}</button>
                    ))}
                </div>
            </header>

            <main className="lista-produtos" style={{ paddingBottom: carrinho.length > 0 ? '90px' : '20px' }}>
                {produtosFiltrados.length > 0 ? (
                    produtosFiltrados.map((produto) => (
                        <div key={produto.id} className="card-pizza" onClick={() => abrirModal(produto)}>
                            {/* IMAGEM DO PRODUTO */}
                            {produto.imagem_url ? (
                                <img src={produto.imagem_url} alt={produto.nome} className="produto-imagem" />
                            ) : (
                                <div className="img-placeholder">{produto.id_categoria === 2 ? '🥤' : '🍕'}</div>
                            )}
                            
                            <div className="card-info">
                                <h3>{produto.nome}</h3>
                                <p>{produto.descricao}</p>
                                <div className="preco-container">
                                    <span className="preco">R$ {Number(produto.preco_base).toFixed(2).replace('.', ',')}</span>
                                    <button className="btn-add-icone">+</button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="mensagem-vazia"><p>Nenhum produto encontrado 😕</p></div>
                )}
            </main>

            <div className={`modal-overlay ${modalAberto ? 'ativo' : ''}`} onClick={fecharModal}>
                <div className={`modal-bottom-sheet ${modalAberto ? 'aberto' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <div className="drag-handle"></div>
                    
                    {produtoSelecionado && (
                        <div style={{overflowY: 'auto', paddingBottom: '1rem', maxHeight: '75vh'}}>
                            
                            {/* IMAGEM DE DESTAQUE NO MODAL */}
                            {produtoSelecionado.imagem_url && (
                                <img src={produtoSelecionado.imagem_url} alt={produtoSelecionado.nome} className="modal-imagem-destaque" />
                            )}

                            <div className="modal-header">
                                <h2>{produtoSelecionado.nome}</h2>
                                <p>{isBebidaAtiva ? 'Bebida Gelada' : 'Preço calculado pelo sabor de maior valor.'}</p>
                            </div>
                            
                            {isBebidaAtiva ? (
                                /* --- MODAL SIMPLIFICADO PARA BEBIDAS --- */
                                <>
                                    <h3 className="secao-titulo">Quantidade</h3>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem'}}>
                                        <button className="btn-fatia" onClick={() => setQuantidadeBebida(Math.max(1, quantidadeBebida - 1))} style={{width:'40px', height:'40px', fontSize:'1.5rem'}}>-</button>
                                        <span style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{quantidadeBebida}</span>
                                        <button className="btn-fatia" onClick={() => setQuantidadeBebida(quantidadeBebida + 1)} style={{width:'40px', height:'40px', fontSize:'1.5rem'}}>+</button>
                                    </div>
                                </>
                            ) : (
                                /* --- MODAL COMPLETO PARA PIZZAS --- */
                                <>
                                    <h3 className="secao-titulo">1. Tamanho <span>({maxFatiasPermitidas} fatias)</span></h3>
                                    <div className="grid-tamanhos">
                                        {tamanhos.map(tam => (
                                            <button 
                                                key={tam.id}
                                                className={`btn-tamanho ${tamanhoSelecionado === tam.id ? 'ativo' : ''}`}
                                                onClick={() => handleTrocarTamanho(tam.id)}
                                            >
                                                <span>{tam.nome}</span>
                                                <small>{tam.fatias} fatias</small>
                                            </button>
                                        ))}
                                    </div>

                                    {saboresAlocados.length > 1 && (
                                        <>
                                            <h3 className="secao-titulo" style={{color: 'var(--verde-kisabor)'}}>Personalizar Fatias <span>Total: {maxFatiasPermitidas}</span></h3>
                                            <div className="distribuidor-fatias">
                                                {saboresAlocados.map((item) => (
                                                    <div key={item.pizza.id} className="item-fatia">
                                                        <span className="item-fatia-nome">{item.pizza.nome}</span>
                                                        <div className="controles-fatia">
                                                            <button className="btn-fatia" onClick={() => alterarFatia(item.pizza.id, -1)} disabled={item.fatias <= 1}>-</button>
                                                            <span className="fatias-quantidade">{item.fatias}</span>
                                                            <button className="btn-fatia" onClick={() => alterarFatia(item.pizza.id, 1)} disabled={item.fatias >= (maxFatiasPermitidas - saboresAlocados.length + 1)}>+</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    <h3 className="secao-titulo">2. Meio a Meio? <span>Até 3 Extras</span></h3>
                                    {!mostrarSaboresExtras ? (
                                        <button 
                                            onClick={() => setMostrarSaboresExtras(true)}
                                            style={{
                                                width: '100%', padding: '15px', borderRadius: '12px',
                                                background: 'transparent', border: '2px dashed var(--verde-kisabor)',
                                                color: 'var(--verde-kisabor)', fontWeight: 'bold', fontSize: '1rem',
                                                cursor: 'pointer', marginBottom: '1.5rem'
                                            }}
                                        >
                                            🍕 Adicionar outro sabor
                                        </button>
                                    ) : (
                                        <div className="lista-extras">
                                            {pizzas.filter(p => p.id !== produtoSelecionado.id && p.id_categoria === 1).map(p => (
                                                <label key={p.id} className={`item-extra ${idsSelecionados.includes(p.id) ? 'selecionado' : ''}`}>
                                                    <div style={{display: 'flex', flexDirection: 'column'}}>
                                                        <span style={{fontWeight: '500', color: 'var(--texto-principal)'}}>{p.nome}</span>
                                                        <span style={{fontSize:'0.8rem', color:'var(--texto-secundario)'}}>R$ {Number(p.preco_base).toFixed(2)}</span>
                                                    </div>
                                                    <input type="checkbox" checked={idsSelecionados.includes(p.id)} onChange={() => toggleSaborExtra(p)}/>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    <h3 className="secao-titulo">3. Borda Recheada <span>Opcional</span></h3>
                                    <div className="borda-opcoes">
                                        {opcoesBorda.map(borda => (
                                            <div key={borda.id} className={`item-borda ${bordaSelecionada?.id === borda.id ? 'ativo' : ''}`} onClick={() => alternarBorda(borda)}>
                                                <div className="borda-info">
                                                    <span className="borda-nome">{borda.nome}</span>
                                                    <span className="borda-preco">+ R$ {borda.preco.toFixed(2).replace('.', ',')}</span>
                                                </div>
                                                <input type="radio" checked={bordaSelecionada?.id === borda.id} readOnly style={{accentColor: 'var(--verde-kisabor)'}}/>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            <h3 className="secao-titulo">{isBebidaAtiva ? '2.' : '4.'} Observações <span>Opcional</span></h3>
                            <textarea className="campo-observacao" rows="3" placeholder={isBebidaAtiva ? "Ex: Com copo e gelo..." : "Ex: Tirar cebola..."} value={observacaoTexto} onChange={(e) => setObservacaoTexto(e.target.value)}></textarea>

                            <button className="btn-finalizar-pedido" onClick={adicionarAoCarrinho} style={{width: '100%', marginTop: '1rem'}}>
                                Adicionar ao Pedido • R$ {calcularPrecoTotal().toFixed(2).replace('.', ',')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {carrinho.length > 0 && (
                <div className="barra-carrinho">
                    <div>
                        <strong style={{ display: 'block', fontSize: '1.1rem' }}>{carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'}</strong>
                        <small style={{ opacity: 0.9 }}>Total: R$ {carrinho.reduce((acc, item) => acc + item.preco, 0).toFixed(2).replace('.', ',')}</small>
                    </div>
                    <button className="btn-ver-carrinho" onClick={() => navigate('/resumo-pedido', { state: { carrinho } })}>Ver Pedido ➔</button>
                </div>
            )}
        </div>
    );
}