
import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Calculator, DollarSign } from 'lucide-react';
import { Investment } from '../types';

interface TopUpInvestmentData {
  amount: number;
  quantity?: number;
  price?: number;
}

interface TopUpInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTopUp: (data: TopUpInvestmentData) => void;
  investment: Investment | null;
  symbol: string;
}

export const TopUpInvestmentModal: React.FC<TopUpInvestmentModalProps> = ({ isOpen, onClose, onTopUp, investment, symbol }) => {
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setQuantity('');
      setPrice('');
      // Prefill current price if available for stocks
      if (investment?.currentPrice) {
        setPrice(investment.currentPrice.toString());
      }
    }
  }, [isOpen, investment]);

  // Auto-calculate total amount for stocks
  useEffect(() => {
    if (investment && (investment.type === 'stocks' || investment.type === 'crypto')) {
      if (quantity && price) {
        const total = parseFloat(quantity) * parseFloat(price);
        setAmount(total.toFixed(2));
      } else {
        setAmount('');
      }
    }
  }, [quantity, price, investment]);

  const handleSubmit = () => {
    if (!amount) return;

    const data: TopUpInvestmentData = {
      amount: parseFloat(amount)
    };

    if (investment && (investment.type === 'stocks' || investment.type === 'crypto')) {
      if (!quantity || !price) return;
      data.quantity = parseFloat(quantity);
      data.price = parseFloat(price);
    }

    onTopUp(data);
    onClose();
  };

  if (!isOpen || !investment) return null;

  const isStockOrCrypto = investment.type === 'stocks' || investment.type === 'crypto';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-gray-900 w-full h-auto max-h-[95dvh] sm:h-auto sm:max-h-[90dvh] sm:max-w-md rounded-t-3xl sm:rounded-2xl border-t border-gray-700 shadow-2xl flex flex-col animate-slide-up">
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-800 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="text-blue-400" />
            Пополнить актив
          </h2>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar">
            <div className="mb-4 p-3 bg-gray-800 rounded-xl border border-gray-700">
                <p className="text-xs text-gray-500 mb-1">Актив:</p>
                <p className="text-lg font-bold text-white">{investment.name}</p>
                <div className="flex justify-between items-end mt-1">
                    <p className="text-xs text-gray-400">
                        Баланс: {investment.amount.toLocaleString()} {symbol}
                    </p>
                    {isStockOrCrypto && investment.quantity && (
                        <p className="text-xs text-gray-500">
                            {investment.quantity} шт.
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-4">
            {isStockOrCrypto ? (
                <div className="space-y-3">
                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Количество (шт)</label>
                        <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                        placeholder="0"
                        autoFocus
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Цена за шт</label>
                        <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                        placeholder="0"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Calculator size={10} /> Итого сумма ({symbol})
                    </label>
                    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-xl p-3 text-white font-bold text-lg text-center">
                        {amount ? parseFloat(amount).toLocaleString() : '0'}
                    </div>
                </div>
                </div>
            ) : (
                <div>
                <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <DollarSign size={12} /> Сумма пополнения ({symbol})
                </label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg font-bold"
                    placeholder="0"
                    autoFocus
                />
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={!amount || (isStockOrCrypto && (!quantity || !price))}
                className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
            >
                Пополнить
            </button>
            <div className="pb-24 sm:pb-4"></div>
            </div>
        </div>
      </div>
    </div>
  );
};
