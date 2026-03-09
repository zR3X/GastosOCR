import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Expense, Budget } from '../types';
import { CATEGORIES } from '../constants/categories';

export function exportToPDF(
  expenses: Expense[],
  budgets: Budget[],
  dateRange: { from: string; to: string },
  userName: string,
): void {
  const doc = new jsPDF();

  // Header band
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 210, 36, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Reporte Fiscal de Gastos', 14, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}   |   Usuario: ${userName}`,
    14,
    27,
  );

  // Period + totals
  const fmtD = (s: string) => format(new Date(s + 'T00:00:00'), 'dd/MM/yyyy', { locale: es });
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Período: ${fmtD(dateRange.from)} — ${fmtD(dateRange.to)}`, 14, 47);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    `Registros: ${expenses.length}   |   Importe total: $${total.toFixed(2)}`,
    14,
    55,
  );

  // Expense table
  autoTable(doc, {
    startY: 63,
    head: [['Fecha', 'Comercio', 'Descripción', 'Categoría', 'Importe']],
    body: expenses.map((e) => [
      fmtD(e.date),
      e.merchant,
      e.description,
      CATEGORIES.find((c) => c.id === e.category)?.name ?? e.category,
      `$${e.amount.toFixed(2)}`,
    ]),
    headStyles: { fillColor: [79, 70, 229], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 245, 255] },
    foot: [['', '', '', 'TOTAL', `$${total.toFixed(2)}`]],
    footStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: { 4: { halign: 'right' } },
  });

  // Category breakdown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY: number = (doc as any).lastAutoTable?.finalY ?? 200;

  if (finalY < 245) {
    doc.setTextColor(79, 70, 229);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen por Categoría', 14, finalY + 14);

    const catRows = CATEGORIES.map((cat) => {
      const catExp = expenses.filter((e) => e.category === cat.id);
      if (!catExp.length) return null;
      const catTotal = catExp.reduce((s, e) => s + e.amount, 0);
      const budget = budgets.find((b) => b.category === cat.id);
      return [
        cat.name,
        String(catExp.length),
        `$${catTotal.toFixed(2)}`,
        budget?.limit ? `$${budget.limit.toFixed(2)}` : '—',
        budget?.limit ? `$${(budget.limit - catTotal).toFixed(2)}` : '—',
      ];
    }).filter((r): r is string[] => r !== null);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Categoría', 'Gastos', 'Total', 'Presupuesto', 'Diferencia']],
      body: catRows,
      headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
    });
  }

  // Page footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(170, 170, 170);
    doc.text(
      `Pág. ${i} / ${pages}   —   Documento de demostración generado por GastosOCR`,
      105,
      290,
      { align: 'center' },
    );
  }

  doc.save(`reporte-gastos-${dateRange.from}__${dateRange.to}.pdf`);
}
