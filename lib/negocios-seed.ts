export type EtapaNegocio = 'prospeccao' | 'qualificacao' | 'proposta' | 'negociacao' | 'ganho' | 'perdido'

export interface Negocio {
  id: string
  titulo: string
  cliente_id: string
  cliente_nome: string
  valor: number
  produto: string
  etapa: EtapaNegocio
  probabilidade: number
  responsavel: string
  data_criacao: string
  data_atualizacao: string
  data_fechamento_prev?: string
  observacoes?: string
  motivo_perda?: string
  contato_nome?: string
  contato_wa?: string
}

export interface TarefaFollowUp {
  id: string
  negocio_id: string
  descricao: string
  data_venc: string
  responsavel: string
  concluida: boolean
}

export const ETAPAS: { id: EtapaNegocio; label: string; cor: string; bg: string; prob: number }[] = [
  { id: 'prospeccao',   label: 'Prospecção',   cor: '#64748b', bg: '#f8fafc', prob: 10 },
  { id: 'qualificacao', label: 'Qualificação', cor: '#8b5cf6', bg: '#faf5ff', prob: 25 },
  { id: 'proposta',     label: 'Proposta',     cor: '#3b82f6', bg: '#eff6ff', prob: 50 },
  { id: 'negociacao',   label: 'Negociação',   cor: '#f59e0b', bg: '#fffbeb', prob: 75 },
  { id: 'ganho',        label: 'Ganho ✓',      cor: '#10b981', bg: '#f0fdf4', prob: 100 },
  { id: 'perdido',      label: 'Perdido ✗',    cor: '#ef4444', bg: '#fef2f2', prob: 0 },
]

export const MOTIVOS_PERDA = [
  'Preço acima do mercado',
  'Prazo de entrega longo',
  'Concorrente Brasquim',
  'Concorrente Sigma-Aldrich',
  'Concorrente BASF',
  'Sem verba no período',
  'Mudança de fornecedor estratégico',
  'Produto não disponível',
  'Decisão adiada',
  'Contato perdido',
  'Outros',
]

