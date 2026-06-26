export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white px-6 py-3 flex items-center justify-between flex-shrink-0">
      <span className="text-xs text-slate-400">
        © {new Date().getFullYear()} Ativa Chemical — Sistema de Gestão Integrada
      </span>
      <span className="text-xs text-slate-400">
        Criado por{' '}
        <span className="font-semibold" style={{ background: 'linear-gradient(135deg, #06b6d4, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Cyber Records
        </span>
      </span>
    </footer>
  )
}
