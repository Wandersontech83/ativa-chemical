// Dados de referência cruzada: produto ↔ cliente ↔ fornecedor

export const PRODUTOS_CATALOGO = [
  { id: 'prd-001', codigo: 'AC-SOL-001', nome: 'Acetona Industrial 99,5%',  ncm: '2914.11.00', unidade: 'kg', preco_medio: 6.80,  fornecedor_id: 'for-003' },
  { id: 'prd-002', codigo: 'AC-SOL-002', nome: 'Tolueno Industrial',         ncm: '2902.30.00', unidade: 'kg', preco_medio: 7.90,  fornecedor_id: 'for-003' },
  { id: 'prd-003', codigo: 'AC-RES-001', nome: 'Resina Epóxi Bisfenol A',    ncm: '3907.30.00', unidade: 'kg', preco_medio: 28.00, fornecedor_id: 'for-001' },
  { id: 'prd-004', codigo: 'AC-PIG-001', nome: 'Dióxido de Titânio R-902',   ncm: '2823.00.10', unidade: 'kg', preco_medio: 43.00, fornecedor_id: 'for-002' },
  { id: 'prd-005', codigo: 'AC-ADI-001', nome: 'Ftalato de Dioctila (DOP)',  ncm: '2917.34.00', unidade: 'kg', preco_medio: 14.90, fornecedor_id: 'for-001' },
  { id: 'prd-006', codigo: 'AC-SOL-006', nome: 'Acetato de Etila',           ncm: '2915.31.00', unidade: 'kg', preco_medio: 9.20,  fornecedor_id: 'for-003' },
  { id: 'prd-007', codigo: 'AC-PIG-002', nome: 'Negro de Fumo N330',         ncm: '2803.00.10', unidade: 'kg', preco_medio: 8.50,  fornecedor_id: 'for-002' },
  { id: 'prd-008', codigo: 'AC-SOL-008', nome: 'Hexano Industrial 95%',      ncm: '2901.10.10', unidade: 'kg', preco_medio: 6.20,  fornecedor_id: 'for-003' },
  { id: 'prd-009', codigo: 'AC-ACI-001', nome: 'Ácido Acético Glacial',      ncm: '2915.21.00', unidade: 'kg', preco_medio: 5.80,  fornecedor_id: 'for-004' },
  { id: 'prd-010', codigo: 'AC-SOL-010', nome: 'Metanol Industrial',         ncm: '2905.11.00', unidade: 'kg', preco_medio: 4.90,  fornecedor_id: 'for-004' },
]

export const FORNECEDORES_CATALOGO = [
  { id: 'for-001', nome: 'GZ Poly Chemical Co.', pais: 'China', cidade: 'Guangzhou', contato: 'Mr. Chen Wei', email: 'chen@gzpoly.com', prazo_dias: 45, produtos_ids: ['prd-003','prd-005'] },
  { id: 'for-002', nome: 'Hunan Chemical Import & Export', pais: 'China', cidade: 'Changsha', contato: 'Ms. Liu Fang', email: 'liu@hunan-chem.com', prazo_dias: 50, produtos_ids: ['prd-004','prd-007'] },
  { id: 'for-003', nome: 'Shanghai Solvents Ltd', pais: 'China', cidade: 'Shanghai', contato: 'Mr. Zhang Hao', email: 'zhang@sh-solvents.com', prazo_dias: 40, produtos_ids: ['prd-001','prd-002','prd-006','prd-008'] },
  { id: 'for-004', nome: 'Qingdao Import & Export Corp', pais: 'China', cidade: 'Qingdao', contato: 'Mr. Wang Bo', email: 'wang@qingdao-ie.com', prazo_dias: 55, produtos_ids: ['prd-009','prd-010'] },
]

