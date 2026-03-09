import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ScanLine, Receipt, Target,
  FileBarChart2, LogOut, Menu, X, AlertTriangle,
  TrendingUp, KeyRound, Eye, EyeOff, CheckCircle2, Cloud,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useApiKey } from '../context/ApiKeyContext';
import { useCloudinary } from '../context/CloudinaryContext';
import { getCat } from '../constants/categories';
import Modal from './Modal';

const NAV_ITEMS = [
  { to: '/', label: 'Panel Principal', icon: LayoutDashboard, end: true },
  { to: '/scan', label: 'Escanear Recibo', icon: ScanLine, end: false },
  { to: '/expenses', label: 'Mis Gastos de Viaje', icon: Receipt, end: false },
  { to: '/budgets', label: 'Presupuesto', icon: Target, end: false },
  { to: '/reports', label: 'Resumen de Viajes', icon: FileBarChart2, end: false },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { getBudgetAlerts } = useData();
  const { apiKey, setApiKey, hasKey, fromEnv: openaiFromEnv } = useApiKey();
  const { cloudName, apiKey: cldApiKey, setConfig, hasConfig, fromEnv: cldFromEnv } = useCloudinary();
  const navigate = useNavigate();

  const [sideOpen, setSideOpen] = useState(false);

  // OpenAI key modal
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  // Cloudinary modal
  const [cldModalOpen, setCldModalOpen] = useState(false);
  const [cldName, setCldName] = useState('');
  const [cldKey, setCldKey] = useState('');
  const [cldSecret, setCldSecret] = useState('');
  const [showCldSecret, setShowCldSecret] = useState(false);
  const [cldSaved, setCldSaved] = useState(false);

  const alerts = getBudgetAlerts();

  const handleLogout = () => { logout(); navigate('/login'); };

  const openKeyModal = () => {
    setKeyDraft(apiKey); setShowKey(false); setKeySaved(false); setKeyModalOpen(true);
  };
  const handleSaveKey = () => {
    setApiKey(keyDraft);
    setKeySaved(true);
    setTimeout(() => { setKeySaved(false); setKeyModalOpen(false); setKeyDraft(''); }, 1200);
  };

  const openCldModal = () => {
    setCldName(cloudName); setCldKey(cldApiKey); setCldSecret('');
    setShowCldSecret(false); setCldSaved(false); setCldModalOpen(true);
  };
  const handleSaveCld = () => {
    setConfig(cldName, cldKey, cldSecret);
    setCldSaved(true);
    setTimeout(() => { setCldSaved(false); setCldModalOpen(false); }, 1200);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-indigo-700/50">
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
          <Receipt size={20} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-none">ViajeTrack</p>
          <p className="text-indigo-300 text-xs mt-0.5">Gastos de viaje con OCR</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSideOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-100 hover:bg-white/10'
              }`
            }
          >
            <Icon size={18} />
            {label}
            {to === '/budgets' && alerts.length > 0 && (
              <span className="ml-auto w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Config buttons */}
      <div className="px-3 pb-2 space-y-1.5">
        {/* OpenAI Key */}
        {openaiFromEnv ? (
          <div className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium bg-emerald-500/20 text-emerald-200">
            <KeyRound size={14} />
            OpenAI — <span className="font-mono opacity-75">.env</span> ✓
          </div>
        ) : (
          <button
            onClick={openKeyModal}
            className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
              hasKey
                ? 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
                : 'bg-amber-400/20 text-amber-200 hover:bg-amber-400/30 animate-pulse'
            }`}
          >
            <KeyRound size={14} />
            {hasKey ? 'OpenAI Key ✓' : 'Configurar OpenAI Key'}
          </button>
        )}

        {/* Cloudinary */}
        {cldFromEnv ? (
          <div className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium bg-sky-500/20 text-sky-200">
            <Cloud size={14} />
            Cloudinary — <span className="font-mono opacity-75">.env</span> ✓
          </div>
        ) : (
          <button
            onClick={openCldModal}
            className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
              hasConfig
                ? 'bg-sky-500/20 text-sky-200 hover:bg-sky-500/30'
                : 'bg-white/10 text-indigo-200 hover:bg-white/15'
            }`}
          >
            <Cloud size={14} />
            {hasConfig ? 'Cloudinary ✓' : 'Configurar Cloudinary'}
          </button>
        )}
      </div>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-indigo-700/50">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-indigo-300 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-indigo-200 hover:bg-white/10 text-sm transition-colors"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-indigo-700 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sideOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex" onClick={() => setSideOpen(false)}>
          <div className="fixed inset-0 bg-black/50" />
          <aside className="relative w-64 bg-indigo-700 h-full z-50" onClick={(e) => e.stopPropagation()}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Mobile Topbar */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button onClick={() => setSideOpen(true)} className="p-2 rounded-xl hover:bg-slate-100">
            <Menu size={20} className="text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-indigo-600" />
            <span className="font-bold text-slate-800 text-sm">ViajeTrack</span>
          </div>
          {sideOpen && (
            <button onClick={() => setSideOpen(false)} className="ml-auto p-2 rounded-xl hover:bg-slate-100">
              <X size={20} />
            </button>
          )}
        </header>

        {/* No OpenAI key banner */}
        {!hasKey && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
            <div className="max-w-6xl mx-auto flex items-center gap-3 flex-wrap">
              <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
              <span className="text-xs text-amber-700 font-medium">
                Configura tu OpenAI API Key para usar el OCR de recibos y la auto-categorización de viajes.
              </span>
              <button onClick={openKeyModal} className="text-xs font-semibold text-amber-700 underline hover:no-underline">
                Configurar →
              </button>
            </div>
          </div>
        )}

        {/* Budget alerts */}
        {alerts.length > 0 && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2.5">
            <div className="max-w-6xl mx-auto flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-1.5 text-red-700">
                <AlertTriangle size={14} />
                <span className="text-xs font-semibold">Alertas de presupuesto:</span>
              </div>
              {alerts.slice(0, 4).map((a) => {
                const cat = getCat(a.category);
                return (
                  <span key={a.category} className={`text-xs px-2.5 py-1 rounded-full font-medium ${a.pct >= 100 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {cat.name}: {Math.round(a.pct)}%
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-6 max-w-6xl w-full mx-auto">{children}</main>

        <footer className="text-center py-3 text-xs text-slate-400 border-t border-slate-200">
          ViajeTrack Demo &middot; <TrendingUp size={11} className="inline" /> GPT-4o · Cloudinary
        </footer>
      </div>

      {/* ── OpenAI Key Modal ── */}
      <Modal isOpen={keyModalOpen} onClose={() => setKeyModalOpen(false)} title="OpenAI API Key" size="sm">
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Tu API key se guarda solo en el navegador (localStorage) y se envía directamente a OpenAI.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">API Key</label>
            <div className="relative">
              <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showKey ? 'text' : 'password'}
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                placeholder="sk-..."
                className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 font-mono"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
              />
              <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            {hasKey && (
              <button onClick={() => { setApiKey(''); setKeyDraft(''); setKeyModalOpen(false); }} className="px-4 py-2.5 text-xs border border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-medium">
                Eliminar
              </button>
            )}
            <button onClick={() => setKeyModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">
              Cancelar
            </button>
            <button onClick={handleSaveKey} disabled={!keyDraft.trim() || keySaved} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2">
              {keySaved ? <><CheckCircle2 size={15} /> Guardada</> : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Cloudinary Modal ── */}
      <Modal isOpen={cldModalOpen} onClose={() => setCldModalOpen(false)} title="Configurar Cloudinary" size="sm">
        <div className="space-y-4">
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-700 space-y-1">
            <p className="font-semibold mb-1">¿Dónde encontrar estas credenciales?</p>
            <p>Entra a <span className="font-mono font-semibold">cloudinary.com</span> → Dashboard</p>
            <p>Las tres credenciales aparecen en el panel principal.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cloud Name</label>
            <input
              type="text"
              value={cldName}
              onChange={(e) => setCldName(e.target.value)}
              placeholder="mi-cloud-name"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">API Key</label>
            <input
              type="text"
              value={cldKey}
              onChange={(e) => setCldKey(e.target.value)}
              placeholder="123456789012345"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">API Secret</label>
            <div className="relative">
              <input
                type={showCldSecret ? 'text' : 'password'}
                value={cldSecret}
                onChange={(e) => setCldSecret(e.target.value)}
                placeholder={hasConfig ? '••••••••••••••••••••' : 'tu-api-secret'}
                className="w-full pr-10 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowCldSecret(!showCldSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCldSecret ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {hasConfig && !cldSecret && (
              <p className="text-xs text-slate-400 mt-1">Deja vacío para mantener el secret actual.</p>
            )}
          </div>

          {hasConfig && (
            <p className="text-xs text-sky-600 flex items-center gap-1.5">
              <Cloud size={13} /> Imágenes en la carpeta <span className="font-mono font-semibold">gastos-ocr/</span>
            </p>
          )}

          <div className="flex gap-3">
            {hasConfig && (
              <button
                onClick={() => { setConfig('', '', ''); setCldModalOpen(false); }}
                className="px-4 py-2.5 text-xs border border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-medium"
              >
                Eliminar
              </button>
            )}
            <button onClick={() => setCldModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">
              Cancelar
            </button>
            <button
              onClick={handleSaveCld}
              disabled={!cldName.trim() || !cldKey.trim() || (!cldSecret.trim() && !hasConfig) || cldSaved}
              className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              {cldSaved ? <><CheckCircle2 size={15} /> Guardado</> : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
