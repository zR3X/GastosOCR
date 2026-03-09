import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { Expense, CategoryKey } from '../types';
import { CATEGORIES } from '../constants/categories';
import { useApiKey } from '../context/ApiKeyContext';
import { categorizeExpense } from '../utils/ocr';

type FormData = Omit<Expense, 'id' | 'createdAt'>;

interface ExpenseFormProps {
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export default function ExpenseForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
}: ExpenseFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const { apiKey, hasKey } = useApiKey();
  const [form, setForm] = useState({
    date: initialData?.date ?? today,
    amount: initialData?.amount != null ? String(initialData.amount) : '',
    category: initialData?.category ?? ('otros' as CategoryKey),
    description: initialData?.description ?? '',
    merchant: initialData?.merchant ?? '',
    destination: initialData?.destination ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categorizing, setCategorizing] = useState(false);
  const [catSuggested, setCatSuggested] = useState(false);

  const set = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (field === 'merchant' || field === 'description') setCatSuggested(false);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = 'Importe requerido (> 0)';
    if (!form.description.trim()) errs.description = 'Descripción requerida';
    if (!form.merchant.trim()) errs.merchant = 'Comercio / establecimiento requerido';
    if (!form.date) errs.date = 'Fecha requerida';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      date: form.date,
      amount: parseFloat(form.amount),
      category: form.category as CategoryKey,
      description: form.description.trim(),
      merchant: form.merchant.trim(),
      destination: form.destination.trim() || undefined,
      receiptImage: initialData?.receiptImage,
      ocrText: initialData?.ocrText,
    });
  };

  const handleAutoCategorize = async () => {
    if (!hasKey || (!form.merchant && !form.description)) return;
    setCategorizing(true);
    setCatSuggested(false);
    try {
      const cat = await categorizeExpense(form.merchant, form.description, apiKey);
      setForm((f) => ({ ...f, category: cat }));
      setCatSuggested(true);
      setTimeout(() => setCatSuggested(false), 2500);
    } catch {
      // silently fail
    } finally {
      setCategorizing(false);
    }
  };

  const fieldCls = (field: string) =>
    `w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors ${
      errors[field]
        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200'
        : 'border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className={fieldCls('date')}
          />
          {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
        </div>
        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Importe ($)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            className={fieldCls('amount')}
          />
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
        </div>
      </div>

      {/* Merchant */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Comercio / Establecimiento</label>
        <input
          type="text"
          placeholder="Ej. Lufthansa, Airbnb, Uber, Restaurante..."
          value={form.merchant}
          onChange={(e) => set('merchant', e.target.value)}
          className={fieldCls('merchant')}
        />
        {errors.merchant && <p className="text-xs text-red-500 mt-1">{errors.merchant}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción</label>
        <input
          type="text"
          placeholder="Ej. Vuelo MAD-NYC, Hotel 2 noches, Tour ciudad..."
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className={fieldCls('description')}
        />
        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
      </div>

      {/* Destination */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Destino / Ciudad</label>
        <input
          type="text"
          placeholder="Ej. París, Tokio, Nueva York... (opcional)"
          value={form.destination}
          onChange={(e) => set('destination', e.target.value)}
          className={fieldCls('destination')}
        />
      </div>

      {/* Category + AI button */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-slate-600">Categoría</label>
          <button
            type="button"
            onClick={handleAutoCategorize}
            disabled={categorizing || !hasKey || (!form.merchant && !form.description)}
            title={!hasKey ? 'Configura tu API key primero' : 'Sugerir categoría con IA'}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
              catSuggested
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {categorizing ? (
              <span className="w-3 h-3 border border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            ) : (
              <Sparkles size={12} />
            )}
            {catSuggested ? '¡Categoría sugerida!' : categorizing ? 'Analizando...' : 'Auto-categorizar'}
          </button>
        </div>
        <select
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
          className={`${fieldCls('category')} ${catSuggested ? 'border-emerald-400 ring-1 ring-emerald-100' : ''}`}
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {catSuggested && (
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <Sparkles size={11} /> GPT-4o sugirió esta categoría de viaje
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
