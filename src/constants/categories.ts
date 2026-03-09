import type { CategoryKey } from '../types';

export interface CategoryInfo {
  id: CategoryKey;
  name: string;
  color: string;      // hex for Recharts
  bgClass: string;    // Tailwind bg
  textClass: string;  // Tailwind text
  borderClass: string;
  dotClass: string;   // solid bg for dots/icons
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'alimentacion',
    name: 'Alimentación',
    color: '#10b981',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  {
    id: 'transporte',
    name: 'Transporte',
    color: '#3b82f6',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-200',
    dotClass: 'bg-blue-500',
  },
  {
    id: 'salud',
    name: 'Salud',
    color: '#ef4444',
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-200',
    dotClass: 'bg-red-500',
  },
  {
    id: 'entretenimiento',
    name: 'Entretenimiento',
    color: '#8b5cf6',
    bgClass: 'bg-violet-100',
    textClass: 'text-violet-700',
    borderClass: 'border-violet-200',
    dotClass: 'bg-violet-500',
  },
  {
    id: 'servicios',
    name: 'Servicios',
    color: '#f59e0b',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-200',
    dotClass: 'bg-amber-500',
  },
  {
    id: 'ropa',
    name: 'Ropa',
    color: '#ec4899',
    bgClass: 'bg-pink-100',
    textClass: 'text-pink-700',
    borderClass: 'border-pink-200',
    dotClass: 'bg-pink-500',
  },
  {
    id: 'educacion',
    name: 'Educación',
    color: '#6366f1',
    bgClass: 'bg-indigo-100',
    textClass: 'text-indigo-700',
    borderClass: 'border-indigo-200',
    dotClass: 'bg-indigo-500',
  },
  {
    id: 'otros',
    name: 'Otros',
    color: '#6b7280',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-700',
    borderClass: 'border-gray-200',
    dotClass: 'bg-gray-500',
  },
];

export function getCat(id: CategoryKey): CategoryInfo {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
