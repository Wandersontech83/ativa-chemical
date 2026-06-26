'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Plus, Pencil, Trash2, Users, Shield, Key, Eye, EyeOff } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { loadData, saveData, genId } from '@/lib/storage'

interface Usuario {
  id: string; nome: string; email: string; perfil: 'admin' | 'gestor' | 'analista'
  status: 'ativo' | 'inativo'; criado_em: string
}

const SEED: Usuario[] = [
  { id: 'usr-001', nome: 'Wanderson Lima', email: 'admin@ativachemical.com.br', perfil: 'admin', status: 'ativo', criado_em: '2024-01-01' },
  { id: 'usr-002', nome: 'Ana Rodrigues', email: 'gestor@ativachemical.com.br', perfil: 'gestor', status: 'ativo', criado_em: '2024-03-15' },
  { id: 'usr-003', nome: 'Lucas Ferreira', email: 'analista@ativachemical.com.br', perfil: 'analista', status: 'ativo', criado_em: '2024-05-20' },
]

const EMPTY: Omit<Usuario,'id'|'criado_em'> & { senha: string } = {
  nome: '', email: '', perfil: 'analista', status: 'ativo', senha: ''
}

const PERFIL_CONFIG = {
  admin: { label: 'Administrador', color: 'bg-red-100 text-red-700', desc: 'Acesso total ao sistema' },
  gestor: { label: 'Gestor', color: 'bg-blue-100 text-blue-700', desc: 'Acesso a relatórios e aprovações' },
  analista: { label: 'Analista', color: 'bg-slate-100 text-slate-600', desc: 'Acesso operacional básico' },
}

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<'usuarios' | 'empresa' | 'sistema'>('usuarios')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Usuario | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [showSenha, setShowSenha] = useState(false)
  const [deleteId, setDeleteId] = useState<string|null>(null)

  useEffect(() => { setUsuarios(loadData('usuarios', SEED)) }, [])
  const save = (list: Usuario[]) => { setUsuarios(list); saveData('usuarios', list) }

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowSenha(false); setModal(true) }
  const openEdit = (u: Usuario) => { setEditing(u); setForm({...u, senha: ''}); setShowSenha(false); setModal(true) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const { senha, ...rest } = form
    if (editing) {
      save(usuarios.map(u => u.id === editing.id ? {...rest, id: editing.id, criado_em: editing.criado_em} : u))
    } else {
      save([...usuarios, { ...rest, id: genId('usr'), criado_em: new Date().toISOString().split('T')[0] }])
    }
    setModal(false)
  }

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
        <p className="text-slate-500 text-sm mt-0.5">Gerencie usuários, empresa e preferências do sistema</p>
      </div>

      <div className="flex gap-2">
        {(['usuarios','empresa','sistema'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors', tab === t ? 'bg-cyan-600 text-white' : 'bg-white text-slate-600 border border-slate-200')}>
            {t === 'usuarios' ? 'Usuários' : t === 'empresa' ? 'Empresa' : 'Sistema'}
          </button>
        ))}
      </div>

      {tab === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{usuarios.length} usuários cadastrados</p>
            <button onClick={openCreate} className="btn-primary"><Plus size={16}/>Novo Usuário</button>
          </div>

          <div className="grid gap-3">
            {usuarios.map(u => {
              const cfg = PERFIL_CONFIG[u.perfil]
              return (
                <div key={u.id} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {u.nome.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{u.nome}</p>
                      {u.id === 'usr-001' && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Você</span>}
                    </div>
                    <p className="text-sm text-slate-500">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', cfg.color)}>{cfg.label}</span>
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', u.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>{u.status}</span>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"><Pencil size={14}/></button>
                      {u.id !== 'usr-001' && <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14}/></button>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1"><Shield size={12}/>Níveis de acesso</p>
            {Object.values(PERFIL_CONFIG).map(cfg => (
              <p key={cfg.label} className="text-xs text-slate-500 mt-1"><span className={cn('font-semibold mr-1', cfg.color.replace('bg-','text-').split(' ')[1])}>{cfg.label}:</span>{cfg.desc}</p>
            ))}
          </div>
        </div>
      )}

      {tab === 'empresa' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-slate-800">Dados da Empresa</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Razão Social</label><input defaultValue="Ativa Chemical Distribuidora Ltda" className="form-input"/></div>
            <div><label className="form-label">CNPJ</label><input defaultValue="12.345.678/0001-99" className="form-input"/></div>
            <div><label className="form-label">E-mail Comercial</label><input defaultValue="comercial@ativachemical.com.br" className="form-input"/></div>
            <div><label className="form-label">Telefone</label><input defaultValue="(11) 3000-0000" className="form-input"/></div>
            <div><label className="form-label">Cidade</label><input defaultValue="São Paulo" className="form-input"/></div>
            <div><label className="form-label">Estado</label><input defaultValue="SP" className="form-input"/></div>
          </div>
          <div className="flex justify-end">
            <button className="btn-primary">Salvar Dados</button>
          </div>
        </div>
      )}

      {tab === 'sistema' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Informações do Sistema</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Versão</span><span className="font-mono text-slate-700">1.0.0</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Ambiente</span><span className="font-semibold text-emerald-600">Produção</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Desenvolvido por</span><span className="font-semibold" style={{background:'linear-gradient(135deg,#06b6d4,#2563eb)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Cyber Records</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Contato</span><span className="text-slate-700">wanderson@cyberecords.com.br</span></div>
            </div>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Usuário' : 'Novo Usuário'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="form-label">Nome Completo</label><input value={form.nome} onChange={f('nome')} className="form-input" required placeholder="Ex: João Silva"/></div>
          <div><label className="form-label">E-mail</label><input type="email" value={form.email} onChange={f('email')} className="form-input" required placeholder="usuario@ativachemical.com.br"/></div>
          {!editing && (
            <div>
              <label className="form-label">Senha</label>
              <div className="relative">
                <input type={showSenha ? 'text' : 'password'} value={form.senha} onChange={f('senha')} className="form-input pr-10" required={!editing} placeholder="Mínimo 8 caracteres" minLength={6}/>
                <button type="button" onClick={() => setShowSenha(!showSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showSenha ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Perfil</label>
              <select value={form.perfil} onChange={f('perfil')} className="form-input">
                <option value="admin">Administrador</option>
                <option value="gestor">Gestor</option>
                <option value="analista">Analista</option>
              </select>
            </div>
            <div><label className="form-label">Status</label>
              <select value={form.status} onChange={f('status')} className="form-input">
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
          {form.perfil && (
            <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-500">
              <Shield size={12} className="inline mr-1"/>{PERFIL_CONFIG[form.perfil].desc}
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary"><Users size={16}/>{editing ? 'Salvar' : 'Criar Usuário'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar exclusão" size="sm">
        <p className="text-slate-600 mb-5">Excluir este usuário permanentemente? Ele perderá acesso ao sistema.</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancelar</button>
          <button onClick={() => { save(usuarios.filter(u => u.id !== deleteId)); setDeleteId(null) }} className="btn-danger">Excluir</button>
        </div>
      </Modal>
    </div>
  )
}
