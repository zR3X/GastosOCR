import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Expense, Budget, CategoryKey } from '../types';
import { CATEGORIES } from '../constants/categories';

const EXPENSES_KEY = 'gastos_expenses';
const BUDGETS_KEY = 'gastos_budgets';

const SEED_EXPENSES: Expense[] = [
  // March 2026
  { id: 'e1', date: '2026-03-01', amount: 45.30, category: 'alimentacion', description: 'Compra semanal', merchant: 'Mercadona', createdAt: '2026-03-01T10:00:00Z' },
  { id: 'e2', date: '2026-03-02', amount: 12.50, category: 'transporte', description: 'Trayecto trabajo', merchant: 'Cabify', createdAt: '2026-03-02T08:30:00Z' },
  { id: 'e3', date: '2026-03-03', amount: 18.75, category: 'salud', description: 'Medicamentos', merchant: 'Farmacia Central', createdAt: '2026-03-03T12:00:00Z' },
  { id: 'e4', date: '2026-03-04', amount: 15.99, category: 'entretenimiento', description: 'Suscripción mensual', merchant: 'Netflix', createdAt: '2026-03-04T09:00:00Z' },
  { id: 'e5', date: '2026-03-05', amount: 87.50, category: 'servicios', description: 'Factura luz', merchant: 'Iberdrola', createdAt: '2026-03-05T10:00:00Z' },
  { id: 'e6', date: '2026-03-06', amount: 65.00, category: 'ropa', description: 'Camisa y pantalón', merchant: 'Zara', createdAt: '2026-03-06T16:00:00Z' },
  { id: 'e7', date: '2026-03-07', amount: 28.50, category: 'alimentacion', description: 'Cena restaurante', merchant: 'La Taberna', createdAt: '2026-03-07T20:00:00Z' },
  { id: 'e8', date: '2026-03-07', amount: 55.00, category: 'transporte', description: 'Gasolina', merchant: 'Repsol', createdAt: '2026-03-07T14:00:00Z' },
  { id: 'e9', date: '2026-03-08', amount: 120.00, category: 'educacion', description: 'Curso online', merchant: 'Udemy', createdAt: '2026-03-08T11:00:00Z' },
  { id: 'e10', date: '2026-03-08', amount: 9.99, category: 'entretenimiento', description: 'Suscripción música', merchant: 'Spotify', createdAt: '2026-03-08T09:00:00Z' },
  // February 2026
  { id: 'e11', date: '2026-02-28', amount: 62.15, category: 'alimentacion', description: 'Compra mensual', merchant: 'Carrefour', createdAt: '2026-02-28T11:00:00Z' },
  { id: 'e12', date: '2026-02-25', amount: 22.00, category: 'transporte', description: 'Bono metro', merchant: 'Metro Madrid', createdAt: '2026-02-25T08:00:00Z' },
  { id: 'e13', date: '2026-02-20', amount: 45.00, category: 'salud', description: 'Cuota gimnasio', merchant: 'Fitness Center', createdAt: '2026-02-20T18:00:00Z' },
  { id: 'e14', date: '2026-02-15', amount: 35.99, category: 'otros', description: 'Compra online', merchant: 'Amazon', createdAt: '2026-02-15T14:00:00Z' },
  { id: 'e15', date: '2026-02-10', amount: 35.99, category: 'servicios', description: 'Factura móvil', merchant: 'Vodafone', createdAt: '2026-02-10T10:00:00Z' },
  { id: 'e16', date: '2026-02-08', amount: 85.00, category: 'alimentacion', description: 'Compra semanal', merchant: 'Mercadona', createdAt: '2026-02-08T10:00:00Z' },
  { id: 'e17', date: '2026-02-05', amount: 25.00, category: 'entretenimiento', description: 'Entradas cine x2', merchant: 'Cinesa', createdAt: '2026-02-05T19:00:00Z' },
  { id: 'e18', date: '2026-02-01', amount: 90.00, category: 'servicios', description: 'Factura gas', merchant: 'Naturgy', createdAt: '2026-02-01T10:00:00Z' },
  // January 2026
  { id: 'e19', date: '2026-01-31', amount: 48.75, category: 'ropa', description: 'Zapatillas deportivas', merchant: 'Nike Store', createdAt: '2026-01-31T12:00:00Z' },
  { id: 'e20', date: '2026-01-28', amount: 75.00, category: 'educacion', description: 'Libros de texto', merchant: 'FNAC', createdAt: '2026-01-28T16:00:00Z' },
  { id: 'e21', date: '2026-01-15', amount: 110.00, category: 'servicios', description: 'Seguro hogar', merchant: 'Mapfre', createdAt: '2026-01-15T10:00:00Z' },
  { id: 'e22', date: '2026-01-10', amount: 38.40, category: 'alimentacion', description: 'Supermercado', merchant: 'Lidl', createdAt: '2026-01-10T12:00:00Z' },
];

