
import React, { useState } from 'react';
import { X, PiggyBank } from 'lucide-react';
import { SavingsGoal } from '../types';

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFunds: (amount: number) => void;
  goal: SavingsGoal | null;
  symbol: string;
}

export const AddFundsModal: React.FC<AddFundsModalProps> = ({ isOpen, onClose, onAddFunds, goal, symbol }) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = () => {
    if (!amount) return;
    onAddFunds(parseFloat(amount));
    setAmount('');
    onClose();
  };

  if (!isOpen || !goal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-gray-900 w-full max-w-sm rounded-2xl border border-gray-700 shadow-2xl p-6 animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PiggyBank className="text-emerald-400" />
            Пополнить копилку
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
            <p className="text-sm text-gray-400">Цель:</p>
            <p className="text-lg font-bold text-white">{goal.name}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Сколько отложили? ({symbol})</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-lg font-bold"
              placeholder="0"
              autoFocus
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!amount}
            className="w-full py-3 mt-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50"
          >
            Пополнить
          </button>
        </div>
      </div>
    </div>
  );
};