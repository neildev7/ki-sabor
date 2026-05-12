-- 1. PREPARAÇÃO DO AMBIENTE
-- Desativa checagem de chaves para poder recriar o banco do zero sem erros
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS ki_sabor;
CREATE DATABASE ki_sabor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ki_sabor;

-- 2. CRIAÇÃO DAS TABELAS

CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL
);

CREATE TABLE tamanhos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(30) NOT NULL,
    fatias INT NOT NULL,
    ajuste_preco DECIMAL(10,2) DEFAULT 0.00
);

CREATE TABLE mesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero INT NOT NULL UNIQUE,
    status ENUM('Livre', 'Ocupada') DEFAULT 'Livre'
);

CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco_base DECIMAL(10,2) NOT NULL,
    id_categoria INT NOT NULL,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id) ON DELETE CASCADE
);

CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_mesa INT NOT NULL,
    tipo_atendimento VARCHAR(50) DEFAULT 'Automatico',
    status ENUM('Pendente', 'Confirmado', 'Em Preparo', 'Pronto', 'Entregue', 'Cancelado') DEFAULT 'Pendente',
    total DECIMAL(10,2) NOT NULL,
    data_criacao DATETIME NOT NULL,
    timer_limite DATETIME NOT NULL,
    FOREIGN KEY (id_mesa) REFERENCES mesas(id) ON DELETE RESTRICT
);

CREATE TABLE itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_tamanho INT NOT NULL,
    observacoes TEXT,
    preco_pago DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_tamanho) REFERENCES tamanhos(id) ON DELETE RESTRICT
);

CREATE TABLE item_sabores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_item_pedido INT NOT NULL,
    id_produto INT NOT NULL,
    FOREIGN KEY (id_item_pedido) REFERENCES itens_pedido(id) ON DELETE CASCADE,
    FOREIGN KEY (id_produto) REFERENCES produtos(id) ON DELETE RESTRICT
);

-- 3. INSERÇÃO DOS DADOS INICIAIS (POPULANDO O BANCO)

-- Categorias
INSERT INTO categorias (nome) VALUES ('Pizzas'), ('Bebidas');

-- Tamanhos (Com a regra de ajuste de preços que definimos)
INSERT INTO tamanhos (nome, fatias, ajuste_preco) VALUES 
('Grande', 8, 0.00),
('Média', 6, -2.00),
('Brotinho', 4, -4.00);

-- Mesas (Salão de Baixo: 1 a 15 | Salão de Cima: 20 a 44)
INSERT INTO mesas (numero, status) VALUES 
(1, 'Livre'), (2, 'Livre'), (3, 'Livre'), (4, 'Livre'), (5, 'Livre'),
(6, 'Livre'), (7, 'Livre'), (8, 'Livre'), (9, 'Livre'), (10, 'Livre'),
(11, 'Livre'), (12, 'Livre'), (13, 'Livre'), (14, 'Livre'), (15, 'Livre'),
(20, 'Livre'), (21, 'Livre'), (22, 'Livre'), (23, 'Livre'), (24, 'Livre'),
(25, 'Livre'), (26, 'Livre'), (27, 'Livre'), (28, 'Livre'), (29, 'Livre'),
(30, 'Livre'), (31, 'Livre'), (32, 'Livre'), (33, 'Livre'), (34, 'Livre'),
(35, 'Livre'), (36, 'Livre'), (37, 'Livre'), (38, 'Livre'), (39, 'Livre'),
(40, 'Livre'), (41, 'Livre'), (42, 'Livre'), (43, 'Livre'), (44, 'Livre');

