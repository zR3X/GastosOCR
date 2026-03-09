import { useState, useMemo } from 'react';
import { FileDown, FileText, CalendarRange, TrendingDown } from 'lucide-react';
import { useData } from '../context/DataContext';
import { CATEGORIES, getCat } from '../constants/categories';
import { exportToPDF } from '../utils/exportPDF';
import { exportToCSV } from '../utils/exportCSV';
import { useAuth } from '../context/AuthContext';

function fmt(n: number) { return `$${n.toFixed(2)}`; }

// Default: current month
function defaultFrom() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

export default function Reports() {
  const { expenses, budgets } = useData();
  const { user } = useAuth();
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [exportingPdf, setExportingPdf] = useState(false);

  const filtered = useMemo(
    () =>
      expenses
        .filter((e) => e.date >= dateFrom && e.date <= dateTo)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, dateFrom, dateTo],
  );

  const total = filtered.reduce((s, e) => s + e.amount, 0);
  const avg = filtered.length ? total / filtered.length : 0;

  const byCategory = useMemo(() =>
    CATEGORIES.map((cat) => {
      const catExp = filtered.filter((e) => e.category === cat.id);
      return {
        cat,
        count: catExp.length,
        total: catExp.reduce((s, e) => s + e.amount, 0),
        pct: total > 0 ? (catExp.reduce((s, e) => s + e.amount, 0) / total) * 100 : 0,
      };
    }).filter((c) => c.count > 0).sort((a, b) => b.total - a.total),
    [filtered, total],
  );

  const handleExportPDF = async () => {
    if (!filtered.length) { alert('No hay gastos en el período seleccionado.'); return; }
    setExportingPdf(true);
    await new Promise((r) => setTimeout(r, 50)); // allow render update
    exportToPDF(filtered, budgets, { from: dateFrom, to: dateTo }, user?.name ?? 'Demo');
    setExportingPdf(false);
  };

  const handleExportCSV = () => {
    if (!filtered.length) { alert('No hay gastos en el período seleccionado.'); return; }
    exportToCSV(filtered);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Informes Fiscales</h1>
        <p className="text-sm text-slate-500 mt-0.5">Exporta tus gastos para declaración de impuestos — Demo</p>
      </div>

      {/* Date range + export */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm">
          <CalendarRange size={16} />
          Período de informe
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
            />
          </div>

          {/* Quick range buttons */}
          <div className="flex gap-2 flex-wrap">
            {[
              {
                label: 'Este mes',
                fn: () => {
                  const d = new Date();
                  setDateFrom(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
                  setDateTo(d.toISOString().slice(0, 10));
                },
              },
              {
                label: 'Mes anterior',
                fn: () => {
                  const d = new Date();
                  d.setMonth(d.getMonth() - 1);
                  const y = d.getFullYear();
                  const m = d.getMonth() + 1;
                  const last = new Date(y, m, 0).getDate();
                  setDateFrom(`${y}-${String(m).padStart(2, '0')}-01`);
                  setDateTo(`${y}-${String(m).padStart(2, '0')}-${last}`);
                },
              },
              {
                label: 'Este año',
                fn: () => {
                  const y = new Date().getFullYear();
                  setDateFrom(`${y}-01-01`);
                  setDateTo(new Date().toISOString().slice(0, 10));
                },
              },
            ].map(({ label, fn }) => (
              <button
                key={label}
                onClick={fn}
                className="text-xs px-3 py-2 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 text-slate-600 rounded-xl font-medium transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleExportPDF}
            disabled={exportingPdf || !filtered.length}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {exportingPdf ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FileText size={16} />
            )}
            Exportar PDF
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!filtered.length}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <FileDown size={16} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total gastos', value: fmt(total) },
          { label: 'Nº registros', value: String(filtered.length) },
          { label: 'Promedio', value: fmt(avg) },
          { label: 'Categorías', value: String(byCategory.length) },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
            <p className="text-xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <TrendingDown size={16} />
            Desglose por categoría
          </div>
          <div className="space-y-2.5">
            {byCategory.map(({ cat, count, total: cTotal, pct }) => (
              <div key={cat.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cat.dotClass}`} />
                    <span className="font-medium text-slate-700">{cat.name}</span>
                    <span className="text-xs text-slate-400">({count} gastos)</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-xs text-slate-400">{Math.round(pct)}%</span>
                    <span className="font-bold text-slate-800">{fmt(cTotal)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full progress-bar ${cat.dotClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview table */}
      {filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">
              Vista previa — {filtered.length} registros
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Comercio</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden md:table-cell">Descripción</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Categoría</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.slice(0, 20).map((e) => {
                  const cat = getCat(e.category);
                  return (
                    <tr key={e.id}>
                      <td className="px-4 py-2.5 text-xs text-slate-500">
                        {new Date(e.date + 'T00:00:00').toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-medium text-slate-700">{e.merchant}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 hidden md:table-cell">{e.description}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${cat.bgClass} ${cat.textClass}`}>
                          {cat.name}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs font-bold text-slate-800">{fmt(e.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-indigo-100 bg-indigo-50">
                  <td colSpan={3} className="px-4 py-2.5 text-xs font-bold text-indigo-700 hidden md:table-cell">
                    {filtered.length > 20 && `(Mostrando 20 de ${filtered.length})`}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-bold text-indigo-700">TOTAL</td>
                  <td className="px-4 py-2.5 text-right text-sm font-bold text-indigo-700">{fmt(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <FileText size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Sin gastos en el período seleccionado</p>
          <p className="text-xs text-slate-400 mt-1">Ajusta el rango de fechas</p>
        </div>
      )}

      <p className="text-xs text-center text-slate-400 pb-2">
        Este informe es una demostración. Los datos se almacenan localmente en tu navegador.
      </p>
    </div>
  );
}
