import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Expense, Budget, CategoryKey } from '../types';
import { CATEGORIES } from '../constants/categories';

const EXPENSES_KEY = 'viaje_expenses';
const BUDGETS_KEY = 'viaje_budgets';

const SEED_EXPENSES: Expense[] = [
  // Marzo 2026 — Viaje a México
  { id: 'e1', date: '2026-03-01', amount: 520.00, category: 'vuelos', description: 'Vuelo MAD→MEX (ida y vuelta)', merchant: 'Iberia', destination: 'Ciudad de México', createdAt: '2026-03-01T08:00:00Z' },
  { id: 'e2', date: '2026-03-02', amount: 85.00, category: 'alojamiento', description: 'Hotel Centro Histórico (noche)', merchant: 'Hotel Zócalo Central', destination: 'Ciudad de México', createdAt: '2026-03-02T14:00:00Z' },
  { id: 'e3', date: '2026-03-02', amount: 18.50, category: 'comida', description: 'Tacos y mezcal en mercado', merchant: 'Mercado de San Juan', destination: 'Ciudad de México', createdAt: '2026-03-02T20:00:00Z' },
  { id: 'e4', date: '2026-03-03', amount: 12.00, category: 'transporte', description: 'Metro + Uber aeropuerto', merchant: 'Uber México', destination: 'Ciudad de México', createdAt: '2026-03-03T09:00:00Z' },
  { id: 'e5', date: '2026-03-03', amount: 35.00, category: 'actividades', description: 'Entrada Museo Nacional Antropología', merchant: 'INAH', destination: 'Ciudad de México', createdAt: '2026-03-03T11:00:00Z' },
  { id: 'e6', date: '2026-03-04', amount: 60.00, category: 'compras', description: 'Artesanías y souvenirs', merchant: 'Mercado de Artesanías', destination: 'Ciudad de México', createdAt: '2026-03-04T16:00:00Z' },
  { id: 'e7', date: '2026-03-05', amount: 95.00, category: 'alojamiento', description: 'Posada en Oaxaca (2 noches)', merchant: 'Casa Oaxaca', destination: 'Oaxaca', createdAt: '2026-03-05T15:00:00Z' },
  { id: 'e8', date: '2026-03-05', amount: 22.00, category: 'comida', description: 'Mole negro y tlayudas', merchant: 'El Asador Vasco', destination: 'Oaxaca', createdAt: '2026-03-05T21:00:00Z' },
  { id: 'e9', date: '2026-03-06', amount: 45.00, category: 'actividades', description: 'Tour Monte Albán con guía', merchant: 'Oaxaca Tours', destination: 'Oaxaca', createdAt: '2026-03-06T10:00:00Z' },
  { id: 'e10', date: '2026-03-07', amount: 28.00, category: 'transporte', description: 'Autobús Oaxaca → Puerto Escondido', merchant: 'ADO', destination: 'Puerto Escondido', createdAt: '2026-03-07T07:00:00Z' },
  // Febrero 2026 — Viaje a Tokio
  { id: 'e11', date: '2026-02-01', amount: 980.00, category: 'vuelos', description: 'Vuelo MAD→NRT (ida y vuelta)', merchant: 'Japan Airlines', destination: 'Tokio', createdAt: '2026-02-01T06:00:00Z' },
  { id: 'e12', date: '2026-02-02', amount: 120.00, category: 'alojamiento', description: 'Hotel Shinjuku (2 noches)', merchant: 'Park Hyatt Tokyo', destination: 'Tokio', createdAt: '2026-02-02T15:00:00Z' },
  { id: 'e13', date: '2026-02-03', amount: 35.00, category: 'comida', description: 'Ramen + sushi en Tsukiji', merchant: 'Tsukiji Market', destination: 'Tokio', createdAt: '2026-02-03T13:00:00Z' },
  { id: 'e14', date: '2026-02-03', amount: 28.00, category: 'transporte', description: 'Pase de metro 3 días', merchant: 'Tokyo Metro', destination: 'Tokio', createdAt: '2026-02-03T08:00:00Z' },
  { id: 'e15', date: '2026-02-04', amount: 55.00, category: 'actividades', description: 'Teamlab Borderless', merchant: 'TeamLab', destination: 'Tokio', createdAt: '2026-02-04T14:00:00Z' },
  { id: 'e16', date: '2026-02-05', amount: 88.00, category: 'compras', description: 'Electrónica en Akihabara', merchant: 'Yodobashi Camera', destination: 'Tokio', createdAt: '2026-02-05T17:00:00Z' },
  { id: 'e17', date: '2026-02-06', amount: 110.00, category: 'alojamiento', description: 'Ryokan tradicional en Kyoto', merchant: 'Ryokan Yoshida', destination: 'Kioto', createdAt: '2026-02-06T16:00:00Z' },
  { id: 'e18', date: '2026-02-07', amount: 42.00, category: 'actividades', description: 'Entrada templos Fushimi Inari', merchant: 'Fushimi Inari', destination: 'Kioto', createdAt: '2026-02-07T09:00:00Z' },
  // Enero 2026 — Viaje a París
  { id: 'e19', date: '2026-01-10', amount: 310.00, category: 'vuelos', description: 'Vuelo MAD→CDG (ida y vuelta)', merchant: 'Vueling', destination: 'París', createdAt: '2026-01-10T07:00:00Z' },
  { id: 'e20', date: '2026-01-11', amount: 145.00, category: 'alojamiento', description: 'Apartamento Marais (3 noches)', merchant: 'Airbnb Le Marais', destination: 'París', createdAt: '2026-01-11T14:00:00Z' },
  { id: 'e21', date: '2026-01-12', amount: 65.00, category: 'actividades', description: 'Museo del Louvre + audioguía', merchant: 'Musée du Louvre', destination: 'París', createdAt: '2026-01-12T10:00:00Z' },
  { id: 'e22', date: '2026-01-13', amount: 48.00, category: 'comida', description: 'Cena brasserie clásica', merchant: 'Brasserie Lipp', destination: 'París', createdAt: '2026-01-13T20:00:00Z' },
  { id: 'e23', date: '2026-01-13', amount: 95.00, category: 'seguros', description: 'Seguro de viaje Europa', merchant: 'Mapfre Viaje', destination: 'París', createdAt: '2026-01-13T09:00:00Z' },
  { id: 'e24', date: '2026-01-14', amount: 75.00, category: 'compras', description: 'Ropa y recuerdos en Galeries Lafayette', merchant: 'Galeries Lafayette', destination: 'París', createdAt: '2026-01-14T15:00:00Z' },
];

const DEFAULT_BUDGETS: Budget[] = [
  { category: 'vuelos', limit: 1500 },
  { category: 'alojamiento', limit: 800 },
  { category: 'transporte', limit: 200 },
  { category: 'comida', limit: 400 },
  { category: 'actividades', limit: 300 },
  { category: 'compras', limit: 250 },
  { category: 'seguros', limit: 150 },
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
