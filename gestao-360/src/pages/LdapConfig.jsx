import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '@components/Header'
import {
  ArrowLeft,
  ShieldCheck,
  Save,
  Trash2,
  FlaskConical,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Server,
  Info,
} from 'lucide-react'

// Estado inicial do formulario LDAP (baseado no GLPI)
const emptyLdapConfig = {
  nome: '',
  servidorPadrao: 'sim',
  ativo: 'sim',
  servidor: '',
  portaLdap: '389',
  comentarios: '',
  filtroConexao: '(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))',
  baseDn: '',
  usarVinculacao: 'sim',
  rootDn: '',
  senha: '',
  campoLogin: 'samaccountname',
  campoSincronizacao: '',
  grupoAD: '',
}

export default function LdapConfig() {
  const navigate = useNavigate()
  const [configs, setConfigs] = useState(() => {
    const saved = localStorage.getItem('gestao360_ldap_configs')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { /* ignora */ }
    }
    return [
      { id: 1, ...emptyLdapConfig, nome: 'IPECONECT', servidor: '10.0.1.4', baseDn: 'dc=grupoprestacon,dc=local', rootDn: 'grupo-prestacon\\Administrador' },
    ]
  })
  const [activeConfigId, setActiveConfigId] = useState(1)
  const [testStatus, setTestStatus] = useState(null) // null | 'testing' | 'success' | 'error'
  const [testMessage, setTestMessage] = useState('')
  const [testDetails, setTestDetails] = useState(null)
  const [saved, setSaved] = useState(false)

  const activeConfig = configs.find(c => c.id === activeConfigId)

  const updateField = (field, value) => {
    setConfigs(prev =>
      prev.map(c =>
        c.id === activeConfigId ? { ...c, [field]: value } : c
      )
    )
    setSaved(false)
  }

  const handleSave = () => {
    // Persiste as configs LDAP no localStorage para uso na autenticacao
    localStorage.setItem('gestao360_ldap_configs', JSON.stringify(configs))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleTest = async () => {
    setTestStatus('testing')
    setTestMessage('')
    setTestDetails(null)

    try {
      const response = await fetch('/api/ldap/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeConfig),
      })

      const data = await response.json()

      if (data.success) {
        setTestStatus('success')
        setTestMessage(data.message)
        setTestDetails(data.details)
      } else {
        setTestStatus('error')
        setTestMessage(data.message)
      }
    } catch (err) {
      setTestStatus('error')
      setTestMessage('Erro ao conectar com o servidor da API. Verifique se o backend esta rodando.')
    }

    // Limpa o status apos 8 segundos
    setTimeout(() => {
      setTestStatus(null)
      setTestMessage('')
      setTestDetails(null)
    }, 8000)
  }

  const handleAddConfig = () => {
    const newId = Math.max(...configs.map(c => c.id)) + 1
    setConfigs(prev => [...prev, { id: newId, ...emptyLdapConfig, nome: `Novo Diretorio ${newId}` }])
    setActiveConfigId(newId)
  }

  const handleDelete = () => {
    if (configs.length <= 1) return
    const remaining = configs.filter(c => c.id !== activeConfigId)
    setConfigs(remaining)
    setActiveConfigId(remaining[0].id)
  }

  return (
    <div>
      <Header
        title="Autenticacao LDAP"
        subtitle="Configuracao > Autenticacao > Diretorio LDAP"
      />

      <main className="p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <button
            onClick={() => navigate('/')}
            className="hover:text-primary-600 transition-colors"
          >
            Painel
          </button>
          <span className="text-slate-300">/</span>
          <button
            onClick={() => navigate('/configuracao')}
            className="hover:text-primary-600 transition-colors"
          >
            Configuracao
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium">Autenticacao</span>
        </div>

        <div className="flex gap-6">
          {/* Sidebar de diretorios */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200/60 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700">Diretorios LDAP</h3>
                <button
                  onClick={handleAddConfig}
                  className="w-7 h-7 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <ul className="space-y-1">
                {configs.map(config => (
                  <li key={config.id}>
                    <button
                      onClick={() => setActiveConfigId(config.id)}
                      className={`
                        w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all
                        flex items-center gap-2.5
                        ${activeConfigId === config.id
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-50'
                        }
                      `}
                    >
                      <Server className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="block truncate">{config.nome || 'Sem nome'}</span>
                        <span className="text-[11px] text-slate-400 block truncate">{config.servidor || 'Nao configurado'}</span>
                      </div>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${config.ativo === 'sim' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Formulario principal */}
          {activeConfig && (
            <div className="flex-1">
              <div className="bg-white rounded-2xl border border-slate-200/60">
                {/* Header do formulario */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Diretorio LDAP - {activeConfig.nome || 'Novo'}
                    </h2>
                    <p className="text-xs text-slate-400">ID {activeConfig.id} | Configuracao do servidor de autenticacao</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span className={`
                      px-2.5 py-1 rounded-full text-[11px] font-medium
                      ${activeConfig.ativo === 'sim' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}
                    `}>
                      {activeConfig.ativo === 'sim' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>

                {/* Campos do formulario */}
                <div className="p-6 space-y-6">

                  {/* Secao: Identificacao */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Identificacao</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FieldInput
                        label="Nome"
                        value={activeConfig.nome}
                        onChange={(v) => updateField('nome', v)}
                        placeholder="Ex: IPECONECT"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FieldSelect
                          label="Servidor padrao"
                          value={activeConfig.servidorPadrao}
                          onChange={(v) => updateField('servidorPadrao', v)}
                          options={[{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Nao' }]}
                        />
                        <FieldSelect
                          label="Ativo"
                          value={activeConfig.ativo}
                          onChange={(v) => updateField('ativo', v)}
                          options={[{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Nao' }]}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Secao: Servidor */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Servidor</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FieldInput
                        label="Servidor"
                        value={activeConfig.servidor}
                        onChange={(v) => updateField('servidor', v)}
                        placeholder="IP ou hostname (ex: 10.0.1.4)"
                      />
                      <FieldInput
                        label="Porta LDAP (padrao=389)"
                        value={activeConfig.portaLdap}
                        onChange={(v) => updateField('portaLdap', v)}
                        placeholder="389"
                        type="number"
                      />
                    </div>
                  </div>

                  {/* Secao: Filtro e Base */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Filtro e Base</h3>
                    <div className="space-y-4">
                      <FieldTextarea
                        label="Filtro da conexao"
                        value={activeConfig.filtroConexao}
                        onChange={(v) => updateField('filtroConexao', v)}
                        placeholder="(&(objectClass=user)(objectCategory=person))"
                        rows={3}
                        hint="Filtro LDAP para busca de usuarios. O filtro padrao exclui contas desabilitadas no AD."
                      />
                      <FieldInput
                        label="BaseDN"
                        value={activeConfig.baseDn}
                        onChange={(v) => updateField('baseDn', v)}
                        placeholder="dc=empresa,dc=local"
                        hint="Distinguished Name base para busca no diretorio."
                      />
                    </div>
                  </div>

                  {/* Secao: Vinculacao (Bind) */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Vinculacao (Bind)</h3>
                    <div className="space-y-4">
                      <FieldSelect
                        label="Usar vinculacao"
                        value={activeConfig.usarVinculacao}
                        onChange={(v) => updateField('usarVinculacao', v)}
                        options={[{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Nao' }]}
                        hint="Usar credenciais para conectar ao servidor LDAP (recomendado)."
                      />
                      {activeConfig.usarVinculacao === 'sim' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <FieldInput
                            label="RootDN (para ligacoes nao anonimas)"
                            value={activeConfig.rootDn}
                            onChange={(v) => updateField('rootDn', v)}
                            placeholder="dominio\\usuario ou CN=admin,DC=empresa,DC=local"
                          />
                          <FieldInput
                            label="Senha (para ligacoes nao anonimas)"
                            value={activeConfig.senha}
                            onChange={(v) => updateField('senha', v)}
                            placeholder="Senha do RootDN"
                            type="password"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Secao: Campos de Login */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Campos de Login</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FieldInput
                        label="Campo de Login"
                        value={activeConfig.campoLogin}
                        onChange={(v) => updateField('campoLogin', v)}
                        placeholder="samaccountname"
                        hint="Atributo LDAP usado como login (geralmente samaccountname ou uid)."
                      />
                      <FieldInput
                        label="Campo de sincronizacao"
                        value={activeConfig.campoSincronizacao}
                        onChange={(v) => updateField('campoSincronizacao', v)}
                        placeholder="Opcional"
                        hint="Atributo para sincronizacao de dados entre LDAP e o sistema."
                      />
                    </div>
                  </div>

                  {/* Secao: Controle de Acesso */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Controle de Acesso</h3>
                    <FieldInput
                      label="Grupo do AD (restringir acesso)"
                      value={activeConfig.grupoAD}
                      onChange={(v) => updateField('grupoAD', v)}
                      placeholder="CN=GRP_Gestao360,OU=Grupos,DC=grupoprestacon,DC=local"
                      hint="Somente usuarios membros deste grupo poderao logar no sistema. Deixe vazio para permitir qualquer usuario do AD. Use o Distinguished Name (DN) completo do grupo."
                    />
                  </div>

                  {/* Secao: Comentarios */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Observacoes</h3>
                    <FieldTextarea
                      label="Comentarios"
                      value={activeConfig.comentarios}
                      onChange={(v) => updateField('comentarios', v)}
                      placeholder="Anotacoes sobre esta configuracao..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Footer com acoes */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
                  <div className="flex items-center gap-3">
                    {/* Botao Testar */}
                    <button
                      onClick={handleTest}
                      disabled={testStatus === 'testing'}
                      className="
                        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                        bg-primary-50 text-primary-700 hover:bg-primary-100
                        disabled:opacity-50 transition-colors
                      "
                    >
                      {testStatus === 'testing' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : testStatus === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : testStatus === 'error' ? (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      ) : (
                        <FlaskConical className="w-4 h-4" />
                      )}
                      {testStatus === 'testing' ? 'Testando...'
                        : testStatus === 'success' ? 'Conexao OK!'
                        : testStatus === 'error' ? 'Falha na conexao'
                        : 'Testar conexao'}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Botao Excluir */}
                    {configs.length > 1 && (
                      <button
                        onClick={handleDelete}
                        className="
                          flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                          border border-rose-200 text-rose-600 hover:bg-rose-50
                          transition-colors
                        "
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir permanentemente
                      </button>
                    )}

                    {/* Botao Salvar */}
                    <button
                      onClick={handleSave}
                      className="
                        flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                        bg-accent-400 text-white hover:bg-accent-500
                        shadow-sm shadow-accent-400/20 transition-colors
                      "
                    >
                      <Save className="w-4 h-4" />
                      {saved ? 'Salvo!' : 'Salvar'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Resultado do teste */}
              {testMessage && (
                <div className={`
                  mt-4 rounded-2xl border p-5
                  ${testStatus === 'success'
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-rose-50 border-rose-200'
                  }
                `}>
                  <div className="flex items-center gap-2 mb-2">
                    {testStatus === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    )}
                    <span className={`text-sm font-semibold ${testStatus === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {testMessage}
                    </span>
                  </div>
                  {testDetails && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/60 rounded-lg px-3 py-2">
                        <span className="text-slate-500">Servidor:</span>{' '}
                        <span className="font-medium text-slate-700">{testDetails.servidor}:{testDetails.porta}</span>
                      </div>
                      <div className="bg-white/60 rounded-lg px-3 py-2">
                        <span className="text-slate-500">Bind:</span>{' '}
                        <span className="font-medium text-slate-700">{testDetails.bind}</span>
                      </div>
                      <div className="bg-white/60 rounded-lg px-3 py-2">
                        <span className="text-slate-500">BaseDN:</span>{' '}
                        <span className="font-medium text-slate-700">{testDetails.baseDn}</span>
                      </div>
                      <div className="bg-white/60 rounded-lg px-3 py-2">
                        <span className="text-slate-500">Usuarios encontrados:</span>{' '}
                        <span className="font-medium text-slate-700">{testDetails.usuariosEncontrados}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

/* ================================================
   Componentes de campo reutilizaveis
   ================================================ */

function FieldInput({ label, value, onChange, placeholder, type = 'text', hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full px-4 py-2.5 text-sm rounded-xl
          bg-white border border-slate-200
          focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
          placeholder:text-slate-300 transition-all
        "
      />
      {hint && (
        <p className="flex items-start gap-1 mt-1.5 text-[11px] text-slate-400">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          {hint}
        </p>
      )}
    </div>
  )
}

function FieldSelect({ label, value, onChange, options, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full px-4 py-2.5 text-sm rounded-xl
          bg-white border border-slate-200
          focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
          transition-all appearance-none cursor-pointer
        "
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {hint && (
        <p className="flex items-start gap-1 mt-1.5 text-[11px] text-slate-400">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          {hint}
        </p>
      )}
    </div>
  )
}

function FieldTextarea({ label, value, onChange, placeholder, rows = 3, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="
          w-full px-4 py-2.5 text-sm rounded-xl
          bg-white border border-slate-200
          focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
          placeholder:text-slate-300 transition-all resize-y
        "
      />
      {hint && (
        <p className="flex items-start gap-1 mt-1.5 text-[11px] text-slate-400">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          {hint}
        </p>
      )}
    </div>
  )
}
