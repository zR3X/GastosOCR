import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Receipt,
  Target,
  ScanLine,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { CATEGORIES, getCat } from '../constants/categories';
import type { CategoryKey } from '../types';

function fmt(n: number) {
  return `$${n.toFixed(2)}`;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { expenses, budgets, getBudgetAlerts } = useData();
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  const monthExpenses = useMemo(
    () =>
      expenses.filter((e) => {
        const d = new Date(e.date + 'T00:00:00');
        return d.getFullYear() === curYear && d.getMonth() + 1 === curMonth;
      }),
    [expenses, curYear, curMonth],
  );

  const totalMonth = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const budgetRemaining = totalBudget - totalMonth;

  // Top category this month
  const topCat = useMemo(() => {
    const bycat: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      bycat[e.category] = (bycat[e.category] ?? 0) + e.amount;
    });
    const sorted = Object.entries(bycat).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) return null;
    return { id: sorted[0][0] as CategoryKey, amount: sorted[0][1] };
  }, [monthExpenses]);

  // Pie chart data
  const pieData = useMemo(() => {
    const bycat: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      bycat[e.category] = (bycat[e.category] ?? 0) + e.amount;
    });
    return CATEGORIES.map((c) => ({
      name: c.name,
      value: Math.round((bycat[c.id] ?? 0) * 100) / 100,
      color: c.color,
    })).filter((d) => d.value > 0);
  }, [monthExpenses]);

  // Monthly bar chart - last 6 months
  const barData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(curYear, curMonth - 1 - (5 - i), 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const total = expenses
        .filter((e) => {
          const ed = new Date(e.date + 'T00:00:00');
          return ed.getFullYear() === y && ed.getMonth() + 1 === m;
        })
        .reduce((s, e) => s + e.amount, 0);
      return {
        mes: d.toLocaleDateString('es-ES', { month: 'short' }),
        total: Math.round(total * 100) / 100,
      };
    });
  }, [expenses, curYear, curMonth]);

  const alerts = getBudgetAlerts();
  const recent = expenses.slice(0, 6);

  const monthName = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Mis Viajes</h1>
          <p className="text-sm text-slate-500 mt-0.5 capitalize">{monthName}</p>
        </div>
        <Link
          to="/scan"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <ScanLine size={16} />
          Escanear recibo
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Gasto este mes"
          value={fmt(totalMonth)}
          sub={`${monthExpenses.length} gastos`}
          icon={Receipt}
          color="bg-indigo-500"
        />
        <StatCard
          label="Presupuesto restante"
          value={fmt(budgetRemaining)}
          sub={`de ${fmt(totalBudget)} total`}
          icon={Target}
          color={budgetRemaining >= 0 ? 'bg-emerald-500' : 'bg-red-500'}
        />
        <StatCard
          label="Total registrado"
          value={`${expenses.length}`}
          sub="gastos de viaje"
          icon={TrendingUp}
          color="bg-violet-500"
        />
        <StatCard
          label="Categoría principal"
          value={topCat ? getCat(topCat.id).name : '—'}
          sub={topCat ? fmt(topCat.amount) : 'Sin datos este mes'}
          icon={TrendingUp}
          color={topCat ? 'bg-amber-500' : 'bg-slate-400'}
        />
      </div>

      {/* Budget Alerts */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
            <AlertTriangle size={16} />
            Alertas de presupuesto — {monthName}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {alerts.map((a) => {
              const cat = getCat(a.category);
              const over = a.pct >= 100;
              return (
                <div
                  key={a.category}
                  className={`rounded-xl p-3 border text-xs ${
                    over
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}
                >
                  <div className="flex justify-between font-semibold mb-1">
                    <span>{cat.name}</span>
                    <span>{Math.round(a.pct)}% usado</span>
                  </div>
                  <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full progress-bar ${over ? 'bg-red-400' : 'bg-amber-400'}`}
                      style={{ width: `${Math.min(a.pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs opacity-80">
                    <span>Gastado: {fmt(a.spent)}</span>
                    <span>Límite: {fmt(a.limit)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Pie chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-800 text-sm mb-4">Gastos de viaje por categoría (mes actual)</h2>
          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Legend
                    formatter={(v) => <span className="text-xs text-slate-600">{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              Sin gastos este mes
            </div>
          )}
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-800 text-sm mb-4">Gasto en viajes por mes (últimos 6 meses)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} width={52} />
                <Tooltip formatter={(v) => fmt(Number(v))} />
                <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 text-sm">Últimos gastos de viaje</h2>
          <Link
            to="/expenses"
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {recent.length === 0 && (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">
              No hay gastos registrados.{' '}
              <Link to="/scan" className="text-indigo-500 hover:underline">
                Escanea tu primer recibo de viaje
              </Link>
            </div>
          )}
          {recent.map((e) => {
            const cat = getCat(e.category);
            return (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${cat.bgClass} ${cat.textClass} flex-shrink-0`}
                >
                  {cat.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{e.merchant}</p>
                  <p className="text-xs text-slate-400 truncate">{e.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-slate-800">{fmt(e.amount)}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(e.date + 'T00:00:00').toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