export const NEGOCIOS_SEED: Negocio[] = [
  { id:'neg-001', titulo:'Dióxido de Titânio — TinTex MG', cliente_id:'cli-008', cliente_nome:'TinTex Tintas Indústria', valor:185000, produto:'Dióxido de Titânio R-902', etapa:'negociacao', probabilidade:75, responsavel:'Carlos Souza', data_criacao:'2026-05-10', data_atualizacao:'2026-07-01', data_fechamento_prev:'2026-07-20', observacoes:'Cliente pediu 3% desconto para fechar trimestre', contato_nome:'Pedro Amaral', contato_wa:'5511999990001' },
  { id:'neg-002', titulo:'Resina Epóxi — Polímeros do Vale', cliente_id:'cli-009', cliente_nome:'Polímeros do Vale Ltda', valor:92000, produto:'Resina Epóxi Bisfenol A', etapa:'proposta', probabilidade:50, responsavel:'Carlos Souza', data_criacao:'2026-06-01', data_atualizacao:'2026-07-03', data_fechamento_prev:'2026-07-31', contato_wa:'5511988880002' },
  { id:'neg-003', titulo:'Acetona — QuímSul Renovação', cliente_id:'cli-018', cliente_nome:'QuímSul Distribuidora', valor:54000, produto:'Acetona Industrial 99,5%', etapa:'ganho', probabilidade:100, responsavel:'Wanderson Lima', data_criacao:'2026-05-15', data_atualizacao:'2026-06-25', data_fechamento_prev:'2026-06-30', contato_wa:'5548999990003' },
  { id:'neg-004', titulo:'Tolueno — Nordeste Química CE', cliente_id:'cli-004', cliente_nome:'Nordeste Química Ltda', valor:38000, produto:'Tolueno Industrial', etapa:'qualificacao', probabilidade:25, responsavel:'Ana Lima', data_criacao:'2026-06-20', data_atualizacao:'2026-07-05', contato_wa:'5585988880004' },
  { id:'neg-005', titulo:'DOP Plastificante — AgroPlast MT', cliente_id:'cli-007', cliente_nome:'AgroPlast Mato Grosso', valor:76000, produto:'Ftalato de Dioctila (DOP)', etapa:'prospeccao', probabilidade:10, responsavel:'Marcos Pereira', data_criacao:'2026-07-01', data_atualizacao:'2026-07-06', contato_wa:'5565977770005' },
  { id:'neg-006', titulo:'TiO₂ — Verniz & Cor Rio', cliente_id:'cli-022', cliente_nome:'Verniz & Cor Rio Ltda', valor:124000, produto:'Dióxido de Titânio R-902', etapa:'perdido', probabilidade:0, responsavel:'Carlos Souza', data_criacao:'2026-05-01', data_atualizacao:'2026-06-15', motivo_perda:'Preço acima do mercado', contato_wa:'5521966660006' },
  { id:'neg-007', titulo:'Acetato de Etila — PetroSul RS', cliente_id:'cli-001', cliente_nome:'PetroSul Derivados Ltda', valor:29000, produto:'Acetato de Etila', etapa:'proposta', probabilidade:50, responsavel:'Wanderson Lima', data_criacao:'2026-06-28', data_atualizacao:'2026-07-04', data_fechamento_prev:'2026-07-25', contato_wa:'5551988880007' },
  { id:'neg-008', titulo:'Resina Epóxi — Norte-Sul Brasília', cliente_id:'cli-030', cliente_nome:'Norte-Sul Resinas', valor:215000, produto:'Resina Epóxi Bisfenol A', etapa:'negociacao', probabilidade:75, responsavel:'Marcos Pereira', data_criacao:'2026-06-10', data_atualizacao:'2026-07-06', data_fechamento_prev:'2026-07-15', observacoes:'Contrato anual em discussão', contato_wa:'5561977770008' },
  { id:'neg-009', titulo:'Acetona — Minas Químicos SA', cliente_id:'cli-038', cliente_nome:'Minas Químicos SA', valor:67000, produto:'Acetona Industrial 99,5%', etapa:'qualificacao', probabilidade:25, responsavel:'Carlos Souza', data_criacao:'2026-07-02', data_atualizacao:'2026-07-06', contato_wa:'5531966660009' },
  { id:'neg-010', titulo:'DOP — Agroquim NE', cliente_id:'cli-003', cliente_nome:'Agroquim Nordeste Ltda', valor:88000, produto:'Ftalato de Dioctila (DOP)', etapa:'proposta', probabilidade:50, responsavel:'Ana Lima', data_criacao:'2026-06-15', data_atualizacao:'2026-07-05', data_fechamento_prev:'2026-07-28', contato_wa:'5581955550010' },
]

export const TAREFAS_SEED: TarefaFollowUp[] = [
  { id:'trf-001', negocio_id:'neg-001', descricao:'Enviar contraproposta com desconto de 2%', data_venc:'2026-07-08', responsavel:'Carlos Souza', concluida:false },
  { id:'trf-002', negocio_id:'neg-002', descricao:'Follow-up: cliente não respondeu à proposta', data_venc:'2026-07-07', responsavel:'Carlos Souza', concluida:false },
  { id:'trf-003', negocio_id:'neg-004', descricao:'Enviar ficha técnica do Tolueno Industrial', data_venc:'2026-07-09', responsavel:'Ana Lima', concluida:false },
  { id:'trf-004', negocio_id:'neg-007', descricao:'Confirmar prazo de entrega com logística', data_venc:'2026-07-07', responsavel:'Wanderson Lima', concluida:false },
  { id:'trf-005', negocio_id:'neg-008', descricao:'Apresentar minutas do contrato anual', data_venc:'2026-07-10', responsavel:'Marcos Pereira', concluida:false },
  { id:'trf-006', negocio_id:'neg-010', descricao:'Reunião de qualificação técnica', data_venc:'2026-07-11', responsavel:'Ana Lima', concluida:false },
]
