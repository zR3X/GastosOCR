export type CategoryKey =
  | 'alimentacion'
  | 'transporte'
  | 'salud'
  | 'entretenimiento'
  | 'servicios'
  | 'ropa'
  | 'educacion'
  | 'otros';

export interface Expense {
  id: string;
  date: string;         // YYYY-MM-DD
  amount: number;
  category: CategoryKey;
  description: string;
  merchant: string;
  receiptImage?: string; // base64 JPEG compressed
  ocrText?: string;
  createdAt: string;     // ISO timestamp
}

export interface Budget {
  category: CategoryKey;
  limit: number;         // monthly limit
}

export interface User {
  email: string;
  name: string;
}

export interface OcrResult {
  rawText: string;
  parsedAmount?: number;
  parsedDate?: string;
  parsedMerchant?: string;
}
