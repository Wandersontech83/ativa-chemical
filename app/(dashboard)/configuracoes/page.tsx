'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Settings, Shield, Bot, Building2, Users, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('empresa')
  const [sefazAmbiente, setSefazAmbiente] = useState('homologacao')

  const tabs = [
    { id: 'empresa', label: 'Empresa', icon: Building2 },
    { id: 'sefaz', label: 'SEFAZ & NF-e', icon: Shield },
    { id: 'margem', label: 'Regras de Margem', icon: Settings },
    { id: 'agente', label: 'Agente IA', icon: Bot },
    { id: 'usuarios', label: 'Usuários', icon: Users },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
        <p className="text-slate-500 text-sm mt-0.5">Configurações do sistema e integração</p>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit flex-wrap">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}>
              <Icon size={14} />{tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'empresa' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 max-w-lg">
          <h2 className="font-semibold text-slate-800 mb-4">Dados da Empresa</h2>
          <div className="space-y-4">
            {[
              { label: 'Razão Social', value: 'Ativa Chemical Representações Ltda' },
              { label: 'CNPJ', value: '12.345.678/0001-90' },
              { label: 'Inscrição Estadual', value: '123.456.789.000' },
              { label: 'Endereço', value: 'Av. Industrial, 1500, Sala 301' },
              { label: 'Cidade/Estado', value: 'São Paulo/SP — CEP 04795-000' },
              { label: 'Telefone', value: '(11) 3456-7890' },
              { label: 'E-mail', value: 'comercial@ativachemical.com.br' },
            ].map(f => (
              <div key={f.label}>
                <label className="form-label">{f.label}</label>
                <input type="text" defaultValue={f.value} className="form-input" />
              </div>
            ))}
            <button onClick={() => toast.success('Configurações salvas!')} className="btn-primary">Salvar</button>
          </div>
        </div>
      )}

      {activeTab === 'sefaz' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 max-w-lg">
          <h2 className="font-semibold text-slate-800 mb-4">Configurações SEFAZ e NF-e</h2>
          <div className="space-y-4">
            <div>
              <label className="form-label">Ambiente SEFAZ</label>
              <div className="flex gap-3">
                {['homologacao', 'producao'].map(env => (
                  <button key={env} onClick={() => setSefazAmbiente(env)}
                    className={cn('flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all',
                      sefazAmbiente === env
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
                    )}>
                    {env === 'homologacao' ? '🧪 Homologação (Demo)' : '🏭 Produção'}
                  </button>
                ))}
              </div>
              {sefazAmbiente === 'homologacao' && (
                <p className="text-xs text-amber-600 mt-1.5 bg-amber-50 p-2 rounded">
                  ⚠️ Modo homologação: NF-es emitidas são apenas para testes e não têm validade fiscal.
                </p>
              )}
            </div>

            <div>
              <label className="form-label">Certificado Digital A1 (.pfx)</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 transition-colors">
                <Upload size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">Clique para fazer upload do certificado .pfx</p>
                <p className="text-xs text-slate-400 mt-1">Armazenado criptografado no servidor</p>
              </div>
            </div>

            <div>
              <label className="form-label">Senha do Certificado</label>
              <input type="password" placeholder="••••••••" className="form-input" />
            </div>

            <div>
              <label className="form-label">Série da NF-e</label>
              <input type="number" defaultValue={1} className="form-input w-24" />
            </div>

            <button onClick={() => toast.success('Configurações SEFAZ salvas!')} className="btn-primary">Salvar</button>
          </div>
        </div>
      )}

      {activeTab === 'margem' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 max-w-lg">
          <h2 className="font-semibold text-slate-800 mb-4">Regras de Margem por Categoria</h2>
          <div className="space-y-3">
            {[
              { cat: 'Solventes Industriais', margem: 35 },
              { cat: 'Resinas e Polímeros', margem: 40 },
              { cat: 'Pigmentos e Corantes', margem: 45 },
              { cat: 'Aditivos Industriais', margem: 38 },
              { cat: 'Químicos de Limpeza', margem: 30 },
            ].map(r => (
              <div key={r.cat} className="flex items-center gap-4">
                <span className="flex-1 text-sm text-slate-700">{r.cat}</span>
                <div className="flex items-center gap-2">
                  <input type="number" defaultValue={r.margem} className="form-input w-20 text-right" />
                  <span className="text-slate-500 text-sm">%</span>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
              <span className="flex-1 text-sm font-semibold text-slate-700">Margem Mínima Global</span>
              <div className="flex items-center gap-2">
                <input type="number" defaultValue={15} className="form-input w-20 text-right" />
                <span className="text-slate-500 text-sm">%</span>
              </div>
            </div>
            <button onClick={() => toast.success('Regras de margem salvas!')} className="btn-primary mt-2">Salvar</button>
          </div>
        </div>
      )}

      {activeTab === 'agente' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 max-w-lg">
          <h2 className="font-semibold text-slate-800 mb-1">Configurações do Agente IA</h2>
          <p className="text-sm text-slate-500 mb-4">O agente usa Claude API para monitorar operações e gerar alertas inteligentes.</p>
          <div className="space-y-4">
            {[
              { label: 'Intervalo de execução (minutos)', type: 'number', value: 15 },
              { label: 'Dias sem resposta de proposta para alertar', type: 'number', value: 5 },
              { label: 'Horas sem NF-e após aprovação para alertar', type: 'number', value: 24 },
              { label: 'Dias sem movimentação logística para alertar', type: 'number', value: 3 },
            ].map(f => (
              <div key={f.label}>
                <label className="form-label">{f.label}</label>
                <input type={f.type} defaultValue={f.value} className="form-input w-32" />
              </div>
            ))}
            <div>
              <label className="form-label">Modelo Claude</label>
              <select className="form-input w-auto">
                <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (mais rápido, econômico)</option>
                <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (mais capaz)</option>
              </select>
            </div>
            <button onClick={() => toast.success('Configurações do agente salvas!')} className="btn-primary">Salvar</button>
          </div>
        </div>
      )}

      {activeTab === 'usuarios' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden max-w-2xl">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800 text-sm">Usuários do Sistema</h2>
            <button className="btn-primary py-1.5 text-xs"><Users size={13} /> Convidar</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Carlos Mendes', email: 'admin@ativachemical.com.br', role: 'admin', active: true },
                { name: 'Ana Rodrigues', email: 'gestor@ativachemical.com.br', role: 'gestor', active: true },
                { name: 'Lucas Ferreira', email: 'analista@ativachemical.com.br', role: 'analista', active: true },
              ].map(u => (
                <tr key={u.email}>
                  <td className="font-medium text-slate-800">{u.name}</td>
                  <td className="text-slate-500 text-sm">{u.email}</td>
                  <td><span className={cn('badge', u.role === 'admin' ? 'badge-blue' : u.role === 'gestor' ? 'badge-orange' : 'badge-gray')}>{u.role}</span></td>
                  <td><span className="badge-green">Ativo</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