-- Produtos - Bebidas (Categoria 2)
INSERT INTO produtos (nome, descricao, preco_base, id_categoria) VALUES 
('Coca-Cola 2L', 'Gelada e refrescante', 14.00, 2),
('Guaraná Antarctica 2L', 'O sabor do Brasil', 12.00, 2),
('Suco de Laranja 500ml', 'Natural e feito na hora', 9.00, 2),
('Água Mineral 500ml', 'Com ou sem gás', 5.00, 2),
('Caipirinha de Limão', 'Cachaça especial, limão e açúcar', 18.00, 2),
('Gin Tônica Premium', 'Gin, tônica e especiarias', 25.00, 2),
('Cerveja Heineken Long Neck', 'Cerveja Premium 330ml', 10.00, 2);

-- Produtos - Pizzas Doces (Categoria 1)
INSERT INTO produtos (nome, descricao, preco_base, id_categoria) VALUES 
('Brigadeiro', 'Chocolate ao leite coberto com granulado', 65.00, 1),
('Romeu e Julieta', 'Mussarela coberta com goiabada derretida', 60.00, 1),
('Banana com Canela', 'Fatias de banana, leite condensado e canela', 55.00, 1);

-- Produtos - Pizzas Especiais (Categoria 1)
INSERT INTO produtos (nome, descricao, preco_base, id_categoria) VALUES 
('Carne Seca', 'Carne seca desfiada com requeijão cremoso e cebola', 85.00, 1),
('Rúcula com Tomate Seco', 'Mussarela, tomate seco, rúcula fresca e parmesão', 75.00, 1),
('Strogonoff de Carne', 'Strogonoff de carne, champignon e batata palha', 80.00, 1),
('Nordestina', 'Carne de sol, cebola roxa, queijo coalho e pimenta biquinho', 85.00, 1),
('Carbonara', 'Mussarela, bacon crocante, ovos e parmesão', 78.00, 1),
('Pepperoni', 'Mussarela coberta com fatias generosas de pepperoni', 75.00, 1),
('Lombo com Cream Cheese', 'Fatias de lombo canadense com gotas de cream cheese', 80.00, 1);

-- Produtos - Pizzas Tradicionais (Categoria 1)
INSERT INTO produtos (nome, descricao, preco_base, id_categoria) VALUES 
('Mussarela', 'Mussarela derretida e orégano', 50.00, 1),
('Calabresa', 'Calabresa fatiada, cebola e azeitonas', 55.00, 1),
('Portuguesa', 'Presunto, ovos, cebola, ervilha e mussarela', 65.00, 1),
('Frango com Catupiry', 'Frango desfiado coberto com autêntico Catupiry', 65.00, 1),
('Marguerita', 'Mussarela, rodelas de tomate, parmesão e manjericão fresco', 60.00, 1),
('Quatro Queijos', 'Mussarela, provolone, parmesão e gorgonzola', 70.00, 1),
('Napolitana', 'Mussarela, rodelas de tomate e parmesão ralado', 58.00, 1),
('Baiana', 'Calabresa moída, ovos, pimenta, cebola e mussarela', 65.00, 1),
('Bacon', 'Mussarela coberta com fatias de bacon crocante', 65.00, 1),
('Milho', 'Mussarela coberta com milho verde', 55.00, 1),
('Alho e Óleo', 'Mussarela, alho frito em azeite e parmesão', 58.00, 1),
('Atum', 'Atum sólido, cebola e azeitonas pretas', 68.00, 1),
('Palmito', 'Mussarela coberta com rodelas de palmito e orégano', 65.00, 1),
('Presunto', 'Mussarela e fatias de presunto magro', 55.00, 1),
('Escarola', 'Escarola refogada, bacon e mussarela', 60.00, 1),
('Brócolis', 'Brócolis ninja refogado no alho, coberto com mussarela', 62.00, 1),
('Siciliana', 'Mussarela, champignon e bacon', 68.00, 1),
('Peruana', 'Atum, ovos, cebola e mussarela', 70.00, 1),
('Francesa', 'Mussarela, presunto, ovos e champignon', 65.00, 1),
('Toscana', 'Calabresa moída coberta com mussarela', 60.00, 1);

-- Reativa a checagem de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;