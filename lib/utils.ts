import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { locale: ptBR, addSuffix: true })
}

export function formatCNPJ(cnpj: string): string {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export function formatCEP(cep: string): string {
  return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2')
}

export function calcularMargem(custo: number, venda: number): number {
  if (custo === 0) return 0
  return ((venda - custo) / venda) * 100
}

export function calcularPrecoVenda(custo: number, margemPercent: number): number {
  return custo / (1 - margemPercent / 100)
}

export const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
  expirada: 'Expirada',
  aguardando_aprovacao: 'Aguardando Aprovação',
  faturado: 'Faturado',
  em_logistica: 'Em Logística',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
  encerrado: 'Encerrado',
  pendente: 'Pendente',
  autorizada: 'Autorizada',
  cancelada: 'Cancelada',
  erro: 'Erro',
  aguardando_coleta: 'Aguardando Coleta',
  em_transito: 'Em Trânsito',
  saiu_entrega: 'Saiu para Entrega',
  canhoto_recebido: 'Canhoto Recebido',
  ativo: 'Ativo',
  em_renovacao: 'Em Renovação',
  vencido: 'Vencido',
  novo: 'Novo',
  lido: 'Lido',
  resolvido: 'Resolvido',
  ignorado: 'Ignorado',
  pago: 'Pago',
}

export const STATUS_COLORS: Record<string, string> = {
  rascunho: 'badge-gray',
  enviada: 'badge-blue',
  aprovada: 'badge-green',
  rejeitada: 'badge-red',
  expirada: 'badge-red',
  aguardando_aprovacao: 'badge-yellow',
  faturado: 'badge-blue',
  em_logistica: 'badge-orange',
  entregue: 'badge-green',
  cancelado: 'badge-red',
  encerrado: 'badge-gray',
  pendente: 'badge-yellow',
  autorizada: 'badge-green',
  erro: 'badge-red',
  aguardando_coleta: 'badge-yellow',
  em_transito: 'badge-blue',
  saiu_entrega: 'badge-orange',
  canhoto_recebido: 'badge-green',
  ativo: 'badge-green',
  em_renovacao: 'badge-yellow',
  vencido: 'badge-red',
  novo: 'badge-blue',
  lido: 'badge-gray',
  resolvido: 'badge-green',
  pago: 'badge-green',
}