const DEFAULT_BUDGETS: Budget[] = [
  { category: 'alimentacion', limit: 400 },
  { category: 'transporte', limit: 150 },
  { category: 'salud', limit: 100 },
  { category: 'entretenimiento', limit: 80 },
  { category: 'servicios', limit: 250 },
  { category: 'ropa', limit: 120 },
  { category: 'educacion', limit: 200 },
  { category: 'otros', limit: 100 },
];

export interface BudgetAlert {
  category: CategoryKey;
  spent: number;
  limit: number;
  pct: number;
}

interface DataContextType {
  expenses: Expense[];
  budgets: Budget[];
  addExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => Expense;
  updateExpense: (id: string, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>) => void;
  deleteExpense: (id: string) => void;
  setBudget: (category: CategoryKey, limit: number) => void;
  getMonthExpenses: (year: number, month: number) => Expense[];
  getBudgetAlerts: () => BudgetAlert[];
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const stored = localStorage.getItem(EXPENSES_KEY);
      if (stored) return JSON.parse(stored) as Expense[];
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(SEED_EXPENSES));
      return SEED_EXPENSES;
    } catch {
      return SEED_EXPENSES;
    }
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    try {
      const stored = localStorage.getItem(BUDGETS_KEY);
      if (stored) return JSON.parse(stored) as Budget[];
      localStorage.setItem(BUDGETS_KEY, JSON.stringify(DEFAULT_BUDGETS));
      return DEFAULT_BUDGETS;
    } catch {
      return DEFAULT_BUDGETS;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses)); } catch { /* quota exceeded */ }
  }, [expenses]);

  useEffect(() => {
    try { localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets)); } catch { /* quota exceeded */ }
  }, [budgets]);

  const addExpense = (data: Omit<Expense, 'id' | 'createdAt'>): Expense => {
    const expense: Expense = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setExpenses((prev) => [expense, ...prev]);
    return expense;
  };

  const updateExpense = (id: string, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const setBudget = (category: CategoryKey, limit: number) => {
    setBudgets((prev) => {
      const idx = prev.findIndex((b) => b.category === category);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { category, limit };
        return next;
      }
      return [...prev, { category, limit }];
    });
  };

  const getMonthExpenses = (year: number, month: number): Expense[] =>
    expenses.filter((e) => {
      const d = new Date(e.date + 'T00:00:00');
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

  const getBudgetAlerts = (): BudgetAlert[] => {
    const now = new Date();
    const monthExp = getMonthExpenses(now.getFullYear(), now.getMonth() + 1);
    return CATEGORIES.map((cat) => {
      const budget = budgets.find((b) => b.category === cat.id);
      if (!budget || budget.limit <= 0) return null;
      const spent = monthExp
        .filter((e) => e.category === cat.id)
        .reduce((s, e) => s + e.amount, 0);
      const pct = (spent / budget.limit) * 100;
      return pct >= 80 ? { category: cat.id, spent, limit: budget.limit, pct } : null;
    })
      .filter((a): a is BudgetAlert => a !== null)
      .sort((a, b) => b.pct - a.pct);
  };

  return (
    <DataContext.Provider
      value={{ expenses, budgets, addExpense, updateExpense, deleteExpense, setBudget, getMonthExpenses, getBudgetAlerts }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
