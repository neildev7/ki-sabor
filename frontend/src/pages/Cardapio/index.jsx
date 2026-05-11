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
    
    const [pizzaBase, setPizzaBase] = useState(null);
    const [modalAberto, setModalAberto] = useState(false);
    
    const [tamanhoSelecionado, setTamanhoSelecionado] = useState('');
    
    // NOVO ESTADO: Substitui o antigo saboresExtras para guardar a alocação de fatias
    const [saboresAlocados, setSaboresAlocados] = useState([]);
    
    const [bordaSelecionada, setBordaSelecionada] = useState(null);
    const [observacaoTexto, setObservacaoTexto] = useState('');
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
                const [respPizzas, respTamanhos] = await Promise.all([
                    api.get('/produtos/pizzas'),
                    api.get('/produtos/tamanhos')
                ]);
                setPizzas(respPizzas.data);
                setTamanhos(respTamanhos.data);
            } catch (error) {
                console.error("Erro:", error);
            } finally {
                setLoading(false);
            }
        };
        carregarDados();
    }, [navigate, numeroMesa]);

    const pizzasFiltradas = pizzas.filter((pizza) => {
        const matchPesquisa = pizza.nome.toLowerCase().includes(termoBusca.toLowerCase()) || 
                              pizza.descricao.toLowerCase().includes(termoBusca.toLowerCase());
        let matchCategoria = true; 
        const nomesDoces = ['Brigadeiro', 'Romeu e Julieta', 'Banana com Canela'];
        const nomesEspeciais = ['Carne Seca', 'Rúcula com Tomate Seco', 'Strogonoff de Carne', 'Nordestina', 'Carbonara', 'Pepperoni', 'Lombo com Cream Cheese'];

        if (categoriaAtiva === 'Doces') matchCategoria = nomesDoces.includes(pizza.nome);
        else if (categoriaAtiva === 'Especiais') matchCategoria = nomesEspeciais.includes(pizza.nome);
        else if (categoriaAtiva === 'Tradicionais') matchCategoria = !nomesDoces.includes(pizza.nome) && !nomesEspeciais.includes(pizza.nome);
        else if (categoriaAtiva === 'Bebidas') matchCategoria = false; 

        return matchPesquisa && matchCategoria;
    });

    // Pega quantas fatias o tamanho atual permite
    const getMaxFatias = (idTamanho) => {
        const tam = tamanhos.find(t => t.id === Number(idTamanho));
        return tam ? tam.fatias : 8;
    };

    const abrirModal = (pizza) => {
        setPizzaBase(pizza);
        const tamanhoPadrao = tamanhos.length > 0 ? tamanhos[0].id : '';
        setTamanhoSelecionado(tamanhoPadrao);
        
        // Inicia a alocação dando todas as fatias para a pizza escolhida
        setSaboresAlocados([{ pizza: pizza, fatias: getMaxFatias(tamanhoPadrao) }]);
        
        setBordaSelecionada(null);
        setObservacaoTexto('');
        setModalAberto(true);
    };

    const fecharModal = () => {
        setModalAberto(false);
        setTimeout(() => setPizzaBase(null), 300); 
    };

    // Atualiza o total de fatias se o cliente trocar o tamanho (ex: de Grande para Brotinho)
    const handleTrocarTamanho = (idNovoTamanho) => {
        setTamanhoSelecionado(idNovoTamanho);
        const novoMax = getMaxFatias(idNovoTamanho);
        
        // Se trocou de tamanho, reseta os sabores extras para evitar quebra na matemática
        setSaboresAlocados([{ pizza: pizzaBase, fatias: novoMax }]);
    };

    const toggleSaborExtra = (pizzaExtra) => {
        const jaSelecionado = saboresAlocados.find(s => s.pizza.id === pizzaExtra.id);

        if (jaSelecionado) {
            // Se já tem, remove e devolve as fatias para o sabor base
            const fatiasDevolvidas = jaSelecionado.fatias;
            const novaLista = saboresAlocados.filter(s => s.pizza.id !== pizzaExtra.id);
            novaLista[0].fatias += fatiasDevolvidas; // Devolve pra primeira pizza da lista
            setSaboresAlocados(novaLista);
        } else {
            // Se vai adicionar, verifica limite de 4 sabores
            if (saboresAlocados.length >= 4) return alert("Máximo de 4 sabores alcançado.");
            
            // Tira 1 fatia do sabor que tem mais fatias para dar para o novo
            const novaLista = [...saboresAlocados];
            const saborComMaisFatias = novaLista.reduce((prev, current) => (prev.fatias > current.fatias) ? prev : current);
            
            if (saborComMaisFatias.fatias <= 1) return alert("Não há fatias suficientes para dividir mais.");
            
            saborComMaisFatias.fatias -= 1;
            novaLista.push({ pizza: pizzaExtra, fatias: 1 });
            setSaboresAlocados(novaLista);
        }
    };

    // Lógica para os botões [+] e [-]
    const alterarFatia = (idPizza, delta) => {
        const novaLista = [...saboresAlocados];
        const indexAtual = novaLista.findIndex(s => s.pizza.id === idPizza);
        
        // Não pode zerar uma pizza (se quiser remover, desmarca no checkbox)
        if (delta === -1 && novaLista[indexAtual].fatias === 1) return;

        if (delta === 1) {
            // Se quer adicionar uma fatia aqui, precisa tirar de outra pizza
            const indexDooador = novaLista.findIndex((s, i) => i !== indexAtual && s.fatias > 1);
            if (indexDooador === -1) return; // Ninguém tem fatia pra doar
            
            novaLista[indexDooador].fatias -= 1;
            novaLista[indexAtual].fatias += 1;
        } else {
            // Se quer tirar daqui, dá pra primeira pizza diferente que encontrar
            const indexReceptor = indexAtual === 0 ? 1 : 0;
            novaLista[indexAtual].fatias -= 1;
            novaLista[indexReceptor].fatias += 1;
        }
        
        setSaboresAlocados(novaLista);
    };

    const alternarBorda = (borda) => {
        // Se a borda clicada já estiver selecionada, ele desmarca
        if (bordaSelecionada && bordaSelecionada.id === borda.id) {
            setBordaSelecionada(null);
        } else {
            // Se não, ele seleciona a nova borda
            setBordaSelecionada(borda);
        }
    };
    
    // A MÁGICA DO PREÇO: Pega o maior preço base + ajuste do tamanho
    const calcularPrecoTotal = () => {
        if (!pizzaBase) return 0;
        
        // Mapeia o preço de todos os sabores escolhidos e pega o maior!
        const precosBase = saboresAlocados.map(s => Number(s.pizza.preco_base));
        const maiorPrecoBase = Math.max(...precosBase);

        const tamanhoObj = tamanhos.find(t => t.id === Number(tamanhoSelecionado));
        const ajuste = tamanhoObj ? Number(tamanhoObj.ajuste_preco) : 0;

        let total = maiorPrecoBase + ajuste;
        if (bordaSelecionada) total += Number(bordaSelecionada.preco);
        
        return total;
    };

    const adicionarAoCarrinho = () => {
        if (!tamanhoSelecionado) return alert("Selecione um tamanho.");

        const precoFinal = calcularPrecoTotal();
        const tamanhoObj = tamanhos.find(t => t.id === Number(tamanhoSelecionado));
        
        // Formata as fatias para a cozinha ler nas observações
        const textoFatias = saboresAlocados.map(s => `${s.fatias} fatias de ${s.pizza.nome}`).join(' | ');
        
        let observacaoFinal = `Divisão: ${textoFatias}. `;
        if (bordaSelecionada) observacaoFinal += `Borda: ${bordaSelecionada.nome}. `;
        if (observacaoTexto) observacaoFinal += `Obs: ${observacaoTexto}`;

        // Para o back-end, mandamos a lista de IDs normal
        const IDsSabores = saboresAlocados.map(s => s.pizza.id);

        const novoItem = {
            id_item_pedido: Date.now(),
            produto: pizzaBase,
            tamanho: tamanhoObj,
            preco: precoFinal,
            observacoes: observacaoFinal.trim(),
            sabores: IDsSabores
        };

        setCarrinho([...carrinho, novoItem]);
        fecharModal();
    };

    if (loading) return <div className="app-container" style={{display:'flex', alignItems:'center', justifyContent:'center'}}><p>Carregando as melhores pizzas...</p></div>;

    const idsSelecionados = saboresAlocados.map(s => s.pizza.id);
    const maxFatiasPermitidas = getMaxFatias(tamanhoSelecionado);

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
                {pizzasFiltradas.length > 0 ? (
                    pizzasFiltradas.map((pizza) => (
                        <div key={pizza.id} className="card-pizza" onClick={() => abrirModal(pizza)}>
                            <div className="img-placeholder">🍕</div>
                            <div className="card-info">
                                <h3>{pizza.nome}</h3>
                                <p>{pizza.descricao}</p>
                                <div className="preco-container">
                                    <span className="preco">R$ {Number(pizza.preco_base).toFixed(2).replace('.', ',')}</span>
                                    <button className="btn-add-icone">+</button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="mensagem-vazia"><p>Nenhuma pizza encontrada 😕</p></div>
                )}
            </main>

            <div className={`modal-overlay ${modalAberto ? 'ativo' : ''}`} onClick={fecharModal}>
                <div className={`modal-bottom-sheet ${modalAberto ? 'aberto' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <div className="drag-handle"></div>
                    
                    {pizzaBase && (
                        <div style={{overflowY: 'auto', paddingBottom: '1rem', maxHeight: '75vh'}}>
                            <div className="modal-header">
                                <h2>{pizzaBase.nome}</h2>
                                <p>Preço calculado pelo sabor de maior valor.</p>
                            </div>
                            
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

                            {/* --- NOVA SEÇÃO: DISTRIBUIÇÃO DE FATIAS --- */}
                            {saboresAlocados.length > 1 && (
                                <>
                                    <h3 className="secao-titulo" style={{color: 'var(--verde-kisabor)'}}>
                                        Personalizar Fatias <span>Total: {maxFatiasPermitidas}</span>
                                    </h3>
                                    <div className="distribuidor-fatias">
                                        {saboresAlocados.map((item) => (
                                            <div key={item.pizza.id} className="item-fatia">
                                                <span className="item-fatia-nome">{item.pizza.nome}</span>
                                                <span className="item-fatia-preco">R$ {Number(item.pizza.preco_base).toFixed(2)}</span>
                                                <div className="controles-fatia">
                                                    <button className="btn-fatia" onClick={() => alterarFatia(item.pizza.id, -1)} disabled={item.fatias <= 1}>-</button>
                                                    <span className="fatias-quantidade">{item.fatias}</span>
                                                    <button className="btn-fatia" onClick={() => alterarFatia(item.pizza.id, 1)} disabled={item.fatias >= (maxFatiasPermitidas - saboresAlocados.length + 1)}>+</button>
                                                </div>
                                            </div>
                                        ))}
                                        <p className="alerta-fatias">
                                            Aumente as fatias de um sabor para diminuir automaticamente do outro.
                                        </p>
                                    </div>
                                </>
                            )}

                            <h3 className="secao-titulo">2. Adicionar Sabores <span>Até 3 Extras</span></h3>
                            <div className="lista-extras">
                                {pizzas.filter(p => p.id !== pizzaBase.id).map(p => (
                                    <label key={p.id} className={`item-extra ${idsSelecionados.includes(p.id) ? 'selecionado' : ''}`}>
                                        <div style={{display: 'flex', flexDirection: 'column'}}>
                                            <span style={{fontWeight: '500', color: 'var(--texto-principal)'}}>{p.nome}</span>
                                            <span style={{fontSize:'0.8rem', color:'var(--texto-secundario)'}}>R$ {Number(p.preco_base).toFixed(2)}</span>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={idsSelecionados.includes(p.id)}
                                            onChange={() => toggleSaborExtra(p)}
                                        />
                                    </label>
                                ))}
                            </div>

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

                            <h3 className="secao-titulo">4. Observações <span>Opcional</span></h3>
                            <textarea className="campo-observacao" rows="3" placeholder="Ex: Tirar cebola..." value={observacaoTexto} onChange={(e) => setObservacaoTexto(e.target.value)}></textarea>

                            <button className="btn-finalizar-pedido" onClick={adicionarAoCarrinho} style={{width: '100%'}}>
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