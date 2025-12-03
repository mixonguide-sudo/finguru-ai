
import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Sparkles, Clipboard, Info, Plus, Calendar, Globe, ChevronUp } from 'lucide-react';
import { CATEGORIES, Transaction, TransactionType, Currency } from '../types';
import { parseTransactionText } from '../services/geminiService';
import { convertCurrency, AVAILABLE_CURRENCIES } from '../services/currencyService';
import { toLocalISOString } from '../utils/dateUtils';
import { t } from '../utils/translations';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdate?: (transaction: Transaction) => void;
  initialText?: string;
  defaultDate?: Date;
  editingTransaction?: Transaction | null;
  checkLimits?: (type: 'parse') => boolean;
  onOpenPremium?: () => void;
  updateUsage?: (type: 'parse') => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  onUpdate,
  initialText = '', 
  defaultDate,
  editingTransaction,
  checkLimits,
  onOpenPremium,
  updateUsage
}) => {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('KZT'); 
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [aiText, setAiText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customDate, setCustomDate] = useState<string>('');
  
  // Custom dropdown state
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);

  const [baseCurrency, setBaseCurrency] = useState<Currency>('KZT');
  const [language, setLanguage] = useState<'ru' | 'kz' | 'en'>('ru');

  const [customCategories, setCustomCategories] = useState<{income: string[], expense: string[]}>(() => {
    const saved = localStorage.getItem('finguru_custom_categories');
    return saved ? JSON.parse(saved) : { income: [], expense: [] };
  });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Helper to format date strictly to YYYY-MM-DD in local time
  const formatDateForInput = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
      const savedSettings = localStorage.getItem('finguru_settings');
      if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed.currency) {
              setBaseCurrency(parsed.currency);
              if (!editingTransaction) {
                  setCurrency(parsed.currency);
              }
          }
          if (parsed.language) {
              setLanguage(parsed.language);
          }
      }
  }, [isOpen, editingTransaction]);

  // Click outside to close currency dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
            setIsCurrencyOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        setMode('manual');
        setAmount((editingTransaction.originalAmount || editingTransaction.amount).toString());
        setCurrency((editingTransaction.originalCurrency as Currency) || editingTransaction.currency as Currency);
        setCategory(editingTransaction.category);
        setDescription(editingTransaction.description.replace(/ \(Orig: .*\)/, '')); 
        setType(editingTransaction.type);
        
        // Use helper to ensure we get local date string, not UTC
        const dateObj = new Date(editingTransaction.date);
        setCustomDate(formatDateForInput(dateObj));

      } else {
        setAmount('');
        setCategory('');
        setDescription('');
        setAiText(initialText || '');
        if (initialText) {
             setMode('ai');
             handleAiProcess(initialText);
        } else {
             setMode('manual');
        }
        
        if (defaultDate) {
             setCustomDate(formatDateForInput(defaultDate));
        } else {
             setCustomDate(formatDateForInput(new Date()));
        }
      }
    }
  }, [isOpen, editingTransaction, initialText, defaultDate]);


  const handleAiProcess = async (textToProcess: string = aiText) => {
    if (!textToProcess.trim()) return;

    if (checkLimits && !checkLimits('parse')) {
        if (onOpenPremium) onOpenPremium();
        return;
    }

    setIsProcessing(true);
    const result = await parseTransactionText(textToProcess);
    setIsProcessing(false);

    if (result) {
      if (updateUsage) updateUsage('parse');
      setAmount(result.amount.toString());
      if (result.currency && AVAILABLE_CURRENCIES.includes(result.currency as Currency)) {
          setCurrency(result.currency as Currency);
      }
      setCategory(result.category);
      setType(result.type as TransactionType);
      setDescription(result.description || textToProcess);
      setMode('manual');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setAiText(text);
        handleAiProcess(text);
      }
    } catch (err) {
      console.error('Failed to read clipboard', err);
      alert('Вставьте текст вручную или разрешите доступ.');
    }
  };

  const handleAddCustomCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const updatedCustom = {
      ...customCategories,
      [type]: [...customCategories[type], newCategoryName.trim()]
    };
    
    setCustomCategories(updatedCustom);
    localStorage.setItem('finguru_custom_categories', JSON.stringify(updatedCustom));
    
    setCategory(newCategoryName.trim());
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const handleSubmit = () => {
    if (!amount || !category) return;

    let finalDate = new Date();
    if (customDate) {
        // Explicitly construct local date to avoid UTC shifts
        const parts = customDate.split('-');
        finalDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        
        const now = new Date();
        finalDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    } else if (defaultDate) {
        finalDate = new Date(defaultDate);
    }

    const numAmount = parseFloat(amount);
    
    let finalAmount = numAmount;
    if (currency !== baseCurrency) {
        finalAmount = convertCurrency(numAmount, currency, baseCurrency);
    }

    const dateString = toLocalISOString(finalDate);

    const transactionData = {
      amount: finalAmount,
      currency: baseCurrency,
      originalAmount: currency !== baseCurrency ? numAmount : undefined,
      originalCurrency: currency !== baseCurrency ? currency : undefined,
      category,
      description: `${description}${currency !== baseCurrency ? ` (Orig: ${numAmount} ${currency})` : ''}`,
      date: dateString,
      type,
      isManual: mode === 'manual'
    };

    if (editingTransaction && onUpdate) {
        onUpdate({
            ...editingTransaction,
            ...transactionData
        });
    } else {
        onAdd(transactionData);
    }

    onClose();
  };

  if (!isOpen) return null;

  const currentCategories = [...CATEGORIES[type], ...customCategories[type]];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
      {/* 
        Mobile: h-[100dvh] ensures it takes full screen, avoiding keyboard overlap issues. 
        Desktop: Auto height, centered.
      */}
      <div className="bg-gray-900 w-full h-[100dvh] sm:h-auto sm:max-h-[90dvh] sm:max-w-md rounded-none sm:rounded-2xl border-t border-gray-700 shadow-2xl flex flex-col animate-slide-up">
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-800 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">
                {editingTransaction ? t('modal.edit_record', language) : t('modal.new_record', language)}
            </h2>
            <div className="flex items-center gap-2 mt-1">
               <Calendar size={12} className="text-emerald-400"/>
               <input 
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="bg-transparent text-xs text-emerald-400 font-medium outline-none"
               />
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
            {!editingTransaction && (
                <div className="flex gap-2 p-1 bg-gray-800 rounded-xl mb-6">
                <button 
                    onClick={() => setMode('manual')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${mode === 'manual' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    {t('manual', language)}
                </button>
                <button 
                    onClick={() => setMode('ai')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'ai' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    <Sparkles size={14} />
                    {t('ai_import', language)}
                </button>
                </div>
            )}

            {mode === 'ai' ? (
            <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-500/20 p-3 rounded-xl space-y-3">
                    <div className="flex gap-3">
                    <div className="bg-blue-500/20 p-1.5 rounded h-min">
                        <Info className="text-blue-400" size={16} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-blue-200 mb-1">{t('modal.ai_help', language)}</h4>
                        <p className="text-xs text-blue-200/70 leading-relaxed">
                        {t('modal.ai_desc', language)}
                        </p>
                    </div>
                    </div>
                </div>
                <button 
                onClick={handlePaste}
                className="w-full py-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 rounded-xl text-emerald-400 font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                >
                <Clipboard size={20} />
                {t('modal.paste', language)}
                </button>
                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800"></div></div>
                    <div className="relative flex justify-center text-xs"><span className="px-2 bg-gray-900 text-gray-500 uppercase tracking-wider">или текст</span></div>
                </div>
                <textarea
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                placeholder="Пример: Kaspi Gold покупка 2500 Magnum..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none h-24 text-sm"
                />
                <button
                onClick={() => handleAiProcess()}
                disabled={isProcessing || !aiText}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-blue-500/20 transition-all"
                >
                {isProcessing ? <span className="animate-pulse">...</span> : <><Sparkles size={18} /> {t('modal.recognize', language)}</>}
                </button>
                <div className="pb-24"></div>
            </div>
            ) : (
            <div className="space-y-4 pb-20 sm:pb-4">
                <div className="flex gap-3 justify-center mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={type === 'expense'} onChange={() => setType('expense')} className="hidden" />
                    <div className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${type === 'expense' ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-gray-700 text-gray-500'}`}>{t('expense', language)}</div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={type === 'income'} onChange={() => setType('income')} className="hidden" />
                    <div className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${type === 'income' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-gray-700 text-gray-500'}`}>{t('income', language)}</div>
                </label>
                </div>
                
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">{t('modal.amount', language)}</label>
                        <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-2xl font-bold text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="0" autoFocus />
                    </div>
                    <div className="w-24 relative" ref={currencyRef}>
                        <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <Globe size={10} /> {t('currency', language)}
                        </label>
                        
                        {/* Custom Currency Drop-up */}
                        <button 
                            onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                            className="w-full h-[66px] bg-gray-800 border border-gray-700 rounded-xl px-2 text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none flex flex-col items-center justify-center"
                        >
                            <span>{currency}</span>
                            <ChevronUp size={12} className={`text-gray-500 transition-transform ${isCurrencyOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isCurrencyOpen && (
                            <div className="absolute bottom-full mb-1 left-0 right-0 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-20 animate-fade-in">
                                {AVAILABLE_CURRENCIES.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => {
                                            setCurrency(c);
                                            setIsCurrencyOpen(false);
                                        }}
                                        className={`w-full py-2.5 text-center text-sm font-medium hover:bg-gray-700 transition-colors ${currency === c ? 'text-emerald-400 bg-gray-750' : 'text-gray-300'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {currency !== baseCurrency && amount && (
                    <p className="text-xs text-gray-400 text-right">
                        ≈ {convertCurrency(parseFloat(amount), currency, baseCurrency)} {baseCurrency}
                    </p>
                )}

                <div>
                <label className="block text-xs text-gray-500 mb-1">{t('modal.category', language)}</label>
                <div className="grid grid-cols-3 gap-2">
                    {currentCategories.map((cat) => (
                    <button key={cat} onClick={() => setCategory(cat)} className={`p-2 text-xs rounded-lg border transition-all ${category === cat ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'}`}>{cat}</button>
                    ))}
                    
                    {isAddingCategory ? (
                        <div className="col-span-3 sm:col-span-1 flex gap-2 bg-gray-800 border border-gray-600 rounded-lg p-1 animate-fade-in">
                            <input 
                                type="text" 
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="..."
                                className="w-full bg-transparent text-white text-xs outline-none px-1"
                                autoFocus
                            />
                            <button onClick={handleAddCustomCategory} className="bg-emerald-600 p-1 rounded text-white hover:bg-emerald-500">
                                <Check size={14} />
                            </button>
                            <button onClick={() => setIsAddingCategory(false)} className="bg-gray-700 p-1 rounded text-gray-300 hover:bg-gray-600">
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsAddingCategory(true)}
                            className="p-2 text-xs rounded-lg border border-dashed border-gray-600 text-gray-500 hover:text-gray-300 hover:border-gray-500 hover:bg-gray-800/50 transition-all flex items-center justify-center gap-1"
                        >
                            <Plus size={14} /> {t('add', language)}
                        </button>
                    )}
                </div>
                </div>
                <div>
                <label className="block text-xs text-gray-500 mb-1">{t('modal.desc', language)}</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="..." />
                </div>
                <button onClick={handleSubmit} disabled={!amount || !category} className="w-full py-4 mt-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 rounded-xl font-bold text-white shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    <Check size={20} /> {editingTransaction ? t('update', language) : t('save', language)}
                </button>
                <div className="pb-12"></div>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};
