import { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, ScanLine, Filter, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { CATEGORIES, getCat } from '../constants/categories';
import Modal from '../components/Modal';
import ExpenseForm from '../components/ExpenseForm';
import type { Expense, CategoryKey } from '../types';

function fmt(n: number) { return `$${n.toFixed(2)}`; }

export default function Expenses() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useData();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<CategoryKey | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return expenses.filter((e) => {
      if (catFilter !== 'all' && e.category !== catFilter) return false;
      if (dateFrom && e.date < dateFrom) return false;
      if (dateTo && e.date > dateTo) return false;
      if (q && !e.merchant.toLowerCase().includes(q) && !e.description.toLowerCase().includes(q) && !(e.destination ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [expenses, search, catFilter, dateFrom, dateTo]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);
  const avg = filtered.length ? total / filtered.length : 0;
  const hasFilters = catFilter !== 'all' || dateFrom || dateTo || search;

  const clearFilters = () => {
    setSearch('');
    setCatFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const handleAdd = (data: Parameters<typeof addExpense>[0]) => {
    addExpense(data);
    setAddOpen(false);
  };

  const handleEdit = (data: Parameters<typeof addExpense>[0]) => {
    if (editTarget) { updateExpense(editTarget.id, data); setEditTarget(null); }
  };

  const handleDelete = () => {
    if (deleteTarget) { deleteExpense(deleteTarget.id); setDeleteTarget(null); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Mis Gastos de Viaje</h1>
          <p className="text-sm text-slate-500 mt-0.5">{expenses.length} gastos registrados</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus size={16} />
          Añadir gasto
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar comercio, descripción o destino..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-xs text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <X size={13} /> Limpiar
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter size={13} />
          </div>
          {/* Category filter pills */}
          <button
            onClick={() => setCatFilter('all')}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              catFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCatFilter(c.id)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                catFilter === c.id
                  ? `${c.dotClass} text-white`
                  : `${c.bgClass} ${c.textClass} hover:opacity-80`
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2 text-xs items-center text-slate-500">
          <span>Desde</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-300"
          />
          <span>hasta</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-300"
          />
        </div>
      </div>

      {/* Summary row */}
      {filtered.length > 0 && (
        <div className="flex gap-3">
          {[
            { label: 'Resultados', value: String(filtered.length) },
            { label: 'Total', value: fmt(total) },
            { label: 'Promedio', value: fmt(avg) },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 px-4 py-2 text-center flex-1">
              <p className="text-lg font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <ScanLine size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No hay gastos</p>
            <p className="text-xs text-slate-400 mt-1">
              {hasFilters ? 'Prueba a cambiar los filtros' : 'Añade tu primer gasto o escanea un recibo'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Comercio</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Destino</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Descripción</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Categoría</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Importe</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((e) => {
                  const cat = getCat(e.category);
                  return (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(e.date + 'T00:00:00').toLocaleDateString('es-ES', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {e.receiptImage && (
                            <button
                              onClick={() => setImgPreview(e.receiptImage!)}
                              className="w-6 h-6 bg-slate-100 rounded overflow-hidden flex-shrink-0 hover:opacity-80"
                              title="Ver recibo"
                            >
                              <img src={e.receiptImage} alt="" className="w-full h-full object-cover" />
                            </button>
                          )}
                          <span className="font-medium text-slate-800 truncate max-w-[120px]">{e.merchant}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden lg:table-cell truncate max-w-[120px]">
                        {e.destination ? (
                          <span className="inline-flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                            {e.destination}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell truncate max-w-[200px]">
                        {e.description}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-medium ${cat.bgClass} ${cat.textClass}`}>
                          {cat.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800 whitespace-nowrap">
                        {fmt(e.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                          <button
                            onClick={() => setEditTarget(e)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(e)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Nuevo gasto">
        <ExpenseForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} submitLabel="Guardar gasto" />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Editar gasto">
        {editTarget && (
          <ExpenseForm
            initialData={editTarget}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            submitLabel="Guardar cambios"
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar gasto" size="sm">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              ¿Eliminar el gasto de{' '}
              <span className="font-semibold text-slate-800">{fmt(deleteTarget.amount)}</span> en{' '}
              <span className="font-semibold text-slate-800">{deleteTarget.merchant}</span>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Image Preview */}
      <Modal isOpen={!!imgPreview} onClose={() => setImgPreview(null)} title="Recibo escaneado" size="lg">
        {imgPreview && (
          <img src={imgPreview} alt="Recibo" className="w-full rounded-xl" />
        )}
      </Modal>
    </div>
  );
}
