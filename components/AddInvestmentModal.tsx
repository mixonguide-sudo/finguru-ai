
import React, { useState, useEffect } from 'react';
import { X, Briefcase, TrendingUp, Bitcoin, Landmark, Home, PiggyBank, Percent, Coins, Search, Calculator, Check } from 'lucide-react';
import { Investment, InvestmentType, Currency } from '../types';
import { AVAILABLE_CURRENCIES } from '../services/currencyService';
import { t } from '../utils/translations';
import { getStockData } from '../services/geminiService';
import { toLocalISOString } from '../utils/dateUtils';

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (inv: Investment) => void;
  onUpdate?: (inv: Investment) => void;
  editingInvestment?: Investment | null;
}

const TYPES: { id: InvestmentType; label: string; icon: React.ReactNode }[] = [
  { id: 'deposit', label: 'inv.deposit', icon: <Landmark size={16} /> },
  { id: 'stocks', label: 'inv.stocks', icon: <TrendingUp size={16} /> },
  { id: 'crypto', label: 'inv.crypto', icon: <Bitcoin size={16} /> },
  { id: 'property', label: 'inv.property', icon: <Home size={16} /> },
  { id: 'other', label: 'inv.other', icon: <PiggyBank size={16} /> },
];

export const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd,
  onUpdate,
  editingInvestment
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(''); // Total Amount
  const [currency, setCurrency] = useState<Currency>('KZT');
  const [type, setType] = useState<InvestmentType>('deposit');
  
  // Passive Income Fields
  const [apy, setApy] = useState(''); 
  const [revenue, setRevenue] = useState('');

  // Stock/Crypto Fields
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  // Fallback language
  const lang = 'ru'; 

  // Load data if editing
  useEffect(() => {
    if (isOpen) {
        if (editingInvestment) {
            setName(editingInvestment.name);
            setAmount(editingInvestment.amount.toString());
            setCurrency(editingInvestment.currency);
            setType(editingInvestment.type);
            
            setApy(editingInvestment.apy ? editingInvestment.apy.toString() : '');
            setRevenue(editingInvestment.revenue ? editingInvestment.revenue.toString() : '');
            
            setTicker(editingInvestment.ticker || '');
            setQuantity(editingInvestment.quantity ? editingInvestment.quantity.toString() : '');
            
            // Fix long decimals
            setBuyPrice(editingInvestment.buyPrice ? Number(editingInvestment.buyPrice).toFixed(2) : '');
            setCurrentPrice(editingInvestment.currentPrice ? Number(editingInvestment.currentPrice).toFixed(2) : '');
        } else {
            resetForm();
        }
    }
  }, [isOpen, editingInvestment]);

  // Auto-calculate total amount for stocks
  useEffect(() => {
      if ((type === 'stocks' || type === 'crypto') && quantity) {
          const price = currentPrice || buyPrice;
          if (price) {
              const total = parseFloat(quantity) * parseFloat(price);
              setAmount(total.toFixed(2));
          }
      }
  }, [quantity, buyPrice, currentPrice, type]);

  const handleCheckPrice = async () => {
      if (!ticker) return;
      setIsLoadingPrice(true);
      try {
        const data = await getStockData(ticker);
        setIsLoadingPrice(false);
        
        if (data && data.price && data.price > 0) {
            setCurrentPrice(data.price.toFixed(2));
            // Automatically set dividend yield if available
            if (data.apy !== undefined) {
                setApy(data.apy.toFixed(2));
            }
        } else {
            alert('Не удалось обновить цену. Введите данные вручную.');
        }
      } catch (e) {
          setIsLoadingPrice(false);
          alert('Не удалось обновить цену. Введите данные вручную.');
      }
  };

  const handleSubmit = () => {
    if (!name || !amount) return;

    const invData: Investment = {
      id: editingInvestment ? editingInvestment.id : Date.now().toString(),
      name,
      amount: parseFloat(amount),
      currency,
      type,
      createdAt: editingInvestment ? editingInvestment.createdAt : toLocalISOString(new Date()),
      apy: apy ? parseFloat(apy) : undefined,
      revenue: revenue ? parseFloat(revenue) : undefined,
      ticker: ticker || undefined,
      quantity: quantity ? parseFloat(quantity) : undefined,
      buyPrice: buyPrice ? parseFloat(buyPrice) : undefined,
      currentPrice: currentPrice ? parseFloat(currentPrice) : undefined
    };

    if (editingInvestment && onUpdate) {
        onUpdate(invData);
    } else {
        onAdd(invData);
    }

    onClose();
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setCurrency('KZT');
    setType('deposit');
    setApy('');
    setRevenue('');
    setTicker('');
    setQuantity('');
    setBuyPrice('');
    setCurrentPrice('');
  };

  const isStockOrCrypto = type === 'stocks' || type === 'crypto';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-gray-900 w-full h-auto max-h-[95dvh] sm:h-auto sm:max-h-[90dvh] sm:max-w-md rounded-t-3xl sm:rounded-2xl border-t border-gray-700 shadow-2xl flex flex-col animate-slide-up">
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-800 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Briefcase className="text-blue-400" />
            {editingInvestment ? t('inv.modal.title_edit', lang) : t('inv.modal.title_add', lang)}
          </h2>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            {/* Type Selector */}
            <div>
                <label className="block text-xs text-gray-500 mb-2">{t('inv.type', lang)}</label>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {TYPES.map((tItem) => (
                    <button
                    key={tItem.id}
                    onClick={() => setType(tItem.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                        type === tItem.id
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                    }`}
                    >
                    {tItem.icon}
                    {t(tItem.label, lang)}
                    </button>
                ))}
                </div>
            </div>

            {/* Name & Ticker */}
            <div className="flex gap-2">
                <div className="flex-[2]">
                    <label className="block text-xs text-gray-500 mb-1">{t('inv.name', lang)}</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Apple, Bitcoin..."
                    />
                </div>
                {isStockOrCrypto && (
                    <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">{t('inv.field.ticker', lang)}</label>
                        <input
                            type="text"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase font-bold text-center"
                            placeholder="AAPL"
                        />
                    </div>
                )}
            </div>

            {/* Stock Specific Fields */}
            {isStockOrCrypto && (
                <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700 space-y-3">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">{t('inv.field.qty', lang)}</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
                                placeholder="0"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">{t('inv.field.buyPrice', lang)}</label>
                            <input
                                type="number"
                                value={buyPrice}
                                onChange={(e) => setBuyPrice(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs text-gray-500 mb-1 flex justify-between items-center">
                            {t('inv.field.currPrice', lang)}
                            <button 
                                type="button"
                                onClick={handleCheckPrice}
                                disabled={isLoadingPrice || !ticker}
                                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded transition-colors"
                            >
                                {isLoadingPrice ? <span className="animate-spin">...</span> : <Search size={10} />}
                                {isLoadingPrice ? 'Поиск...' : 'Найти (AI)'}
                            </button>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={currentPrice}
                                onChange={(e) => setCurrentPrice(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white font-bold"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Amount & Currency */}
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                        {isStockOrCrypto ? <Calculator size={10} /> : null}
                        {t('inv.total', lang)}
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className={`w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none ${isStockOrCrypto ? 'bg-gray-900/50 text-gray-400' : ''}`}
                        placeholder="0"
                        readOnly={isStockOrCrypto} // Auto-calculated for stocks
                    />
                </div>
                <div className="w-24">
                    <label className="block text-xs text-gray-500 mb-1">{t('currency', lang)}</label>
                    <select 
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as Currency)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                    >
                        {AVAILABLE_CURRENCIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Dynamic Passive Income Fields */}
            {type === 'property' ? (
                <div>
                    <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Coins size={12} /> {t('inv.field.rent', lang)}
                    </label>
                    <input
                        type="number"
                        value={revenue}
                        onChange={(e) => setRevenue(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        placeholder="0"
                    />
                </div>
            ) : (
                <div>
                    <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Percent size={12} /> 
                        {type === 'crypto' ? 'Staking APY (%)' : 
                        type === 'stocks' ? t('inv.field.div', lang) : 
                        type === 'other' ? t('inv.field.growth', lang) : 
                        t('inv.field.apy', lang)}
                    </label>
                    <input
                        type="number"
                        value={apy}
                        onChange={(e) => setApy(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        placeholder="5.5"
                    />
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={!name || !amount}
                className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                <Check size={18} />
                {editingInvestment ? t('save', lang) : t('add', lang)}
            </button>
            
            <div className="pb-24 sm:pb-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
