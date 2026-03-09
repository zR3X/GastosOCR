import OpenAI from 'openai';
import type { CategoryKey } from '../types';

const VALID_CATEGORIES: CategoryKey[] = [
  'alimentacion', 'transporte', 'salud', 'entretenimiento',
  'servicios', 'ropa', 'educacion', 'otros',
];

export interface ReceiptAnalysis {
  merchant: string;
  amount: number | null;
  date: string | null;
  category: CategoryKey;
  description: string;
}

const RECEIPT_PROMPT = `Analiza esta imagen de un recibo/ticket de compra y extrae los datos en formato JSON con exactamente esta estructura:
{
  "merchant": "nombre del comercio o establecimiento",
  "amount": número_decimal_con_el_total_final_pagado_o_null (en pesos, sin símbolo),
  "date": "YYYY-MM-DD o null si no aparece",
  "category": "una de exactamente: alimentacion|transporte|salud|entretenimiento|servicios|ropa|educacion|otros",
  "description": "descripción breve del tipo de compra en español, máximo 60 caracteres"
}
Reglas importantes:
- amount: el TOTAL final pagado (no subtotal ni IVA). Número puro sin símbolos. null si no se ve claramente.
- date: formato YYYY-MM-DD estrictamente. null si no está legible.
- category: elige la categoría más adecuada según el tipo de comercio y productos.
- description: describe qué tipo de gasto es (ej: "Compra supermercado", "Gasolina vehículo", "Medicamentos farmacia").
- Responde ÚNICAMENTE con el JSON, sin markdown, sin explicaciones adicionales.`;

/** Analyze a receipt image using GPT-4o Vision */
export async function analyzeReceiptWithAI(
  base64Image: string,
  apiKey: string,
): Promise<ReceiptAnalysis> {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: base64Image, detail: 'high' },
          },
          { type: 'text', text: RECEIPT_PROMPT },
        ],
      },
    ],
    max_tokens: 400,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0].message.content ?? '{}';
  const parsed = JSON.parse(raw);

  return {
    merchant: String(parsed.merchant ?? '').trim(),
    amount: parsed.amount != null && !isNaN(Number(parsed.amount)) ? Number(parsed.amount) : null,
    date: parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(String(parsed.date)) ? String(parsed.date) : null,
    category: VALID_CATEGORIES.includes(parsed.category) ? (parsed.category as CategoryKey) : 'otros',
    description: String(parsed.description ?? '').trim().slice(0, 80),
  };
}

/** Auto-categorize an expense based on merchant and description */
export async function categorizeExpense(
  merchant: string,
  description: string,
  apiKey: string,
): Promise<CategoryKey> {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'Eres un asistente que categoriza gastos personales. Responde ÚNICAMENTE con una de estas palabras exactas en minúsculas: alimentacion, transporte, salud, entretenimiento, servicios, ropa, educacion, otros',
      },
      {
        role: 'user',
        content: `Comercio: ${merchant}\nDescripción: ${description}`,
      },
    ],
    max_tokens: 15,
    temperature: 0,
  });

  const cat = (response.choices[0].message.content ?? 'otros').trim().toLowerCase();
  return VALID_CATEGORIES.includes(cat as CategoryKey) ? (cat as CategoryKey) : 'otros';
}

/** Resize image for AI processing (keep quality, reduce dimensions) */
export async function resizeForAI(file: File, maxWidth = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

/** Compress image for storage in localStorage */
export async function compressImage(file: File, maxWidth = 900, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}