// Histórico de consumo: qual cliente compra qual produto
// Estrutura: { cliente_id, produto_id, volume_medio_mensal_kg, ultima_compra, frequencia_meses, valor_medio_mensal }
export const HISTORICO_CONSUMO = [
  // PetroSul Derivados (RS) — solventes
  { cliente_id:'cli-001', produto_id:'prd-001', volume_medio_kg:800, ultima_compra:'2024-11-28', freq_meses:1, valor_mensal:5440 },
  { cliente_id:'cli-001', produto_id:'prd-002', volume_medio_kg:600, ultima_compra:'2024-11-28', freq_meses:1, valor_mensal:4740 },
  { cliente_id:'cli-001', produto_id:'prd-008', volume_medio_kg:400, ultima_compra:'2024-10-15', freq_meses:2, valor_mensal:2480 },

  // IndTex Plásticos (SP) — plastificantes e resinas
  { cliente_id:'cli-002', produto_id:'prd-005', volume_medio_kg:1200, ultima_compra:'2024-11-20', freq_meses:1, valor_mensal:17880 },
  { cliente_id:'cli-002', produto_id:'prd-003', volume_medio_kg:300, ultima_compra:'2024-11-20', freq_meses:1, valor_mensal:8400 },
  { cliente_id:'cli-002', produto_id:'prd-009', volume_medio_kg:500, ultima_compra:'2024-11-01', freq_meses:1, valor_mensal:2900 },

  // Agroquim Nordeste (PE) — solventes agrícolas
  { cliente_id:'cli-003', produto_id:'prd-001', volume_medio_kg:700, ultima_compra:'2024-10-15', freq_meses:1, valor_mensal:4760 },
  { cliente_id:'cli-003', produto_id:'prd-010', volume_medio_kg:500, ultima_compra:'2024-10-15', freq_meses:1, valor_mensal:2450 },
  { cliente_id:'cli-003', produto_id:'prd-006', volume_medio_kg:300, ultima_compra:'2024-09-20', freq_meses:2, valor_mensal:2760 },

  // Nordeste Química (CE)
  { cliente_id:'cli-004', produto_id:'prd-001', volume_medio_kg:500, ultima_compra:'2024-11-05', freq_meses:1, valor_mensal:3400 },
  { cliente_id:'cli-004', produto_id:'prd-002', volume_medio_kg:400, ultima_compra:'2024-11-05', freq_meses:1, valor_mensal:3160 },
  { cliente_id:'cli-004', produto_id:'prd-009', volume_medio_kg:300, ultima_compra:'2024-10-10', freq_meses:2, valor_mensal:1740 },

  // Fab Têxtil Nordeste (PB) — corantes e solventes
  { cliente_id:'cli-005', produto_id:'prd-006', volume_medio_kg:400, ultima_compra:'2024-09-01', freq_meses:1, valor_mensal:3680 },
  { cliente_id:'cli-005', produto_id:'prd-010', volume_medio_kg:300, ultima_compra:'2024-09-01', freq_meses:1, valor_mensal:1470 },

  // Química Centro-Oeste (GO)
  { cliente_id:'cli-006', produto_id:'prd-003', volume_medio_kg:200, ultima_compra:'2024-11-10', freq_meses:1, valor_mensal:5600 },
  { cliente_id:'cli-006', produto_id:'prd-005', volume_medio_kg:500, ultima_compra:'2024-11-10', freq_meses:1, valor_mensal:7450 },
  { cliente_id:'cli-006', produto_id:'prd-007', volume_medio_kg:300, ultima_compra:'2024-10-05', freq_meses:2, valor_mensal:2550 },

  // AgroPlast Mato Grosso (MT) — solventes e plastificantes agrícolas
  { cliente_id:'cli-007', produto_id:'prd-001', volume_medio_kg:600, ultima_compra:'2024-10-20', freq_meses:1, valor_mensal:4080 },
  { cliente_id:'cli-007', produto_id:'prd-005', volume_medio_kg:400, ultima_compra:'2024-10-20', freq_meses:1, valor_mensal:5960 },
  { cliente_id:'cli-007', produto_id:'prd-008', volume_medio_kg:350, ultima_compra:'2024-10-20', freq_meses:1, valor_mensal:2170 },

  // TinTex Tintas (MG) — pigmentos e resinas
  { cliente_id:'cli-008', produto_id:'prd-004', volume_medio_kg:800, ultima_compra:'2024-11-15', freq_meses:1, valor_mensal:34400 },
  { cliente_id:'cli-008', produto_id:'prd-003', volume_medio_kg:250, ultima_compra:'2024-11-15', freq_meses:1, valor_mensal:7000 },
  { cliente_id:'cli-008', produto_id:'prd-007', volume_medio_kg:400, ultima_compra:'2024-10-20', freq_meses:1, valor_mensal:3400 },

  // Polímeros do Vale (SP)
  { cliente_id:'cli-009', produto_id:'prd-003', volume_medio_kg:350, ultima_compra:'2024-11-25', freq_meses:1, valor_mensal:9800 },
  { cliente_id:'cli-009', produto_id:'prd-005', volume_medio_kg:800, ultima_compra:'2024-11-25', freq_meses:1, valor_mensal:11920 },
  { cliente_id:'cli-009', produto_id:'prd-009', volume_medio_kg:200, ultima_compra:'2024-11-01', freq_meses:1, valor_mensal:1160 },

  // Resinas Curitiba (PR)
  { cliente_id:'cli-010', produto_id:'prd-003', volume_medio_kg:280, ultima_compra:'2024-11-18', freq_meses:1, valor_mensal:7840 },
  { cliente_id:'cli-010', produto_id:'prd-005', volume_medio_kg:600, ultima_compra:'2024-11-18', freq_meses:1, valor_mensal:8940 },

  // Plastbrasil (SP Campinas)
  { cliente_id:'cli-012', produto_id:'prd-005', volume_medio_kg:700, ultima_compra:'2024-10-30', freq_meses:1, valor_mensal:10430 },
  { cliente_id:'cli-012', produto_id:'prd-001', volume_medio_kg:300, ultima_compra:'2024-10-30', freq_meses:1, valor_mensal:2040 },

  // Solv-Tech Bahia
  { cliente_id:'cli-014', produto_id:'prd-001', volume_medio_kg:500, ultima_compra:'2024-11-12', freq_meses:1, valor_mensal:3400 },
  { cliente_id:'cli-014', produto_id:'prd-002', volume_medio_kg:350, ultima_compra:'2024-11-12', freq_meses:1, valor_mensal:2765 },
  { cliente_id:'cli-014', produto_id:'prd-006', volume_medio_kg:200, ultima_compra:'2024-10-01', freq_meses:2, valor_mensal:1840 },

  // AutoQuím Paraná (PR)
  { cliente_id:'cli-015', produto_id:'prd-001', volume_medio_kg:450, ultima_compra:'2024-11-22', freq_meses:1, valor_mensal:3060 },
  { cliente_id:'cli-015', produto_id:'prd-007', volume_medio_kg:600, ultima_compra:'2024-11-22', freq_meses:1, valor_mensal:5100 },
  { cliente_id:'cli-015', produto_id:'prd-010', volume_medio_kg:400, ultima_compra:'2024-10-15', freq_meses:1, valor_mensal:1960 },

  // PigmentBR (SP Santo André) — pigmentos
  { cliente_id:'cli-016', produto_id:'prd-004', volume_medio_kg:1000, ultima_compra:'2024-11-28', freq_meses:1, valor_mensal:43000 },
  { cliente_id:'cli-016', produto_id:'prd-007', volume_medio_kg:800, ultima_compra:'2024-11-28', freq_meses:1, valor_mensal:6800 },
  { cliente_id:'cli-016', produto_id:'prd-003', volume_medio_kg:150, ultima_compra:'2024-11-10', freq_meses:1, valor_mensal:4200 },

  // QuímSul (SC Florianópolis)
  { cliente_id:'cli-018', produto_id:'prd-002', volume_medio_kg:500, ultima_compra:'2024-11-20', freq_meses:1, valor_mensal:3950 },
  { cliente_id:'cli-018', produto_id:'prd-001', volume_medio_kg:400, ultima_compra:'2024-11-20', freq_meses:1, valor_mensal:2720 },
  { cliente_id:'cli-018', produto_id:'prd-008', volume_medio_kg:300, ultima_compra:'2024-10-10', freq_meses:2, valor_mensal:1860 },

  // Adesiv-Tech MG (Uberlândia)
  { cliente_id:'cli-019', produto_id:'prd-003', volume_medio_kg:180, ultima_compra:'2024-10-25', freq_meses:1, valor_mensal:5040 },
  { cliente_id:'cli-019', produto_id:'prd-009', volume_medio_kg:400, ultima_compra:'2024-10-25', freq_meses:1, valor_mensal:2320 },

  // PoliPlast RS
  { cliente_id:'cli-020', produto_id:'prd-005', volume_medio_kg:500, ultima_compra:'2024-11-10', freq_meses:1, valor_mensal:7450 },
  { cliente_id:'cli-020', produto_id:'prd-003', volume_medio_kg:150, ultima_compra:'2024-11-10', freq_meses:1, valor_mensal:4200 },

  // Verniz & Cor Rio (RJ)
  { cliente_id:'cli-022', produto_id:'prd-004', volume_medio_kg:900, ultima_compra:'2024-11-27', freq_meses:1, valor_mensal:38700 },
  { cliente_id:'cli-022', produto_id:'prd-007', volume_medio_kg:700, ultima_compra:'2024-11-27', freq_meses:1, valor_mensal:5950 },
  { cliente_id:'cli-022', produto_id:'prd-001', volume_medio_kg:300, ultima_compra:'2024-11-15', freq_meses:1, valor_mensal:2040 },

  // QuimSer Sergipe
  { cliente_id:'cli-024', produto_id:'prd-001', volume_medio_kg:300, ultima_compra:'2024-11-08', freq_meses:1, valor_mensal:2040 },
  { cliente_id:'cli-024', produto_id:'prd-010', volume_medio_kg:250, ultima_compra:'2024-11-08', freq_meses:2, valor_mensal:1225 },

  // TinBrasil Ribeirão Preto (SP)
  { cliente_id:'cli-027', produto_id:'prd-004', volume_medio_kg:700, ultima_compra:'2024-11-20', freq_meses:1, valor_mensal:30100 },
  { cliente_id:'cli-027', produto_id:'prd-007', volume_medio_kg:500, ultima_compra:'2024-11-20', freq_meses:1, valor_mensal:4250 },

  // Norte-Sul Resinas (DF/Brasília)
  { cliente_id:'cli-030', produto_id:'prd-003', volume_medio_kg:300, ultima_compra:'2024-11-25', freq_meses:1, valor_mensal:8400 },
  { cliente_id:'cli-030', produto_id:'prd-005', volume_medio_kg:700, ultima_compra:'2024-11-25', freq_meses:1, valor_mensal:10430 },
  { cliente_id:'cli-030', produto_id:'prd-001', volume_medio_kg:400, ultima_compra:'2024-11-25', freq_meses:1, valor_mensal:2720 },

  // Gaúcha Tintas (RS Pelotas)
  { cliente_id:'cli-032', produto_id:'prd-004', volume_medio_kg:500, ultima_compra:'2024-10-28', freq_meses:1, valor_mensal:21500 },
  { cliente_id:'cli-032', produto_id:'prd-007', volume_medio_kg:350, ultima_compra:'2024-10-28', freq_meses:1, valor_mensal:2975 },

  // PolyMix Joinville (SC)
  { cliente_id:'cli-033', produto_id:'prd-005', volume_medio_kg:600, ultima_compra:'2024-11-18', freq_meses:1, valor_mensal:8940 },
  { cliente_id:'cli-033', produto_id:'prd-003', volume_medio_kg:200, ultima_compra:'2024-11-18', freq_meses:1, valor_mensal:5600 },

  // Centro-Oeste Solventes (GO)
  { cliente_id:'cli-034', produto_id:'prd-001', volume_medio_kg:500, ultima_compra:'2024-10-20', freq_meses:1, valor_mensal:3400 },
  { cliente_id:'cli-034', produto_id:'prd-002', volume_medio_kg:300, ultima_compra:'2024-10-20', freq_meses:1, valor_mensal:2370 },
  { cliente_id:'cli-034', produto_id:'prd-008', volume_medio_kg:250, ultima_compra:'2024-10-20', freq_meses:1, valor_mensal:1550 },

  // Catarinense Polímeros (SC)
  { cliente_id:'cli-036', produto_id:'prd-005', volume_medio_kg:700, ultima_compra:'2024-11-22', freq_meses:1, valor_mensal:10430 },
  { cliente_id:'cli-036', produto_id:'prd-003', volume_medio_kg:180, ultima_compra:'2024-11-22', freq_meses:1, valor_mensal:5040 },

  // Minas Químicos (MG Contagem)
  { cliente_id:'cli-038', produto_id:'prd-004', volume_medio_kg:600, ultima_compra:'2024-11-20', freq_meses:1, valor_mensal:25800 },
  { cliente_id:'cli-038', produto_id:'prd-007', volume_medio_kg:400, ultima_compra:'2024-11-20', freq_meses:1, valor_mensal:3400 },
  { cliente_id:'cli-038', produto_id:'prd-003', volume_medio_kg:100, ultima_compra:'2024-10-15', freq_meses:2, valor_mensal:2800 },

  // AgroBrasil Goiás
  { cliente_id:'cli-039', produto_id:'prd-001', volume_medio_kg:400, ultima_compra:'2024-10-15', freq_meses:1, valor_mensal:2720 },
  { cliente_id:'cli-039', produto_id:'prd-010', volume_medio_kg:300, ultima_compra:'2024-10-15', freq_meses:1, valor_mensal:1470 },

  // Nordeste Industrial (PB)
  { cliente_id:'cli-040', produto_id:'prd-001', volume_medio_kg:350, ultima_compra:'2024-11-10', freq_meses:1, valor_mensal:2380 },
  { cliente_id:'cli-040', produto_id:'prd-006', volume_medio_kg:200, ultima_compra:'2024-11-10', freq_meses:2, valor_mensal:1840 },

  // QuimNordeste PE
  { cliente_id:'cli-037', produto_id:'prd-002', volume_medio_kg:250, ultima_compra:'2024-11-05', freq_meses:1, valor_mensal:1975 },
  { cliente_id:'cli-037', produto_id:'prd-001', volume_medio_kg:200, ultima_compra:'2024-11-05', freq_meses:1, valor_mensal:1360 },

  // Cearense Ind. Química
  { cliente_id:'cli-029', produto_id:'prd-002', volume_medio_kg:300, ultima_compra:'2024-11-01', freq_meses:1, valor_mensal:2370 },
  { cliente_id:'cli-029', produto_id:'prd-009', volume_medio_kg:200, ultima_compra:'2024-11-01', freq_meses:2, valor_mensal:1160 },

  // ChemPro ES
  { cliente_id:'cli-021', produto_id:'prd-003', volume_medio_kg:150, ultima_compra:'2024-10-18', freq_meses:1, valor_mensal:4200 },
  { cliente_id:'cli-021', produto_id:'prd-005', volume_medio_kg:300, ultima_compra:'2024-10-18', freq_meses:1, valor_mensal:4470 },

  // Aço & Química MS
  { cliente_id:'cli-026', produto_id:'prd-009', volume_medio_kg:350, ultima_compra:'2024-11-15', freq_meses:1, valor_mensal:2030 },
  { cliente_id:'cli-026', produto_id:'prd-010', volume_medio_kg:300, ultima_compra:'2024-11-15', freq_meses:1, valor_mensal:1470 },
]
