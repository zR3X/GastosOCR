import OpenAI from 'openai';
import type { CategoryKey } from '../types';

const VALID_CATEGORIES: CategoryKey[] = [
  'vuelos', 'alojamiento', 'transporte', 'comida',
  'actividades', 'compras', 'seguros', 'otros',
];

export interface ReceiptAnalysis {
  merchant: string;
  amount: number | null;
  date: string | null;
  category: CategoryKey;
  description: string;
  destination: string;
}

const RECEIPT_PROMPT = `Analiza esta imagen de un recibo/ticket de viaje y extrae los datos en formato JSON con exactamente esta estructura:
{
  "merchant": "nombre del comercio o establecimiento",
  "amount": número_decimal_con_el_total_final_pagado_o_null (sin símbolo de moneda),
  "date": "YYYY-MM-DD o null si no aparece",
  "category": "una de exactamente: vuelos|alojamiento|transporte|comida|actividades|compras|seguros|otros",
  "description": "descripción breve del gasto de viaje en español, máximo 60 caracteres",
  "destination": "ciudad o país donde ocurrió el gasto, o cadena vacía si no se puede deducir"
}
Categorías de viaje:
- vuelos: billetes de avión, tasas aeroportuarias
- alojamiento: hoteles, hostels, Airbnb, ryokans
- transporte: taxi, metro, autobús, tren, alquiler de vehículo
- comida: restaurantes, cafeterías, mercados, supermercado
- actividades: museos, tours, excursiones, entradas
- compras: souvenirs, ropa, electrónica, recuerdos
- seguros: seguro de viaje, visas, trámites
- otros: cualquier gasto que no encaje en las anteriores
Reglas importantes:
- amount: el TOTAL final pagado. Número puro sin símbolos. null si no se ve claramente.
- date: formato YYYY-MM-DD estrictamente. null si no está legible.
- destination: nombre de ciudad o país (ej: "Tokio", "París", "México DF"). Cadena vacía si no se puede deducir.
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
    destination: String(parsed.destination ?? '').trim(),
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
          'Eres un asistente que categoriza gastos de viaje. Responde ÚNICAMENTE con una de estas palabras exactas en minúsculas: vuelos, alojamiento, transporte, comida, actividades, compras, seguros, otros',
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
