import type { Expense } from '../types';
import { CATEGORIES } from '../constants/categories';

export function exportToCSV(expenses: Expense[]): void {
  const headers = ['Fecha', 'Comercio', 'Descripción', 'Categoría', 'Importe ($)'];
  const rows = expenses.map((e) => [
    e.date,
    `"${e.merchant.replace(/"/g, '""')}"`,
    `"${e.description.replace(/"/g, '""')}"`,
    CATEGORIES.find((c) => c.id === e.category)?.name ?? e.category,
    e.amount.toFixed(2),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gastos-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
