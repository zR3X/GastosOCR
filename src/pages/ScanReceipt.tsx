import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Camera, CheckCircle, AlertCircle, FileImage,
  RotateCcw, Sparkles, KeyRound, Cloud,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useApiKey } from '../context/ApiKeyContext';
import { useCloudinary } from '../context/CloudinaryContext';
import ExpenseForm from '../components/ExpenseForm';
import { analyzeReceiptWithAI, resizeForAI, compressImage } from '../utils/ocr';
import { uploadToCloudinary } from '../utils/cloudinary';
import type { ReceiptAnalysis } from '../utils/ocr';

type ScanStep =
  | { step: 'idle' }
  | { step: 'analyzing'; imageUrl: string; status: string }
  | { step: 'review'; analysis: ReceiptAnalysis; receiptUrl: string }
  | { step: 'saved' };

export default function ScanReceipt() {
  const [state, setState] = useState<ScanStep>({ step: 'idle' });
  const [dragOver, setDragOver] = useState(false);
  const [aiError, setAiError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { addExpense } = useData();
  const { apiKey, hasKey } = useApiKey();
  const { cloudName, apiKey: cldApiKey, apiSecret: cldApiSecret, hasConfig } = useCloudinary();
  const navigate = useNavigate();

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen (JPG, PNG, HEIC...)');
        return;
      }
      setAiError('');

      const previewUrl = URL.createObjectURL(file);
      setState({ step: 'analyzing', imageUrl: previewUrl, status: 'Preparando imagen...' });

      try {
        // Step 1 — resize for AI (parallel with upload)
        setState((s) => s.step === 'analyzing' ? { ...s, status: 'Subiendo imagen y analizando con GPT-4o...' } : s);

        const [aiImage, receiptUrl] = await Promise.all([
          resizeForAI(file, 1600),
          hasConfig
            ? uploadToCloudinary(file, cloudName, cldApiKey, cldApiSecret)
            : compressImage(file, 900, 0.75),
        ]);

        URL.revokeObjectURL(previewUrl);

        setState((s) => s.step === 'analyzing' ? { ...s, status: 'GPT-4o leyendo el recibo...', imageUrl: receiptUrl } : s);

        // Step 2 — OCR + categorization
        const analysis = await analyzeReceiptWithAI(aiImage, apiKey);

        setState({ step: 'review', analysis, receiptUrl });
      } catch (err: unknown) {
        URL.revokeObjectURL(previewUrl);
        setState({ step: 'idle' });
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        if (msg.includes('401') || msg.toLowerCase().includes('incorrect api key')) {
          setAiError('OpenAI API key incorrecta. Verifica tu clave en la configuración.');
        } else if (msg.includes('429')) {
          setAiError('Límite de tasa alcanzado en OpenAI. Espera un momento e inténtalo de nuevo.');
        } else if (msg.includes('insufficient_quota')) {
          setAiError('Sin crédito disponible en tu cuenta de OpenAI.');
        } else if (msg.toLowerCase().includes('cloudinary') || msg.includes('400') || msg.includes('401')) {
          setAiError(`Error al subir imagen a Cloudinary: ${msg}`);
        } else {
          setAiError(`Error: ${msg}`);
        }
      }
    },
    [apiKey, cloudName, cldApiKey, cldApiSecret, hasConfig],
  );

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) processFile(files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSave = (formData: Parameters<typeof addExpense>[0]) => {
    const img = state.step === 'review' ? state.receiptUrl : undefined;
    addExpense({ ...formData, receiptImage: img });
    setState({ step: 'saved' });
    setTimeout(() => navigate('/expenses'), 1400);
  };

  // ── SAVED ─────────────────────────────────────────────────
  if (state.step === 'saved') {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center fade-in">
        <CheckCircle size={60} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">¡Gasto guardado!</h2>
        <p className="text-slate-500 text-sm">Redirigiendo a Mis Gastos...</p>
      </div>
    );
  }

  // ── ANALYZING ─────────────────────────────────────────────
  if (state.step === 'analyzing') {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="text-xl font-bold text-slate-800">Procesando recibo...</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center space-y-5">
          <div className="w-40 h-52 mx-auto bg-slate-100 rounded-xl overflow-hidden">
            <img src={state.imageUrl} alt="Recibo" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-700">{state.status}</p>
              <p className="text-xs text-slate-400">
                {hasConfig ? 'Subiendo a Cloudinary · Analizando con GPT-4o' : 'Analizando con GPT-4o Vision'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-indigo-500 bg-indigo-50 rounded-xl px-4 py-2.5">
            <Sparkles size={13} />
            OCR · Extracción de datos · Auto-categorización
          </div>
        </div>
      </div>
    );
  }

  // ── REVIEW ─────────────────────────────────────────────────
  if (state.step === 'review') {
    const { analysis, receiptUrl } = state;
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Revisar datos extraídos</h1>
            <p className="text-sm text-slate-500 mt-0.5">GPT-4o ha analizado tu recibo. Verifica y corrige si es necesario.</p>
          </div>
          <button
            onClick={() => setState({ step: 'idle' })}
            className="flex items-center gap-1.5 text-xs text-slate-500 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RotateCcw size={13} /> Nuevo escaneo
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
            <Sparkles size={13} />
            Datos extraídos por <span className="font-semibold">GPT-4o Vision</span>
          </div>
          {hasConfig && (
            <div className="flex items-center gap-2 text-xs text-sky-600 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2">
              <Cloud size={13} />
              Imagen en <span className="font-semibold">Cloudinary</span>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <img src={receiptUrl} alt="Recibo" className="w-full max-h-80 object-contain bg-slate-50" />
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Datos del gasto</h3>
            <ExpenseForm
              initialData={{
                amount: analysis.amount ?? undefined,
                date: analysis.date ?? undefined,
                merchant: analysis.merchant || undefined,
                description: analysis.description || undefined,
                category: analysis.category,
              }}
              onSubmit={handleSave}
              onCancel={() => setState({ step: 'idle' })}
              submitLabel="Guardar gasto"
            />
          </div>
        </div>
      </div>
    );
  }

  // ── IDLE ──────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Escanear Recibo</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          GPT-4o Vision analiza tu ticket y extrae importe, fecha, comercio y categoría automáticamente.
        </p>
      </div>

      {/* Status pills */}
      <div className="flex gap-2 flex-wrap">
        <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border ${hasKey ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          <KeyRound size={11} />
          OpenAI {hasKey ? 'configurado ✓' : 'no configurado'}
        </span>
        <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border ${hasConfig ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
          <Cloud size={11} />
          Cloudinary {hasConfig ? `(${cloudName}) ✓` : '— usando almacenamiento local'}
        </span>
      </div>

      {/* Warnings */}
      {!hasKey && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <KeyRound size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">OpenAI API Key no configurada</p>
            <p className="text-xs mt-0.5">Configura tu API key en la barra lateral para usar el OCR.</p>
          </div>
        </div>
      )}

      {aiError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Error al analizar</p>
            <p className="text-xs mt-0.5">{aiError}</p>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => hasKey && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
          !hasKey
            ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
            : dragOver
            ? 'border-indigo-400 bg-indigo-50 cursor-pointer'
            : 'border-slate-300 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer'
        }`}
      >
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${dragOver ? 'bg-indigo-200' : 'bg-indigo-100'}`}>
          <Upload size={28} className="text-indigo-500" />
        </div>
        <p className="text-slate-700 font-semibold mb-1">Arrastra tu recibo aquí</p>
        <p className="text-slate-400 text-sm mb-4">o haz clic para seleccionar archivo</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
            <FileImage size={12} /> JPG, PNG, HEIC
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full">
            <Sparkles size={12} /> GPT-4o Vision
          </span>
          {hasConfig && (
            <span className="inline-flex items-center gap-1.5 text-xs text-sky-600 bg-sky-50 px-3 py-1.5 rounded-full">
              <Cloud size={12} /> Cloudinary
            </span>
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />

      <button
        onClick={() => hasKey && cameraInputRef.current?.click()}
        disabled={!hasKey}
        className="w-full flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
      >
        <Camera size={18} /> Usar cámara del dispositivo
      </button>
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFiles(e.target.files)} />

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-600 mb-2">Flujo de procesamiento:</p>
        <p>1. La imagen se sube a <strong>Cloudinary</strong> {!hasConfig && '(o se guarda localmente si no está configurado)'}</p>
        <p>2. <strong>GPT-4o</strong> analiza el recibo y extrae: importe, fecha, comercio y categoría</p>
        <p>3. Revisas los datos antes de guardar el gasto</p>
      </div>
    </div>
  );
}
