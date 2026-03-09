import { useState, useMemo } from 'react';
import {
  ShoppingCart, Car, Heart, Tv, Zap, Shirt, BookOpen, Package,
  Pencil, Check, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useData } from '../context/DataContext';
import { CATEGORIES, getCat } from '../constants/categories';
import type { CategoryKey } from '../types';

const ICONS: Record<CategoryKey, LucideIcon> = {
  alimentacion: ShoppingCart,
  transporte: Car,
  salud: Heart,
  entretenimiento: Tv,
  servicios: Zap,
  ropa: Shirt,
  educacion: BookOpen,
  otros: Package,
};

function fmt(n: number) { return `$${n.toFixed(2)}`; }

function BudgetCard({
  catId,
  spent,
  limit,
  onSave,
}: {
  catId: CategoryKey;
  spent: number;
  limit: number;
  onSave: (limit: number) => void;
}) {
  const cat = getCat(catId);
  const Icon = ICONS[catId];
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const over = limit > 0 && spent > limit;
  const warn = !over && pct >= 80;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(limit || ''));

  const barColor = over ? 'bg-red-500' : warn ? 'bg-amber-400' : 'bg-emerald-500';
  const pctColor = over ? 'text-red-600' : warn ? 'text-amber-600' : 'text-emerald-600';

  const handleSave = () => {
    const val = parseFloat(draft);
    if (!isNaN(val) && val >= 0) { onSave(val); setEditing(false); }
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 space-y-3 ${over ? 'border-red-200' : warn ? 'border-amber-200' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${cat.bgClass} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon size={18} className={cat.textClass} />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{cat.name}</p>
            <p className="text-xs text-slate-400">Presupuesto mensual</p>
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => { setDraft(String(limit || '')); setEditing(true); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>

      {/* Spending vs budget */}
      <div className="flex justify-between text-sm">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Gastado</p>
          <p className="font-bold text-slate-800">{fmt(spent)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 mb-0.5">Límite</p>
          {editing ? (
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="10"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
                autoFocus
                className="w-24 border border-indigo-300 rounded-lg px-2 py-1 text-sm text-right font-bold focus:outline-none focus:ring-1 focus:ring-indigo-200"
              />
              <button onClick={handleSave} className="p-1 text-emerald-600 hover:text-emerald-700">
                <Check size={14} />
              </button>
              <button onClick={() => setEditing(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            </div>
          ) : (
            <p className="font-bold text-slate-800">{limit > 0 ? fmt(limit) : '—'}</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {limit > 0 && (
        <div className="space-y-1">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full progress-bar ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">{fmt(Math.max(0, limit - spent))} restante</span>
            <span className={`font-semibold ${pctColor}`}>{Math.round(pct)}%</span>
          </div>
          {over && (
            <p className="text-xs text-red-600 font-medium">
              ⚠️ Excedido en {fmt(spent - limit)}
            </p>
          )}
        </div>
      )}

      {limit === 0 && !editing && (
        <p className="text-xs text-slate-400 italic">Sin límite establecido</p>
      )}
    </div>
  );
}

export default function Budgets() {
  const { budgets, getMonthExpenses, setBudget } = useData();
  const now = new Date();

  const monthExpenses = useMemo(
    () => getMonthExpenses(now.getFullYear(), now.getMonth() + 1),
    [getMonthExpenses, now.getFullYear(), now.getMonth()],
  );

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    });
    return map;
  }, [monthExpenses]);

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  const monthName = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Presupuesto</h1>
        <p className="text-sm text-slate-500 mt-0.5 capitalize">{monthName}</p>
      </div>

      {/* Global summary */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-slate-500 font-medium">Presupuesto total del mes</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">
              ${totalSpent.toFixed(2)}{' '}
              <span className="text-sm font-normal text-slate-400">/ ${totalBudget.toFixed(2)}</span>
            </p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${totalPct >= 100 ? 'text-red-600' : totalPct >= 80 ? 'text-amber-500' : 'text-emerald-600'}`}>
              {Math.round(totalPct)}%
            </p>
            <p className="text-xs text-slate-400">utilizado</p>
          </div>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full progress-bar ${totalPct >= 100 ? 'bg-red-500' : totalPct >= 80 ? 'bg-amber-400' : 'bg-indigo-500'}`}
            style={{ width: `${totalPct}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Restante: ${Math.max(0, totalBudget - totalSpent).toFixed(2)} &middot; Haz clic en ✏️ en cada categoría para cambiar el límite
        </p>
      </div>

      {/* Category cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CATEGORIES.map((cat) => {
          const budget = budgets.find((b) => b.category === cat.id);
          return (
            <BudgetCard
              key={cat.id}
              catId={cat.id}
              spent={spentByCategory[cat.id] ?? 0}
              limit={budget?.limit ?? 0}
              onSave={(limit) => setBudget(cat.id, limit)}
            />
          );
        })}
      </div>
    </div>
  );
}
