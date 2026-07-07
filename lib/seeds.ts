// Shared seed data — importar aqui evita que páginas que dependem de dados de
// outros módulos recebam [] quando o localStorage ainda não foi populado.

export const SEED_FORNECEDORES = [
  { id:'for-001', nome:'Hunan Chemical Co. Ltd',  pais:'China',    cidade:'Changsha',  contato:'Li Wei',       email:'sales@hunanchemical.cn',  telefone:'+86 731 8888-9999', categoria:'Resinas e Pigmentos',   prazo_entrega:45, moeda:'CNY', status:'ativo',   site:'hunanchemical.cn' },
  { id:'for-002', nome:'GZ Poly Materials',        pais:'China',    cidade:'Guangzhou', contato:'Zhang Min',    email:'export@gzpoly.com',       telefone:'+86 20 8777-6666',  categoria:'Polímeros e Aditivos',  prazo_entrega:40, moeda:'CNY', status:'ativo' },
  { id:'for-003', nome:'Quimibras Ind. Ltda',      pais:'Brasil',   cidade:'São Paulo', contato:'Roberto Alves',email:'vendas@quimibras.com.br', telefone:'(11) 3333-4444',    categoria:'Solventes Industriais', prazo_entrega:7,  moeda:'BRL', status:'ativo' },
  { id:'for-004', nome:'SinoResin Chemical',       pais:'China',    cidade:'Shanghai',  contato:'Wang Fang',    email:'intl@sinoresin.com',      telefone:'+86 21 5555-7777',  categoria:'Resinas Especiais',     prazo_entrega:50, moeda:'USD', status:'ativo' },
  { id:'for-005', nome:'Euro Chem AG',             pais:'Alemanha', cidade:'Frankfurt', contato:'Hans Müller',  email:'export@eurochem.de',      telefone:'+49 69 4444-3333',  categoria:'Catalisadores',         prazo_entrega:30, moeda:'EUR', status:'inativo' },
]

export const SEED_PRODUTOS = [
  { id:'prd-001', codigo:'AC-001', nome:'Acetona Industrial 99,5%',       unidade:'kg', ncm:'2914.11.00', categoria:'Solventes Industriais', preco_custo:4.50,  preco_venda_sugerido:6.80,  estoque_atual:1250, estoque_minimo:300 },
  { id:'prd-002', codigo:'TL-001', nome:'Tolueno Grau Industrial',         unidade:'kg', ncm:'2902.30.00', categoria:'Solventes Industriais', preco_custo:5.20,  preco_venda_sugerido:7.90,  estoque_atual:890,  estoque_minimo:200 },
  { id:'prd-003', codigo:'RE-001', nome:'Resina Epóxi Bisfenol A',         unidade:'kg', ncm:'3907.30.11', categoria:'Resinas e Polímeros',   preco_custo:18.00, preco_venda_sugerido:28.00, estoque_atual:340,  estoque_minimo:100 },
  { id:'prd-004', codigo:'TI-001', nome:'Dióxido de Titânio R-902',        unidade:'kg', ncm:'3206.11.10', categoria:'Pigmentos e Corantes',  preco_custo:28.00, preco_venda_sugerido:43.00, estoque_atual:480,  estoque_minimo:150 },
  { id:'prd-005', codigo:'DP-001', nome:'Ftalato de Dioctila (DOP)',       unidade:'kg', ncm:'2917.34.00', categoria:'Aditivos Industriais',  preco_custo:9.80,  preco_venda_sugerido:14.90, estoque_atual:1100, estoque_minimo:500 },
  { id:'prd-006', codigo:'AE-001', nome:'Acetato de Etila Grau Industrial',unidade:'kg', ncm:'2915.31.00', categoria:'Solventes Industriais', preco_custo:6.10,  preco_venda_sugerido:9.20,  estoque_atual:95,   estoque_minimo:200 },
]

export const SEED_COMPRAS_AGUARDANDO = [
  { id:'cmp-002', numero:'OC-2026-002', fornecedor_id:'for-002', fornecedor:'GZ Poly Materials', fornecedor_email:'export@gzpoly.com', data:'2026-06-15', previsao_entrega:'2026-07-25', categoria:'Polímeros e Aditivos', itens:[{id:'i2',produto:'Ftalato de Dioctila (DOP)',produto_id:'prd-005',ncm:'2917.34.00',unidade:'kg',quantidade:5000,preco_unitario:9.8,tem_ipi:true,aliquota_ipi:5}], valor_itens:49000, valor_ipi:2450, valor_total:51450, status:'aguardando_aprovacao', moeda:'CNY', cambio:0.77, forma_pagamento:'LC 60 dias', observacoes:'' },
]
