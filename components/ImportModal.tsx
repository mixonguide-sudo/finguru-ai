
import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, Image as ImageIcon, CheckCircle, AlertCircle, Loader2, ArrowRight, Save } from 'lucide-react';
import { parseBankStatement } from '../services/geminiService';
import { Transaction, Settings, Currency, CATEGORIES } from '../types';
import { t } from '../utils/translations';
import { toLocalISOString } from '../utils/dateUtils';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (transactions: Omit<Transaction, 'id'>[]) => void;
  settings: Settings;
  checkLimits: (type: 'parse') => boolean;
  onOpenPremium: () => void;
  onUpdateSettings?: (newSettings: Settings) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ 
  isOpen, 
  onClose, 
  onImport, 
  settings,
  checkLimits,
  onOpenPremium,
  onUpdateSettings
}) => {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [rememberChoices, setRememberChoices] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const handlePaste = (e: ClipboardEvent) => {
        if (step !== 'upload') return;
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              processFile(file);
              e.preventDefault();
              return;
            }
          }
        }
      };
      
      window.addEventListener('paste', handlePaste);
      return () => window.removeEventListener('paste', handlePaste);
    }
  }, [isOpen, step]);

  const applyMappings = (data: any[]) => {
      if (!settings.merchantMappings) return data;
      
      return data.map(item => {
          const key = (item.merchant || item.description || '').toLowerCase();
          const mappingKey = Object.keys(settings.merchantMappings || {}).find(k => key.includes(k.toLowerCase()));
          
          if (mappingKey && settings.merchantMappings) {
              return { ...item, category: settings.merchantMappings[mappingKey] };
          }
          return item;
      });
  };

  const processFile = async (file: File) => {
    if (!checkLimits('parse')) {
        onOpenPremium();
        return;
    }

    setIsLoading(true);
    setError('');

    try {
      const base64 = await convertToBase64(file);
      const base64Data = base64.split(',')[1];
      
      const result = await parseBankStatement(base64Data, file.type);
      
      if (Array.isArray(result) && result.length > 0) {
          const mappedResult = applyMappings(result);
          setParsedData(mappedResult);
          setStep('preview');
      } else {
          setError('Не удалось найти транзакции. Попробуйте другой файл или сделайте скриншот четче.');
      }
    } catch (err) {
      console.error(err);
      setError('Ошибка обработки. Поддерживаются: PDF, JPG, PNG.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const updateItemCategory = (index: number, newCategory: string) => {
      const newData = [...parsedData];
      newData[index].category = newCategory;
      setParsedData(newData);
  };

  const handleConfirmImport = () => {
      const transactions: Omit<Transaction, 'id'>[] = parsedData.map(item => ({
          amount: item.amount,
          currency: (item.currency && ['KZT', 'USD', 'EUR', 'RUB'].includes(item.currency)) ? item.currency : settings.currency,
          category: item.category || 'Другое',
          description: item.description || 'Импорт из выписки',
          date: item.date ? toLocalISOString(new Date(item.date)) : toLocalISOString(new Date()),
          type: (item.type === 'income' || item.type === 'expense') ? item.type : 'expense',
          isManual: false,
          merchant: item.merchant
      }));
      
      if (rememberChoices && onUpdateSettings) {
          const newMappings = { ...(settings.merchantMappings || {}) };
          let hasUpdates = false;

          parsedData.forEach(item => {
              const key = item.merchant || item.description;
              if (key && item.category && item.category !== 'Другое') {
                  const mapKey = key.trim();
                  
                  if (newMappings[mapKey] !== item.category) {
                      newMappings[mapKey] = item.category;
                      hasUpdates = true;
                  }
              }
          });

          if (hasUpdates) {
              onUpdateSettings({ ...settings, merchantMappings: newMappings });
          }
      }
      
      onImport(transactions);
      handleClose();
  };

  const handleClose = () => {
      setStep('upload');
      setParsedData([]);
      setError('');
      onClose();
  };

  const categoriesList = [...CATEGORIES.expense, ...CATEGORIES.income];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity">
      <div className="bg-gray-900 w-full h-auto max-h-[95dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        
        <div className="p-6 border-b border-gray-800 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="text-blue-400" />
            Импорт выписки (AI)
          </h2>
          <button onClick={handleClose} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {step === 'upload' ? (
                <div className="space-y-6">
                    <div className="text-center space-y-2">
                        <p className="text-gray-300 text-sm">
                            Загрузите <strong>PDF</strong> или нажмите <strong>Ctrl+V</strong>, чтобы вставить скриншот.
                        </p>
                        <p className="text-gray-500 text-xs">
                            ИИ распознает транзакции из Kaspi, Halyk и других банков.
                        </p>
                    </div>

                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-700 hover:border-blue-500 bg-gray-800/50 hover:bg-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group relative"
                    >
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 size={48} className="text-blue-500 animate-spin" />
                                <span className="text-blue-400 font-medium text-sm animate-pulse">Анализируем документ...</span>
                            </div>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                    <Upload size={32} className="text-blue-400" />
                                </div>
                                <div className="text-center">
                                    <span className="text-blue-400 font-bold text-sm">Нажмите для загрузки</span>
                                    <p className="text-gray-500 text-xs mt-1">или вставьте скриншот (Ctrl+V)</p>
                                </div>
                            </>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept=".pdf,image/*" 
                            className="hidden" 
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-2 text-red-400 text-xs">
                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                            {error}
                        </div>
                    )}
                    
                    <div className="flex gap-2 justify-center">
                        <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                            <ImageIcon size={12} /> Скриншоты
                        </div>
                         <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                            <FileText size={12} /> PDF Выписки
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Найдено операций: <strong className="text-white">{parsedData.length}</strong></span>
                        <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
                            <input 
                                type="checkbox" 
                                checked={rememberChoices}
                                onChange={(e) => setRememberChoices(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                            />
                            Запомнить категории
                        </label>
                    </div>

                    <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                        {parsedData.map((item, idx) => {
                            const isUnknown = item.category === 'Другое' || !item.category;
                            return (
                                <div key={idx} className={`bg-gray-800 p-3 rounded-xl border ${isUnknown ? 'border-amber-500/50' : 'border-gray-700'} flex flex-col gap-2`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            {item.merchant && <div className="text-[10px] text-blue-400 font-bold uppercase">{item.merchant}</div>}
                                            <div className="text-xs text-gray-500 line-clamp-1" title={item.description}>{item.description}</div>
                                            <div className="text-[10px] text-gray-600 mt-0.5">{item.date}</div>
                                        </div>
                                        <div className={`font-bold text-sm ${item.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                                            {item.type === 'income' ? '+' : '-'}{item.amount}
                                        </div>
                                    </div>
                                    
                                    {/* Editable Category Dropdown */}
                                    <div className="relative">
                                        <select 
                                            value={item.category}
                                            onChange={(e) => updateItemCategory(idx, e.target.value)}
                                            className={`w-full bg-gray-900 border text-xs rounded-lg px-2 py-1.5 outline-none appearance-none ${isUnknown ? 'border-amber-500 text-amber-200' : 'border-gray-700 text-gray-300'}`}
                                        >
                                            {categoriesList.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <ArrowRight size={10} className="text-gray-500 rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button 
                        onClick={handleConfirmImport}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold shadow-lg flex items-center justify-center gap-2"
                    >
                        {rememberChoices && <Save size={16} />}
                        <CheckCircle size={18} />
                        Добавить всё
                    </button>
                    
                    <button 
                        onClick={() => setStep('upload')}
                        className="w-full py-2 text-gray-400 hover:text-white text-sm"
                    >
                        Назад
                    </button>
                    <div className="pb-24 sm:pb-0"></div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
